import {getRootConformsTos} from '../controllers/rootConformsTo';
import {getRawCrate} from '../controllers/record';
import {ROCrate} from 'ro-crate';
import {getLogger} from "../services";
import {indexFiles} from "./indexFiles";
import path from "path";
import * as fs from 'fs-extra';

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
      const itemProxy = crate.getRootDataset();
      const item = Object.assign({}, itemProxy);
      if (item) {
        if (item['@type'] && item['@type'].includes('RepositoryObject')) {
          //log.debug(`Indexing RepositoryObject of ${item['@id']}`);
          //item._root = root;
          item._crateId = crateId;
          item.conformsTo = 'RepositoryObject';
          item.license = item.license || member.license || root.license;
          const normalItem = crate.getNormalizedTree(item, 1);
          //normalItem._root = {"@value": root['@id']};
          normalItem._root = {'@id': root['@id'], name: root.name}
          try {
            let {body} = await client.index({
              index: index,
              body: Object.assign({}, normalItem)
            });
          } catch (e) {
            log.error('Index RepositoryObject normalItem');
            //log.debug(JSON.stringify(normalFileItem));
            const logFolder = configuration.api?.log?.logFolder || '/tmp/logs/oni';
            if (!await fs.exists(logFolder)) {
              await fs.mkdir(logFolder);
            }
            log.error(`Verify rocrate in ${logFolder}`)
            await fs.writeFile(path.normalize(path.join(logFolder, col.crateId.replace(/[/\\?%*:|"<>]/g, '-') + '_normalItem.json')), JSON.stringify(normalItem, null, 2));
          }
          //Then get a file, same as:
          // /stream?id=<<crateId>>&path=<<pathOfFile>>
          for (let hasFileProxy of crate.utils.asArray(item['hasFile'])) {
            const hasFile = Object.assign({}, hasFileProxy);
            await indexFiles({
              crateId: item['@id'], item, hasFile, crate,
              client, index, root, repository
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
