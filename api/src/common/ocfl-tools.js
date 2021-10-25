import path from "path";
import fs from "fs-extra";
import {Repository as OCFLRepository} from "ocfl";
import {getLogger} from "./logger";
import hasha from "hasha";
import {loadConfiguration} from "./configuration";
import {workingPath} from "./utils";
import {v4 as uuidv4} from "uuid";
import {createRecord} from "../lib/record";

const log = getLogger();

export async function loadFromOcfl(repoPath, catalogFilename, hashAlgorithm) {
  try {
    const repo = new OCFLRepository();
    repoPath = workingPath(repoPath);
    log.debug(`Loading OCFL: ${repoPath}`);
    await repo.load(repoPath);

    const objects = await repo.objects();
    const records = [];
    for (let object of objects) {
      log.debug(`Loading ocfl object at ${object.path}`);
      const json = await readCrate(object, catalogFilename);
      if (json) {
        records.push({
          path: path.relative(repoPath, object.path),
          hash_path: hasha(object.path, {algorithm: hashAlgorithm}),
          jsonld: json,
          ocflObject: object
        });
      } else {
        log.warn(`Couldn't find ${catalogFilename} in OCFL inventory for ${object.path}`);
      }
    }
    log.debug(`got ${records.length} records`);

    return records;
  } catch (e) {
    log.error('loadFromOcfl error');
    log.error(e);
  }
}

// look for the ro-crate metadata file in the ocfl object's
// inventory, and if found, try to load and parse it.
// if it's not found, returns undefined

export async function readCrate(object, catalogFilename) {

  const inv = await object.getInventory();
  const headState = inv.versions[inv.head].state;

  for (let hash of Object.keys(headState)) {
    if (headState[hash].includes(catalogFilename)) {
      const jsonfile = path.join(object.path, inv.manifest[hash][0]);
      try {
        const json = await fs.readJson(jsonfile);
        return json;
      } catch (e) {
        log.error(`Error reading ${jsonfile}`);
        log.error(e);
        return undefined;
      }
    }
  }
  return undefined;
}

export async function getItem(object, catalogFilename, itemId) {
  const inv = await object.getInventory();
  const headState = inv.versions[inv.head].state;
  for (let hash of Object.keys(headState)) {
    if (headState[hash].includes(catalogFilename)) {
      try {
        const filePath = path.join(object.path, itemId);
        return filePath;
      } catch (e) {
        log.error(`Error reading ${filePath}`);
        log.error(e);
        return undefined;
      }
    }
  }
}

export async function connectRepo(repoPath) {
  const repo = new OCFLRepository();
  try {
    const stat = await fs.stat(repoPath);
    if (stat.isDirectory()) {
      await repo.load(repoPath);
      return repo;
    } else {
      console.error(`${repoPath} is not a directory`);
    }
  } catch (e) {
    await fs.mkdir(repoPath);
    await repo.create(repoPath);
    return repo;
  }
}

export async function checkin(repo, repoName, rocrateDir, crate, hashAlgorithm) {
  const rocrateFile = path.join(rocrateDir, "ro-crate-metadata.json");
  try {
    const existingId = crate.getNamedIdentifier(repoName);
    log.debug(`repoName: ${repoName}, ${existingId}`);
    if (existingId) {
      log.debug(`Local identifier found ${repoName}/${existingId}`);
      const hasDir = hasha(existingId, {algorithm: hashAlgorithm});
      const res = await repo.importNewObjectDir(hasDir, rocrateDir);
      log.debug(`Updated ${existingId}, ${res.path}`);
    } else {
      const newId = arcpId({crate, identifier: repoName});
      log.debug(`Minting new local identifier ${repoName}/${newId}`);
      await repo.importNewObjectDir(newId, rocrateDir);
      log.debug(`Imported ${rocrateDir}  ${newId}`);
      crate.addIdentifier({name: repoName, identifier: newId});
      await fs.writeJson(rocrateFile, crate.getJson(), {spaces: 2});
      const hasDir = hasha(newId, {algorithm: hashAlgorithm});
      const res = await repo.importNewObjectDir(hasDir, rocrateDir);
      log.debug(`Updated ${rocrateDir} ${newId} metadata with identifier - wrote to ${res}`);
    }
  } catch (e) {
    log.error(`Error importing ${rocrateDir}`);
    log.error(e);
  }

}

// TODO: Define a standard on what to do in case there is no Identifier.
// Like `arcp://name,sydney-speaks/corpus/${type}${id}`;
export function arcpId({crate, identifier}) {
  try {
    const id = crate.getNamedIdentifier(identifier);
    if (!id) {
      const fallBackId = crate.getNamedIdentifier('domain');
      if (!fallBackId) {
        log.warn(`No identifier found ${identifier}... skipping`);
        return null;
      }
      const url = new URL(fallBackId, `arcp://name,${identifier}`);
      return url.href;
    } else {
      const url = new URL(id, `arcp://name,`);
      return url.href;
    }
  } catch (e) {
    log.error(`arcpId error`);
    log.error(e);
  }
}
