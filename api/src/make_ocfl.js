require("regenerator-runtime/runtime");
const ocflTools = require("./common/ocfl-tools");
const { loadConfiguration } = require("./common");

let configuration;

(async () => {
  try {
    configuration = await loadConfiguration();
    await ocflTools.createRepo({ configuration });
  } catch (error) {
    console.error(error);
    process.exit();
  }

})();
