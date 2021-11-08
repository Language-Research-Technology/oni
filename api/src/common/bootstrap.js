const { getLogger } = require('./index');
const { createRecord, deleteRecords } = require('../lib/record');
const { loadFromOcfl, arcpId } = require('./ocfl-tools');
const { ROCrate } = require('ro-crate');

const log = getLogger();

async function bootstrap({ configuration }) {
  await deleteRecords();
  await initOCFL({ configuration })
}

async function initOCFL({ configuration }) {
  const ocfl = configuration.api.ocfl;
  const license = configuration.api.license;
  const identifier = configuration.api.identifier;
  try {
    const records = await loadFromOcfl(ocfl.ocflPath, ocfl.catalogFilename, ocfl.hashAlgorithm);
    let i = 0;
    for (let record of records) {
      log.debug(`Loading record: ${ ++i } : ${ record['path'] }`);
      const ocflObject = record['ocflObject'];
      const crate = new ROCrate(record['jsonld']);
      crate.index();
      const root = crate.getRootDataset();
      let lic;
      if (root['license'] && root['license']['@id']) {
        lic = root['license']['@id']
      } else {
        lic = license['default'];
      }
      const rec = {
        arcpId: arcpId({ crate, identifier: identifier['main'] }),
        path: record['path'],
        diskPath: ocflObject['path'],
        license: lic,
        name: root['name'],
        description: root['description']
      }
      //index the types
      //if it claims to be a memberOf !! think of sydney speaks
      //const recordCreate = await createRecordWithCrate(rec, root['hasMember'], crate.__item_by_type);
      const recordCreate = await createRecord(rec, root['memberOf'] || [], root['@type'] || []);
    }
    log.info('Finish Init');
  } catch (e) {
    log.error('initOCFL error');
    log.error(e);
  }

}

module.exports = {
  bootstrap: bootstrap,
  initOCFL: initOCFL
}
