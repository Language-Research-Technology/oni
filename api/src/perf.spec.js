require('regenerator-runtime/runtime');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs-extra');

const perf = require('./perf');
const { testHost, testOCFLConf, testCreate } = require('../src/common');
const { makedir } = require('./common/random');

let configuration;
let perfDataDir = path.join(process.cwd(), '../test-data/perf');

jest.setTimeout(100000);

function cleanup(perfDataDir) {
  if (fs.pathExistsSync(perfDataDir)) {
    fs.removeSync(perfDataDir);
  }
}

describe("create ro-crates", () => {

  beforeAll(() => {
    cleanup(perfDataDir);
  });

  test("Should have started", async () => {
    let response = await fetch(`${ testHost }/configuration`);
    expect(response.status).toEqual(200);
    configuration = await response.json();
    expect(configuration).toHaveProperty("ui");
  });

  test("Should create random collections", async () => {
    const sourceData = await perf.loadSourceData(path.join(process.cwd(), '../test-data/vocabularies'));
    const collections = await perf.randomCollections(1, sourceData);
    expect(collections.length).toBeGreaterThan(0);
  });

  test("Should create random ro-crates and store them", async () => {
    const sourceData = await perf.loadSourceData(path.join(process.cwd(), '../test-data/vocabularies'));
    const n = 1000;
    const collections = await perf.randomCollections(n, sourceData);

    testOCFLConf.create = testCreate;
    collections.reduce((promise, collection, index) => {
      return promise.then(async () => {
        const id = await makedir(perfDataDir);
        return perf.createROCrate({ dest: perfDataDir, collection, id, repoName: testOCFLConf.create.repoName })
          .then(() => {
            if (index >= n) {
              console.log("Done");
              expect(collections.length).toBe(1000);
            }
            return Promise.resolve();
          });
      })
    }, Promise.resolve());
  });
});

