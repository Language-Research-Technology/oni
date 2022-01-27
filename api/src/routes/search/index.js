import { search, scroll } from '../../indexer/elastic';
import { getLogger } from '../../services';
import { first } from 'lodash';
import { inspect } from '../../services/utils';

import * as esb from 'elastic-builder';

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
            const fields = [ '@id', 'name.@value', '_text_english', '_text_arabic_standard',
              '_text_chinese_mandarin', '_text_persian_iranian', '_text_turkish',
              '_text_vietnamese' ];
            const query = esb.multiMatchQuery(fields, req.query.multi.trim());
            inspect(query.toJSON());
          } else {
            query = { match_all: {} };
            aggs = {}
          }
          //TODO: place this in configuration
          aggs = esb.nestedAggregation('languages', 'hasFile.language.name')
                    .agg(
                      esb.termsAggregation('values', 'hasFile.language.name.@value')
                        .agg(esb.termsAggregation('values', 'hasFile.language.name.@value.keyword')
                        )
                    );
          inspect(aggs.toJSON());
          // aggs = {
          //   "languages": {
          //     "nested": {
          //       "path": "hasFile.language.name"
          //     },
          //     "aggs": {
          //       "values": {
          //         "terms": {
          //           "field": "hasFile.language.name.@value"
          //         },
          //         "aggs": {
          //           "values": {
          //             "terms": {
          //               "field": "hasFile.language.name.@value.keyword"
          //             }
          //           }
          //         }
          //       }
          //     }
          //   }
          // }
          hits = await search({ configuration, index, query, aggs, explain: true });
          inspect({ Total: hits?.hits?.total });
          inspect({ Aggregations: hits?.aggregations }, 2);
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
