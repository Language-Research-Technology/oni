const { getLogger } = require("../../services");
const { setupGithubRoutes } = require('./github');
const passport = require('passport');
const sessions = require('client-sessions');
const models = require('../../models');
const { UnauthorizedError } = require('restify-errors');

const log = getLogger();

function setupAuthRoutes({ server, configuration }) {

  server.use(passport.initialize());
  //TODO: Make use of real sessions with postgres
  server.use(sessions({
    secret: configuration['api']['session']['secret'],
    cookieName: 'session'
  }))
  server.use(passport.session());
  //The below is required for restify, TODO: check if is still needed.

  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user);
  });
  // server.use(function (req, res, next) {
  //   res.redirect = function (addr) {
  //     res.header('Location', addr);
  //     res.send(302);
  //   }
  // });
  server.get('/authenticated', (req, res, next) => {
    if (req.isAuthenticated()) {
      log.debug('is authenticated');
      log.debug(req.session['accessToken']);
      res.json({authenticated: true});
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
  /*
   * Setup your social login:
  */
  setupGithubRoutes({ server, passport, configuration });
}


module.exports = {
  setupAuthRoutes: setupAuthRoutes
}
