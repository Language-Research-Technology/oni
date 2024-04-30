import { ROCrate } from 'ro-crate';
import { getLogger } from './logger.js';
import { createRecord } from '../controllers/record.js';
//import * as defaultIndexer from 'oni-indexer-opensearch';
const log = getLogger();
/**
 * Create both structural index and search index from the ocfl repository
 * @param {object} p
 * @param {string[]} [p.types]
 * @param {import('@ocfl/ocfl').OcflStorage} p.repository
 * @param {string} p.defaultLicense
 * @param {string[]} [p.skipByMatch]
 */
export async function indexRepository({ repository, defaultLicense, skipByMatch = [], types = [] }) {
  const skipRegExp = skipByMatch.length ? new RegExp(skipByMatch.join("|"), "i") : null;
  if (!types.length) return;
  let counts = Object.fromEntries(types.map(t => [t, 0]));
  for await (const o of repository) {
    await o.load();
    if (skipRegExp && skipRegExp.test(o.id)) {
      log.warn(`${o.id} : Skipping object by match in config: ${skipRegExp}`);
    } else {
      log.debug(`Loading record: ${o.root}`);
      try {
        const jsonContent = await o.getFile({ logicalPath: 'ro-crate-metadata.json' }).asString();
        const rawCrate = JSON.parse(jsonContent);
        const crate = new ROCrate(rawCrate, { array: true, link: true });
        for (const t of types) {
          try {
            await indexer[t]({ objectRoot: o.root, crate, defaultLicense });
            counts[t]++;
          } catch (error) {
          }
        }
      } catch (e) {
        log.error(e.message);
      }
    }
  }
  return counts;
}  
//await bootstrap({ configuration });
// await elasticInit({ configuration });
// await elasticBootstrap({ configuration });
// await elasticIndex({ configuration, repository });

async function indexCrateStructural({ objectRoot, crate, defaultLicense }) {
  const root = crate.rootDataset;
  if (!root) {
    log.warn(`${objectRoot} : does not contain an ROCrate with a valid root dataset`);
    return;
  }

  const license = root.license?.[0]?.['@id'] || defaultLicense;
  const crateId = crate.rootId;
  //console.log(`${crateId} license: ${lic}`);
  if (crateId !== './') {
    const rec = {
      crateId,
      license,
      name: root.name[0],
      description: root.description[0] || '',
      objectRoot
    }
    log.info(`Loading ${rec.crateId}`);
    await createRecord({
      data: rec,
      memberOfs: root['memberOf'] || [],
      atTypes: root['@type'] || [],
      conformsTos: root['conformsTo'] || []
    });
  } else {
    log.error(`Cannot insert a crate with Id: './' please use arcp`);
  }
}

async function indexCrateSearch(crate) {
        //elastic.index().then(() => isRunningElastic = false);
        // elasticInit({configuration});
        // elasticBootstrap({configuration});
        // elasticIndex({configuration, repository});

}

const indexer = {
  structural: indexCrateStructural,
  search: indexCrateSearch
}