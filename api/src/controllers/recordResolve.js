import { ROCrate } from 'ro-crate';
import { getRawCrate, getRecord, getUridCrate } from './record';
import { getRootMemberOfs } from './rootMemberOf';
import { getLogger } from '../services';

const log = getLogger();

export async function recordResolve({ id, getUrid, configuration }) {
  try {
    log.debug(`Get resolve-parts: ${ id }`);
    const response = [];
    await resolveProfile({
      crateId: id,
      response: response,
      getUrid: getUrid,
      configuration: configuration
    });
    if (response.length < 1) {
      return null;
    } else {
      const rocrate = new ROCrate();
      rocrate.index();
      log.debug('Create New ROCrate');
      for (let c of response) {
        const subcrate = new ROCrate(c);
        subcrate.toGraph();
        const rootNamedId = subcrate.getNamedIdentifier(configuration.api.identifier.main);
        const root = subcrate.getRootDataset();
        subcrate.changeGraphId(root, rootNamedId);
        for (let s of subcrate.getFlatGraph()) {
          rocrate.addItem(s);
        }
      }
      log.debug('Updated all "./" s');
      //TODO: Someone please take a look at this munging
      //Now we have an extra ./
      const index = rocrate.json_ld['@graph'].findIndex((o) => o['@id'] === './');
      if (index > -1) rocrate.json_ld['@graph'].splice(index, 1);
      //Deleted and then replaced with the req.query.id
      findAndReplace(rocrate.json_ld['@graph'], id, './');
      log.debug('Deleted root "./"');
      return rocrate.json_ld;
    }
  } catch (e) {
    log.error(e);
    log.error('Error trying to resolve links');
    throw new Error(e);
  }
}

async function resolveProfile({ crateId, response, configuration, getUrid }) {
  const recordMeta = await getRecord({ crateId });
  if (!recordMeta.data) {
    return response;
  }
  const member = recordMeta.data['crateId'];
  const diskPath = recordMeta.data['diskPath'];
  let record;
  if (getUrid) {
    record = await getUridCrate({
      host: configuration.api.host,
      crateId: member,
      diskPath: diskPath,
      catalogFilename: configuration.api.ocfl.catalogFilename,
      typesTransform: configuration.api.rocrate.dataTransform.types
    });
  } else {
    record = await getRawCrate({
      diskPath: recordMeta.data['diskPath'],
      catalogFilename: configuration.api.ocfl.catalogFilename
    });
  }
  response.push(record);
  let memberOfs = await getRootMemberOfs({ crateId: member });
  for (let memberOf of memberOfs['data']) {
    if (memberOf['dataValues']) {
      const mO = memberOf['dataValues'];
      await resolveProfile({ crateId: mO['crateId'], response, configuration, getUrid: true });
    }
  }
  return response;
}

function findAndReplace(object, value, replacevalue) {
  for (let x in object) {
    if (typeof object[x] === typeof {}) {
      findAndReplace(object[x], value, replacevalue);
    }
    if (object['@id'] === value) {
      object['@id'] = replacevalue;
      break;
    }
  }
}
