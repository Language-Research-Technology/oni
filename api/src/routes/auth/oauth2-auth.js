import {BadRequestError, UnauthorizedError, ServiceUnavailableError} from 'restify-errors';
import {loadConfiguration, getLogger, logEvent, generateToken} from '../../services';
import {jwtVerify, createRemoteJWKSet} from "jose";
import {Issuer, generators} from 'openid-client';
import {createUser, updateUser} from '../../controllers/user';
import {createSession} from '../../controllers/session';
import models from '../../models';
import {ClientOAuth2} from 'client-oauth2';
import {AuthorizationCode, ClientCredentials} from 'simple-oauth2';
import {getGithubUser} from '../../services/github';
import * as utils from "../../services/utils";
import {isEmpty, first} from "lodash";

const {URL, URLSearchParams} = require('url');

const log = getLogger();

export function setupOauthRoutes({server, configuration}) {

  /**
   * @openapi
   * /:
   *   get:
   *     description: O-Auth Provider Login
   *     parameters:
   *       - provider
   *     responses:
   *       200:
   *         description: .
   */
  server.get("/oauth/:provider/login", async function (req, res, next) {
    const provider = req.params.provider;
    const conf = configuration.api.authentication[provider];
    log.debug(JSON.stringify(conf));
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
      redirect_uri: conf.redirect_uri,
      scope: conf.scope,
      state: conf.state
    });
    res.send({url, code_verifier, provider});
    next();
  });

  /**
   * @openapi
   * /:
   *   get:
   *     description: O-Auth Provider Code
   *     parameters:
   *       - provider
   *       - code
   *       - state
   *     responses:
   *       200:
   *         description: Return session token to authorize user with corresponding code.
   */
  server.post("/oauth/:provider/code", async function (req, res, next) {
    const adminEmail = first(configuration.api.administrators);
    if (!req.body.code) {
      return next(new BadRequestError(`Code not provided`));
    }

    let token = await getOauthToken({
      code: req.body.code,
      state: req.body.state,
      configuration: configuration
    });
    if (isEmpty(token) && !token['access_token']) {
      return next(new UnauthorizedError());
    } else {
      let userData = await getUserToken({configuration, provider: req.body.state, token});
      log.debug('userData');
      let user;
      // Not all userData contains email
      userData.provider = req.body.state;
      if (configuration.api.administrators.includes(userData?.email)) {
        // admin account - set it up and login
        console.log(`Admin ${userData?.email}`);
        try {
          user = await createUser({data: userData, configuration});
        } catch (error) {
          return next(new UnauthorizedError());
        }
      } else {
        console.log(`Normal ${userData.provider} / ${userData.providerId}`);
        // normal user account - we are allowing access unless its locked
        // create will findOne and update the token
        try {
          user = await createUser({data: userData, configuration});
          console.log(user);
        } catch (e) {
          await logEvent({
            level: "error",
            owner: adminEmail,
            text: e.message,
            data: userData.providerId
          });
          return next(new UnauthorizedError());
        }
        if (user?.locked) {
          log.info(`The account for '${user.email}' is locked. Denying user login.`);
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
          log.info(`The account for '${user.email}' is being setup.`);
          await logEvent({
            level: "info",
            owner: user.email,
            text: `The account is being setup.`,
          });
          try {
            user = await createUser({data: userData, configuration});
          } catch (e) {
            await logEvent({
              level: "error",
              owner: adminEmail,
              text: e.message,
            });
            return next(new UnauthorizedError());
          }
        }
      }
      log.debug(`Creating session for ${userData.provider} / ${userData.providerId} / ${user?.email}`);
      let session = await createSession({user, configuration});

      res.send({token: session.token});

      next();
    }
  });
}

async function getOauthToken({code, state, configuration}) {
  try {
    const conf = configuration.api.authentication[state];
    const config = {
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
    }
    let oauth2;
    if (conf['oauthType'] === 'ClientCredentials') {
      oauth2 = new ClientCredentials(config);
    } else if (conf['oauthType'] === 'AuthorizationCode') {
      oauth2 = new AuthorizationCode(config);
    }
    const tokenParams = {
      scope: conf.scope,
      code: code,
      state: state
    };
    try {
      let accessToken = await oauth2.getToken(tokenParams);
      if (accessToken.expired()) {
        const refreshParams = {
          scope: conf.scope,
          prompt: conf.prompt
        };
        accessToken = await accessToken.refresh(refreshParams);
      }
      return accessToken.token;
    } catch (e) {
      console.log(e)
    }
  } catch (e) {
    console.log(e);
    log.error(e.message);
    throw new Error(e);
  }
}

async function getUserToken({configuration, provider, token}) {
  try {
    const conf = configuration.api.authentication[provider];
    let response;
    if (conf['useHeaders']) {
      response = await fetch(conf.user, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': conf.bearer + ' ' + token['access_token']
        }
      });
    } else if (conf['useFormData']) {
      log.debug(`useFormData: ${conf['useFormData']}`);
      response = await fetch(conf.user, {
        method: 'POST',
        body: new URLSearchParams({
          'access_token': token['access_token'] || 'NA'
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
      });
    }
    log.debug('user');
    const user = await response.json();
    log.debug(JSON.stringify(user));
    if (user) {
      return {
        email: user?.email,
        name: user?.name,
        provider: provider,
        providerId: user.id || user.sub,
        providerUsername: user?.username || user?.login,
        accessToken: token['access_token'],
        accessTokenExpiresAt: token['expires_at'] || null,
        refreshToken: token['refresh_token'] || null
      };
    } else {
      return {}
    }
  } catch (e) {
    log.error(e);
    throw new Error(e);
  }
}

export async function needsNewToken({configuration, provider, user}) {
  try {
    const conf = configuration.api.authentication[provider];
    if (isTokenExpired({
      expirationWindowSeconds: conf['expirationWindowSeconds'],
      expires_at: user['accessTokenExpiresAt']
    })) {
      log.debug('token expired');
      const accessToken = await getNewToken({configuration, provider: 'cilogon', user});
      return accessToken;
    } else {
      log.debug('token still working');
      return user['accessToken'];
    }
  } catch (e) {
    log.debug('Error: needsNewToken');
    throw new Error(e);
  }
}

function isTokenExpired({expirationWindowSeconds = 0, expires_at}) {
  return expires_at - (Date.now() + expirationWindowSeconds * 1000) <= 0;
}

async function getNewToken({configuration, provider, user}) {
  try {
    log.debug(`getNewToken`);
    const conf = configuration.api.authentication[provider];
    const authTokenHost = `${conf.tokenHost}${conf.tokenPath}`;
    let response;
    if (conf['useHeaders']) {
      log.debug(`useHeaders: ${conf['useHeaders']}`);
      response = await fetch(authTokenHost, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': conf.bearer + ' ' + user['refreshToken']
        }
      });
    } else if (conf['useFormData']) {
      log.debug(`useFormData: ${conf['useFormData']}`);
      //     console.log(`
      //     curl -d grant_type=refresh_token \\
      //    -d client_id=${conf.clientID} \\
      //    -d client_secret=${conf.clientSecret} \\
      //    -d refresh_token=${user['refreshToken']} \\
      //    -d scope=scope=${conf.scope} \\
      //    ${authTokenHost} \\
      // > cilogon-token-response.json`)
      const parameters = {
        'grant_type': 'refresh_token',
        'client_id': conf.clientID,
        'client_secret': conf.clientSecret,
        'scope': conf.scope,
        'refresh_token': user['refreshToken']
      }
      // const searchParams = new URLSearchParams();
      // Object.keys(parameters).forEach(key => searchParams.append(key, parameters[key]))
      // console.log(searchParams.toString()) // This should be ok but cilogon does not like it encoded OMG!
      // const body = `grant_type=refresh_token&client_id=${conf.clientID}&client_secret=${conf.clientSecret}&scope=scope=${conf.scope}&refresh_token=${user['refreshToken']}`;
      // console.log(body)
      const url = new URL(authTokenHost);
      Object.keys(parameters).forEach(key => url.searchParams.append(key, parameters[key]))
      response = await fetch(url);
    }
    if (response.status === 200) {
      const accessToken = await response.json();
      const tokenConf = configuration.api.tokens;
      await updateUser({
        id: user.id,
        multi: [
          {key: 'accessToken', value: utils.encrypt(tokenConf.secret, accessToken.access_token)},
          {key: 'refreshToken', value: utils.encrypt(tokenConf.secret, accessToken.refresh_token)},
          {key: 'accessTokenExpiresAt', value: accessToken.expires_at}]
      });
      return accessToken.access_token;
    } else {
      console.log(response.statusText);
      return null;
    }
  } catch (e) {
    log.error('Error: getNewToken');
    log.error(JSON.stringify(e))
    return null;
  }
}
