import { Record } from "#src/models/record.js";
import { File } from "#src/models/file.js";
import { Indexer } from "./indexer.js";
import { createRecord } from '../controllers/record.js';
import { logger } from "#src/services/logger.js";
import { createCRC32 } from 'hash-wasm';
import { join, relative } from "node:path";
import { createPreview } from "#src/helpers/preview.js";
import { where } from "sequelize";

export class StructuralIndexer extends Indexer {
  ocflBase;

  constructor({ configuration }) {
    super();
    this.defaultLicense = configuration.api.license?.default?.['@id'];
    this.ocflPath = configuration.api.ocfl.ocflPath;
    this.ocflPathInternal = configuration.api.ocfl.ocflPathInternal
    this.previewPath = configuration.api.ocfl.previewPath;
    this.previewPathInternal = configuration.api.ocfl.previewPathInternal;
    this.memberOfField = configuration.api.memberOfField || 'pcdm:memberOf';
  }

  async _index({ ocflObject, crate }) {
    await ocflObject.load();
    const rootDataset = crate.rootDataset;
    const crateId = crate.rootId;
    const license = rootDataset.license?.[0]?.['@id'] || this.defaultLicense;
    //console.log(`${crateId} license: ${lic}`);
    const objectRoot = ocflObject.root;
    const rec = {
      crateId,
      license,
      name: rootDataset.name?.[0] || crateId,
      description: rootDataset.description?.[0] || '',
      objectRoot
    }
    logger.info(`[structural] Indexing ${rec.crateId}`);
    await createRecord({
      data: rec,
      memberOfs: rootDataset[this.memberOfField ] || [],
      atTypes: rootDataset['@type'] || [],
      conformsTos: rootDataset.conformsTo || []
    });
    await File.destroy({ where: { crateId } });
    const relRoot = relative(this.ocflPath, objectRoot);
    const crc32 = await createCRC32();
    let count = 0;
    for await (let f of await ocflObject.files()) {
      try {
        //const fp = join(objectRoot, f.contentPath)
        //const rs = createReadStream(fp);
        //const stats = await stat(f.path);
        const rs = await f.stream();
        crc32.init();
        //let size = 0;
        for await (const chunk of rs) {
          crc32.update(chunk);
          //size += chunk.length;
        }
        const hash = crc32.digest('hex');
        await File.create({
          path: join(relRoot, f.contentPath),
          logicalPath: f.logicalPath,
          crateId,
          size: f.size,
          crc32: hash,
          lastModified: f.lastModified
        });
        logger.debug(`[structural] [${rec.crateId}] Indexed file ${f.logicalPath}`);
        count++;
      } catch (error) {
        logger.error(error.message);
      }
    }
    //const internalPrefix = relative(this.ocflPathInternal, this.previewPathInternal);
    //await createPreview({ crc32, File, crate, previewPath: this.previewPath, internalPrefix});
    
    logger.info(`[structural] Indexed ${rec.crateId} | files=${count}`);
  }

  async delete(crateId) {
    const where = crateId ? { crateId } : {};
    await Record.destroy({ truncate: true, cascade: true, where });
    await File.destroy({ truncate: true, where });
  }

  async count(crateId) {
    let opt;
    if (crateId) {
      opt = {
        where: { crateId },
      }
    }
    return await Record.count(opt);
  }
}
