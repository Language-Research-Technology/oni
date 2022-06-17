import {getRootConformsTos} from '../controllers/rootConformsTo';
import {getRecord} from '../controllers/record';
import {ROCrate} from 'ro-crate';
import {recordResolve} from '../controllers/recordResolve';
import {getLogger} from "../services";
import {indexObjects} from "./indexObjects";
import {indexMembers} from "./indexMembers";
import {indexSubCollections} from "./indexSubCollections";

import path from "path";
import * as fs from 'fs-extra';
import {first, isEmpty, toArray} from 'lodash';
import {getRootMemberOfs} from "../controllers/rootMemberOf";

const log = getLogger();

export async function configureMappings({configuration, client}) {

  //TODO: move this to config
  try {
    const elastic = configuration['api']['elastic'];
    await client.indices.create({
      index: elastic['index'],
      body: {mappings: elastic['mappings']}
    });
    await client.indices.putSettings({
      index: elastic['index'],
      body: {mapping: {total_fields: {limit: elastic['mappingFieldLimit'] || 1000}}}
    })
    if (elastic?.log === 'debug') {
      const config = await client.cluster.getSettings();
      log.debug(JSON.stringify(config));
    }
  } catch (e) {
    log.error('configureMappings');
    log.error(JSON.stringify(e.message));
    throw new Error(e);
  }
}

export async function indexCollections({configuration, repository, client}) {
  log.debug('indexCollections');
  try {
    let rootConformsTos = await getRootConformsTos({
      conforms: 'https://github.com/Language-Research-Technology/ro-crate-profile#Collection',
      members: null
    });
    let i = 0;
    const elastic = configuration['api']['elastic'];
    const index = elastic['index'];
    log.info(`Trying to index: ${rootConformsTos.length}`);
    for (let rootConformsTo of rootConformsTos) {
      const col = rootConformsTo['dataValues'] || rootConformsTo;
      i++;
      log.info(`Indexing: ${i}: ${col.crateId}`);
      const resolvedCrate = await recordResolve({id: col.crateId, getUrid: false, configuration, repository});
      if (resolvedCrate.error) {
        log.error(`cannot resolve collection: ${col.crateId}`);
        log.error(resolvedCrate.error);
      } else {
        const rocrateOpts = {alwaysAsArray: true, resolveLinks: true};
        const crate = new ROCrate(resolvedCrate, rocrateOpts);
        const repoCollectionRoot = crate.rootDataset;
        if (repoCollectionRoot) {
          const memberOf = col['memberOf'];
          if (!memberOf) {
            repoCollectionRoot._isTopLevel = 'true';
          } else {
            log.error(`${col.crateId} if member of ${col['memberOf']}`);
          }
          repoCollectionRoot._crateId = col.crateId;
          repoCollectionRoot._containsTypes = [];
          repoCollectionRoot.conformsTo = 'Collection';
          repoCollectionRoot._isRoot = 'true';

          const normalRoot = crate.getTree({root: repoCollectionRoot, depth: 2, allowCycle: false});
          const _root = [{
            '@id': first(repoCollectionRoot._crateId),
            '@type': repoCollectionRoot['@type'],
            'name': [{'@value': first(repoCollectionRoot.name)}]
          }];
          //TODO: better license checks
          repoCollectionRoot.license = repoCollectionRoot?.license || col.record.dataValues?.license || col.record?.license;
          if (isEmpty(repoCollectionRoot.license)) {
            log.warn('No license found for item repoCollectionRoot: ' + repoCollectionRoot._crateId);
            log.warn('A default text string as license will be attached');
            const license = configuration.api.license;
            _root.license = [{'@value': license}];
          } else {
            _root.license = normalRoot.license
          }
          if (repoCollectionRoot._isTopLevel) {
            _root.isTopLevel = 'true';
          }
          //root.collection = _root['name'] || root['@id'];
          normalRoot._root = _root;
          try {
            const {body} = await client.index({
              index: index,
              body: normalRoot
            });
          } catch (e) {
            log.error('index normalRoot');
            const logFolder = configuration.api?.log?.logFolder || '/tmp/logs/oni';
            if (!await fs.exists(logFolder)) {
              await fs.mkdir(logFolder);
            }
            log.error(`Verify rocrate in ${logFolder}`)
            await fs.writeFile(path.normalize(path.join(logFolder, col.crateId.replace(/[/\\?%*:|"<>]/g, '-') + '_normalRoot.json')), JSON.stringify(normalRoot, null, 2));
          }
          if (repoCollectionRoot.hasMember && repoCollectionRoot.hasMember.length > 0) {
            log.debug(`Indexing Members of root`);
            await indexMembers({
              parent: repoCollectionRoot,
              crate,
              client,
              configuration,
              crateId: col.crateId,
              root: _root,
              _memberOf: _root.concat(),
              repository
            });
          } else {
            log.debug('Indexing SubCollections and objects');
            await indexSubCollections({
              crateId: col.crateId,
              client,
              index,
              root: _root,
              _memberOf: _root.concat(),
              repository,
              configuration
            });
          }
        }
      }
    }
  } catch (e) {
    log.error(e);
  }
}
