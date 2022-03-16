import { getRecord, getFile } from '../../controllers/record';
import fs from 'fs-extra';
import { getLogger } from '../../services';
import { licenseChecker, isAuthorized } from '../../services/license';
import { getUserMemberships } from '../../controllers/userMembership';

const log = getLogger();

export async function getRecordItem({ req, res, next, configuration, passthrough, repository }) {
  log.debug(`Get data item: ${ req.query.id } : ${ req.query.path }`)
  let record = await getRecord({ crateId: req.query.id });
  let pass = false;
  let message = 'Not Found';
  if (record.data) {
    if (configuration['api']['licenses'] && record.data['license'] && !passthrough) {
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
        itemId: req.query.id,
        repository,
        filePath: req.query.path
      });
      //TODO: send the correct mimeType
      if (fileObj && fs.pathExistsSync(fileObj.filePath)) {
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
        message = 'Path not found';
        res.json({ id: req.query.id, path: req.query.path, message: message }).status(401);
      }
    } else {
      message = 'Not authorized';
      res.json({ id: req.query.id, path: req.query.path, message: message }).status(404);
      next();
    }
  } else {
    res.send({ message: `Path: ${ req.query.path } of ${ req.query.id } not found` }).status(404);
    next();
  }
}
