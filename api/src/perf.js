require('regenerator-runtime/runtime');

const fs = require('fs-extra');
const ROCrate = require('ro-crate').ROCrate;

const random = require('./common/random');
const path = require('path');
const logger = require('./common');

const log = logger.getLogger();

const ORGTYPES = ['Institute', 'University'];
const HONORIFICS = ['Dr', 'A/Prof', 'Prof', 'Dr', 'Dr', 'Dr', 'Mr', 'Ms'];
const FILE_TYPES = ['OR', 'B'];

async function loadSource(file) {
  try {
    const text = await fs.readFile(file);
    return text.toString().split('\n');
  } catch (e) {
    log.error('loadSource');
    log.error(e)
    throw new Error(e);
  }
}

async function loadSourceData(baseDir) {
  const sourceData = {};
  sourceData['surnames'] = await loadSource(path.join(baseDir, 'surname.txt'));
  sourceData['givennames'] = await loadSource(path.join(baseDir, 'givenname.txt'));
  sourceData['licenses'] = await fs.readJson(path.join(baseDir, 'licenses.json'));
  return sourceData;
}

async function randomCollections(n, sourceData) {
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

async function createROCrate({ dest, collection, id, repoName }) {
  try {
    const crate = new ROCrate();
    crate.index();
    const root = crate.getRootDataset();
    root.identifier = [
      { "@id": `_:local-id:${repoName}:arcp://name,${repoName}/${id}` }
    ]
    for (const prop of Object.keys(collection.root)) {
      root[prop] = collection.root[prop];
    }
    crate.addItem({
      "@id": `_:local-id:${repoName}:arcp://name,${repoName}/${id}`,
      "@type": "PropertyValue",
      "value": `arcp://name,${repoName}/${id}`,
      "name": repoName
    });
    for (const item of collection.elements) {
      crate.addItem(item);
    }

    const catalog = path.join(dest, id, 'ro-crate-metadata.json');
    const context = { '@context': crate.defaults.context };
    await crate.resolveContext();
    await fs.mkdirp(path.join(dest, id));
    await fs.writeFile(catalog, JSON.stringify(crate.json_ld, null, 2));
  } catch (e) {
    console.log(e);
    log.error('createROCrate');
    log.error(e);
  }
}

module.exports = {
  loadSourceData: loadSourceData,
  randomCollections: randomCollections,
  createROCrate: createROCrate
}
