require('regenerator-runtime/runtime');
const fetch = require("node-fetch");

const { testHost, testOCFLConf } = require('../services');
const { getRecord, getUridCrate } = require('./record');
const { transformURIs } = require('../services/ro-crate-utils');
const { OcflObject } = require('ocfl');
const { ROCrate } = require('ro-crate');

jest.setTimeout(10000);

describe('Test load records', () => {
  test('it should be able to retrieve records', async () => {
    const crateId = 'arcp://name,ATAP/uts.edu.au';
    const record = await getRecord({ crateId: crateId });
    const ocflObject = new OcflObject(record['diskPath']);
    const newCrate = await transformURIs({
      host: testHost,
      recordId: crateId,
      ocflObject,
      uridTypes: [ 'File' ],
      catalogFilename: testOCFLConf.catalogFilename
    });
    const crate = new ROCrate(newCrate);
    crate.toGraph();
    const interview427 = crate.getItem('#interview-#427');
    const hasFiles = interview427['hasFile'];
    const anId = hasFiles[hasFiles.length - 1];
    expect(anId['@id'].startsWith('http')).toBe(true)
  });

});
