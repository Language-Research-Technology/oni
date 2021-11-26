const {
  getDataConformsTo,
  getAllRecords,
  getDataSingleRecord,
  getDataRoCrate,
  getDataItem,
  getDataMembers,
  getDataTypes,
  getResolveLinks
} = require('./index');
const { getLogger } = require('../../services');
const { isUndefined } = require('lodash');
const { getUser } = require('../../controllers/user');
const log = getLogger();

function setupRecordRoutes({ server, passport, configuration }) {
  //GET /data/conformsTo
  //GET /data/record?id
  //GET /data

  server.get("/data", async (req, res, next) => {
    if (req.query.conformsTo) {
      await getDataConformsTo({ req, res });
    } else if (req.query.id && req.query.meta) {
      await getDataSingleRecord({ req, res });
    } else if (req.query.id) {
      if (!isUndefined(req.query.types)) {
        await getDataTypes({ req, res });
      } else if (!isUndefined(req.query.members)) {
        await getDataMembers({ req, res });
      } else if (!isUndefined(req.query['resolve-links'])) {
        await getResolveLinks({ req, res, next, configuration });
      } else {
        await getDataRoCrate({ req, res, next, configuration });
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
          await getDataItem({ req, res, next, configuration });
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
  setupRecordRoutes: setupRecordRoutes
}
