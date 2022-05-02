require('regenerator-runtime/runtime');
const fetch = require("node-fetch");
const path = require('path');
const fs = require('fs-extra');

const { loadConfiguration, generateToken } = require("../services");
const perf = require('./load/perf');
const host = require("../services").testHost;
const testOCFLConf = require('../services').testOCFLConf;
const testCreate = require('../services').testCreate;
const ocflTools = require('oni-ocfl');
const { makedir } = require('../services/random');
const { it } = require('date-fns/locale');
const { async } = require('hasha');
const { workingPath } = require('../services/utils');
const ocfl = require('ocfl');

let configuration;
let perfDataDir = path.join(process.cwd(), './test-data/perf');

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;
jest.setTimeout(MAX_SAFE_TIMEOUT);

function cleanup(perfDataDir) {
  if (fs.pathExistsSync(perfDataDir)) {
    fs.removeSync(perfDataDir);
  }
}

describe("Load test", () => {
  test('Should push all ro-crates to the database', async () => {
    //Read all perfDataDir
    const crates = await fs.readdir(perfDataDir);
    const ocflPath = workingPath('/opt/storage/oni/ocfl');
    testOCFLConf.create = testCreate;
    const repo = await ocflTools.connectRepo(ocflPath);
    console.log(`Trying to load: ${ crates.length } objects`);
    let i = 0;
    for (const ro of crates) {
      i++;
      const col = {
        "title": ro,
        "skip": false,
        "roCrateDir": path.join(perfDataDir, ro),
        "roCrate": "ro-crate-metadata.json"
      };
      console.log(`${ i } : ${ col.roCrateDir + "/" + col.roCrate }`);
      await ocflTools.loadCollection({ repo, ocfl: testOCFLConf, col });
    }
    expect(crates.length).toBe(100);
  });
});
