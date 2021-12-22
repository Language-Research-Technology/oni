require("regenerator-runtime/runtime");
import fs from "fs-extra";
import {ROCrate} from "ro-crate";
import {getItem} from "oni-ocfl";
import {host, testOCFLConf} from "./";
import {OcflObject} from "ocfl";
import fetch from "node-fetch";
import {getRecord, getUridCrate} from "../controllers/record";

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
