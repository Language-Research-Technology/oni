import "regenerator-runtime";
import fetch from "node-fetch";
import {host} from "../common";

import {testOCFLConf as ocfl} from "../common";
import {getRecord, getUridCrate} from "./record";

jest.setTimeout(10000);

describe("Test load records", () => {
  test("it should be able to retrieve records", async () => {
    const id = 'arcp://name,ATAP/uts.edu.au';
    const record = await getRecord({recordId: id});
    const crate = await getUridCrate({arcpId: id, diskPath: record['diskPath'], catalogFilename: ocfl.catalogFilename});
    expect(crate).not.toBeNull();
  });

});
