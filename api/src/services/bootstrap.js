import {getLogger} from './index';
import {createRecord, deleteRecords} from '../controllers/record';
import {ocfltools} from 'oni-ocfl';
import {ROCrate} from 'ro-crate';
import * as fs from 'fs-extra';
import assert from 'assert';
import * as path from 'path';
import {first} from 'lodash';
import {OcflObject} from "@coedl/ocfl";

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

export async function bootstrapObject({configuration, repository, object}) {
  log.debug(`Loading record: ${object['repositoryPath']}`);
  const license = configuration.api.license;
  const identifier = configuration.api.identifier;
  const jsonInfo = await ocfltools.getFileInfo({repository, crateId: object.id, filePath: 'ro-crate-metadata.json'});
  const crateFile = await fs.readJson(jsonInfo.path);
  const crate = new ROCrate(crateFile);
  const root = crate.getRootDataset();
  if (root) {
    let lic;
    const rootLicense = first(root?.license) || root?.license;
    if (rootLicense && rootLicense['@id']) {
      lic = rootLicense['@id'];
    } else {
      lic = license?.default?.['@id'];
    }
    const crateId = crate.getRootId();
    //console.log(`${crateId} license: ${lic}`);
    if (crateId !== './') {
      const rec = {
        crateId: crateId,
        license: lic,
        name: root['name'],
        description: root['description'] || '',
        pairtreeId: object.pairtreeId
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
    log.warn(`${jsonInfo.path} : does not contain an ROCrate with a valid root`);
  }
}

export async function initOCFL({configuration}) {
  return new Promise(async (resolve, reject) => {
    try {
      const ocfl = configuration.api.ocfl;
      const repository = await ocfltools.connectRepo({ocflRoot: ocfl.ocflPath, ocflScratch: ocfl.ocflScratch});
      assert(await repository.isRepository(), 'Aborting: Bad OCFL repository');
      repository.findObjects();
      let objectsCount = 0;
      repository.on("object", async object => {
        await object.load();
        objectsCount++;
        log.info(`Found: ${objectsCount} : ${object.id}`);
        await bootstrapObject({configuration, repository, object});
      });
      repository.on("done", () => {
        process.nextTick(() => {
          log.info('Finished walking repository');
          resolve(objectsCount);
        });
      });
      repository.on("error", (e) => {
        log.error(e);
        log.error('Error finding objects!');
        reject(e);
      });
      //TODO: Actually do something here instead of a timeout!
      //await new Promise((resolve) => setTimeout(resolve, 20000));
      //return repository;
    } catch (e) {
      log.error('initOCFL error');
      log.error(e);
      reject(e);
    }
  });
}
