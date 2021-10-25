import {getRecords, getRecord, getRawCrate, getUridCrate, getFile} from "../lib/record";
import {getLogger} from "../common/logger";
import fs from 'fs-extra';

const log = getLogger();

export function setupRoutes({server, configuration}) {
  server.get("/data", async (req, res, next) => {
    if (req.query.id && req.query.meta) {
      log.debug(`get data ${req.query.id}`);
      let record = await getRecord({recordId: req.query.id});
      if (record) {
        delete record['dataValues']['path'];
        delete record['dataValues']['diskPath'];
        res.send(record);
      } else {
        res.status(404).send({id: req.query.id, message: "Not Found"})
      }
    } else if (req.query.id) {
      log.debug(`get data ${req.query.id}`);
      let record = await getRecord({recordId: req.query.id});
      if (record) {
        let crate;
        switch (req.query.get) {
          case 'raw':
            crate = await getRawCrate({
              diskPath: record['diskPath'],
              catalogFilename: configuration.api.ocfl.catalogFilename
            });
            res.json(crate);
            break;
          default:
            crate = await getUridCrate({
              arcpId: req.query.id,
              diskPath: record['diskPath'],
              catalogFilename: configuration.api.ocfl.catalogFilename
            });
            res.json(crate);
        }
      } else {
        res.status(404).send({id: req.query.id, message: "Not Found"})
      }
    } else {
      let records = await getRecords({
        offset: req.query.offset,
        limit: req.query.limit,
      });
      res.send({
        total: records.total,
        data: records.data.map((r) => {
          delete r['path'];
          delete r['diskPath'];
          return r;
        })
      });
    }
    next();
  });
  server.get("/data/item", async (req, res, next) => {
    if (req.query.id && req.query.file) {
      let record = await getRecord({recordId: req.query.id});
      if (record) {
        const fileObj = await getFile({
          record: record,
          itemId: req.query.file,
          catalogFilename: configuration.api.ocfl.catalogFilename
        });
        res.setHeader('Content-disposition', 'attachment; filename=' + fileObj.filename);
        res.setHeader('Content-type', fileObj.mimetype);

        const filestream = fs.createReadStream(fileObj.filePath);
        filestream.pipe(res);

      } else {
        res.status(404).send({id: req.query.id, message: "Not Found"})
      }
    } else {
      res.send({usage: 'file param required'}).status(400);
    }
    next();
  });
}
