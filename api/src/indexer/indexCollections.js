import { getRootConformsTos } from '../controllers/rootConformsTo';
import { getFile, getRawCrate, getRecord } from '../controllers/record';
import { ROCrate } from 'ro-crate';
import { recordResolve } from '../controllers/recordResolve';
import { first } from 'lodash';
import fs from 'fs';

export async function putCollectionMappings({ configuration, client }) {

  const mappings = {
    "mappings": {
      "properties": {
        "@id": {
          "type": "keyword"
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
  }
  const { body } = await client.indices.create({
    index: 'items',
    body: mappings
  });
}

export async function indexCollections({ configuration, client }) {
  try {
    const rootConformsTos = await getRootConformsTos({
      conforms: 'https://github.com/Language-Research-Technology/ro-crate-profile#Collection'
    });
    let i = 0;
    console.log(`Trying to index: ${ rootConformsTos.length }`);
    for (let rootConformsTo of rootConformsTos) {
      const col = rootConformsTo.dataValues;
      i++;
      console.log(`${ i } : ${ col.crateId }`);
      let record = await getRecord({ crateId: col.crateId });
      /*    const rawCrate = await getRawCrate({
            diskPath: record.data['diskPath'],
            catalogFilename: configuration.api.ocfl.catalogFilename
          });*/
      const resolvedCrate = await recordResolve({ id: col.crateId, getUrid: false, configuration });
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
      const { body } = await client.index({
        index: index,
        body: item
      });
    }
  } catch (e) {
    console.log(e.message)
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
        item.partOf = { '@id': i['@id'] };
        //Bubble up types to the parent
        for (let t of crate.utils.asArray(item._contains['@type'])) {
          if (t !== 'RepositoryObject') {
            parent._contains['@type'][t] = t;
          }
        }

        const { body } = await client.index({
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
        item.partOf = { '@id': i['@id'] };
        for (let t of crate.utils.asArray(m['@type'])) {
          if (t !== 'RepositoryObject') {
            parent._contains['@type'][t] = t;
          }
        }
        for (let f of crate.utils.asArray(m['hasFile'])) {
          const ff = crate.getItem(f['@id']);
          var lg = 'english';
          if (ff) {
            if (ff.language) {

              for (let l of crate.utils.asArray(ff.language)) {
                const ll = crate.getItem(l['@id']);
                if (ll) {
                  const nl = crate.getNormalizedTree(ll, 1);
                  lg = first(nl['name'])['@value'].toLowerCase().replace(/\W+/g, '_')
                  item._contains.language[nl['@id']] = nl;
                  parent._contains.language[nl['@id']] = nl;
                }
              }
            }
            //TODO find csvs too all text formats
            if (ff.encodingFormat && crate.utils.asArray(ff.encodingFormat.includes('text/plain'))) {
              const hackFilePath = ff['@id'].replace(/^.*path=/, '');
              const fileObj = await getFile({
                record: record.data,
                itemId: ff['@id'],
                catalogFilename: configuration.api.ocfl.catalogFilename
              });
              const fileContent = fs.readFileSync(fileObj.filePath, 'utf-8');
              item['_text_' + lg] = fileContent;
            }
          }
        }
        flattenContains(item);
        const { body } = await client.index({
          index: index,
          body: item
        });
      }
    }
  } catch (e) {
    console.log(e.message)
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

