const { loadConfiguration } = require("./configuration.js");
const { writeJSON } = require("fs-extra");
const { cloneDeep } = require("lodash");
const { User, sequelize } = require("../models/index.js");

const testOCFLConf = {
  "ocflPath": "/opt/storage/oni/ocfl",
  "catalogFilename": "ro-crate-metadata.json",
  "hashAlgorithm": "md5"
}

const testCreate = {
  "repoName": "ATAP",
  "collections": "../test-data/ingest-crate-list.development.json"
}
const testHost = 'http://localhost:8080';
const testLicense = { default: 'Public' };
const testIdentifier = { main: 'ATAP' };

async function setupBeforeAll({ adminEmails = [] }) {
  let configuration = await loadConfiguration();

  let devConfiguration = cloneDeep(configuration);
  devConfiguration.api.administrators = adminEmails;
  const configPath = process.env.ONI_CONFIG_PATH || "/srv/configuration/development-configuration.json";
  await writeJSON(configPath, devConfiguration, {
    spaces: 4,
  });
  return configuration;
}

async function setupBeforeEach({ emails }) {
  let users = [];
  for (let email of emails) {
    let user = await User.create({
      email: email,
      provider: "unset",
      locked: false,
      upload: false,
      administrator: false,
    });
    users.push(user);
  }
  return users;
}

async function teardownAfterEach({ users = [] }) {
  for (let user of users) {
    await user.destroy();
  }
}

async function teardownAfterAll(configuration) {
  const configPath = process.env.ONI_CONFIG_PATH || "/srv/configuration/development-configuration.json";
  await writeJSON(configPath, configuration, {
    spaces: 4,
  });
  sequelize.close();
}

module.exports = {
  testOCFLConf,
  testCreate,
  testHost,
  testLicense,
  testIdentifier,
  setupBeforeAll,
  cloneDeep,
  setupBeforeEach,
  teardownAfterEach,
  teardownAfterAll
}
