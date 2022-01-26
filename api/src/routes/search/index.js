import { search, scroll } from '../../indexer/elastic';
import { getLogger } from '../../services';
import { first } from 'lodash';

const log = getLogger();

export function setupSearchRoutes({ server, configuration }) {
  server.get("/search/:index", async (req, res, next) => {
      try {
        //TODO: Is this where we use Marco's suggestion of building queries?
        // https://elastic-builder.js.org/
        let query;
        let aggs;
        let index = req.params?.index;
        //TODO: How do we make this more dynamic
        //Do we send all queries straight to api?
        let hits;
        if (req.query['scroll']) {
          hits = await scroll({ scrollId: req.query['scroll'] });
        } else if (req.query['id']) {
          log.debug(`Id: ${ req.query['id'] }`);
          const id = decodeURIComponent(req.query['id'])
          query = { match: { '@id': id.trim() } };
          const result = await search({ configuration, index, query });
          const total = result?.hits?.total;
          log.debug(`Total: ${ total?.value }`);
          hits = first(result?.hits?.hits);
        } else {
          if (req.query.multi) {
            query = {
              multi_match: {
                query: req.query.multi.trim(),
                type: 'most_fields',
                //TODO: place this in configuration
                fields: [ '@id', 'name.@value', '_text_english', '_text_arabic_standard',
                  '_text_chinese_mandarin', '_text_persian_iranian', '_text_turkish',
                  '_text_vietnamese' ]
              }
            };

          } else {
            query = { match_all: {} };
            aggs = {}
          }
          //TODO: place this in configuration
          aggs = {
            "languages": {
              "terms": { "field": "hasFile.language.name.@value.keyword" }
            }
          }
          hits = await search({ configuration, index, query, aggs, explain: true });
          console.log('aggregations:')
          console.log(hits?.aggregations)
        }
        res.send(hits);
      } catch (e) {
        console.log(e);
        res.send({ error: 'Error searching index', message: e.message }).status(500);
      }

    }
  )
  ;
}
