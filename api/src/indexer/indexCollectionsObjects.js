import {getRootConformsTos} from '../controllers/rootConformsTo';
import {getRawCrate} from '../controllers/record';
import {ROCrate} from 'ro-crate';
import {getLogger} from "../services";
import {indexFiles} from "./indexCollectionsFiles";

const log = getLogger();

export async function indexObjects({crateId, client, index, root, repository}) {
  try {
    //This is the same as doing
    // http://localhost:9000/api/object?conformsTo=https://github.com/Language-Research-Technology/ro-crate-profile%23Object&memberOf=<<crateId>>
    const members = await getRootConformsTos({
      conforms: 'https://github.com/Language-Research-Technology/ro-crate-profile#Object',
      members: crateId
    });
    log.debug(`Members of ${crateId} : ${members['length'] || 0}`);
    for (let member of members) {
      //The same as doing:
      // /api/object/meta?id=<<crateId>>
      log.debug(`indexObject: member ${member['crateId']}`);
      //TODO: add version
      const rawCrate = await getRawCrate({repository, crateId: member['crateId']});
      const crate = new ROCrate(rawCrate);
      const item = crate.getRootDataset();
      if (item) {
        if (item['@type'] && item['@type'].includes('RepositoryObject')) {
          log.debug(`Indexing RepositoryObject of ${item['@id']}`);
          item._root = root;
          item._crateId = crateId;
          item.conformsTo = 'RepositoryObject';
          const normalItem = crate.getNormalizedTree(item, 2);
          let {body} = await client.index({
            index: index,
            body: normalItem
          });

          //Then get a file, same as:
          // /stream?id=<<crateId>>&path=<<pathOfFile>>
          for (let hasFile of crate.utils.asArray(item['hasFile'])) {
            await indexFiles({
              crateId: item['@id'], item, hasFile, crate, client,
              index, root, repository
            });
          }
        } else {
          log.warn(`Skipping ${item['@id']} not a RepositoryObject`);
        }
      }
    }
  } catch (e) {
    log.error(e);
  }
}
