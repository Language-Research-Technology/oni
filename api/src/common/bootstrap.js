import path from "path";
import {getLogger} from "./logger";
import {loadConfiguration} from "./configuration";
import {createRecord} from "../lib/record";
import {loadFromOcfl, arcpId} from "./ocfl-tools";
import {ROCrate} from "ro-crate"

const log = getLogger();

export async function initOCFL() {
    const configuration = await loadConfiguration();
    const o = configuration.api.ocfl;
    log.debug(`Loading ocfl from ${o.ocflPath}`);
    const records = await loadFromOcfl(o.ocflPath, o.catalogFilename, o.hashAlgorithm);
    for (let record of records) {
        const ocflObject = record['ocflObject'];
        const crate = new ROCrate(record['jsonld']);
        crate.index();
        const root = crate.getRootDataset();
        let license = null;
        if (root['license']) {
            license = root['license']['id']
        }
        const rec = {
            arcpId: arcpId(record['hash_path']),
            path: record['path'],
            diskPath: ocflObject['path'],
            license: license,
            name: root['name'],
            description: root['description']
        }
        await createRecord(rec);
    }

}
