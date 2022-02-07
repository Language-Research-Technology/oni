import {search, scroll} from '../../indexer/elastic';
import {getLogger, loadConfiguration} from '../../services';
import {first} from 'lodash';
import {inspect} from '../../services/utils';

import {multiQuery, boolQuery, aggsQueries} from "../../controllers/elastic";

const log = getLogger();

export function setupSearchRoutes({server, configuration}) {
  server.get("/search/:index", async (req, res, next) => {
      try {
        const configuration = await loadConfiguration();
        const {aggregations, highlightFields, fields} = configuration['api']['elastic'];
        let searchBody = {};
        let index = req.params?.index;
        let hits;
        if (req.query['scroll']) {
          hits = await scroll({scrollId: req.query['scroll']});
        } else if (req.query['id']) {
          const id = req.query['id'].trim();
          searchBody.query = {match: {'@id': decodeURIComponent(id)}}
          const result = await search({configuration, index, searchBody});
          log.debug(`Total: ${result?.hits?.total?.value}`);
          hits = first(result?.hits?.hits);
        } else {
          if (req.query.multi) {
            const searchQuery = req.query.multi.trim();
            searchBody = multiQuery({searchQuery, fields, highlightFields});
          } else {
            searchBody.query = {match_all: {}};
          }
          searchBody.aggs = aggsQueries({aggregations});
          hits = await search({configuration, index, searchBody, explain: false});
          inspect({Total: hits?.hits?.total});
          inspect({Aggregations: hits?.aggregations}, 4);
        }
        res.send(hits);
      } catch (e) {
        console.log(e);
        res.send({error: 'Error searching index', message: e.message}).status(500);
      }
    }
  );
  server.post("/search/:index", async (req, res, next) => {
    try {
      const configuration = await loadConfiguration();
      const {aggregations, highlightFields, fields} = configuration['api']['elastic'];
      let index = req.params?.index;
      if (index) {
        let searchBody = {};
        let hits;
        const searchQuery = req.body.multi.trim();
        const filters = req.body.filter;
        searchBody = boolQuery({searchQuery, fields, filters, highlightFields});
        searchBody.aggs = aggsQueries({aggregations});
        //inspect(searchBody.aggs)
        hits = await search({configuration, index, searchBody, explain: false});
        //inspect(hits)
        res.send(hits);
      } else {
        res.send({error: 'Error', message: 'Index name not sent'}).status(400);
      }
    } catch (e) {
      console.log(e);
      res.send({error: 'Error searching index', message: e.message}).status(500);

    }
  })
}
