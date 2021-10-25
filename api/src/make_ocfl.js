import "regenerator-runtime";
import fs from "fs-extra";
import {testOCFLConf as ocfl} from "./common";
import {checkin, connectRepo} from "./common/ocfl-tools";
import {ROCrate} from "ro-crate";
import {loadConfiguration} from "./common";
import {workingPath} from "./common/utils";

let configuration;

function cleanup(ocflPath) {
  if (fs.pathExistsSync(ocflPath)) {
    fs.removeSync(ocflPath);
  }
}

async function loadCollection({repo, ocfl, col}) {
  try {
    const jsonld = fs.readJsonSync(col.roCrateDir + "/" + col.roCrate);
    const crate = new ROCrate(jsonld);
    crate.index();
    console.log(`Check-in: ${col.title}`);
    await checkin(repo, ocfl.create.repoName, col.roCrateDir, crate, ocfl.hashAlgorithm);
  } catch (e) {
    console.log('error: loadCollection');
    throw new Error(e);
  }
}

async function createRepo({configuration}) {
  try {
    const ocfl = configuration.api.ocfl;
    const ocflPath = workingPath(ocfl.ocflPath);
    cleanup(ocflPath);
    const repo = await connectRepo(ocflPath);
    const collections = await fs.readJson(ocfl.create.collections);
    for (let col of collections) {
      if (!col.skip) {
        await loadCollection({repo, ocfl, col});
      }
    }
    console.log("Finished loading collections");
  } catch (e) {
    console.log('error: createRepo');
    throw new Error(e);
  }
}

(async () => {
  try {
    configuration = await loadConfiguration();
    await createRepo({configuration});
  } catch (error) {
    console.error(error);
    process.exit();
  }

})();
