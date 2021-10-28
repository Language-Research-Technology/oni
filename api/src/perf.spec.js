import "regenerator-runtime";
import fetch from "node-fetch";
import path from 'path';
import {chance } from 'chance';

import { loadConfiguration, generateToken } from "../src/common";
import * as perf from './perf';
import {
  testHost as host,
} from "../src/common";

describe("Load test API", () => {
  // it("Should have started", async () => {
  //   let response = await fetch(`${host}/configuration`);
  //   expect(response.status).toEqual(200);
  //   let configuration = await response.json();
  //   expect(configuration).toHaveProperty("ui");
  // });

  it("Should create random ro-crates and store them", async () => {
    const sourceData = await perf.loadSourceData(path.join(process.cwd(), '../test-data/vocabularies'));
    const collections = await perf.randomCollections(1, sourceData);
    console.log(collections[0]);
  });

});
