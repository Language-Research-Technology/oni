const GitHubStrategy = require('passport-github2').Strategy;
const { getLogger } = require('../../services');
const { isUndefined } = require('lodash');
const { createUser } = require('../../controllers/user');
const log = getLogger();

function setupGithubRoutes({ server, passport, configuration }) {
  const authentication = configuration['api']['authentication'];
  if (authentication['github']) {
    log.debug('setup github authentication')
    const authGithub = authentication['github'];
    passport.use(new GitHubStrategy({
        clientID: authGithub['clientID'],
        clientSecret: authGithub['clientSecret'],
        callbackURL: authGithub['redirectUri'],
        scope: 'read:org, user'
      },
      async function (accessToken, refreshToken, profile, done) {
        log.debug('trying to do a github strategy')
        // In this example, the user's profile is supplied as the user record.
        // In a production-quality application, the profile should be associated
        // with a user record in the application's database, which allows for
        // account linking and authentication with other identity providers.
        log.debug(`Access Token: ${ accessToken }`);
        //TODO create user here.
        const user = {};
        user.email = profile['email'];
        user.name = profile['displayName'];
        user.providerId = profile['id'];
        user.providerUsername = profile['username'];
        user.provider = profile['provider'];
        user.accessToken = accessToken;
        log.debug(user.providerId);
        const newUser = await createUser(user);
        // profile.session.memberships = await auth.setUserAccess({
        //   config: configuration,
        //   user: { username: req.session.username, accessToken: req.session.accessToken }
        // })
        return done(null, profile, { accessToken: accessToken, refreshToken: refreshToken });
      }
    ));
    server.get('/auth/github/login',
      passport.authenticate('github', {}, function (req, res, next) {
        // The request will be redirected to GitHub for authentication, so this
        // function will not be called.
      }));

    server.get('/auth/github/callback', function (req, res, next) {
      passport.authenticate('github', function (err, user, info) {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.redirect('/auth/github');
        }
        req.logIn(user, async function (err) {
          if (err) {
            return next(err);
          }
          req.session.accessToken = info.accessToken;
          req.session.uid = user['id'];
          req.session.displayName = user['displayName'];
          req.session.username = user['username'];
          req.session.provider = user['provider'];
          // req.session.memberships = await auth.setUserAccess({
          //   config: config,
          //   user: {username: req.session.username, accessToken: req.session.accessToken}
          // })
          //TODO: how to return the user to where it was?
          return res.redirect('http://localhost:9000', next);
        });
      })(req, res, next);
    });
  }
}

module.exports = {
  setupGithubRoutes: setupGithubRoutes
}
