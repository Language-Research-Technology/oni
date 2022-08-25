import { getRecord, getFile } from '../../controllers/record';
import fs from 'fs-extra';
import { getLogger } from '../../services';
import { checkIfAuthorized } from '../../services/license';
import { getUserMemberships } from '../../controllers/userMembership';

const log = getLogger();

export async function getRecordItem({ req, res, next, configuration, passthrough, repository }) {
  log.debug(`Get data item: ${ req.query.id } : ${ req.query.path }`)
  let record = await getRecord({ crateId: req.query.id });
  let pass = false;
  let message = 'Not Found';
  if (record.data) {
    if (configuration['api']['licenses'] && record.data['license'] && !passthrough) {
      const user =req?.session?.user ||  req?.user;
      const userId = user?.id;
      const access = await checkIfAuthorized({userId, license: record.data['license'], configuration});
      pass = access.hasAccess;
    } else {
      pass = true;
    }
    //Check thruthy for pass and if foundAuthorization from isAuthorized
    if (pass) {
      const fileObj = await getFile({
        itemId: req.query.id,
        repository,
        filePath: req.query.path
      });
      //TODO: send the correct mimeType
      if (fileObj && fileObj.fileStream) {
        res.writeHead(200, {
          'Content-Disposition': 'attachment; filename=' + fileObj.filename,
          'Content-Type': fileObj.mimetype
        });
        fileObj.fileStream.on('error', function (err) {
          log.error(err);
          res.end();
        });
        fileObj.fileStream.on('end', function () {
          log.debug('end')
          res.end();
          next();
        });
        fileObj.fileStream.pipe(res);
      } else {
        message = 'Path not found';
        res.status(404);
        res.json({ id: req.query.id, path: req.query.path, message: message });
      }
    } else {
      message = 'Not authorized';
      res.status(404);
      res.json({ id: req.query.id, path: req.query.path, message: message });
      next();
    }
  } else {
    res.status(404);
    res.send({ message: `Path: ${ req.query.path } of ${ req.query.id } not found` });
    next();
  }
}
