import { Client } from '@opensearch-project/opensearch';
import { Indexer } from "./indexer.js";
import { logger } from "#src/services/logger.js";

export class SearchIndexer extends Indexer {
  conf;
  defaultLicense;
  /** @type {Client} */
  client;
  constructor({ configuration }) {
    super();
    this.defaultLicense = configuration.api.license?.default?.['@id'];
    this.conf = configuration.api.elastic || {};
    this.client = new Client({ node: configuration.api.elastic.node });
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

  async _index({ ocflObject, crate }) {
  }

  async _delete() {
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

  async search({index = this.conf.index, searchBody, filterPath=undefined, explain = false}) {
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
