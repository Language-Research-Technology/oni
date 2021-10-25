import "regenerator-runtime";
import fs from "fs-extra";

import {loadFromOcfl, checkin, connectRepo, getItem} from "./ocfl-tools";
import {ROCrate} from "ro-crate";

import {host, testOCFLConf as ocfl} from "../common";
import {OcflObject} from "ocfl";
import fetch from "node-fetch";
import {getRecord, getUridCrate} from "../lib/record";

const testData = {
  roCrateDir: "../test-data/rocrates/farmstofreeways",
  roCrate: "ro-crate-metadata.json"
}

describe("Test loading the configuration", () => {
  it("create repo", async () => {

    const id = 'arcp://name,ATAP/uts.edu.au';
    const itemId = 'files/165/original_2e21ee2bdb706deca25326c1128d745c.jpg';

    const record = await getRecord({recordId: id});
    const ocflObject = new OcflObject(record['diskPath']);
    const filePath = await getItem(ocflObject, ocfl.catalogFilename, itemId);
    filePath;

  });
});
