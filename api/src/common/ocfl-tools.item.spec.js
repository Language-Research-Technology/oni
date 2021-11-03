require("regenerator-runtime/runtime");
const fs = require("fs-extra");
const {ROCrate} = require("ro-crate");

const {loadFromOcfl, checkin, connectRepo, getItem} = require("./ocfl-tools");
const {host, testOCFLConf} = require("../common");
const {OcflObject} = require("ocfl");
const fetch = require("node-fetch");
const {getRecord, getUridCrate} = require("../lib/record");

const testData = {
  roCrateDir: "../test-data/rocrates/farmstofreeways",
  roCrate: "ro-crate-metadata.json"
}

describe("Test request 1 item", () => {
  it("get item", async () => {

    const id = 'arcp://name,ATAP/uts.edu.au';
    const itemId = 'files/165/original_2e21ee2bdb706deca25326c1128d745c.jpg';

    const record = await getRecord({recordId: id});
    const ocflObject = new OcflObject(record['diskPath']);
    const filePath = await getItem(ocflObject, testOCFLConf.catalogFilename, itemId);
    filePath;

  });
});
