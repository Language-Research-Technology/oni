import * as fs from "fs-extra";

const { ROCrate } = require('ro-crate');
const { ocfltools } = require('oni-ocfl');
const { getLogger } = require("./index");

const log = getLogger();

export async function transformURIs({ host, crateId, uridTypes, repository }) {
  log.debug('transformURIs');
  const jsonInfo = await ocfltools.getFileInfo({ repository, crateId, filePath: 'ro-crate-metadata.json' });
  const json = await fs.readJson(jsonInfo.path);
  const crate = new ROCrate(json);
  for (const item of crate.getGraph()) {
    const itemType = crate.utils.asArray(item['@type']);
    const updateItems = [];
    for (let type of uridTypes) {
      if (itemType.includes(type)) {
        updateItems.push(item);
      }
    }
    updateItems.forEach((i) => {
      const ref = crate.getItem(i['@id']);
      if (ref) {
        log.debug(ref['@id']);
        crate.changeGraphId(ref, `${ host }/stream?id=${ crateId }&path=${ ref['@id'] }`);
      }
    });
  }
  return crate.getJson();
}
