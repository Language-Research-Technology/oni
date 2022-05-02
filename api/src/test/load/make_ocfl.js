require("regenerator-runtime/runtime");
const { ocfltools } = require("oni-ocfl");
const { loadConfiguration } = require("../../services");

let configuration;

(async () => {
  try {
    configuration = await loadConfiguration();
    await ocfltools.createRepo({ configuration });
  } catch (error) {
    console.error(error);
    process.exit();
  }

})();
