const { getRecord, getFile } = require('../../controllers/record');
const fs = require('fs-extra');
const { getLogger } = require('../../services');
const { licenseChecker, isAuthorized } = require('../../services/license');
const { getUserMemberships } = require('../../controllers/userMembership');
const log = getLogger();

async function getRecordItem({ req, res, next, configuration }) {
  log.debug(`Get data item: ${ req.query.id } : ${ req.query.file }`)
  let record = await getRecord({ crateId: req.query.id });
  let pass = false;
  let message = 'Not Found';
  if (record.data) {
    if (configuration['api']['licenses'] && record.data['license']) {
      const user = req['user'];
      const userId = user.id
      const memberships = await getUserMemberships({ where: { userId: userId } })
      pass = isAuthorized({
        memberships,
        license: record.data['license'],
        licenseConfiguration: configuration['api']['licenses']
      });
    } else {
      pass = true;
    }
    //Check thruthy for pass and if foundAuthorization from isAuthorized
    if (pass) {
      const fileObj = await getFile({
        record: record.data,
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
        message = 'File not found';
        res.json({ id: req.query.id, file: req.query.file, message: message }).status(401);
      }
    } else {
      message = 'Not authorized';
      res.json({ id: req.query.id, file: req.query.file, message: message }).status(404);
      next();
    }
  } else {
    res.send({ message: `File: ${ req.query.file } not found` }).status(404);
    next();
  }
}

module.exports = {
  getRecordItem
}
