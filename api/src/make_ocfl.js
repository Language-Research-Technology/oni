require("regenerator-runtime/runtime");
const { createRepo } = require("oni-ocfl");
const { loadConfiguration } = require("./common");

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
