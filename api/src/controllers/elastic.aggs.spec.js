import {aggsQueries} from "./elastic";

require('regenerator-runtime/runtime');
import {loadConfiguration} from "../services";

const {aggsQuery, boolQuery} = require("./elastic");
import {inspect} from '../services/utils';
import {elasticInit, search} from '../indexer/elastic';

jest.setTimeout(100000);

describe('Test elastic aggs queries', () => {
  test('it should create aggs query', async () => {
    const configuration = await loadConfiguration();
    const elastic = configuration['api']['elastic'];
    await elasticInit({configuration});
    const fields = elastic.fields;
    const searchBody = {};
    const aggregations = elastic.aggregations;
    searchBody.aggs = aggsQueries({aggregations});
    const results = await search({configuration, index: 'items', searchBody, fields});
    expect(Object.keys(results.aggregations).length).toEqual(aggregations.length);
  });
});
