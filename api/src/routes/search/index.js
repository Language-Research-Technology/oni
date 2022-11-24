import {search, scroll, clearScroll} from '../../indexer/elastic';
import {getLogger, loadConfiguration, routeUser} from '../../services';
import {first, pullAt} from 'lodash';
import {boolQuery, aggsQueries } from "../../controllers/elastic";
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
   *       - withScroll
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
            results = await scroll({configuration, scrollId: req.query['scroll']});
          } catch (e) {
            res.status(401);
            res.send({error_type: 'scroll_error', error: 'Error scrolling', message: e.message});
          }
        } else if (req.query['id']) {
          exactMatch = true;
          const id = req.query['id'].trim();
          const _crateId = req.query['_crateId'].trim();
          searchBody.query = {
            dis_max: {
              queries: [
                {match: {'@id': decodeURIComponent(id)}},
                {match: {'_crateId': decodeURIComponent(_crateId)}}
              ]
            }
          };
          results = await search({configuration, index, searchBody});
          log.debug(`Total: ${results?.hits?.total?.value}`);
        } else if (req.query['_id']) {
          exactMatch = true;
          const id = req.query['_id'].trim();
          searchBody.query = {
            terms: {
              _id: [decodeURIComponent(id)]
            }
          };
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
          const needsScroll = req.query.withScroll;
          results = await search({configuration, index, searchBody, explain: false, needsScroll});
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
      } catch
        (e) {
        console.log(e);
        res.status(500);
        res.send({error: 'Error searching index', message: e.message});
        next();
      }
    })
  );
  server.get("/search/scroll", routeBrowse(async (req, res, next) => {}));
  /**
   * @openapi
   * /:
   *   del:
   *     description: Delete scroll ID
   *     parameters:
   *       - scroll
   *     responses:
   *       200:
   *         description: Deletes scroll id.
   */
  server.del("/search/scroll", routeBrowse(async (req, res, next) => {
      try {
        log.debug('search/scroll');
        let scrollId = req.query['id'];
        const results = await clearScroll({scrollId});
        res.status(202);
        res.send({results});
        next();
      } catch (e) {
        res.status(500);
        res.send({error: 'Error deleting scroll', message: e.message});
        next();
      }
    })
  );
}
