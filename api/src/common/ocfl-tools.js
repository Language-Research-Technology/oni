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
    const repo = new OCFLRepository();
    repoPath = workingPath(repoPath);
    log.debug(`Loading OCFL: ${repoPath}`);
    await repo.load(repoPath);

    const objects = await repo.objects();
    const records = [];
    const catalogs = Array.isArray(catalogFilename) ? catalogFilename : [catalogFilename];

    for (let object of objects) {
        log.info(`Loading ocfl object at ${object.path}`);
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

export async function checkin(repo, repoName, rocrateDir, crate) {
    const rocrateFile = path.join(rocrateDir, "ro-crate-metadata.json");

    try {
        const existingId = crate.getNamedIdentifier(repoName);
        log.debug(repoName, existingId);
        if (existingId) {
            log.debug(`Local identifier found ${repoName}/${existingId}`);
            const res = await repo.importNewObjectDir(existingId, rocrateDir);
            log.debug(`Updated ${existingId}, ${res.path}`);
        } else {
            const newId = uuidv4();
            log.debug(`Minting new local identifier ${repoName}/${newId}`);
            await repo.importNewObjectDir(newId, rocrateDir);
            log.debug(`Imported ${rocrateDir}  ${newId}`);
            crate.addIdentifier({name: repoName, identifier: newId});
            await fs.writeJson(rocrateFile, crate.getJson(), {spaces: 2});
            const res = await repo.importNewObjectDir(newId, rocrateDir);
            log.debug(`Updated ${rocrateDir} ${newId} metadata with identifier - wrote to ${res}`);
        }
    } catch (e) {
        log.error(`Error importing ${rocrateDir}`);
        log.error(e);
    }

}

export function arcpId(id) {
    if (!id.startsWith('/')) {
        id = `/${id}`;
    }
    const url = new URL(id, `arcp://uuid,${uuidv4()}`);
    return url.href;
}
