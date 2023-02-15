require('regenerator-runtime/runtime');
const path = require('path');
const {languageProfileURI} = require("language-data-commons-vocabs");
const {generateArcpId} = require('oni-ocfl');

const fs = require('fs-extra');
const {ROCrate} = require('ro-crate');

const random = require('../../services/random');
const logger = require('../../services');

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
    const rocrateOpts = {alwaysAsArray: true, resolveLinks: true};
    const crate = new ROCrate({}, rocrateOpts);

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

    // const metadataDescriptor = crate.getItem("ro-crate-metadata.json");
    // metadataDescriptor.conformsTo = crate.utils.asArray(metadataDescriptor.conformsTo)
    //metadataDescriptor.conformsTo.push({"@id": languageProfileURI("Collection")});
    crate.addProfile(languageProfileURI("Collection"));
    root.conformsTo = [{"@id": languageProfileURI("Collection")}];

    for (const item of collection.elements) {
      crate.addItem(item);
    }

    const catalog = path.join(dest, id, 'ro-crate-metadata.json');
    await crate.resolveContext();
    await fs.mkdirp(path.join(dest, id));

    crate.rootId = crate.rootDataset['@id'] = generateArcpId(repoName, "collection", id);
    const metadataDesc = crate.getItem(crate.defaults.roCrateMetadataID);
    metadataDesc.about = crate.rootDataset;

    await fs.writeFile(catalog, JSON.stringify(crate.getJson(), null, 2));
  } catch (e) {
    console.log(e);
    log.error('createROCrate');
    log.error(e);
  }
}

module.exports = {
  loadSourceData,
  randomCollections,
  createROCrate
}
