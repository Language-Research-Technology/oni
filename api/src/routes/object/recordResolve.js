import { getRecord, getUridCrate }from '../../controllers/record';
import { getLogger }from '../../services';
import { getRootMemberOfs }from '../../controllers/rootMemberOf';
import { ROCrate }from 'ro-crate';

const log = getLogger();

export async function getRecordResolveLinks({ req, res, next, configuration }) {
  try {
    log.debug(`Get resolve-parts: ${ req.query.id }`);
    const response = [];
    await resolveProfile({
      crateId: req.query.id,
      response: response,
      configuration: configuration
    });
    if (response.length < 1) {
      res.send({ id: req.query.id, message: 'Not Found' }).status(404);
    } else {
      const rocrate = new ROCrate();
      rocrate.index();
      log.debug('Create New ROCrate');
      for (let c of response) {
        const subcrate = new ROCrate(c);
        subcrate.index();
        subcrate.toGraph();
        const rootNamedId = subcrate.getNamedIdentifier(configuration.api.identifier.main);
        const root = subcrate.getRootDataset();
        subcrate.changeGraphId(root, rootNamedId);
        for (let s of subcrate.getGraph()) {
          rocrate.addItem(s);
        }
      }
      log.debug('Updated all "./" s');
      //TODO: Someone please take a look at this munging
      //Now we have an extra ./
      const index = rocrate.json_ld['@graph'].findIndex((o) => o['@id'] === './');
      if (index > -1) rocrate.json_ld['@graph'].splice(index, 1);
      //Deleted and then replaced with the req.query.id
      findAndReplace(rocrate.json_ld['@graph'], req.query.id, './');
      log.debug('Deleted root "./"');
      res.send(rocrate.json_ld).status(200);
      next();
    }
  } catch (e) {
    log.error(e);
    res.send({ error: 'Error trying to resolve links', message: e.message }).status(500);
  }
}

async function resolveProfile({ crateId, response, configuration }) {
  const recordMeta = await getRecord({ crateId });
  if (!recordMeta.data) {
    return response;
  }
  const member = recordMeta.data['crateId'];
  const diskPath = recordMeta.data['diskPath'];
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
    if (memberOf['dataValues']) {
      const mO = memberOf['dataValues'];
      await resolveProfile({ crateId: mO['crateId'], response, configuration });
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
