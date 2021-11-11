const { getDataConformsTo, getAllRecords, getDataSingleRecord, getDataRoCrate, getDataItem, getDataMembers, getDataTypes } = require('./data');
const { getLogger } = require('../common');
const { isUndefined } = require('lodash');
const log = getLogger();

function setupRoutes({ server, configuration }) {
  server.get("/data", async (req, res, next) => {
    if (req.query.conformsTo) {
      await getDataConformsTo({ req, res });
    } else if (req.query.id && req.query.meta) {
      await getDataSingleRecord({ req, res });
    } else if (req.query.id) {
      if (!isUndefined(req.query.types)) {
        await getDataTypes({req, res});
      } else if (!isUndefined(req.query.members)) {
        await getDataMembers({req, res});
      } else {
        await getDataRoCrate({ req, res, next, configuration });
      }
    } else {
      await getAllRecords({ req, res });
    }
    next();
  });
  server.get("/data/item", async (req, res, next) => {
    try {
      if (req.query.id && req.query.file) {
        await getDataItem({ req, res, next, configuration });
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
