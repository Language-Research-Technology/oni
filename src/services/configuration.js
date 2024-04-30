import { readJSON } from "fs-extra/esm";
import { readFile } from "node:fs/promises";
import defaultConf from "../../configuration/default.js";

const privateFields = ["clientSecret"];
/** @typedef { typeof defaultConf } Configuration */
/** @type {Configuration} */
var configuration;

async function readFirstFound(paths) {
  for (const p of paths) {
    try {
      const result = await readFile(p, 'utf8');
      return [p, result];
    } catch (error) {
    }
  }
  return [];
}

function overrideDefault(defConf, conf) {
  for (const key in conf) {
    if ((conf[key] != null && conf[key].constructor.name === 'Object') &&
      (defConf[key] != null && defConf[key].constructor.name === 'Object')) {
        defConf[key] = overrideDefault(defConf[key], conf[key])
    } else {
      defConf[key] = conf[key];
    }
  }
  return defConf;
}

/**
 * @param {string} [confPath] 
 * @returns
 */
export async function loadConfiguration(confPath, force = false) {
  if (!force && configuration) return configuration;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const configPath = confPath || process.env.ONI_CONFIG_PATH || `/srv/configuration/${nodeEnv}-configuration.json`;
  const [actualPath, jsonContent] = await readFirstFound([configPath, `/srv/configuration/${nodeEnv}.json`, '/srv/configuration.json']);
  if (jsonContent) {
    console.log('Loading configuration from:', actualPath);
    try {
      configuration = JSON.parse(jsonContent);
    } catch (error) {
      console.error('Error loading configuration');
    }
  }
  if (configuration) {
    configuration = overrideDefault(defaultConf, configuration);
  } else {
    configuration = defaultConf;
    console.error('No configuration file found, using default');
  }

  configuration.api.origins = configuration.api.origins.filter(o => o.host);

  return configuration;
}

export function filterPrivateInformation({ configuration }) {
  let services = Object.keys(configuration.api.authentication).map((service) => {
    service = {
      ...configuration.api.authentication[service],
      name: service,
    };
    for (let privateField of privateFields) {
      delete service[privateField];
    }
    return service;
  });
  configuration.api.authentication = {};
  for (let service of services) {
    configuration.api.authentication[service.name] = service;
  }

  return configuration;
}

// export async function createSessionForTest() {
//     const origConfig = await loadConfiguration();

//     let testConfig = cloneDeep(origConfig);
//     testConfig.api.applications = [{ name: "test", url: "localhost:8000", secret: "xxx" }];
//     await writeJSON("/srv/configuration/development-configuration.json", testConfig);
//     let user = {
//         email: chance.email(),
//         name: chance.name(),
//     };

//     let response = await fetch(`${api}/session/application`, {
//         method: "POST",
//         headers: {
//             Authorization: "Bearer xxx",
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify(user),
//     });
//     response = await response.json();
//     await writeJSON("/srv/configuration/development-configuration.json", origConfig);
//     return { sessionId: response.sessionId, user };
// }
