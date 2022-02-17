require('regenerator-runtime/runtime');
import {loadConfiguration} from "../services";
const {aggsQueries, boolQuery} = require("./elastic");
import {inspect} from '../services/utils';
import {elasticInit, search} from '../indexer/elastic';

jest.setTimeout(10000);

describe('Test elastic bool queries', () => {
  test('it should create bool query with filter', async () => {
    const configuration = await loadConfiguration();
    const {aggregations, highlightFields, index, fields} = configuration['api']['elastic'];
    const {filters} = configuration['api']['elastic']['test'];
    await elasticInit({configuration});
    const searchQuery = '';
    const searchBody = boolQuery({searchQuery, fields, filters, highlightFields});
    searchBody.aggs = aggsQueries({aggregations});
    const results = await search({configuration, index: index, searchBody, fields})  
    expect(results).not.toBe(undefined);
  });
});
