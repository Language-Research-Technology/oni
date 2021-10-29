import "regenerator-runtime";
import fs from "fs-extra";
import {testOCFLConf as ocfl} from "./common";
import * as ocflTools from "./common/ocfl-tools";
import {ROCrate} from "ro-crate";
import {loadConfiguration} from "./common";
import {workingPath} from "./common/utils";

let configuration;

(async () => {
  try {
    configuration = await loadConfiguration();
    await ocflTools.createRepo({configuration});
  } catch (error) {
    console.error(error);
    process.exit();
  }

})();
