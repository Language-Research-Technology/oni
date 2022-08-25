require("regenerator-runtime/runtime");

import {testOCFLConf} from "./";
import {OcflObject} from "ocfl";
import {getRecord} from "../controllers/record";

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
    const filePath = await ocfltools.getItem(ocflObject, testOCFLConf.catalogFilename, itemId);
    filePath;

  });
});
