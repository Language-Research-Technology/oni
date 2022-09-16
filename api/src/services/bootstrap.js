import {getLogger} from './index';
import {createRecord, deleteRecords} from '../controllers/record';
import ocfl from '@ocfl/ocfl-fs';
import {ROCrate} from 'ro-crate';
import * as fs from 'fs-extra';
import assert from 'assert';
import * as path from 'path';
import {first} from 'lodash';


const log = getLogger();

export async function bootstrap({configuration}) {
  try {
    await deleteRecords();
    log.info('All collections from database have been deleted');
    return await initOCFL({configuration});
  } catch (e) {
    log.error(e);
    throw new Error(e);
  }
}

export async function bootstrapObject({configuration, object}) {
  log.debug(`Loading record: ${object.root}`);
  const license = configuration.api.license;
  const identifier = configuration.api.identifier;
  let crate;
  try {
    const crateFile = await object.getFile({logicalPath: 'ro-crate-metadata.json'}).asString();
    crate = new ROCrate(JSON.parse(crateFile));
  } catch (e) {
    log.error(e.message);
  }
  const root = crate.rootDataset;
  if (root) {
    let lic;
    const rootLicense = first(root?.license) || root?.license;
    if (rootLicense && rootLicense['@id']) {
      lic = rootLicense['@id'];
    } else {
      lic = license?.default?.['@id'];
    }
    const crateId = crate.rootId;
    //console.log(`${crateId} license: ${lic}`);
    if (crateId !== './') {
      const rec = {
        crateId: crateId,
        license: lic,
        name: root['name'],
        description: root['description'] || '',
        objectRoot: object.root
      }
      log.info(`Loading ${rec.crateId}`);
      //log.info(JSON.stringify(root['conformsTo']));
      //index the types
      //if it claims to be a memberOf !! think of sydney speaks
      //const recordCreate = await createRecordWithCrate(rec, root['hasMember'], crate.__item_by_type);
      const recordCreate = await createRecord({
        data: rec,
        memberOfs: root['memberOf'] || [],
        atTypes: root['@type'] || [],
        conformsTos: root['conformsTo'] || []
      });
    } else {
      log.error(`Cannot insert a crate with Id: './' please use arcp`);
    }
  } else {
    log.warn(`${object.root} : does not contain an ROCrate with a valid root`);
  }
}

export async function initOCFL({configuration}) {
  return new Promise(async (resolve, reject) => {
    try {
      const ocflConf = configuration.api.ocfl;
      const storage = ocfl.storage({root: ocflConf.ocflPath, workspace: ocflConf.ocflScratch, ocflVersion: '1.0'});
      storage.load();
      let objectsCount = 0;
      for await (let object of storage) {
        await object.load();
        objectsCount++;
        log.info(`Found: ${objectsCount} : ${object.id}`);
        await bootstrapObject({configuration, storage, object});
      }
      resolve(objectsCount);
    } catch (e) {
      log.error('initOCFL error');
      log.error(e.message);
      reject(e);
    }
  });
}
