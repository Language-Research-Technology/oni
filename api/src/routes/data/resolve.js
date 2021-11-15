const { getRecord, getFile, getUridCrate } = require('../../lib/record');
const fs = require('fs-extra');
const { first, filter } = require('lodash');
const { getLogger } = require('../../common');
const { getDataRoCrate } = require('./crate');
const { getRootConformsTos, getRootConformsToByCrateId } = require('../../lib/rootConformsTo');
const { getRootMemberOfs } = require('../../lib/rootMemberOf');
const { ROCrate } = require('ro-crate');
const log = getLogger();

async function getResolveLinks({ req, res, next, configuration }) {
  try {
    log.debug(`Get resolve: ${ req.query.id } : ${ req.query['resolve-links'] }`)
    const record = await getRecord({ crateId: req.query.id });
    if (!record['data']) {
      res.send({ error: 'record not found' }).status(404);
    }
    const response = [];
    const resolveLinks = await resolveProfile({
      crateId: record['data'].crateId,
      response: response,
      configuration: configuration
    });
    //TODO: ask Peter why the default is ro-crate-metadata.jsonld
    const rocrate = new ROCrate({
      "@context": [
        "https://w3id.org/ro/crate/1.1/context",
        {
          "@vocab": "http://schema.org/"
        },
        {
          "@base": null
        }
      ],
      "@graph": [
        {
          "@id": "./",
          "@type": "Dataset"
        },
        {
          "@id": "ro-crate-metadata.json",
          "@type": "CreativeWork",
          "about": {
            "@id": "./"
          },
          "identifier": "ro-crate-metadata.json"
        } ]
    });
    rocrate.toGraph();
    for (let c of resolveLinks) {
      const subcrate = new ROCrate(c);
      subcrate.toGraph();
      const rootNamedId = subcrate.getNamedIdentifier(configuration.api.identifier.main);
      log.debug(rootNamedId);
      const root = subcrate.getRootDataset();
      subcrate.changeGraphId(root, rootNamedId);
      for (let s of subcrate.getGraph()) {
        rocrate.addItem(s);
      }
    }
    log.debug('changed all root Ids')
    //This is silly?
    const roGraphNoId = filter(rocrate.getGraph(), (r) => r['@id'] !== './');
    findAndReplace(roGraphNoId, req.query.id, './');
    //--
    // const base = rocrate.getItem(req.query.id);
    // rocrate.changeGraphId(base, './');
    if (!resolveLinks) {
      res.send({ id: req.query.id, file: req.query.file, message: 'Not Found' }).status(404);
    } else {
      //res.send(rocrate.getGraph()).status(200);
      res.send(roGraphNoId).status(200);
      next();
    }
  } catch (e) {
    log.error(e);
    res.send({ error: 'Error trying to resolve links', message: e.message }).status(500);
  }
}

async function resolveProfile({ crateId, response, configuration }) {
  const conformsTos = await getRootConformsToByCrateId({ crateId });
  if (!conformsTos) {
    return response;
  }
  const profiles = filter(conformsTos, (c) => {
    //TODO: Ask Peter: Only works if there is only one profile per conforms to
    return c['dataValues']['conformsTo'].match(/ro-crate-profile/g);
  });
  if (!profiles || profiles.length < 1) {
    return response;
  }
  const profile = first(profiles);
  const member = profile['dataValues']['crateId'];
  const diskPath = profile['dataValues']['record']['diskPath'];
  const record = await getUridCrate({
    host: configuration.api.host,
    crateId: member,
    diskPath: diskPath,
    catalogFilename: configuration.api.ocfl.catalogFilename,
    typesTransform: configuration.api.rocrate.dataTransform.types
  });
  response.push(record);
  let memberOfs = await getRootMemberOfs({ crateId: member });
  for (let memberOf of memberOfs['data']) {
    const mO = memberOf['dataValues'];
    const member = mO['crateId'];
    const diskPath = mO['record']['dataValues']['diskPath']
    const record = await getUridCrate({
      host: configuration.api.host,
      crateId: member,
      diskPath: diskPath,
      catalogFilename: configuration.api.ocfl.catalogFilename,
      typesTransform: configuration.api.rocrate.dataTransform.types
    });
    response.push(record);
    await resolveProfile({ crateId: mO['crateId'], response, configuration });
  }
  return response;
}

function findAndReplace(object, value, replacevalue) {
  for (let x in object) {
    if (typeof object[x] === typeof {}) {
      findAndReplace(object[x], value, replacevalue);
    }
    if (object[x] === value) {
      object['@id'] = replacevalue;
      break;
    }
  }
}

module.exports = {
  getResolveLinks: getResolveLinks
}
