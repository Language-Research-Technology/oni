const { getLogger } = require("../../services");
const { setupGithubRoutes } = require('./github');
const { getUser } = require('../../controllers/user');
const sessions = require('client-sessions');
const models = require('../../models');
const { UnauthorizedError } = require('restify-errors');
const { Strategy: BearerStrategy } = require('passport-http-bearer');
const { getGithubMemberships } = require('../../controllers/github');
const log = getLogger();

function setupAuthRoutes({ server, passport, configuration }) {

  server.use(passport.initialize());
  //TODO: Make use of real sessions with postgres
  server.use(sessions({
    secret: configuration['api']['session']['secret'],
    cookieName: 'session'
  }))
  server.use(passport.session());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  server.get('/authenticated', (req, res, next) => {
    if (req.isAuthenticated()) {
      log.debug('is authenticated');
      res.json({ authenticated: true });
    } else {
      next(new UnauthorizedError());
    }
  });
  server.get('/logout', async (req, res, next) => {
    if (req.headers.authorization) {
      let token = req.headers.authorization.split("Bearer ")[1];
      if (token) {
        let session = await models.session.findOne({ where: { token } });
        if (session) await session.destroy();
      }
    }
    await req.logout();

    next(new UnauthorizedError());
  });

  passport.use(new BearerStrategy(
    async function (token, done) {
      const user = await getUser({ where: { apiToken: token } });
      if (!user) {
        return done(null, false);
      }
      return done(null, user, { scope: 'all' });
    }
  ));
  /*
   * Setup your social login:
  */
  setupGithubRoutes({ server, passport, configuration });

  server.get('/auth/memberships',
    passport.authenticate('bearer', { session: false }),
    async function (req, res, next) {
      if (!req.isAuthenticated()) {
        res.json({ accessDenied: true });
        next(new UnauthorizedError());
      } else {
        //TODO: Design group configuration later
        const group = configuration['api']['licenseGroup'];
        //TODO: load dynamically the memberships functions
        const memberships = await getGithubMemberships({ userId: req['user']['id'], group });
        res.json({ memberships });
      }
    });
}


module.exports = {
  setupAuthRoutes: setupAuthRoutes
}
