import "regenerator-runtime";
import fs from "fs-extra";

import { getRecords } from "../lib/record";
import { bootstrap } from "./bootstrap";

import { loadConfiguration, testOCFLConf as ocfl } from "../common";

jest.setTimeout(10000);

describe("Test bootstraping the index", () => {
    it("bootstrap with test config", async () => {
        await bootstrap({ configuration: { api: { ocfl: ocfl, license: { default: "Public" }, identifier: { main: "ATAP" } } } })
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
