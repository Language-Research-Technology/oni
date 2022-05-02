import {bootstrap} from "../../services/bootstrap";

require('regenerator-runtime/runtime');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs-extra');
const rimraf = require('rimraf');

const {ocfltools, generateArcpId} = require('oni-ocfl');
import {ROCrate} from 'ro-crate';

const perf = require('./perf');
const {testHost, testOCFLConf, testCreate} = require('../../services');
const {makedir} = require('../../services/random');
const {workingPath} = require("../../services/utils");
import {loadConfiguration, filterPrivateInformation} from "../../services/configuration";
import {elasticBootstrap, elasticIndex, elasticInit} from "../../indexer/elastic";
import {getRecords} from "../../controllers/record";

let configuration;
let perfDataDir = path.join(process.cwd(), './test-data/perf-100');
let ocflRoot;
let ocflScratch;
const totalCrates = 1000;
const multiplier = 100; //This is sensitive to your memory

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;
jest.setTimeout(MAX_SAFE_TIMEOUT);

function cleanup(perfDataDir) {
  if (fs.pathExistsSync(perfDataDir)) {
    fs.removeSync(perfDataDir);
  }
}

describe("Create Crates", () => {

  beforeAll(() => {

  });

  test("Should have started", async () => {
    configuration = await loadConfiguration();
    expect(configuration).toHaveProperty("api");
  });

  test("Should create random collections", async () => {
    const sourceData = await perf.loadSourceData(path.join(process.cwd(), './test-data/vocabularies'));
    const collections = await perf.randomCollections(1, sourceData);
    expect(collections.length).toBeGreaterThan(0);
  });

  test("Should create random ro-crates and store them", async () => {
    const sourceData = await perf.loadSourceData(path.join(process.cwd(), './test-data/vocabularies'));
    testOCFLConf.create = testCreate;
    let i = 0;
    for (let cratesCreated = 1; cratesCreated <= totalCrates; cratesCreated++) {
      const collections = await perf.randomCollections(multiplier, sourceData);
      for (let collection of collections) {
        const id = await makedir(perfDataDir);
        await perf.createROCrate({dest: perfDataDir, collection, id, repoName: testOCFLConf.create.repoName})
        console.log(`Crate: ${i++}`);
      }
    }
    const total = totalCrates * multiplier;
    expect(i).toBe(total);
  });
});

let repository;

describe("Checkin OCFL", () => {

  beforeAll(async () => {
    configuration = await loadConfiguration();
    ocflRoot = workingPath(configuration.api.ocfl.ocflPath);
    ocflScratch = workingPath(configuration.api.ocfl.ocflScratch);
    repository = await ocfltools.connectRepo({ocflRoot, ocflScratch});
  });

  test('Should push all ro-crates to an existing repository', async () => {
    //Read all perfDataDir
    const crates = await fs.readdir(perfDataDir);
    testOCFLConf.create = testCreate;

    console.log(`Trying to load: ${crates.length} objects`);
    let objectCount = 0;
    for (const ro of crates) {
      objectCount++;
      const col = {
        "title": ro,
        "skip": false,
        "roCrateDir": path.join(perfDataDir, ro),
        "roCrate": "ro-crate-metadata.json"
      };
      const rocrateFilePath = path.join(col.roCrateDir, col.roCrate);
      const json = await fs.readJson(rocrateFilePath);
      const rocrateOpts = {alwaysAsArray: true, resolveLinks: true};
      const rocrate = new ROCrate(json, rocrateOpts);
      console.log(`${objectCount} : ${col.roCrateDir + "/" + col.roCrate}`);
      //I have to do this next line because of a bug in ro-crate-js#develop-rewrite
      //rocrate.rootId = generateArcpId(configuration.api.ocfl.create.repoName, "collection", col.title);
      const object = await ocfltools.checkin({repository: repository, rocrateDir: col.roCrateDir, crate: rocrate});
      const isObject = await object.isObject();
      expect(isObject);
    }
    const total = totalCrates * multiplier;
    expect(objectCount).toBe(total);
  });
});


describe("Postgres", () => {

  beforeAll(async () => {
    configuration = await loadConfiguration();
  });

  test('Should index all ocfl objects into postgres', async () => {
    try {
      await bootstrap({configuration});
      const records = await getRecords({offset:0, limit:1});
      expect(records.total).toBe(totalCrates);
    } catch (e) {
      console.log(e);
    }
  });
});

describe("Elastic", () => {

  beforeAll(async () => {
    configuration = await loadConfiguration();
  });

  test('Connect to repo', async () => {
    const ocfl = configuration.api.ocfl;
    repository = await ocfltools.connectRepo({ocflRoot: ocfl.ocflPath, ocflScratch: ocfl.ocflScratch});
    expect(await repository.isRepository());
  });

  test('Should index all ocfl objects into elastic', async () => {
    //Override configuration with test ocfl
    await elasticInit({configuration});
    await elasticBootstrap({configuration});
    await elasticIndex({configuration, repository});
  });
});
