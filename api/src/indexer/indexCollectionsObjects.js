import {getRootConformsTos} from '../controllers/rootConformsTo';
import {getFile, getRawCrate, getRecord} from '../controllers/record';
import {ROCrate} from 'ro-crate';
import fs from 'fs';
import * as path from 'path';
import {getLogger} from "../services";

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
            log.debug(`Get Files for ${hasFile['@id']}`);
            const fileItem = crate.getItem(hasFile['@id']);
            crate.pushValue(fileItem, 'file', hasFile);
            let fileContent = '';
            if (fileItem) {
              const fileItemFormat = fileItem?.encodingFormat?.find((ef) => {
                if (typeof ef === 'string') return ef.match('text');
              });
              if (fileItemFormat) {
                const fileObj = await getFile({
                  itemId: item['@id'],
                  repository,
                  filePath: fileItem['@id']
                });
                if (fileObj) {
                  if (fs.existsSync(path.resolve(fileObj.filePath))) {
                    fileContent = fs.readFileSync(path.resolve(fileObj.filePath), {encoding: 'utf-8'});
                    //addContent(item['hasFile'], fileItem['@id'], fileContent);
                  } else {
                    log.debug(`path: ${fileObj.filePath} does not resolve to a file`);
                  }
                }
              }
              fileItem._root = root;
              fileItem._parent = {
                name: item.name,
                '@id': item['@id'],
                '@type': item['@type']
              }
              const normalFileItem = crate.getNormalizedTree(fileItem, 3)
              normalFileItem['_text'] = fileContent;
              const {body} = await client.index({
                index: index,
                body: normalFileItem
              });
            }
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
