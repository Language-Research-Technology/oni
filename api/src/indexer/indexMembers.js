import {getLogger} from "../services";
import {indexFiles} from "./indexFiles";
import path from "path";
import * as fs from 'fs-extra';
import {first, toArray, isEqual, isEmpty} from "lodash";

const log = getLogger();

export async function indexMembers({parent, crate, client, configuration, crateId, root, _memberOf, repository}) {
  try {
    const index = 'items';
    log.debug(`Indexing ${crateId} `);
    for (let item of crate.utils.asArray(parent.hasMember)) {
      if (item['@type'] && item['@type'].includes('RepositoryCollection')) {
        log.debug(`Indexing RepositoryCollection of ${item['@id']}`);
        item._crateId = crateId;
        item._containsTypes = [];
        item.conformsTo = 'RepositoryCollection';
        //item.partOf = {'@id': parent['@id']};
        item.license = item?.license || parent?.license || root?.license
        if (isEmpty(item.license)) {
          log.warn('No license found for item: ' + item._crateId);
        }
        await indexMembers({parent: item, crate, client, configuration, crateId, root, _memberOf, repository});
        //Bubble up types to the parent
        for (let t of crate.utils.asArray(item._containsTypes)) {
          if (t !== 'RepositoryObject') {
            if (!parent._containsTypes.includes(t)) {
              crate.pushValue(parent, '_containsTypes', t);
            }
          }
        }
        const normalCollectionItem = crate.getTree({root: item, depth: 1, allowCycle: false});
        normalCollectionItem._root = root;
        normalCollectionItem._memberOf = _memberOf;
        try {
          const {body} = await client.index({
            index: index,
            body: Object.assign({}, normalCollectionItem)
          });
        } catch (e) {
          log.error('Index normalCollectionItem');
          //log.debug(JSON.stringify(normalFileItem));
          const logFolder = configuration.api?.log?.logFolder || '/tmp/logs/oni';
          if (!await fs.exists(logFolder)) {
            await fs.mkdir(logFolder);
          }
          log.error(`Verify rocrate in ${logFolder}`)
          await fs.writeFile(path.normalize(path.join(logFolder, crateId.replace(/[/\\?%*:|"<>]/g, '-') + '_normalCollectionItem.json')), JSON.stringify(normalCollectionItem, null, 2));
        }
      } else if (item['@type'] && item['@type'].includes('RepositoryObject')) {
        item._crateId = crateId;
        item.conformsTo = 'RepositoryObject';
        //item.partOf = {'@id': parent['@id']};
        item.license = item?.license || member?.license || parent?.license || root?.license;
        if (isEmpty(item.license)){
          log.warn('No license found for indexMembers.item: ' + item._crateId);
        }
        item.name = item['name'] || item['@id'];
        const normalObjectItem = crate.getTree({root: item, depth: 1, allowCycle: false});
        const normalParent = [{
          '@id': parent['@id'],
          '@type': parent['@type'],
          name: [{'@value': first(parent['name'])}]
        }];
        //normalObjectItem._memberOf = _memberOf; //_memberOf.concat(parentMemberOf); //If I do this then another collection of different type is indexed. ASK PETER
        //TODO: this below seems unnecessary. What can we do? We are relying
        if (isEqual(_memberOf, normalParent)) {
          normalObjectItem._memberOf = _memberOf;
        } else {
          normalObjectItem._memberOf = _memberOf.concat(normalParent);
        }
        normalObjectItem._root = root;
        try {
          const {body} = await client.index({
            index: index,
            body: normalObjectItem
          });
        } catch (e) {
          log.error('IndexMembers normalObjectItem');
          log.error(e);
          const logFolder = configuration.api?.log?.logFolder || '/tmp/logs/oni';
          if (!await fs.exists(logFolder)) {
            await fs.mkdir(logFolder);
          }
          const fileName = path.normalize(path.join(logFolder, crateId.replace(/[/\\?%*:|"<>]/g, '-') + '_normalObjectItem.json'));
          log.error(`Verify rocrate in ${logFolder} for ${fileName}`);
          await fs.writeFile(fileName, JSON.stringify(normalObjectItem, null, 2));
        }
        // Add a parent for the @type: File
        for (let typeProxy of crate.utils.asArray(item['@type'])) {
          const type = Object.assign({}, typeProxy)
          if (type !== 'RepositoryObject') {
            if (Array.isArray(parent._containsTypes)) {
              if (!parent._containsTypes.includes(type)) {
                crate.pushValue(parent, '_containsTypes', type);
              }
            }
          }
        }
        //if (item['hasPart']) log.debug(`Getting files for ${crateId}`);
        for (let hasPart of crate.utils.asArray(item['hasPart'])) {
          await indexFiles({
            crateId: crateId, item, hasPart, parent, crate,
            client, index, root, repository, configuration,
            _memberOf
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
