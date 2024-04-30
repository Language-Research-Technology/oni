import fs from "fs-extra";

import { getRecords } from "../controllers/record";
import { bootstrap } from "./bootstrap";
import { testLicense, testIdentifier, testOCFLConf } from "./";

jest.setTimeout(10000);

describe("Test bootstraping the index", () => {
  it("bootstrap with test config", async () => {
    await bootstrap({
      configuration: {
        api: {
          ocfl: testOCFLConf,
          license: testLicense,
          identifier: testIdentifier
        }
      }
    })
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
