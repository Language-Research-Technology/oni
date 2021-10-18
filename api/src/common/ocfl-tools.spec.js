import "regenerator-runtime";
import fs from "fs-extra";

import {loadFromOcfl, checkin, connectRepo} from "./ocfl-tools";
import {ROCrate} from "ro-crate";

let records;
let crate;

const ocfl = {
    "ocflPath": "../test-data/test_ocfl",
    "catalogFilename": "ro-crate-metadata.json",
    "hashAlgorithm": "md5"
}

const testData = {
    roCrateDir: "../test-data/rocrates/farmstofreeways",
    roCrate: "ro-crate-metadata.json"
}

async function cleanup() {
    if (fs.pathExistsSync(ocfl.ocflPath)) {
        await fs.removeSync(ocfl.ocflPath);
    }
}

describe("Test loading the configuration", () => {

    beforeAll(async () => {
        await cleanup();
    });
    beforeAll(async () => {
        await cleanup();
    });

    test("create repo", async () => {
        const repo = await connectRepo(ocfl.ocflPath);
        const jsonld = fs.readJsonSync(testData.roCrateDir + "/" + testData.roCrate);
        const crate = new ROCrate(jsonld);
        crate.index();
        await checkin(repo, 'domain', testData.roCrateDir, crate)
    })
    test("it should load the ocfl repo", async () => {
        records = await loadFromOcfl(ocfl.ocflPath, ocfl.catalogFilename, ocfl.hashAlgorithm);
        expect(records.length).toBe(1);
    });
    test("It should load ocflobjects", () => {
        expect(records[0]['ocflObject']).not.toBeNull()
    });
    test("It should load an ro-crate", () => {
        const jsonld = records[0]['jsonld'];
        crate = new ROCrate(jsonld);
        crate.index();
        const root = crate.getRootDataset();
        //TODO: ask peter if this is useful?
        const identifier = crate.getNamedIdentifier('domain');
        identifier
        expect(root).not.toBe("/uts.edu.au");
    })
});
