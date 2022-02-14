import {getRootConformsTos} from '../controllers/rootConformsTo';
import {getFile, getRawCrate, getRecord} from '../controllers/record';
import {ROCrate} from 'ro-crate';
import {recordResolve} from '../controllers/recordResolve';
import fs from 'fs';
import * as path from 'path';
import { getLogger } from "../services";

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

export async function indexCollections({configuration, client}) {
  try {
    const rootConformsTos = await getRootConformsTos({
      conforms: 'https://github.com/Language-Research-Technology/ro-crate-profile#Collection'
    });
    let i = 0;
    log.debug(`Trying to index: ${rootConformsTos.length}`);
    for (let rootConformsTo of rootConformsTos) {
      const col = rootConformsTo['dataValues'];
      i++;
      log.debug(`${i} : ${col.crateId}`);
      let record = await getRecord({crateId: col.crateId});
      const resolvedCrate = await recordResolve({id: col.crateId, getUrid: false, configuration});
      const crate = new ROCrate(resolvedCrate);
      crate.toGraph();
      const root = crate.getRootDataset();
      root._crateId = col.crateId;
      root._containsTypes = [];
      await indexMembers(root, crate, client, configuration, record, col.crateId, root._crateId);
      root.conformsTo = 'Collection';
      const index = 'items';
      const {body} = await client.index({
        index: index,
        body: crate.getNormalizedTree(root, 2)
      });
    }
  } catch (e) {
    throw new Error(e);
  }
}

async function indexMembers(parent, crate, client, configuration, record, crateId, rootId) {
  try {
    const index = 'items';
    for (let item of crate.utils.asArray(parent.hasMember)) {
      if (item['@type'].includes('RepositoryCollection')) {
        item._rootId = rootId;
        item._crateId = crateId;
        item._containsTypes = [];
        await indexMembers(item, crate, client, configuration, record, crateId, rootId);
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
        const {body} = await client.index({
          index: index,
          body: crate.getNormalizedTree(item, 2)
        });
      } else if (item['@type'].includes('RepositoryObject')) {
        item._crateId = crateId;
        item.conformsTo = 'RepositoryObject';
        item.partOf = {'@id': parent['@id']};
        for (let type of crate.utils.asArray(item['@type'])) {
          if (type !== 'RepositoryObject') {
            if (!parent._containsTypes.includes(type)) {
              crate.pushValue(parent, '_containsTypes', type);
            }
          }
        }
        for (let hasFile of crate.utils.asArray(item['hasFile'])) {
          const fileItem = crate.getItem(hasFile['@id']);
          let fileContent = '';
          if (fileItem) {
            fileItem._rootId = rootId;
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
              if (typeof ef === 'string') return ef.match('text/plain');
            });
            if (fileItemFormat) {
              const fileObj = await getFile({
                record: record.data,
                itemId: fileItem['@id'],
                catalogFilename: configuration.api.ocfl.catalogFilename
              });
              if (fs.existsSync(path.resolve(fileObj.filePath))) {
                fileContent = fs.readFileSync(path.resolve(fileObj.filePath), {encoding: 'utf-8'});
                //addContent(item['hasFile'], fileItem['@id'], fileContent);
              } else {
                log.debug(`path: ${fileObj.filePath} does not resolve to a file`);
              }
            }
          }

          fileItem['_text'] = fileContent;
          fileItem._parent = {
            name: item.name,
            '@id': item['@id'],
            '@type': item['@type']
          }
          const {body} = await client.index({
            index: index,
            body: crate.getNormalizedTree(fileItem, 2)
          });
        }
        const {body} = await client.index({
          index: index,
          body: crate.getNormalizedTree(item, 2)
        });
      }
    }
  } catch
    (e) {
    throw new Error(e);
  }
}


function addContent(arr, id, content) {
  const index = arr.findIndex(x => x['@id'] === id);
  if (index !== -1) {
    arr[index]['_content'] = content
  }
  return arr;
}
