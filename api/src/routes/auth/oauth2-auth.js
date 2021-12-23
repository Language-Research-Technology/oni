import { BadRequestError, UnauthorizedError, ServiceUnavailableError } from 'restify-errors';
import { loadConfiguration, getLogger, logEvent, generateToken } from '../../services';
import { jwtVerify, createRemoteJWKSet } from "jose";
import { Issuer, generators } from 'openid-client';
import { createUser } from '../../controllers/user';
import { createSession } from '../../controllers/session';
import models from '../../models';
import { ClientOAuth2 } from 'client-oauth2';
import { AuthorizationCode, ClientCredentials } from 'simple-oauth2';
import { getGithubUser } from '../../services/github';

const log = getLogger();

export function setupOauthRoutes({ server, configuration }) {

  server.get("/oauth/:provider/login", async function (req, res, next) {
    const provider = req.params.provider;
    const conf = configuration.api.authentication[provider];
    log.debug(conf);
    try {
    } catch (error) {
      return next(new ServiceUnavailableError());
    }

    // const client = new ClientOAuth2({
    //   clientId: conf.clientID,
    //   clientSecret: conf.clientSecret,
    //   accessTokenUri: conf.tokenHost,
    //   authorizationUri:  conf.authorizeHost,
    //   redirectUri: conf.redirectUri,
    //   scopes: conf.scope
    // });

    const client = new AuthorizationCode({
      client: {
        id: conf.clientID,
        secret: conf.clientSecret
      },
      auth: {
        authorizeHost: conf.authorizeHost,
        authorizePath: conf.authorizePath,
        tokenHost: conf.tokenHost,
        tokenPath: conf.tokenPath
      }
    });

    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    const code_challenge_method = "S256";
    // const url = client.authorizationUrl({
    //   scope: "openid email profile",
    //   code_challenge,
    //   code_challenge_method,
    //   state: provider,
    // });
    const url = client.authorizeURL({
      redirectURI: conf.redirectUri,
      scope: conf.scope,
      state: conf.state,
    });
    res.send({ url, code_verifier, provider });
    next();
  });

  server.post("/oauth/:provider/code", async function (req, res, next) {
    if (!req.body.code) {
      return next(new BadRequestError(`Code not provided`));
    }

    let token = await getOauthToken({
      code: req.body.code,
      state: req.body.state,
      configuration: configuration,
    });

    let userData = await getUserToken({ configuration, provider: req.body.state, token });

    let user;
    // Not all userData contains email
    userData.provider = req.body.state;
    if (configuration.api.administrators.includes(userData?.email)) {
      // admin account - set it up and login
      console.log(`Admin ${ userData?.email }`);
      try {
        user = await createUser({ data: userData, configuration });
      } catch (error) {
        return next(new UnauthorizedError());
      }
    } else {
      console.log(`Normal ${ userData.provider } / ${ userData.id }`);
      // normal user account - we are allowing access unless its locked
      // create will findOne and update the token
      user = await createUser({ data: userData, configuration });

      if (user?.locked) {
        log.info(`The account for '${ user.email }' is locked. Denying user login.`);
        await logEvent({
          level: "info",
          owner: user.email,
          text: `The account is locked. Denying user login.`,
        });
        // user account exists but user is locked
        return next(new UnauthorizedError());
      }
      if (!user?.provider || !user.givenName) {
        // user account looks like a stub account - create it properly
        log.info(`The account for '${ user.email }' is being setup.`);
        await logEvent({
          level: "info",
          owner: user.email,
          text: `The account is being setup.`,
        });
        try {
          user = await createUser({ data: userData, configuration });
        } catch (error) {
          return next(new UnauthorizedError());
        }
      }
    }
    log.debug(`Creating session for ${ userData.provider } / ${ userData.providerId } / ${ user?.email }`);
    let session = await createSession({ user, configuration });

    res.send({ token: session.token });

    next();
  });
}

async function getOauthToken({ code, state, configuration }) {
  const conf = configuration.api.authentication[state];
  const client = new ClientCredentials({
    client: {
      id: conf.clientID,
      secret: conf.clientSecret
    },
    auth: {
      authorizeHost: conf.authorizeHost,
      authorizePath: conf.authorizePath,
      tokenHost: conf.tokenHost,
      tokenPath: conf.tokenPath
    }
  });

  const tokenParams = {
    scope: conf.scope,
    code: code,
    state: state
  };
  const { token } = await client.getToken(tokenParams);
  return token;
}

async function getUserToken({ configuration, provider, token }) {
  const conf = configuration.api.authentication[provider];
  const response = await fetch(conf.user, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': conf.bearer + ' ' + token['access_token']
    }
  })
  const user = await response.json();

  return {
    email: user?.email,
    name: user?.name,
    provider: provider,
    providerId: user.id,
    providerUsername: user?.username || user?.login,
    accessToken: token['access_token']
  };
}
