import {ROCrate} from 'ro-crate';
import {getRootConformsTos} from "../controllers/rootConformsTo";
import {getLogger} from "../services";
import {getRawCrate} from "../controllers/record";
import path from "path";
import * as fs from 'fs-extra';
import {indexMembers} from "./indexMembers";
import {indexObjects} from "./indexObjects";
import {first} from "lodash";

const log = getLogger();

export async function indexSubCollections({configuration, repository, client, crateId, index, root}) {
  log.debug('indexSubCollections');
  try {
    let rootConformsTos = await getRootConformsTos({
      conforms: 'https://github.com/Language-Research-Technology/ro-crate-profile#Collection',
      members: crateId
    });
    log.debug(`SubCollections of ${crateId} : ${rootConformsTos['length'] || 0}`);
    for (let rootConformsTo of rootConformsTos) {
      const col = rootConformsTo['dataValues'] || rootConformsTo;
      log.debug(`indexSubCollection: member ${col['crateId']}`);
      //TODO: add version
      const rawCrate = await getRawCrate({repository, crateId: col['crateId']});
      const rocrateOpts = {alwaysAsArray: true, resolveLinks: true};
      const crate = new ROCrate(rawCrate, rocrateOpts);
      const repoSubCollectionRoot = crate.getRootDataset();
      if (repoSubCollectionRoot) {
        if (repoSubCollectionRoot['@type'] && repoSubCollectionRoot['@type'].includes('RepositoryCollection')) {
          repoSubCollectionRoot._crateId = col.crateId;
          repoSubCollectionRoot._containsTypes = [];
          repoSubCollectionRoot.conformsTo = 'SubCollection';
          //TODO: better license checks
          repoSubCollectionRoot.license = repoSubCollectionRoot.license || col.record.dataValues?.license || col.record?.license;
          const normalRoot = crate.getTree({root: repoSubCollectionRoot, depth: 2, allowCycle: false});
          //root should be already normalized
          normalRoot._memberOf = root;
          normalRoot._root = root;
          try {
            const {body} = await client.index({
              index: index,
              body: normalRoot
            });
          } catch (e) {
            log.error('Index SubCollection RepositoryCollection normalRoot');
            //log.debug(JSON.stringify(normalFileItem));
            const logFolder = configuration.api?.log?.logFolder || '/tmp/logs/oni';
            if (!await fs.exists(logFolder)) {
              await fs.mkdir(logFolder);
            }
            const fileName = path.normalize(path.join(logFolder, col.crateId.replace(/[/\\?%*:|"<>]/g, '-') + '_normalSubCollectionItem.json'));
            log.error(`Verify rocrate in ${logFolder} for ${fileName}`);
            await fs.writeFile(fileName, JSON.stringify(normalRoot, null, 2));
          }
          const parent = {
            '@id': repoSubCollectionRoot['@id'],
            '@type': repoSubCollectionRoot['@type'],
            name: [{'@value': first(repoSubCollectionRoot['name'])}]
          }
          if (repoSubCollectionRoot.hasMember && repoSubCollectionRoot.hasMember.length > 0) {
            log.debug(`Indexing Members of root`);
            await indexMembers({
              parent,
              crate,
              client,
              configuration,
              crateId: col.crateId,
              root,
              repository
            });
          } else {
            log.debug('Indexing objects of SubCollections');
            await indexObjects({
              crateId: col.crateId,
              client,
              crate,
              index,
              root,
              parent,
              repository,
              configuration
            });
          }
        }
      }
    }
  } catch
    (e) {
    log.error(e);
  }
}
