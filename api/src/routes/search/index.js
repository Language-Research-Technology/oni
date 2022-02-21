import {search, scroll} from '../../indexer/elastic';
import {getLogger, loadConfiguration} from '../../services';
import {first} from 'lodash';
import {boolQuery, aggsQueries} from "../../controllers/elastic";

const log = getLogger();

export function setupSearchRoutes({server, configuration}) {
  server.get("/search/:index", async (req, res, next) => {
    try {
      log.debug('search/index');
      const {aggregations, highlightFields, fields} = configuration['api']['elastic'];
      let searchBody = {};
      let index = req.params?.index;
      let results;
      if (req.query['scroll']) {
        results = await scroll({scrollId: req.query['scroll']});
      } else if (req.query['id']) {
        const id = req.query['id'].trim();
        searchBody.query = {match: {'@id': decodeURIComponent(id)}};
        const result = await search({configuration, index, searchBody});
        log.debug(`Total: ${result?.hits?.total?.value}`);
        results = first(result?.hits?.hits);
      } else {
        const searchQuery = req.query?.multi?.trim() || '';
        let filters = [];
        if (req.query.filters) {
          filters = decodeURIComponent(req.query.filters);
          filters = JSON.parse(filters);
        }
        searchBody = boolQuery({searchQuery, fields, filters, highlightFields});
        searchBody.aggs = aggsQueries({aggregations});
        log.debug(JSON.stringify({aggs: searchBody.aggs}));
        results = await search({configuration, index, searchBody, explain: false});
      }
      res.send(results);
    } catch (e) {
      console.log(e);
      res.send({error: 'Error searching index', message: e.message}).status(500);
    }
  });

}
