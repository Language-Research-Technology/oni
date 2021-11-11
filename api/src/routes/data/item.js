const { getRecord, getFile } = require('../../lib/record');
const fs = require('fs-extra');

async function getDataItem({ req, res, next, configuration }) {
  log.debug(`Get data item: ${ req.query.id } : ${ req.query.file }`)
  let record = await getRecord({ crateId: req.query.id });
  if (record.data) {
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
      res.send({ id: req.query.id, file: req.query.file, message: 'Not Found' }).status(404);
      next();
    }
  } else {
    res.send({ usage: 'file parameter required' }).status(400);
    next();
  }
}

module.exports = {
  getDataItem: getDataItem
}
