const { getLogger } = require("../../services");
const { setupGithubRoutes } = require('./github');
const { getUser } = require('../../controllers/user');
const sessions = require('client-sessions');
const models = require('../../models');
const { UnauthorizedError } = require('restify-errors');
const { getGithubMemberships } = require('../../controllers/github');
const { setupLoginRoutes } = require('./openid-auth');
const { setupOauthRoutes } = require('./oauth2-auth');
import { routeUser, routeAdmin, routeBearer } from '../../middleware/auth';

const log = getLogger();

function setupAuthRoutes({ server, configuration }) {

  server.get('/authenticated',
    routeUser(async (req, res, next) => {
      log.debug('is authenticated');
      res.json({ authenticated: true });
      next();
    })
  );

  server.get('/logout', async (req, res, next) => {
    if (req.headers.authorization) {
      let token = req.headers.authorization.split("Bearer ")[1];
      if (token) {
        let session = await models.session.findOne({ where: { token } });
        if (session) await session.destroy();
      }
    }
    next(new UnauthorizedError());
  });

  /*
   * TODO: How to setup your social login dynamically
  */
  setupLoginRoutes({ server, configuration });
  setupOauthRoutes({ server, configuration });

  server.get('/auth/memberships',
    routeUser(async function (req, res, next) {
      log.debug('User: ' + req.session?.user?.id);
      if (!req.session?.user?.id) {
        res.json({ accessDenied: true });
        next(new UnauthorizedError());
      } else {
        // TODO: Design group configuration
        const group = configuration['api']['licenseGroup'];
        // TODO: load dynamically the memberships functions
        const memberships = await getGithubMemberships({ userId: req.session.user.id, group });
        res.json({ memberships });
      }
    })
  )
}

module.exports = {
  setupAuthRoutes
}
