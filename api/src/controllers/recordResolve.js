import {ROCrate} from 'ro-crate';
import {getRawCrate, getRecord, getUridCrate} from './record';
import {getRootMemberOfs} from './rootMemberOf';
import {getLogger} from '../services';
import {ocfltools} from "oni-ocfl";
import * as fs from 'fs-extra';
import assert from "assert";
import * as path from 'path';

const log = getLogger();

export async function recordResolve({id, getUrid, configuration, repository}) {
  try {
    const rocrateOpts = {alwaysAsArray: true, resolveLinks: true};
    const response = [];
    await resolveMembers({
      crateId: id,
      response,
      getUrid,
      configuration,
      repository
    });
    log.debug(`Found ${response.length} members of ${id}`);
    if (response.length < 1) {
      return null;
    } else if (response.length === 1) {
      //It's only one don't resolve.
      log.silly('recordResolve:foundOneCrate');
      let rocrate;
      try {
        rocrate = new ROCrate(response[0], rocrateOpts);
      } catch (e) {
        log.error('________')
        log.error(`${id} cannot be parsed`);
        const logFolder = configuration.api?.log?.logFolder || '/tmp/logs/oni';
        if(!await fs.exists(logFolder)){
          await fs.mkdir(logFolder);
        }
        log.error(`Verify rocrate in ${logFolder}`)
        //console.log(JSON.stringify(response[0]));
        await fs.writeFile(path.normalize(path.join(logFolder, id.replace(/[/\\?%*:|"<>]/g, '-') + '.json')), JSON.stringify(response[0], null, 2));
        log.error('________')
      }
      return rocrate.getJson();
    } else {
      //Merge all the ROCrates into one giant one.
      log.silly('recordResolve:mergeAllCrates');
      const json = await getCrate({repository, crateId: id, configuration, getUrid});
      const rocrate = new ROCrate(json, rocrateOpts);
      for (let c of response) {
        const subcrate = new ROCrate(c, rocrateOpts);
        //TODO: below is commented out because we used to support './' as root ids. Not anymore
        //const rootNamedId = subcrate.getNamedIdentifier(configuration.api.identifier.main);
        //log.debug(`root Named Id: ${rootNamedId}`);
        const root = subcrate.getRootDataset();
        if (root) {
          //subcrate.changeGraphId(root, rootNamedId);
          const subcrateGraph = subcrate.getJson();
          for (let s of subcrateGraph['@graph']) {
            if (s['@id'] && !rocrate.getItem(s['@id'])) {
              rocrate.addItem(s);
            }
          }
        }
      }
      return rocrate.getJson();
    }
  } catch (e) {
    log.error(e);
    log.error('Error trying to resolve links');
    return {error: e};
  }
}

async function resolveMembers({crateId, response, configuration, getUrid, repository}) {
  log.silly('resolveMembers');
  let record = await getCrate({repository, crateId, configuration, getUrid});
  response.push(record);
  let memberOfs = await getRootMemberOfs({crateId});
  for (let memberOf of memberOfs['data']) {
    if (memberOf['dataValues']) {
      const mO = memberOf['dataValues'];
      await resolveMembers({
        crateId: mO['crateId'],
        response,
        configuration,
        getUrid,
        repository
      });
    }
  }
  return response;
}

export async function getCrate({repository, crateId, configuration, getUrid}) {
  let crate;
  if (getUrid) {
    log.silly('recordResolve:getCrate');
    crate = await getUridCrate({
      host: configuration.api.host,
      crateId,
      typesTransform: configuration.api.rocrate.dataTransform.types,
      repository
    });
  } else {
    log.silly('recordResolve:getRawCrate');
    crate = await getRawCrate({repository, crateId});
  }
  return crate;
}
