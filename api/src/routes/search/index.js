import {search, scroll} from '../../indexer/elastic';
import {getLogger, loadConfiguration, routeUser} from '../../services';
import {first, pullAt} from 'lodash';
import {boolQuery, aggsQueries} from "../../controllers/elastic";
import {getUser} from "../../controllers/user";
import {routeBrowse} from "../../middleware/auth";
import {filterResults} from "../../services/elastic";

const log = getLogger();

export function setupSearchRoutes({server, configuration}) {
  /**
   * @openapi
   * /:
   *   get:
   *     description: Search Index
   *     parameters:
   *       - index
   *       - id
   *       - filters
   *       - scroll
   *     responses:
   *       200:
   *         description: Search results.
   */
  //Usability: Do we want users to be authenticated or let users browse without? if so use routeUser
  server.get("/search/:index", routeBrowse(async (req, res, next) => {
    try {
      log.debug('search/index');
      let user = {};
      if (req?.session?.user) {
        user = await getUser({where: {id: req.session.user.id}});
      }
      let exactMatch = false;
      const {aggregations, highlightFields, fields} = configuration['api']['elastic'];
      let searchBody = {};
      let index = req.params?.index;
      let results;
      if (req.query['scroll']) {
        try {
          results = await scroll({scrollId: req.query['scroll']});
        } catch (e) {
          res.status(401);
          res.send({error_type: 'scroll_error', error: 'Error scrolling', message: e.message});
        }
      } else if (req.query['id']) {
        exactMatch = true;
        const id = req.query['id'].trim();
        const match = {'@id': decodeURIComponent(id)};
        const _parent = req.query['_parent'].trim();
        if(_parent) {
          match['_parent'] = _parent;
        }
        searchBody.query = {match: match};
        results = await search({configuration, index, searchBody});
        log.debug(`Total: ${results?.hits?.total?.value}`);
      } else {
        const searchQuery = req.query?.multi?.trim() || '';
        let filters = [];
        if (req.query.filters) {
          filters = decodeURIComponent(req.query.filters);
          filters = JSON.parse(filters);
        }
        searchBody = boolQuery({searchQuery, fields, filters, highlightFields});
        searchBody.aggs = aggsQueries({aggregations});
        //log.debug(JSON.stringify({aggs: searchBody}));
        results = await search({configuration, index, searchBody, explain: false});
      }
      const userId = user?.id;
      const filtered = await filterResults({userId, results, configuration});
      if (exactMatch) {
        const result = first(filtered?.hits?.hits) || {};
        res.send(result);
      } else {
        res.send(filtered);
      }
      next();
    } catch (e) {
      console.log(e);
      res.status(500);
      res.send({error: 'Error searching index', message: e.message});
      next();
    }
  })
  );

}
