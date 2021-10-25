import path from "path";
import {getLogger} from "./logger";
import {loadConfiguration} from "./configuration";
import {createRecord, deleteRecords} from "../lib/record";
import {loadFromOcfl, arcpId} from "./ocfl-tools";
import {ROCrate} from "ro-crate"

const log = getLogger();

export async function bootstrap({configuration}) {
  await deleteRecords();
  await initOCFL({configuration})
}

export async function initOCFL({configuration}) {
  const ocfl = configuration.api.ocfl;
  const license = configuration.api.license;
  const identifier = configuration.api.identifier;
  try {
    const records = await loadFromOcfl(ocfl.ocflPath, ocfl.catalogFilename, ocfl.hashAlgorithm);
    let i = 0;
    for (let record of records) {
      log.debug(`Loading record: ${++i} : ${record['path']}`);
      const ocflObject = record['ocflObject'];
      const crate = new ROCrate(record['jsonld']);
      crate.index();
      const root = crate.getRootDataset();
      let lic;
      if (root['license'] && root['license']['id']) {
        lic = root['license']['id']
      } else {
        lic = license['default'];
      }
      const rec = {
        arcpId: arcpId({crate, identifier: identifier['main']}),
        path: record['path'],
        diskPath: ocflObject['path'],
        license: lic,
        name: root['name'],
        description: root['description']
      }
      await createRecord(rec);
    }
  } catch (e) {
    log.error(`initOCFL error`);
    log.error(e);
  }

}
