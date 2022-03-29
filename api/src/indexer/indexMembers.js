import {getLogger} from "../services";
import {indexFiles} from "./indexFiles";

const log = getLogger();

export async function indexMembers({parent, crate, client, configuration, crateId, root, repository}) {
  try {
    const index = 'items';
    log.debug(`Indexing ${crateId} `);
    for (let item of crate.utils.asArray(parent.hasMember)) {
      if (item['@type'] && item['@type'].includes('RepositoryCollection')) {
        log.debug(`Indexing RepositoryCollection of ${item['@id']}`);
        item._root = root;
        item._crateId = crateId;
        item._containsTypes = [];
        item.conformsTo = 'RepositoryCollection';
        item.partOf = {'@id': parent['@id']};
        item.license = item.license || parent.license;
        await indexMembers({parent: item, crate, client, configuration, crateId, root, repository});
        //Bubble up types to the parent
        for (let t of crate.utils.asArray(item._containsTypes)) {
          if (t !== 'RepositoryObject') {
            if (!parent._containsTypes.includes(t)) {
              crate.pushValue(parent, '_containsTypes', t);
            }
          }
        }
        const normalCollectionItem = crate.getNormalizedTree(item, 2);
        const {body} = await client.index({
          index: index,
          body: normalCollectionItem
        });
      } else if (item['@type'] && item['@type'].includes('RepositoryObject')) {
        item._crateId = crateId;
        item.conformsTo = 'RepositoryObject';
        item.partOf = {'@id': parent['@id']};
        item._root = root;
        item.license = item.license || parent.license;
        const normalObjectItem = crate.getNormalizedTree(item, 2);
        let {body} = await client.index({
          index: index,
          body: normalObjectItem
        });
        // Add a parent for the @type: File
        for (let type of crate.utils.asArray(item['@type'])) {
          if (type !== 'RepositoryObject') {
            if (!parent._containsTypes.includes(type)) {
              crate.pushValue(parent, '_containsTypes', type);
            }
          }
        }
        if (item['hasFile']) log.info(`Getting files for ${crateId}`);
        for (let hasFile of crate.utils.asArray(item['hasFile'])) {
          await indexFiles({
            crateId: crateId, item, hasFile, parent, crate,
            client, index, root, repository
          });
        }
      } else {
        log.warn(`Skipping ${item['@id']} not a RepositoryCollection or RepositoryObject or does not have @type`);
      }
    }
  } catch (e) {
    log.error(e);
  }
}
