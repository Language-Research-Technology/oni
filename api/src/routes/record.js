const { getRecords, getRecord, getRawCrate, getUridCrate, getFile } = require('../lib/record');
const { getCrateMembers } = require('../lib/crateMember'); // Not used but might be interesting later
const { getCrateTypes } = require('../lib/crateType'); // Not used but might be interesting later
const { getRootMemberOfs } = require('../lib/rootMemberOf');
const { getRootTypes } = require('../lib/rootType');
const { getLogger } = require('../common');
const fs = require('fs-extra');

const log = getLogger();

function setupRoutes({ server, configuration }) {
  server.get("/data", async (req, res, next) => {
    if (req.query.id && req.query.meta) {
      log.debug(`get data ${ req.query.id }`);
      let record = await getRecord({ recordId: req.query.id });
      if (record) {
        delete record['dataValues']['path'];
        delete record['dataValues']['diskPath'];
        res.send(record);
      } else {
        res.send({ id: req.query.id, message: 'Not Found' }).status(404);
      }
    } else if (req.query.id) {
      if (req.query.types) {
        let recordTypes = await getRootTypes({ recordId: req.query.id, types: req.query.types });
        if (recordTypes) {
          res.json(recordTypes);
        } else {
          res.send({ id: req.query.id, message: 'Not Found' }).status(404);
        }
      } else if (req.query.memberOf) {
        let memberOfs = await getRootMemberOfs({ recordId: req.query.id, types: req.query.members });
        if (memberOfs) {
          res.json(memberOfs);
        } else {
          res.send({ id: req.query.id, message: 'Not Found' }).status(404);
        }
      } else {
        log.debug(`get data ${ req.query.id }`);
        let record = await getRecord({ recordId: req.query.id });
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
                host: configuration.api.host,
                arcpId: req.query.id,
                diskPath: record['diskPath'],
                catalogFilename: configuration.api.ocfl.catalogFilename,
                typesTransform: configuration.api.rocrate.dataTransform.types
              });
              res.json(crate);
          }
        } else {
          res.status(404).send({ id: req.query.id, message: 'Not Found' })
        }
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
    try {
      if (req.query.id && req.query.file) {
        let record = await getRecord({ recordId: req.query.id });
        if (record) {
          const fileObj = await getFile({
            record: record,
            itemId: req.query.file,
            catalogFilename: configuration.api.ocfl.catalogFilename
          });
          if (fs.pathExistsSync(fileObj.filePath)) {
            res.writeHead(200, {
              'Content-Disposition': 'attachment; filename=' + fileObj.filename,
              'Content-Type': fileObj.mimetype
            });
            const filestream = fs.createReadStream(fileObj.filePath);
            filestream.on('error', function (err) {
              log.error(err);
              res.end();
            });
            filestream.on('end', function () {
              log.debug('end')
              res.end();
              next();
            });
            filestream.pipe(res);
          } else {
            res.send({ id: req.query.id, file: req.query.file, message: 'Not Found' }).status(404);
            next();
          }
        } else {
          res.send({ usage: 'file parameter required' }).status(400);
          next();
        }
      }
    } catch (e) {
      log.error(e);
      res.send({ error: e['message'] }).status(500);
      next();
    }
  });
}

module.exports = {
  setupRoutes: setupRoutes
}
