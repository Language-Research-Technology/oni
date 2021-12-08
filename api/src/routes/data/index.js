const { getLogger } = require('../../services');
const log = getLogger();
const { isUndefined } = require('lodash');
const {
  getRecordConformsTo,
  getAllRecords,
  getRecordSingle,
  getRecordMembers,
  getRecordTypes,
} = require('./record');
const { getRecordCrate } = require('./recordCrate');
const { getRecordItem } = require('./recordItem');
const { getRecordResolveLinks } = require('./recordResolve');

function setupDataRoutes({ server, passport, configuration }) {
  //TODO: to discuss changing this single /data route to multiple routes
  //GET /data/conformsTo
  //GET /data/record?id
  //GET /data

  server.get("/data", async (req, res, next) => {
    if (req.query.conformsTo) {
      await getRecordConformsTo({ req, res });
    } else if (req.query.id && req.query.meta) {
      await getRecordSingle({ req, res });
    } else if (req.query.id) {
      if (!isUndefined(req.query.types)) {
        await getRecordTypes({ req, res });
      } else if (!isUndefined(req.query.members)) {
        await getRecordMembers({ req, res });
      } else if (!isUndefined(req.query['resolve-links'])) {
        await getRecordResolveLinks({ req, res, next, configuration });
      } else {
        await getRecordCrate({ req, res, next, configuration });
      }
    } else {
      await getAllRecords({ req, res });
    }
    next();
  });
  server.get('/data/item',
    passport.authenticate('bearer', { session: false }),
    async function (req, res, next) {
      try {
        if (req.query.id && req.query.file) {
          await getRecordItem({ req, res, next, configuration });
        } else {
          res.json({ message: 'id and file required' }).status(400);
          next();
        }
      } catch (e) {
        log.error(e);
        res.json({ error: e['message'] }).status(500);
        next();
      }
    });
}


module.exports = {
  setupDataRoutes
}


