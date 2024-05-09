import { logger } from "#src/services/logger.js";

export class Indexer {
  constructor(opt) {}

  static async create({configuration}) {
    const indexer = new this({configuration});
    await indexer.init();
    return indexer;
  }

  async init() {}

  async _index({ ocflObject, crate }) {
    throw new Error('Not Implemented');
  }

  /**
   * @return {Promise<number>}
   */
  async count() {
    throw new Error('Not Implemented');
  }

  async delete() {
    throw new Error('Not Implemented');
  }

  async index({ ocflObject, crate }) {
    const rootDataset = crate.rootDataset;
    const crateId = crate.rootId;
    if (!rootDataset) {
      logger.warn(`${ocflObject.root}: Does not contain an ROCrate with a valid root dataset`);
    } else if (crateId === './') {
      logger.warn(`${ocflObject.root}: Cannot process a crate with invalid identifier ('./').`);
    } else {
      //logger.debug('index ' + ocflObject.root);
      //console.log(this.__state);
      await this._index({ ocflObject, crate });
    }
  }

}