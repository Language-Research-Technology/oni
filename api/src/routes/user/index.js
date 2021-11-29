const { getLogger } = require('../../services');
const { isUndefined } = require('lodash');
const { getUser, updateUser } = require('../../controllers/user');
const log = getLogger();
const { v4: uuidv4 } = require('uuid');

function setupUserRoutes({ server, configuration }) {
  server.get("/user", async (req, res, next) => {
    try {
      if (req['user']) {
        const user = await getUser({ where: { id: req['user']['id'] } });
        user['apiToken'] = null;
        user['accessToken'] = '....removed';
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
      if (req.isAuthenticated() && req['user']) {
        const id = req['user']['id'];
        const user = await updateUser({
          where: { where: { id: id } },
          key: 'apiToken',
          value: uuidv4()
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
  server.del("/user/token", async (req, res, next) => {
    try {
      if (req.isAuthenticated() && req['user']) {
        const id = req['user']['id'];
        const user = await updateUser({
          where: { where: { id: id } },
          key: 'apiToken',
          value: null
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
