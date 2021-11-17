require("regenerator-runtime/runtime");
const fs = require("fs-extra");
const {ROCrate} = require("ro-crate");
const {loadFromOcfl, checkin, connectRepo} = require("oni-ocfl");

let records;
let crate;

import {testOCFLConf as ocfl} from "./";

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
        await checkin(repo, 'ATAP', testData.roCrateDir, crate, 'md5')
    })
    test("it should load the ocfl repo", async () => {
        records = await loadFromOcfl(ocfl.ocflPath, ocfl.catalogFilename, ocfl.hashAlgorithm);
        expect(records.length).toBeGreaterThanOrEqual(1);
    });
    test("It should load ocflobjects", () => {
        expect(records[0]['ocflObject']).not.toBeNull()
    });
    test("It should load an ro-crate", () => {
        const jsonld = records[0]['jsonld'];
        crate = new ROCrate(jsonld);
        crate.index();
        //TODO: ask peter if this is useful?
        const root = crate.getRootDataset();
        expect(root).not.toBe(undefined);
    });
});
