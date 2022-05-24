import fs from 'fs-extra';
import * as path from 'path';
import {getFile} from '../controllers/record';
import {getLogger} from "../services";
import {toArray} from "lodash";

const log = getLogger();

export async function indexFiles({
                                   crateId, item, hasPart, parent,
                                   crate, client, index, root,
                                   repository, configuration,
                                   _memberOf
                                 }) {
  try {
    //log.debug(`Get Files for ${hasFile['@id']}`);
    const fileId = hasPart['@id'];
    const fileItem = crate.getItem(fileId);
    let fileContent = '';
    if (fileItem) {
      //Id already in fileItem
      //crate.pushValue(fileItem, 'file', {'@id': fileItem['@id']});

      fileItem._crateId = crateId;
      fileItem.license = fileItem.license || item.license || parent.license;
      fileItem._parent = {
        name: item.name,
        '@id': item['@id'],
        '@type': item['@type']
      }
      if (fileItem.language) {
        for (let fileItemLanguage of toArray(fileItem.language)) {
          const languageItem = crate.getItem(fileItemLanguage['@id']);
          if (languageItem) {
            crate.pushValue(item, 'language', languageItem);
            if (parent) {
              crate.pushValue(parent, 'language', languageItem);
            }
            crate.pushValue(fileItem, 'language', languageItem);
          }
        }
      }
      //TODO find csvs too all text formats
      //Do a reverse if there is an indexableText add the content.
      let normalFileItem;
      try {
        normalFileItem = crate.getTree({root: fileItem, depth: 1, allowCycle: false});
        normalFileItem._root = root;
        normalFileItem._memberOf = _memberOf;
        //normalFileItem._memberOf = root;
        //TODO: Maybe search for stream pipes in elastic
        const reverse = fileItem['@reverse'];
        if (reverse && reverse['indexableText']) {
          if (fileItem['encodingFormat']) {
            const encodingArray = crate.utils.asArray(fileItem['encodingFormat']);
            const fileItemFormat = encodingArray.find((ef) => {
              if (typeof ef === 'string') return ef.match('text/');
            });
            if (fileItemFormat) {
              const fileObj = await getFile({
                itemId: crateId,
                repository,
                filePath: fileItem['@id']
              });
              if (fileObj) {
                if (await fs.stat(path.resolve(fileObj.filePath))) {
                  fileContent = await fs.readFile(path.resolve(fileObj.filePath), 'utf-8');
                  //addContent(item['hasFile'], fileItem['@id'], fileContent);
                  normalFileItem['_text'] = fileContent;
                } else {
                  log.debug(`path: ${fileObj.filePath} does not resolve to a file`);
                }
              }
            }
          }
        }
        normalFileItem._root = root;
        const {body} = await client.index({
          index: index,
          body: normalFileItem
        });
      } catch (e) {
        log.error(e);
        log.debug('Index normalFileItem')
        console.log(fileItem);
        const logFolder = configuration.api?.log?.logFolder || '/tmp/logs/oni';
        if (!await fs.exists(logFolder)) {
          await fs.mkdir(logFolder);
        }
        const fileName = path.normalize(path.join(logFolder, crateId.replace(/[/\\?%*:|"<>]/g, '-') + '_normalFileItem.json'));
        log.error(`Verify rocrate in ${logFolder} for ${fileName}`);
        await fs.writeFile(fileName, JSON.stringify(normalFileItem, null, 2));
      }
    } else {
      log.warn(`No files for ${hasPart['@id']}`);
    }
  } catch (e) {
    log.error(e);
  }
}

