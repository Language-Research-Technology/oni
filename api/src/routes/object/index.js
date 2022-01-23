import { getLogger } from '../../services';
import { isUndefined } from 'lodash';
import {
  getRecordConformsTo,
  getAllRecords,
  getRecordSingle,
  getRecordMembers,
  getRecordTypes,
  getResolveParts
} from './record';
import { getRecordCrate } from './recordCrate';
import { getRecordItem } from './recordItem';
import { getRecordResolveLinks } from './recordResolve';
import { routeBearer } from '../../middleware/auth';

const log = getLogger();

export function setupObjectRoutes({ server, configuration }) {

  server.get("/object", async (req, res, next) => {
    if (!isUndefined(req.query.memberOf) && !isUndefined(req.query.conformsTo)) {
      //memberOf=id&conformsTo=Collection/Object/
      await getRecordConformsTo({ req, res, next });
    } else if (!isUndefined(req.query.memberOf)) {
      //memberOf=id -> get all the children of id
      //memberOf=null (ie top-level) Get ALL objects which are not part of ANY collection
      await getRecordMembers({ req, res, next });
    } else if (!isUndefined(req.query.conformsTo)) {
      //memberOf=null & conformsTo=collectionProfileURI -> All TOP level collections
      await getRecordConformsTo({ req, res, next });
    } else if (req.query.id) {
      await getRecordSingle({ req, res, next });
    } else {
      res.json({ message: 'Either id or conformsTo or memberOf parameters are required' }).status(400);
      next();
    }
  });


  server.get('/object/meta', async (req, res, next) => {
    if (req.query.id) {
      if (!isUndefined(req.query.types)) {
        await getRecordTypes({ req, res, next });
      } else if (!isUndefined(req.query.members)) {
        await getRecordMembers({ req, res, next });
      } else if (!isUndefined(req.query['resolve-parts']) && !isUndefined(req.query.version)) {
        res.json({ message: 'Version and Resolve-Parts: Not implemented' }).status(400);
        next();
      } else if (!isUndefined(req.query['resolve-parts'])) {
        await getResolveParts({ req, res, next, configuration });
      } else {
        await getRecordCrate({ req, res, next, configuration });
      }
    } else {
      res.json({ message: 'id parameter value is required' }).status(400);
      next();
    }
  });

  server.get('/object/meta/versions', async (req, res, next) => {
    if (req.query.id) {
      res.json({ message: 'meta version: Not implemented' }).status(400);
      next();
    } else {
      res.json({ message: 'id parameter is required' }).status(400);
      next();
    }
  });

  server.get('/stream',
    routeBearer(
      async function (req, res, next) {
        try {
          if (req.query.id && req.query.path) {
            await getRecordItem({ req, res, next, configuration });
          } else if (req.query.id) {
            await getResolveParts({ req, res, next, configuration, select: [ 'parts' ] });
          } else {
            res.json({ message: 'id parameter value is required' }).status(400);
            next();
          }
        } catch
          (e) {
          log.error(e);
          res.json({ error: e['message'] }).status(500);
          next();
        }
      })
  );

  server.get('/object/open',
      async function (req, res, next) {
        try {
          if (req.query.id && req.query.path) {
            req.query.id = decodeURIComponent(req.query.id);
            req.query.path = decodeURIComponent(req.query.path);
            await getRecordItem({ req, res, next, configuration, passthrough: true });
          } else if (req.query.id) {
            await getResolveParts({ req, res, next, configuration, select: [ 'parts' ] });
          } else {
            res.json({ message: 'id parameter value is required' }).status(400);
            next();
          }
        } catch
          (e) {
          log.error(e);
          res.json({ error: e['message'] }).status(500);
          next();
        }
      }
  )
}


