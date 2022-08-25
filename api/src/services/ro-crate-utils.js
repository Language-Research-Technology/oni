import * as fs from "fs-extra";

const {ROCrate} = require('ro-crate');

const {getLogger} = require("./index");

const log = getLogger();

export async function transformURIs({host, crateId, uridTypes, repository}) {
  log.silly('transformURIs');
  const object = repository.object(crateId);
  await object.load();
  const crateFile = await object.getAsString({logicalPath: 'ro-crate-metadata.json'});
  const crate = new ROCrate(JSON.parse(crateFile));
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
        crate.changeGraphId(ref, `${host}/stream?id=${crateId}&path=${ref['@id']}`);
      }
    });
  }
  return crate.getJson();
}
