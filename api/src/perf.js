import {ROCrate} from 'ro-crate';
import fs from 'fs-extra';
import jsonld from 'jsonld'

export async function loadSourceData() {
  const sourcedata = {};
  sourcedata['surnames'] = await loadsource(path.join(dir, 'surname.txt'));
  sourcedata['givennames'] = await loadsource(path.join(dir, 'givenname.txt'));
  return sourcedata;
}

export async function randomCollections(n, sourceData) {

}

export async function createROCrate({dest, collection, id}) {
  const crate = new ROCrate();
  crate.index();
  const root = crate.getRootDataset();
  root.id = id;
  for (let prop of Object.keys(collection)) {
    root[prop] = collection[prop];
  }

  const catalog = path.join(dest, id, 'ro-crate-metadata.jsonld');

  const context = {'@context': crate.defaults.context}


  crate.json_ld = await jsonld.flatten(crate.json_ld, context);
  await fs.writeFile(catalog, JSON.stringify(crate.json_ld, null, 2));

}
