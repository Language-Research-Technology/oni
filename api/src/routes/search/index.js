import {search, scroll} from '../../indexer/elastic';
import {getLogger} from '../../services';
import {first} from 'lodash';
import {inspect} from '../../services/utils';

import * as esb from 'elastic-builder';

const log = getLogger();

export function setupSearchRoutes({server, configuration}) {
  server.get("/search/:index", async (req, res, next) => {
      try {
        //TODO: Is this where we use Marco's suggestion of building queries?
        // https://elastic-builder.js.org/
        let query;
        let aggs;
        let highlight;
        let index = req.params?.index;
        //TODO: How do we make this more dynamic
        //Do we send all queries straight to api?
        let hits;
        if (req.query['scroll']) {
          hits = await scroll({scrollId: req.query['scroll']});
        } else if (req.query['id']) {
          log.debug(`Id: ${req.query['id']}`);
          const id = decodeURIComponent(req.query['id'])
          query = {match: {'@id': id.trim()}};
          const result = await search({configuration, index, query});
          const total = result?.hits?.total;
          log.debug(`Total: ${total?.value}`);
          hits = first(result?.hits?.hits);
        } else {
          if (req.query.multi) {
            const searchQuery = req.query.multi.trim();
            const fields = ['@id', 'name.@value'];
            //let query = esb.multiMatchQuery(fields, req.query.multi.trim());
            const esbQuery = esb.requestBodySearch()
              .query(esb.disMaxQuery()
                .queries([
                  esb.nestedQuery()
                    .path('hasFile')
                    .query(esb.boolQuery().must([esb.matchQuery('hasFile._content', searchQuery)])),
                  esb.multiMatchQuery(fields, searchQuery)
                ])
              ).highlight(esb.highlight()
                .numberOfFragments(3)
                .fragmentSize(150)
                .fields(['hasFile._content', 'hasFile.name.@value.keyword.keyword'])
                .preTags('<mark class="font-bold">', 'hasFile._content')
                .postTags('</mark>', 'hasFile._content')
              );
            query = esbQuery.toJSON().query;
            highlight = esbQuery.toJSON().highlight;
          } else {
            query = {match_all: {}};
            aggs = {}
          }
          //TODO: place this in configuration
          const aggsQuery = esb.requestBodySearch()
            .query(esb.matchQuery('not', 'important'))
            .agg(esb.nestedAggregation('languages', 'hasFile.language.name')
              .agg(
                esb.termsAggregation('values', 'hasFile.language.name.@value')
                  .agg(esb.termsAggregation('values', 'hasFile.language.name.@value.keyword')
                  )
              ))
            .agg(esb.nestedAggregation('types', 'hasFile')
              .agg(
                esb.termsAggregation('values', 'hasFile.@type.keyword')
                  .agg(esb.termsAggregation('values', 'hasFile.@type.keyword.keyword')
                  )
              ))
          const aggsQueryJson = aggsQuery.toJSON();
          aggs = aggsQueryJson.aggs;
          inspect(aggs)
          hits = await search({configuration, index, query, aggs, highlight, explain: false});
          inspect({Total: hits?.hits?.total});
          inspect({Aggregations: hits?.aggregations}, 4);
        }
        res.send(hits);
      } catch (e) {
        console.log(e);
        res.send({error: 'Error searching index', message: e.message}).status(500);
      }

    }
  )
  ;
}
