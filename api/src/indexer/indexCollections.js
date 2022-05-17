import {getRootConformsTos} from '../controllers/rootConformsTo';
import {getRecord} from '../controllers/record';
import {ROCrate} from 'ro-crate';
import {recordResolve} from '../controllers/recordResolve';
import {getLogger} from "../services";
import {indexObjects} from "./indexObjects";
import {indexMembers} from "./indexMembers";
import path from "path";
import * as fs from 'fs-extra';

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
      //members: 'arcp://name,farms-to-freeways/corpus/root'
      //members: 'arcp://name,sydney-speaks/corpus/root' // Add a crateId to test the indexer.
    });
    //Use this block to test cases where a conformsTo conforms to another collection
    // const rootConformsToCrateId = await getRootConformsTos({
    //   conforms: 'https://github.com/Language-Research-Technology/ro-crate-profile#Collection',
    //   crateId: 'arcp://name,farms-to-freeways/corpus/root'
    //   //crateId: 'arcp://name,sydney-speaks/corpus/root' // Add a crateId to test the indexer.
    // });
    // if (rootConformsToCrateId.length > 0) {
    //   rootConformsTos = rootConformsTos.concat(rootConformsToCrateId);
    // }
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
        const root = crate.getRootDataset();
        if (root) {
          root._crateId = col.crateId;
          root._containsTypes = [];
          root.conformsTo = 'Collection';
          //TODO: better license checks
          root.license = root.license || col.record.dataValues?.license || col.record?.license;
          const _root = {
            '@id': root._crateId,
            '@type': root['@type'],
            'name': root.name || ''
          }
          //root._root = _root;
          //root.collection = _root['name'] || root['@id'];
          const normalRoot = crate.getTree({root, depth: 2, allowCycle: false});
          normalRoot._root = {'@id': root['@id'], name: root.name}
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
          if (root.hasMember && root.hasMember.length > 0) {
            log.debug(`Indexing Members of root`);
            await indexMembers({
              parent: root,
              crate,
              client,
              configuration,
              crateId: col.crateId,
              root: _root,
              repository
            });
          } else {
            log.debug('Indexing objects');
            await indexObjects({
              crateId: col.crateId,
              client,
              crate,
              index,
              root: _root,
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
