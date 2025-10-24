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

class State {
  static DELETING = "deleting";
  static INDEXING = "indexing";
  /** @typedef {State.DELETING|State.INDEXING} STATE*/
  /** @type {STATE} */
  state;
  count = 0;
  constructor() { }
  get isIndexed() {
    return this.count > 0;
  }
  get isIndexing() {
    return this.state === State.INDEXING;
  }
  get isDeleting() {
    return this.state === State.DELETING;
  }
  get isBusy() {
    return !!this.state;
  }
  startIndexing() {
    if (!this.state) this.state = State.INDEXING;
  }
  stopIndexing() {
    if (this.isIndexing) this.state = '';
  }
  startDeleting() {
    if (!this.state) this.state = State.DELETING;
  }
  stopDeleting() {
    if (this.isDeleting) this.state = '';
  }
  toJSON() {
    return {
      state: this.state || (this.isIndexed ? 'indexed' : ''),
      count: this.count,
      isIndexed: this.isIndexed,
      isIndexing: this.isIndexing,
      isDeleting: this.isDeleting
    }
  }
}

const states = {
  structural: new State(),
  search: new State()
};

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
  if (states[type]) {
    states[type].count = await indexer[type]?.count();
  }
  return states[type];
}

export async function deleteIndex(type, crateId) {
  if (!states[type] || states[type].isBusy) return;
  states[type].startDeleting();
  await indexer[type]?.delete(crateId);
  states[type].stopDeleting();
}

export async function createIndex(type, crateId, force = false) {
  if (!states[type] || states[type].isBusy) return;
  if (force && !crateId) {
    await deleteIndex(type);
  }
  states[type].startIndexing();
  console.log('Indexing started');
  const counts = await indexRepository({ repository: repo, skipByMatch, types: [type], crateId });
  console.log('Indexing stopped');
  console.log(counts);
  states[type].stopIndexing();
  return true;
}

/**
 * Create both structural index and search index from the ocfl repository
 * @param {object} p
 * @param {string[]} [p.types]
 * @param {import('@ocfl/ocfl').OcflStorage} p.repository
 * @param {string[]} [p.skipByMatch]
 * @param {string} [p.crateId]
 */
export async function indexRepository({ repository, skipByMatch = [], types = [], crateId }) {
  const skipRegExp = skipByMatch.length ? new RegExp(skipByMatch.join("|"), "i") : null;
  if (!types.length) return;
  const counts = Object.fromEntries(types.map(t => [t, 0]));
  for await (const ocflObject of repository) {
    if (skipRegExp?.test(ocflObject.id)) {
      logger.warn(`${ocflObject.id} : Skipping object by match in config: ${skipRegExp}`);
    } else {
      logger.debug(`Loading record: ${ocflObject.root}`);
      try {
        //await ocflObject.load();
        const jsonContent = await ocflObject.getFile({ logicalPath: 'ro-crate-metadata.json' }).text();
        const rawCrate = JSON.parse(jsonContent);
        const crate = new ROCrate(rawCrate, { array: true, link: true });
        // if crateId is specified, index just the object and the subcollections and child objects
        // by checking just the structure implied in the crate id as a hack
        if (!crateId || crate.rootId.startsWith(crateId)) {
          for (const t of types) {
            try {
              if (crateId) await indexer[t].delete(crateId);
              await indexer[t].index({ ocflObject, crate });
              counts[t]++;
            } catch (error) {
              logger.error(error.message);
            }
          }
        }        
      } catch (e) {
        logger.error(e.message);
      }
    }
  }
  return counts;
}
