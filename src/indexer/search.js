import { Client } from '@opensearch-project/opensearch';
import { Indexer } from "./indexer.js";
import { logger } from "#src/services/logger.js";

export class SearchIndexer extends Indexer {
  conf;
  defaultLicense;
  /** @type {Client} */
  client;
  conformsTo;
  constructor({ configuration }) {
    super();
    this.defaultLicense = configuration.api.license?.default?.['@id'];
    this.conf = configuration.api.elastic || {};
    this.client = new Client({ node: configuration.api.elastic.node });
    this.conformsTo = {
      [configuration.api.conformsTo.collection]: indexCollection,
      [configuration.api.conformsTo.object]: indexObject
    };
  }

  async init() {
    logger.debug('Configure Cluster');
    try {
      const elastic = this.conf;
      const settings = {
        "persistent": {
          "search.max_open_scroll_context": elastic?.maxScroll || 5000
        },
        "transient": {
          "search.max_open_scroll_context": elastic?.maxScroll || 5000
        }
      }
      await this.client.cluster.putSettings({ body: settings });
      if (elastic?.log === 'debug') {
        const config = await this.client.cluster.getSettings();
        logger.debug(JSON.stringify(config));
      }
      try {
        await this.client.indices.create({
          index: elastic.index,
          body: {
            max_result_window: elastic.max_result_window,
            mappings: elastic.mappings
          }
        });
        await this.client.indices.putSettings({
          index: elastic.index,
          body: elastic.indexConfiguration
        });
      } catch (error) {
        logger.debug(error);
      }

    } catch (e) {
      logger.error('configureCluster');
      logger.error(JSON.stringify(e.message));
    }
  }

  /**
   * 
   * @param {object} p
   * @param {any} p.ocflObject
   * @param {import('ro-crate').ROCrate} p.crate
   * @param {any} p.rootDataset
   * @returns 
   */
  async _index({ ocflObject, crate }) {
    const rootDataset = crate.rootDataset;
    const indexTypes = (rootDataset.conformsTo || []).map(id => this.conformsTo[id]).filter(o => o);
    if (indexTypes.length) {

      for (const index of indexTypes) {
        index();
      }
    }
  }

  async delete() {
    try {
      await this.client.indices.delete({ index: this.conf.index });
    } catch (e) {
      logger.debug(e.message);
    }
  }

  async count() {
    try {
      const res = await this.client.count({ index: this.conf.index });
      return res.body.count;
    } catch (e) {
      logger.error(e.message);
    }
  }

  async search({ index = this.conf.index, searchBody, filterPath = undefined, explain = false }) {
    try {
      logger.debug("----- searchBody ----");
      logger.debug(JSON.stringify(searchBody));
      logger.debug("----- searchBody ----");
      const opts = {
        index,
        body: searchBody,
        explain: explain,
      }
      if (filterPath) {
        opts['filter_path'] = filterPath
      }
      logger.debug(JSON.stringify(opts));
      const result = await this.client.search(opts);
      return result.body;
    } catch (e) {
      logger.error(e.message);
      throw new Error(e.message);
    }
  }
}
//elastic.index().then(() => isRunningElastic = false);
// elasticInit({configuration});
// elasticBootstrap({configuration});
// elasticIndex({configuration, repository});

function indexCollection() {

}

function indexObject() {

}

/**
 * Find the license of an item with its id if not and id or undefined return a default license from
 * config, if passed an Id and not found it will also return a default license.
 * @param {object[]} licenses - Array of licences
 * @param {import('ro-crate').ROCrate} crate
 * @returns a license object
 *
 */
function resolveLicense(licenses, crate) {
  for (const license of (licenses || [])) {
    const id = typeof license === 'string' ? license : license?.['@id'];
    const entity = crate.getEntity(id);
    if (entity) return entity;
    else logger.warn(`Invalid license: ${id}`);
  }
}
