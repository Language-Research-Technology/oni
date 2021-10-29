import { ROCrate } from 'ro-crate';
import fs from 'fs-extra';
import jsonld from 'jsonld'
import * as random from './common/random';
import path from 'path';

const ORGTYPES = ['Institute', 'University'];
const HONORIFICS = ['Dr', 'A/Prof', 'Prof', 'Dr', 'Dr', 'Dr', 'Mr', 'Ms'];
const FILE_TYPES = ['OR', 'B'];

async function loadSource(file) {
  const text = await fs.readFile(file);
  return text.toString().split("\n");
}

export async function loadSourceData(baseDir) {
  const sourceData = {};
  sourceData['surnames'] = await loadSource(path.join(baseDir, 'surname.txt'));
  sourceData['givennames'] = await loadSource(path.join(baseDir, 'givenname.txt'));
  sourceData['licenses'] = await fs.readJson(path.join(baseDir, 'licenses.json'));
  return sourceData;
}

export async function randomCollections(n, sourceData) {
  const keywords = random.arrayFill(Math.floor(n / 2), random.keyword);

  const orgs = random.arrayFill(Math.floor(n / 10), function orgsGen() {
    return random.organization(sourceData, ORGTYPES);
  });

  const people = random.arrayFill(random.int(2, 8), function peopleGen() {
    return random.person(sourceData, orgs, HONORIFICS)
  });
  const files = random.dataFiles(sourceData, FILE_TYPES);

  return random.arrayFill(n, function randomCollectionGen() {
    return random.collection({
      sourceData,
      keywords,
      honorifics: HONORIFICS,
      people,
      orgs,
      files,
      fileTypes: FILE_TYPES
    })
  });
}

export async function createROCrate({ dest, collection, id }) {
  const crate = new ROCrate();
  crate.index();
  const root = crate.getRootDataset();
  root.identifier = [
    {"@id": id}
  ]
  for (let prop of Object.keys(collection)) {
    root[prop] = collection[prop];
  }

  const catalog = path.join(dest, id, 'ro-crate-metadata.json');

  const context = { '@context': crate.defaults.context };

  crate.json_ld = await jsonld.flatten(crate.json_ld, context);
  await fs.writeFile(catalog, JSON.stringify(crate.json_ld, null, 2));

}
