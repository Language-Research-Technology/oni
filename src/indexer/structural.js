import { Record } from "#src/models/record.js";
import { File } from "#src/models/file.js";
import { Indexer } from "./indexer.js";
import { createRecord } from '../controllers/record.js';
import { logger } from "#src/services/logger.js";
import { createCRC32 } from 'hash-wasm';
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, relative } from "node:path";

export class StructuralIndexer extends Indexer {
  defaultLicense;
  ocflBase;

  constructor({ configuration }) {
    super();
    this.defaultLicense = configuration.api.license?.default?.['@id'];
    this.ocflPath = configuration.api.ocfl.ocflPath;
  }
  async _index({ ocflObject, crate }) {
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
      memberOfs: rootDataset.memberOf || [],
      atTypes: rootDataset['@type'] || [],
      conformsTos: rootDataset.conformsTo || []
    });
    await File.destroy({ where: { crateId } });
    const relRoot = relative(this.ocflPath, objectRoot);
    const crc32 = await createCRC32();
    let count = 0;
    for await (let f of await ocflObject.files()) {
      try {
        //console.log(f.contentPath);
        const fp = join(objectRoot, f.contentPath)
        const rs = createReadStream(fp);
        const stats = await stat(f.path);
        crc32.init();
        let size = 0;
        for await (const chunk of rs) {
          crc32.update(chunk);
          size += chunk.length;
        }
        const hash = crc32.digest('hex');
        await File.create({
          path: join(relRoot, f.contentPath),
          logicalPath: f.logicalPath,
          crateId,
          size,
          crc32: hash,
          lastModified: stats.mtime
        });
        logger.debug(`[structural] [${rec.crateId}] Indexed file ${f.logicalPath}`);
        count++;
      } catch (error) {
        logger.error(error.message);
      }
    }
    logger.info(`[structural] Indexed ${rec.crateId} | files=${count}`);
  }

  async delete() {
    await Record.destroy({ truncate: true, cascade: true });
    await File.destroy({ truncate: true });
  }

  async count() {
    return await Record.count();
  }
}