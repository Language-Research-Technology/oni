import {getRootConformsTos} from '../controllers/rootConformsTo';
import {getFile, getRawCrate, getRecord} from '../controllers/record';
import {ROCrate} from 'ro-crate';
import {recordResolve} from '../controllers/recordResolve';
import {first} from 'lodash';
import fs from 'fs';
import * as path from 'path';

export async function putCollectionMappings({configuration, client}) {

  //TODO: move this to config
  try {
    const mappings = {
      "mappings": {
        "properties": {
          "@id": {
            "type": "keyword"
          },
          "hasFile": {
            "type": "nested",
            "properties": {
              "language": {
                "type": "nested",
                "properties": {
                  "name": {
                    "type": "nested",
                    "properties": {
                      "@value": {
                        "type": "keyword"
                      }
                    }

                  }
                }
              }
            }
          },
          "_text_english": {
            "type": "text",
            "analyzer": "english"
          },
          "_text_arabic_standard": {
            "type": "text",
            "analyzer": "arabic"
          },
          "_text_chinese_mandarin": {
            "type": "text"
          },
          "_text_persian_iranian": {
            "type": "text",
            "analyzer": "persian"
          },
          "_text_turkish": {
            "type": "text",
            "analyzer": "turkish"
          },
          "_text_vietnamese": {
            "type": "text"
          }
        }
      }
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
    console.log(`Trying to index: ${rootConformsTos.length}`);
    for (let rootConformsTo of rootConformsTos) {
      const col = rootConformsTo.dataValues;
      i++;
      console.log(`${i} : ${col.crateId}`);
      let record = await getRecord({crateId: col.crateId});
      /*    const rawCrate = await getRawCrate({
            diskPath: record.data['diskPath'],
            catalogFilename: configuration.api.ocfl.catalogFilename
          });*/
      const resolvedCrate = await recordResolve({id: col.crateId, getUrid: false, configuration});
      const crate = new ROCrate(resolvedCrate);
      crate.toGraph();
      const root = crate.getRootDataset();
      const item = crate.getNormalizedTree(root, 2);
      item._crateId = col.crateId;
      item._contains = {
        '@type': {},
        'language': {}
      };
      await indexMembers(root, item, crate, client, configuration, record, col.crateId);
      item.conformsTo = 'Collection';
      const index = 'items';
      const {body} = await client.index({
        index: index,
        body: item
      });
    }
  } catch (e) {
    throw new Error(e);
  }
}

async function indexMembers(i, parent, crate, client, configuration, record, crateId) {
  try {
    const index = 'items';
    for (let m of crate.utils.asArray(i.hasMember)) {
      if (m['@type'].includes('RepositoryCollection')) {
        const item = crate.getNormalizedTree(m, 2);
        item._crateId = crateId;
        item._contains = {
          '@type': {},
          'language': {}
        }
        await indexMembers(m, item, crate, client, configuration, record, crateId);
        item.conformsTo = 'RepositoryCollection';
        item.partOf = {'@id': i['@id']};
        //Bubble up types to the parent
        for (let t of crate.utils.asArray(item._contains['@type'])) {
          if (t !== 'RepositoryObject') {
            parent._contains['@type'][t] = t;
          }
        }

        const {body} = await client.index({
          index: index,
          body: item
        });
      } else if (m['@type'].includes('RepositoryObject')) {
        const item = crate.getNormalizedTree(m, 2);
        item._crateId = crateId;
        item._contains = {
          '@type': {},
          'language': {}
        }
        item.conformsTo = 'RepositoryObject';
        item.partOf = {'@id': i['@id']};
        for (let t of crate.utils.asArray(m['@type'])) {
          if (t !== 'RepositoryObject') {
            parent._contains['@type'][t] = t;
          }
        }
        for (let f of crate.utils.asArray(m['hasFile'])) {
          const ff = crate.getItem(f['@id']); //TODO: maybe normalize this
          const fileItem = crate.getNormalizedTree(ff, 1);
          fileItem._contains = {
            language: {},
            '@type': {},
          };
          var lg = 'english';
          let fileContent = '';
          if (ff) {
            if (ff.language) {
              for (let l of crate.utils.asArray(ff.language)) {
                const ll = crate.getItem(l['@id']);
                if (ll) {
                  const nl = crate.getNormalizedTree(ll, 1);
                  lg = first(nl['name'])['@value'].toLowerCase().replace(/\W+/g, '_')
                  item._contains.language[nl['@id']] = nl;
                  parent._contains.language[nl['@id']] = nl;
                  fileItem._contains.language[nl['@id']] = nl;
                }
              }
            }
            //TODO find csvs too all text formats
            const eff = ff?.encodingFormat?.find((ef) => {
              if (typeof ef === 'string') return ef.match('text/plain');
            });
            //console.log(crate.getNormalizedTree(ff.encodingFormat, 1))
            if (eff) {
              const fileObj = await getFile({
                record: record.data,
                itemId: ff['@id'],
                catalogFilename: configuration.api.ocfl.catalogFilename
              });
              if (fs.existsSync(path.resolve(fileObj.filePath))) {
                fileContent = fs.readFileSync(path.resolve(fileObj.filePath), {encoding: 'utf-8'});
                //item['_text_' + lg] = fileContent;
                addContent(item['hasFile'], ff['@id'], fileContent);
              } else {
                console.log(`path: ${fileObj.filePath} does not resolve to a file`);
              }
            }
          }

          fileItem['_text_' + lg] = fileContent;
          fileItem._parent = {
            name: item.name,
            '@id': item['@id'],
            '@type': item['@type']
          }
          flattenContains(fileItem);
          const {body} = await client.index({
            index: index,
            body: fileItem
          });
        }
        flattenContains(item);

        delete item['hasFile'];
        const {body} = await client.index({
          index: index,
          body: item
        });

      }
    }
  } catch
    (e) {
    throw new Error(e);
  }
}


function flattenContains(item) {
  for (let c of Object.keys(item._contains)) {
    const contains = [];
    for (let k of Object.keys(item._contains[c])) {
      contains.push(item._contains[c][k])
    }
    item._contains[c] = contains;
  }
}

function addContent(arr, id, content) {
  const index = arr.findIndex(x => x['@id'] === id);
  if (index !== -1) {
    arr[index]['_content'] = content
  }
  return arr;
}
