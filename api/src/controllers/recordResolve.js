import {ROCrate} from 'ro-crate';
import {getRawCrate, getRecord, getUridCrate} from './record';
import {getRootMemberOfs} from './rootMemberOf';
import {getLogger} from '../services';
import {ocfltools} from "oni-ocfl";
import * as fs from 'fs-extra';
import assert from "assert";

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
      log.debug('recordResolve:foundOneCrate');
      const rocrate = new ROCrate(response[0], rocrateOpts);
      return rocrate.getJson();
    } else {
      //Merge all the ROCrates into one giant one.
      log.debug('recordResolve:mergeAllCrates');
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
  log.debug('resolveMembers');
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
    log.debug('recordResolve:getCrate');
    crate = await getUridCrate({
      host: configuration.api.host,
      crateId,
      typesTransform: configuration.api.rocrate.dataTransform.types,
      repository
    });
  } else {
    log.debug('recordResolve:getRawCrate');
    crate = await getRawCrate({repository, crateId});
  }
  return crate;
}
