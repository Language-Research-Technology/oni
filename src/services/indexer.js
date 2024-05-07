import { opendir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { logger } from './logger.js';
import { ROCrate } from 'ro-crate';
import { StructuralIndexer } from '#src/indexer/structural.js';
import { SearchIndexer } from '#src/indexer/search.js';

//import * as defaultIndexer from 'oni-indexer-opensearch';

const indexer = {};
var skipByMatch = [];
var repo;

export async function loadIndexers({ configuration, repository }) {
  skipByMatch = configuration.api.skipByMatch;
  repo = repository;
  indexer.structural = indexer.structural || await StructuralIndexer.create({ configuration });
  indexer.search = indexer.search || await SearchIndexer.create({ configuration });
};

export function getIndexer(type) {
  return indexer[type];
}

// const indexersDir = resolve(import.meta.dirname, '../indexers');
// export async function loadIndexers(dirPath) {
//   try {
//     const dir = await opendir(dirPath);
//     for await (const dirent of dir) {
//       const {name, path} = dirent;
//       if (dirent.isFile() && name.endsWith('.js') && !indexer[name]) {
//         indexer[name] = await import(resolve(path,name));
//       }
//     }
//   } catch (err) {
//     logger.error(err);
//   }   
// }

/**
 * 
 * @param {string} type 
 */
export async function getState(type) {
  return indexer[type]?.state();
}

export async function deleteIndex(type) {
  return indexer[type]?.delete();
}

export async function createIndex(type, force = false) {
  if (force) {
    await deleteIndex(type);
  }
  return indexRepository({ repository: repo, skipByMatch, types: [type] });
}

/**
 * Create both structural index and search index from the ocfl repository
 * @param {object} p
 * @param {string[]} [p.types]
 * @param {import('@ocfl/ocfl').OcflStorage} p.repository
 * @param {string[]} [p.skipByMatch]
 */
export async function indexRepository({ repository, skipByMatch = [], types = [] }) {
  const skipRegExp = skipByMatch.length ? new RegExp(skipByMatch.join("|"), "i") : null;
  if (!types.length) return;
  let counts = Object.fromEntries(types.map(t => [t, 0]));
  for await (const ocflObject of repository) {
    await ocflObject.load();
    if (skipRegExp && skipRegExp.test(ocflObject.id)) {
      logger.warn(`${ocflObject.id} : Skipping object by match in config: ${skipRegExp}`);
    } else {
      logger.debug(`Loading record: ${ocflObject.root}`);
      try {
        const jsonContent = await ocflObject.getFile({ logicalPath: 'ro-crate-metadata.json' }).asString();
        const rawCrate = JSON.parse(jsonContent);
        const crate = new ROCrate(rawCrate, { array: true, link: true });
        for (const t of types) {
          try {
            await indexer[t].index({ ocflObject, crate });
            counts[t]++;
          } catch (error) {
          }
        }
      } catch (e) {
        logger.error(e.message);
      }
    }
  }
  return counts;
}


