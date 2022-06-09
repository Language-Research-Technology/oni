import {ROCrate} from 'ro-crate';
import {getRootConformsTos} from "../controllers/rootConformsTo";
import {getLogger} from "../services";
import {getRawCrate} from "../controllers/record";
import path from "path";
import * as fs from 'fs-extra';
import {indexMembers} from "./indexMembers";
import {indexObjects} from "./indexObjects";
import {first, isEmpty, toArray} from "lodash";

const log = getLogger();

export async function indexSubCollections({configuration, repository, client, crateId, index, root, crate, _memberOf }) {
  log.debug('indexSubCollections');
  try {
    let rootConformsTos = await getRootConformsTos({
      conforms: 'https://github.com/Language-Research-Technology/ro-crate-profile#Collection',
      members: crateId
    });
    log.debug(`SubCollections of ${crateId} : ${rootConformsTos['length'] || 0}`);
    if (rootConformsTos.length > 0) {
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
            repoSubCollectionRoot.conformsTo = 'RepositoryCollection';
            repoSubCollectionRoot._isTopLevel = 'true';
            //TODO: better license checks
            repoSubCollectionRoot.license = repoSubCollectionRoot?.license || col.record.dataValues?.license || col.record?.license || root?.license;
            if (isEmpty(repoSubCollectionRoot.license)) {
              log.warn('No license found for item repoSubCollectionRoot:' + repoSubCollectionRoot._crateId);
              log.warn('A default text string as license will be attached');
              const license = configuration.api.license;
              repoSubCollectionRoot.license = license['default'];
            }
            const normalRoot = crate.getTree({root: repoSubCollectionRoot, depth: 2, allowCycle: false});
            //root should be already normalized
            normalRoot._root = root;
            const parent = [{
              '@id': repoSubCollectionRoot['@id'],
              '@type': repoSubCollectionRoot['@type'],
              name: [{'@value': first(repoSubCollectionRoot['name'])}]
            }];
            normalRoot._memberOf = _memberOf;
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
            if (repoSubCollectionRoot.hasMember && repoSubCollectionRoot.hasMember.length > 0) {
              log.debug(`Indexing Members of root`);
              await indexMembers({
                parent,
                crate,
                client,
                configuration,
                crateId: col.crateId,
                root,
                _memberOf: _memberOf.concat(parent),
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
                _memberOf: _memberOf.concat(parent),
                repository,
                configuration
              });
            }
          }
        }
      }
    } else {
      log.debug('if there are no subcollections, just index the objects')
      await indexObjects({
        crateId,
        client,
        crate,
        index,
        root,
        _memberOf,
        repository,
        configuration
      });
    }
  } catch
    (e) {
    log.error(e);
  }
}
