const GitHubStrategy = require('passport-github2').Strategy;
const { getLogger } = require('../../services');
const { createUser } = require('../../controllers/user');
const { getGithubToken, getGithubUser } = require('../../services/github');
const { UnauthorizedError } = require('restify-errors');
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
        // In a production-quality application, the profile should b  e associated
        // with a user record in the application's database, which allows for
        // account linking and authentication with other identity providers.
        log.debug(`Access Token: ${ accessToken }`);
        //TODO create user here.
        const user = {};
        user.email = profile['email'];
        user.name = profile['displayName'];
        user.providerId = profile['id'];
        user.providerUsername = profile['username'];
        user.provider = 'github';
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
    //TODO: check if needed for the API
    server.get('/auth/github/callback', function (req, res, next) {
      passport.authenticate('github', function (err, user, info) {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.redirect('/auth/github');
        }
        req.logIn(user, function (err) {
          if (err) {
            return next(err);
          }
          //TODO: how to return the user to where it was?
          res.json({ authenticated: true });
          next();
        });
      })(req, res, next);
    });
    server.post('/auth/github/callback', async function (req, res, next) {
      //This smells wrong... not sure, but just using github for testing
      const token = await getGithubToken({ authGithub, code: req.body['code'], verifier: req.body['code_verifier'] })
      const githubUser = await getGithubUser({ user: { accessToken: token['access_token'] } });
      const u = {};
      u.email = githubUser['email'];
      u.name = githubUser['name'];
      u.providerId = githubUser['id'];
      u.organization = githubUser['company'];
      u.providerUsername = githubUser['login'];
      u.provider = 'github';
      //TODO: store token hashed
      u.accessToken = token['access_token'];
      //find or creates user if it doesnt exist.
      const user = await createUser(u);
      if (!user) {
        next(new UnauthorizedError());
      } else {
        req.logIn(user, function (err) {
          if (err) {
            return next(err);
          }
          res.json({ authenticated: true });
          next();
        });
      }
    });
  }

}


module.exports = {
  setupGithubRoutes
}
