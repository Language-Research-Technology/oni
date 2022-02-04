import {inspect} from '../services/utils';
import * as esb from 'elastic-builder';
import {getLogger} from "../services";

const log = getLogger();

export function boolQuery({searchQuery, fields, filters}) {
  log.debug('bool query with filter');
  const filter = [];
  const disMaxQueries = [];

  for (let f of filters) {
    const keys = [];
    const fq = []
    for (let k of f.keys) {
      if (k.checked) {
        keys.push(k.key)
      }
    }
    if (keys.length > 0) {
      fq.push(esb.termsQuery(f.field, keys));
      if (f.path) {
        disMaxQueries.push(
          esb.nestedQuery().path(f.path).query(esb.boolQuery().filter(fq))
        );
      } else {
        disMaxQueries.push(
          esb.boolQuery().filter(esb.termsQuery(f.field, keys))
        );
      }
    }
  }
  disMaxQueries.push(esb.nestedQuery()
    .path('hasFile')
    .query(esb.boolQuery().should([esb.matchQuery('hasFile._content', searchQuery)]))
  );
  disMaxQueries.push(esb.multiMatchQuery(fields, searchQuery));

  const esbQuery = esb.requestBodySearch()
    .query(esb.disMaxQuery().queries(disMaxQueries))
    .highlight(esb.highlight()
      .numberOfFragments(3)
      .fragmentSize(150)
      .fields(['hasFile._content', 'hasFile.name.@value.keyword.keyword'])
      .preTags('<mark class="font-bold">', 'hasFile._content')
      .postTags('</mark>', 'hasFile._content')
    );

  const query = esbQuery.toJSON().query;
  const highlight = esbQuery.toJSON().highlight;
  return {query, highlight};
}

export function multiQuery({searchQuery, fields}) {
  log.debug('multi query');
  const esbQuery = esb.requestBodySearch()
    .query(esb.disMaxQuery()
      .queries([
        esb.nestedQuery()
          .path('hasFile')
          .query(esb.boolQuery().must([esb.matchQuery('hasFile._content', searchQuery)])),
        esb.multiMatchQuery(fields, searchQuery)
      ])
    )
    .highlight(esb.highlight()
      .numberOfFragments(3)
      .fragmentSize(150)
      .fields(['hasFile._content', 'hasFile.name.@value.keyword.keyword'])
      .preTags('<mark class="font-bold">', 'hasFile._content')
      .postTags('</mark>', 'hasFile._content')
    );

  const query = esbQuery.toJSON().query;
  inspect(query);
  const highlight = esbQuery.toJSON().highlight;
  inspect(highlight);
  return {query, highlight};
}

//TODO: doesnt work as expected: cleanup
function composeTermAgg(name, fields, agg) {
  if (Array.isArray(fields)) {
    return fields.reduce(function (done, curr) {
      return agg.agg(esb.termsAggregation('values', curr));
    }, []);
  } else {
    return composeTermAgg(name, fields, agg);
  }
}

function composeTermAggs(name, field, agg) {
  return agg.agg(esb.termsAggregation(name, field));
}

export function aggsQueries({aggregations}) {
  log.debug('aggs queries');
  let nestedAggs = [];
  for (let aO of aggregations) {
    if (aO.path) {
      nestedAggs.push(
        composeTermAggs('values', aO.field, esb.nestedAggregation(aO.name, aO.path))
      );
    } else {
      nestedAggs.push(
        esb.termsAggregation(aO.name, aO.field)
      )
    }
  }
  const aggsQuery = esb.requestBodySearch()
    .query(esb.matchQuery('not', 'important'))
    .aggs(nestedAggs);
  const aggsQueryJson = aggsQuery.toJSON();
  return aggsQueryJson.aggs;
}

export function aggsQuery() {
  log.debug('aggs query');
  const aggsQuery = esb.requestBodySearch()
    .query(esb.matchQuery('not', 'important'))
    .agg(esb.nestedAggregation('language', 'hasFile.language.name')
      .agg(
        esb.termsAggregation('values', 'hasFile.language.name.@value')
        // .agg(
        //   esb.termsAggregation('values', 'hasFile.language.name.@value.keyword')
        // )
      )
    )
    .agg(esb.nestedAggregation('@type', 'hasFile')
      .agg(
        esb.termsAggregation('values', 'hasFile.@type.keyword')
          .agg(
            esb.termsAggregation('values', 'hasFile.@type.keyword.keyword')
          )
      )
    );
  const aggsQueryJson = aggsQuery.toJSON();
  const aggs = aggsQueryJson.aggs;
  console.log("%j", aggs)
  inspect(aggs);
  return aggs
}
