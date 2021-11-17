require("regenerator-runtime/runtime");
const { createRepo } = require("oni-ocfl");
const { loadConfiguration } = require("./services");

let configuration;

(async () => {
  try {
    configuration = await loadConfiguration();
    await createRepo({ configuration });
  } catch (error) {
    console.error(error);
    process.exit();
  }

})();
