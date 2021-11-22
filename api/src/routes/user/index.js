const { getLogger } = require('../../services');
const { isUndefined } = require('lodash');
const { getUser, updateUser } = require('../../controllers/user');
const log = getLogger();
const { v4: uuidv4 } = require('uuid');

function setupUserRoutes({ server, configuration }) {
  server.get("/user", async (req, res, next) => {
    try {
      if (req['user']) {
        const user = await getUser({ userId: req['user']['id'] });
        user['apiToken'] = null;
        res.json({ user }).status(200);
      } else {
        res.json({ user: null }).status(200);
      }
    } catch (e) {
      log.error(e);
      res.send({ error: e['message'] }).status(500);
      next();
    }
  });
  server.get("/user/token", async (req, res, next) => {
    try {
      if (req['user']) {
        const providerId = req['user']['id'] //TODO: fix this.
        const user = await updateUser({
          userId: providerId,
          apiToken: uuidv4()
        });
        res.json({ user }).status(200);
      } else {
        res.json({ user: null }).status(200);
      }
    } catch (e) {
      log.error(e);
      res.send({ error: e['message'] }).status(500);
      next();
    }
  });
}

module.exports = {
  setupUserRoutes: setupUserRoutes
}
