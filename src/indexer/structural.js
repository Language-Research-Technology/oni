import { Record } from "#src/models/record.js";
import { Indexer } from "./indexer.js";
import { createRecord } from '../controllers/record.js';
import { logger } from "#src/services/logger.js";

export class StructuralIndexer extends Indexer {
  defaultLicense;
  constructor({ configuration }) {
    super();
    this.defaultLicense = configuration.api.license?.default?.['@id'];
  }
  async _index({ ocflObject, crate }) {
    const objectRoot = ocflObject.root;
    const root = crate.rootDataset;
    if (!root) {
      logger.warn(`${objectRoot} : does not contain an ROCrate with a valid root dataset`);
      return;
    }
    const license = root.license?.[0]?.['@id'] || this.defaultLicense;
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
      logger.info(`Loading ${rec.crateId}`);
      await createRecord({
        data: rec,
        memberOfs: root['memberOf'] || [],
        atTypes: root['@type'] || [],
        conformsTos: root['conformsTo'] || []
      });
    } else {
      logger.error(`Cannot insert a crate with Id: './' please use arcp`);
    }

  }
  async _delete() {
    await Record.destroy({ truncate: true, cascade: true });
  }
  async count() {
    return await Record.count();
  }
}