import {inspect} from '../services/utils';
import * as esb from 'elastic-builder';
import {getLogger} from "../services";
import {isEmpty} from "lodash";

const log = getLogger();

export function boolQuery({searchQuery, fields, filters, highlightFields}) {
  let disMaxQueries = [];
  const filterDisMaxQueries = [];

  for (let f of filters) {
    const keys = [];
    const fq = []
    const field = f.field.concat('.keyword');
    for (let k of f.keys) {
      if (k.checked) {
        keys.push(k.key)
      }
    }
    if (keys.length > 0) {
      fq.push(esb.termsQuery(field, keys));
      if (f.path) {
        filterDisMaxQueries.push(
          esb.nestedQuery()
            .path(f.path)
            .query(
              esb.boolQuery()
                .must(
                  esb.multiMatchQuery(fields, searchQuery))
                .filter(fq))
        );
      } else {
        filterDisMaxQueries.push(
          esb.boolQuery().filter(esb.termsQuery(field, keys))
        );
      }
    }
  }
  if (filterDisMaxQueries.length > 0) {
    disMaxQueries = disMaxQueries.concat(filterDisMaxQueries);
  } else {
    if (isEmpty(searchQuery)) {
      disMaxQueries.push(esb.matchAllQuery())
    } else {
      disMaxQueries.push(esb.multiMatchQuery(fields, searchQuery));
    }
  }

  const esbQuery = esb.requestBodySearch()
    .query(esb.disMaxQuery().queries(disMaxQueries))
    .highlight(esb.highlight()
      .numberOfFragments(3)
      .fragmentSize(150)
      .fields(highlightFields)
      .preTags('<mark class="font-bold">', highlightFields[0])
      .postTags('</mark>', highlightFields[0])
    );

  const query = esbQuery.toJSON().query;
  log.debug('bool query')
  inspect(query)
  console.log('%j', {query: query})
  const highlight = esbQuery.toJSON().highlight;
  return {query, highlight};
}

export function multiQuery({searchQuery, fields, highlightFields}) {

  log.debug('multi query');
  const esbQuery = esb.requestBodySearch()
    .query(esb.disMaxQuery()
      .queries([
        esb.multiMatchQuery(fields, searchQuery)
      ])
    )
    .highlight(esb.highlight()
      .numberOfFragments(3)
      .fragmentSize(150)
      .fields(highlightFields)
      .preTags('<mark class="font-bold">', highlightFields[0])
      .postTags('</mark>', highlightFields[0])
    );

  const query = esbQuery.toJSON().query;
  inspect(query);
  const highlight = esbQuery.toJSON().highlight;
  //inspect(highlight);
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
  let aggsArray = [];
  for (let aO of aggregations) {
    if (aO.path) {
      aggsArray.push(
        composeTermAggs('values', aO.field, esb.nestedAggregation(aO.name, aO.path))
      );
    } else {
      aggsArray.push(
        esb.termsAggregation(aO.name, aO.field)
      );
    }
  }
  const aggsQuery = esb.requestBodySearch()
    .query(esb.matchQuery('not', 'important'))
    .aggs(aggsArray);
  const aggsQueryJson = aggsQuery.toJSON();
  inspect(aggsQueryJson.aggs);
  return aggsQueryJson.aggs;
}

