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
    const rootDataset = crate.rootDataset;
    const crateId = crate.rootId;
    const license = rootDataset.license?.[0]?.['@id'] || this.defaultLicense;
    //console.log(`${crateId} license: ${lic}`);
    const rec = {
      crateId,
      license,
      name: rootDataset.name[0],
      description: rootDataset.description[0] || '',
      objectRoot: ocflObject.root
    }
    logger.info(`[structural] Indexing ${rec.crateId}`);
    await createRecord({
      data: rec,
      memberOfs: rootDataset.memberOf || [],
      atTypes: rootDataset['@type'] || [],
      conformsTos: rootDataset.conformsTo || []
    });

  }
  async _delete() {
    await Record.destroy({ truncate: true, cascade: true });
  }
  async count() {
    return await Record.count();
  }
}