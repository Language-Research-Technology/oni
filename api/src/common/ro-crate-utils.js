import {OcflObject} from "ocfl";
import {ROCrate} from 'ro-crate';
import {readCrate} from "./ocfl-tools";
import {getLogger} from "../common/logger";

const log = getLogger();

export async function transformURIs({host, recordId, ocflObject, uridTypes, catalogFilename}) {
  const json = await readCrate(ocflObject, catalogFilename);
  const crate = new ROCrate(json);
  crate.index();
  for (const item of crate.json_ld["@graph"]) {
    const itemType = crate.utils.asArray(item['@type']);
    const updateItems = [];
    for (let type of uridTypes) {
      if (itemType.includes(type)) {
        updateItems.push(item);
      }
    }
    updateItems.forEach((i) => {
      const ref = crate.referenceToItem(i);
      if (ref) {
        log.silly(ref['@id']);
        ref['@id'] = `${host}/data/item?id=${recordId}&file=${ref['@id']}`;
      }
    });
  }
  return crate;
}
