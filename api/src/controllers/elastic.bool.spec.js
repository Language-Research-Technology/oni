require('regenerator-runtime/runtime');
import {loadConfiguration} from "../services";
const {aggsQuery, boolQuery} = require("./elastic");
import {inspect} from '../services/utils';
import {elasticInit, search} from '../indexer/elastic';

jest.setTimeout(10000);

describe('Test elastic bool queries', () => {
  test('it should create bool query with filter', async () => {
    const configuration = await loadConfiguration();
    await elasticInit({configuration});
    const searchQuery = '';
    const fields = ['@id', 'name.@value'];
    const filters = [
      {
        path: 'hasFile',
        field: 'hasFile.@type.keyword',
        from: '@type',
        keys: [{key: 'File', checked: false}, {key: 'OrthographicTranscription', checked: true}]
      },
      {
        path: 'hasFile.language.name',
        field: 'hasFile.language.name.@value',
        from: 'language',
        keys: [{key: 'Arabic, Standard', checked: false}, {key: 'Chinese, Mandarin', checked: false}, {key: 'Persian, Iranian', checked: false}, {key: 'Turkish', checked: false}, {key: 'Vietnamese', checked: false}]
      },
      {
        field: '@type',
        from: 'type',
        keys: [{key: 'TextDialogue', checked: true}]
      }
    ];

    const searchBody = boolQuery({searchQuery, fields, filters});
    inspect(searchBody);
    console.log("%j", searchBody)
    searchBody.aggs = aggsQuery({});
    const results = await search({configuration, index: 'items', searchBody, fields})
    inspect(results, 2);
    expect(searchBody).not.toBe(undefined);
  });
});
