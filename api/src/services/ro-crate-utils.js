const { ROCrate } = require('ro-crate');
const { ocfltools } = require('oni-ocfl');
const { getLogger } = require("./index");

const log = getLogger();

export async function transformURIs({ host, crateId, ocflObject, uridTypes, catalogFilename }) {
  const json = await ocfltools.readCrate(ocflObject, catalogFilename);
  const crate = new ROCrate(json);
  crate.index();
  crate.toGraph();
  log.silly('transformURIs');
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
        log.silly(ref['@id']);
        crate.changeGraphId(ref, `${ host }/stream?id=${ crateId }&path=${ ref['@id'] }`);
      }
    });
  }
  return crate.getJson();
}
