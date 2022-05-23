import {inspect} from '../services/utils';
import * as esb from 'elastic-builder';
import {getLogger} from "../services";
import {isEmpty} from "lodash";

const log = getLogger();

export function boolQuery({searchQuery, fields, filters, highlightFields}) {
  log.debug('bool query');
  const filterTerms = [];
  let boolQueryObj;

  for (let bucket of Object.keys(filters)) {
    if (filters[bucket].length > 0) {
      //TODO: send if whether keyword is needed
      filterTerms.push(esb.termsQuery(bucket.concat('.keyword'), filters[bucket]))
    }
  }
  if (isEmpty(searchQuery) && filterTerms.length > 0) {
    boolQueryObj = esb.boolQuery().must(filterTerms);
  } else if (!isEmpty(searchQuery) && filterTerms.length > 0) {
    boolQueryObj = esb.boolQuery().must(esb.multiMatchQuery(fields, searchQuery)).filter(filterTerms);
  } else if (!isEmpty(searchQuery) && filterTerms.length <= 0) {
    boolQueryObj = esb.multiMatchQuery(fields, searchQuery);
  } else if (isEmpty(searchQuery) && filterTerms.length <= 0) {
    boolQueryObj = esb.matchAllQuery();
  }

  const esbQuery = esb.requestBodySearch()
    .query(boolQueryObj)
    .highlight(esb.highlight()
      .numberOfFragments(3)
      .fragmentSize(150)
      .fields(highlightFields)
      .preTags('<mark class="font-bold">', highlightFields[0])
      .postTags('</mark>', highlightFields[0])
    );

  const query = esbQuery.toJSON().query;
  log.debug(JSON.stringify(query));
  const highlight = esbQuery.toJSON().highlight;
  log.debug(JSON.stringify(highlight));
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
  return agg.agg(esb.termsAggregation(name, field).size(1000));
}

export function aggsQueries({aggregations}) {
  log.debug('aggsQueries');
  let aggsArray = [];
  for (let aO of aggregations) {
    if (aO.path) {
      aggsArray.push(
        composeTermAggs('values', aO.field, esb.nestedAggregation(aO.name, aO.path).size(1000))
      );
    } else {
      aggsArray.push(
        esb.termsAggregation(aO.name, aO.field).size(1000)
      );
    }
  }
  const aggsQuery = esb.requestBodySearch()
    .query(esb.matchQuery('not', 'important'))
    .aggs(aggsArray);
  const aggsQueryJson = aggsQuery.toJSON();
  return aggsQueryJson.aggs;
}

