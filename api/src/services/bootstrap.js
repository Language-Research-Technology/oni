import { getLogger } from './index';
import { createRecord, deleteRecords } from '../controllers/record';
import { loadFromOcfl, arcpId } from 'oni-ocfl';
import { ROCrate } from 'ro-crate';

const log = getLogger();

async function bootstrap({ configuration }) {
  await deleteRecords();
  await initOCFL({ configuration });
}

async function initOCFL({ configuration }) {
  const ocfl = configuration.api.ocfl;
  const license = configuration.api.license;
  const identifier = configuration.api.identifier;
  try {
    const records = await loadFromOcfl(ocfl.ocflPath, ocfl.catalogFilename, ocfl.hashAlgorithm);
    let i = 0;
    log.info(`Loading records: ${ records.length }`);
    for (let record of records) {
      log.silly(`Loading record: ${ ++i } : ${ record['path'] }`);
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
      //TODO: Is this the best way to get the conformsTo array?
      const roCrateMetadata = crate.getItem('ro-crate-metadata.json');
      const rec = {
        crateId: arcpId({ crate, identifier: identifier['main'] }),
        path: record['path'],
        diskPath: ocflObject['path'],
        license: lic,
        name: root['name'],
        description: root['description']
      }
      log.debug(`Loading ${rec.crateId}`);
      //index the types
      //if it claims to be a memberOf !! think of sydney speaks
      //const recordCreate = await createRecordWithCrate(rec, root['hasMember'], crate.__item_by_type);
      const recordCreate = await createRecord({
        data: rec,
        memberOfs: root['memberOf'] || [],
        atTypes: root['@type'] || [],
        conformsTos: roCrateMetadata['conformsTo'] || []
      });
    }
    log.info('Finish loading into database');
  } catch (e) {
    log.error('initOCFL error');
    log.error(e);
  }

}

module.exports = {
  bootstrap,
  initOCFL
}
