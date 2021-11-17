require('regenerator-runtime/runtime');
const fetch = require("node-fetch");
const path = require('path');
const fs = require('fs-extra');

const { loadConfiguration, generateToken } = require("./services");
const perf = require('./perf');
const host = require("./services").testHost;
const testOCFLConf = require('./services').testOCFLConf;
const testCreate = require('./services').testCreate;
const ocflTools = require('oni-ocfl');
const { makedir } = require('./services/random');
const { it } = require('date-fns/locale');
const { async } = require('hasha');
const { workingPath } = require('./services/utils');
const ocfl = require('ocfl');

let configuration;
let perfDataDir = path.join(process.cwd(), '../test-data/perf');

jest.setTimeout(10000);

function cleanup(perfDataDir) {
  if (fs.pathExistsSync(perfDataDir)) {
    fs.removeSync(perfDataDir);
  }
}
  

describe("Load test", () => {
  test('Should push all ro-crates to the database', async () => {
    //Read all perfDataDir
    const crates = await fs.readdir(perfDataDir);
    const collections = [];
    //Each load the ro-crate
    for (const ro of crates) {
      const json = await fs.readJSON(path.join(perfDataDir, ro, 'ro-crate-metadata.json'));
      collections.push({
        "title": ro,
        "skip": false,
        "roCrateDir": path.join(perfDataDir, ro),
        "roCrate": "ro-crate-metadata.json"
      });
    }
    const ocflPath = workingPath('./.dev/ocfl');
    testOCFLConf.create = testCreate;
    const repo = await ocflTools.connectRepo(ocflPath);
    for (const col of collections) {
      await ocflTools.loadCollection({ repo, ocfl: testOCFLConf, col });
    }
    expect(collections.length).toBe(100);
  });
});
