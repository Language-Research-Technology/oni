import {aggsQueries} from "./elastic";

require('regenerator-runtime/runtime');
import {loadConfiguration} from "../services";

const {aggsQuery, boolQuery} = require("./elastic");
import {inspect} from '../services/utils';
import {elasticInit, search} from '../indexer/elastic';

jest.setTimeout(10000);

describe('Test elastic aggs queries', () => {
  test('it should create aggs query', async () => {
    const configuration = await loadConfiguration();
    await elasticInit({configuration});
    const fields = ['@id', 'name.@value'];
    const searchBody = {};
    const aggregations = [
      {
        name: 'language', path: 'hasFile.language.name', field: 'hasFile.language.name.@value'
      },
      {
        name: '@type', path: 'hasFile', field: 'hasFile.@type.keyword'
      },
      {
        name: 'contentLocation.@type', field: 'contentLocation.@type.keyword'
      }
    ]
    searchBody.aggs = aggsQueries({aggregations});
    inspect(searchBody.aggs);
    console.log('%j', searchBody.aggs);
    const results = await search({configuration, index: 'items', searchBody, fields})
    inspect(results.aggregations, 5);
    expect(searchBody).not.toBe(undefined);
  });
});
