import {multiQuery} from "./elastic";

require('regenerator-runtime/runtime');
import {loadConfiguration} from "../services";

const {aggsQuery, boolQuery} = require("./elastic");
import {inspect} from '../services/utils';
import {elasticInit, search} from '../indexer/elastic';

jest.setTimeout(10000);

describe('Test elastic multi queries', () => {
  test('it should create multi match query fields', async () => {
    const configuration = await loadConfiguration();
    const {highlightFields, fields} = configuration['api']['elastic'];
    await elasticInit({configuration});
    const searchQuery = '';
    const searchBody = multiQuery({searchQuery, fields, highlightFields});
    expect(searchBody.query).toEqual({multi_match: {query: searchQuery, fields: fields}});
  });
});
