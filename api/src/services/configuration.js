const {readJSON} = require("fs-extra");

const privateFields = ["clientSecret"];

async function loadConfiguration() {
  let configuration;
  if (process.env.ONI_CONFIG_PATH) {
    configuration = process.env.ONI_CONFIG_PATH;
  } else {
    configuration =
      process.env.NODE_ENV === "development"
        ? "/srv/configuration/development-configuration.json"
        : "/srv/configuration.json";
  }
  configuration = await readJSON(configuration);
  return configuration;
}

function filterPrivateInformation({configuration}) {
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

module.exports = {
  loadConfiguration,
  filterPrivateInformation
}
