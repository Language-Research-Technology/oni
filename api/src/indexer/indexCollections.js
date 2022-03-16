import {getRootConformsTos} from '../controllers/rootConformsTo';
import {getRecord} from '../controllers/record';
import {ROCrate} from 'ro-crate';
import {recordResolve} from '../controllers/recordResolve';
import {getLogger} from "../services";
import {indexObjects} from "./indexCollectionsObjects";
import {indexMembers} from "./indexCollectionsMembers";

const log = getLogger();

export async function putCollectionMappings({configuration, client}) {

  //TODO: move this to config
  try {
    const elastic = configuration['api']['elastic']
    const mappings = {
      mappings: elastic['mappings']
    };
    const {body} = await client.indices.create({
      index: 'items',
      body: mappings
    });
  } catch (e) {
    throw new Error(e);
  }
}

export async function indexCollections({configuration, repository, client}) {
  log.debug('indexCollections');
  try {
    const rootConformsTos = await getRootConformsTos({
      conforms: 'https://github.com/Language-Research-Technology/ro-crate-profile#Collection'
    });
    let i = 0;
    const index = 'items';
    log.info(`Trying to index: ${rootConformsTos.length}`);
    for (let rootConformsTo of rootConformsTos) {
      const col = rootConformsTo['dataValues'];
      i++;
      log.info(`${i}: ${col.crateId}`);
      const resolvedCrate = await recordResolve({id: col.crateId, getUrid: false, configuration, repository});
      const crate = new ROCrate(resolvedCrate);
      const root = crate.getRootDataset();
      if (root) {
        root._crateId = col.crateId;
        root._containsTypes = [];
        const _root = {
          '@id': root._crateId,
          'name': root.name || ''
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
            repository
          });
        }
        root.conformsTo = 'Collection';
        root._root = _root;
        const normalRoot = crate.getNormalizedTree(root, 2);
        const {body} = await client.index({
          index: index,
          body: normalRoot
        });
      }
    }
  } catch (e) {
    log.error(e);
  }
}
