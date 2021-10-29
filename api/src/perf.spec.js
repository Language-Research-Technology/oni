import "regenerator-runtime";
import fetch from "node-fetch";
import path from 'path';

import { loadConfiguration, generateToken } from "../src/common";
import * as perf from './perf';
import {
  testHost as host,
} from "../src/common";
import * as ocflTools from './common/ocfl-tools';

let configuration;

describe("Load test API", () => {
  it("Should have started", async () => {
    let response = await fetch(`${host}/configuration`);
    expect(response.status).toEqual(200);
    configuration = await response.json();
    expect(configuration).toHaveProperty("ui");
  });

  it("Should create random collections", async () => {
    const sourceData = await perf.loadSourceData(path.join(process.cwd(), '../test-data/vocabularies'));
    const collections = await perf.randomCollections(1, sourceData);
    expect(collections.length).toBeGreaterThan(0);
  });

  it("Should create random ro-crates and store them", async () => {
    const sourceData = await perf.loadSourceData(path.join(process.cwd(), '../test-data/vocabularies'));
    const collections = await perf.randomCollections(100, sourceData);
    const dest = path.join(process.cwd(), '../test-data/perf');
    const id = 'ATAP';
    collections.map(async (collection) => {
      await perf.createROCrate({dest, collection, id});
    });
    //await ocflTools.createRepo({configuration});
    expect(collections.length).toBeGreaterThan(0);
  });

});
