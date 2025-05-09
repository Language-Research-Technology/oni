import './test-env.js'; // this is important to be placed in the first line.
import { expect } from "expect";
import assert from "node:assert";
import { loadConfiguration } from "./services/configuration.js";
import { indexRepository, loadIndexers } from "./services/indexer.js";
import ocfl from "@ocfl/ocfl-fs";
import fs from "node:fs/promises";
import path from "node:path";
import { sequelize, Sequelize } from './models/index.js';
import { setupRoutes } from "./routes/index.js";
import { createJwtToken, createUsers } from './test-utils.js';


var app;
var users;
const configuration = await loadConfiguration();

global.testDataRootPath = path.resolve(import.meta.dirname, '../test-data');
global.testOcflRootPath = configuration.api.ocfl.ocflTestPath;

configuration.api.openapi.enabled = false;
configuration.api.elastic.index = 'test';

const testSeq = new Sequelize({
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: 'postgres',
  dialect: 'postgres'
});

export const mochaHooks = {
  beforeAll(done) {
    this.app = app;
    this.users = users;
    this.configuration = configuration;
    // do something before every test
    done();
  }
};

export async function mochaGlobalSetup() {
  // @ts-ignore
  global.expect = expect;
  //global.configuration = configuration;
  //configuration = await loadConfiguration('./configuration/development-configuration.json');

  // create test ocfl repo
  const ocflConf = configuration.api.ocfl;
  const storage = {
    root: ocflConf.ocflTestPath,
    workspace: ocflConf.ocflTestScratch,
    ocflVersion: '1.1',
    layout: {
      extensionName: '000N-path-direct-storage-layout'
    }
  };

  let repository;
  try {
    global.repository = repository = await ocfl.createStorage(storage);
    //await repository.load();
  } catch (e) {
    console.error('repository already exist');
    console.error(e);
    process.exit(1);
  }
  // populate ocfl
  const directories = await fs.readdir('./test-data/ocfl');
  for (let name of directories) {
    const base = path.join('./test-data/ocfl', name);
    try {
      const meta = JSON.parse(await fs.readFile(path.join(base, 'ro-crate-metadata.json'), { encoding: 'utf-8' }));
      const objectName = meta['@graph'][0].about['@id'];
      const o = repository.object(objectName);
      await o.import(base);
    } catch (error) {
    }
  }

  // populate test database
  //console.log('hook', process.env.DB_DATABASE);
  try {
    await testSeq.query(`CREATE DATABASE ${process.env.DB_DATABASE};`);
  } catch (error) {
  }
  try {
    await sequelize.sync();
    users = await createUsers(configuration);
    // create tokens
    for (const name in users) {
      const token = await createJwtToken(configuration.api.session.secret, users[name].id, users[name].email);
      users[name]._tokenHeader = `Bearer ${token}`;
    }

    await loadIndexers({ configuration, repository });
    await indexRepository({ repository, types: ['structural','search'], skipByMatch: configuration.api.skipByMatch });
  } catch (error) {
    console.error(error);
  }

  // test app
  app = setupRoutes({ configuration, repository });

  //mock fetch
  const _fetch = global.fetch;
  global.fetch = async function (input, init) {
    console.log(input);
    return _fetch(input, init);
  }
}

export async function mochaGlobalTeardown() {
  //console.log('mochaGlobalTeardown');
  // clean up, delete test db
  const ocflConf = configuration.api.ocfl;
  await fs.rm(ocflConf.ocflTestPath, { recursive: true, force: true });
  await fs.rm(ocflConf.ocflTestScratch, { recursive: true, force: true });
  // var c = await sequelize.models.record.count();
  // console.log(c);
  await sequelize.close();
  await testSeq.query(`DROP DATABASE ${process.env.DB_DATABASE};`);
  await testSeq.close()
  console.log('test end');
}