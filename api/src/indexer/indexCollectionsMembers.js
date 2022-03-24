import {getFile} from '../controllers/record';
import fs from 'fs';
import * as path from 'path';
import {getLogger} from "../services";

const log = getLogger();

export async function indexMembers({parent, crate, client, configuration, crateId, root, repository}) {
  try {
    const index = 'items';
    log.debug(`Indexing ${crateId} `);
    if (!parent.hasMember) log.debug(`Parent has no members`);
    if (parent.hasMember.length === 0) log.warn(`No members to index from ${crateId}!`);
    for (let item of crate.utils.asArray(parent.hasMember)) {
      if (item['@type'] && item['@type'].includes('RepositoryCollection')) {
        log.debug(`Indexing RepositoryCollection of ${item['@id']}`);
        item._root = root;
        item._crateId = crateId;
        item._containsTypes = [];
        await indexMembers({parent: item, crate, client, configuration, crateId, root, repository});
        item.conformsTo = 'RepositoryCollection';
        item.partOf = {'@id': parent['@id']};
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
          log.debug(`Get Files for ${hasFile['@id']}`);
          const fileItem = crate.getItem(hasFile['@id']);
          let fileContent = '';
          if (fileItem) {
            fileItem._root = root;
            if (fileItem.language) {
              for (let fileItemLanguage of crate.utils.asArray(fileItem.language)) {
                const languageItem = crate.getItem(fileItemLanguage['@id']);
                if (languageItem) {
                  crate.pushValue(item, 'language', languageItem);
                  crate.pushValue(parent, 'language', languageItem);
                  crate.pushValue(fileItem, 'language', languageItem);
                  crate.pushValue(fileItem, 'file', hasFile);
                }
              }
            }
            //TODO find csvs too all text formats
            const fileItemFormat = fileItem?.encodingFormat?.find((ef) => {
              if (typeof ef === 'string') return ef.match('text/');
            });
            if (fileItemFormat) {
              const fileObj = await getFile({
                itemId: fileItem['@id'],
                repository,
                filePath: fileItem['@id']
              });
              if(fileObj) {
                if (fs.existsSync(path.resolve(fileObj.filePath))) {
                  fileContent = fs.readFileSync(path.resolve(fileObj.filePath), {encoding: 'utf-8'});
                  //addContent(item['hasFile'], fileItem['@id'], fileContent);
                } else {
                  log.debug(`path: ${fileObj.filePath} does not resolve to a file`);
                }
              }
            }
          } else {
            log.debug(`No files for ${hasFile['@id']}`);
          }
          fileItem._parent = {
            name: item.name,
            '@id': item['@id'],
            '@type': item['@type']
          }
          const normalFileItem = crate.getNormalizedTree(fileItem, 2)
          normalFileItem['_text'] = fileContent;
          const {body} = await client.index({
            index: index,
            body: normalFileItem
          });
        }
      } else {
        log.warn(`Skipping ${item['@id']} not a RepositoryCollection or RepositoryObject or does not have @type`);
      }
    }
  } catch(e) {
    log.error(e);
  }
}
