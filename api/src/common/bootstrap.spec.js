import "regenerator-runtime";
import fs from "fs-extra";

import {getRecords} from "../lib/record";
import {bootstrap} from "./bootstrap";

import {testLicense as license, testIdentifier as identifier, testOCFLConf as ocfl} from "../common";

jest.setTimeout(10000);

describe("Test bootstraping the index", () => {
  it("bootstrap with test config", async () => {
    await bootstrap({configuration: {api: {ocfl: ocfl, license: license, identifier: identifier}}})
    const records = await getRecords({});
    expect(records.data.length).toBeGreaterThanOrEqual(1);
  });
  // it("bootstrap with configuration", async () => {
  //     const configuration = await loadConfiguration();
  //     await bootstrap({configuration});
  //     const records = await getRecords({});
  //     expect(records.data.length).toBeGreaterThanOrEqual(2);
  // });
});
