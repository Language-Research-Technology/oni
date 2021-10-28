import {loadConfiguration} from "../common";
import {writeJSON} from "fs-extra";
import {cloneDeep} from "lodash";
import models from "../models";

export const testOCFLConf = {
  "ocflPath": "../test-data/test_ocfl",
  "catalogFilename": "ro-crate-metadata.json",
  "hashAlgorithm": "md5"
}

export const testHost = 'http://localhost:8080';
export const testLicense = {default: 'Public'};
export const testIdentifier= {main: 'ATAP'};

export async function setupBeforeAll({adminEmails = []}) {
  let configuration = await loadConfiguration();

  let devConfiguration = cloneDeep(configuration);
  devConfiguration.api.administrators = adminEmails;
  const configPath = process.env.ONI_CONFIG_PATH || "/srv/configuration/development-configuration.json";
  await writeJSON(configPath, devConfiguration, {
    spaces: 4,
  });
  return configuration;
}

export async function setupBeforeEach({emails}) {
  let users = [];
  for (let email of emails) {
    let user = await models.user.create({
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

export async function teardownAfterEach({users = []}) {
  for (let user of users) {
    await user.destroy();
  }
}

export async function teardownAfterAll(configuration) {
  const configPath = process.env.ONI_CONFIG_PATH || "/srv/configuration/development-configuration.json";
  await writeJSON(configPath, configuration, {
    spaces: 4,
  });
  models.sequelize.close();
}