import { Hono } from 'hono';
import { getLogger, logEvent } from '../../services/logger.js';
import { generators } from 'openid-client';
import { createUser, updateUser } from '../../controllers/user.js';
import { createSession } from '../../controllers/session.js';
import { AuthorizationCode, ClientCredentials } from 'simple-oauth2';
import * as utils from "../../services/utils.js";
import { first, isEmpty } from "lodash-es";
import { badRequestError, unauthorizedError } from '../../helpers/errors.js';
import { badRequest } from '#src/helpers/responses.js';

//const {URL, URLSearchParams} = require('url');

const log = getLogger();

export function setupOauthRoutes({ configuration }) {
  const app = new Hono({ strict: false });

  /**
   * @openapi
   * /oauth/{provider}/login:
   *   get:
   *     tags:
   *       - auth
   *     description: |
   *                  ### Oauth Provider Login
   *                  Logs in with provider passed in path
   *     parameters:
   *       - in: path
   *         name: provider
   *         description: provider name/id
   *         required: true
   *     responses:
   *       '200':
   *         description: |
   *                      Returns a json with URL, code_verifier and provider
   *                      Use URL to authenticate with browser. Browser will return an URL
   *                      Example: http://localhost:10000/auth/cilogon/callback?code=NB2HI4DTHIXS65DFON2C4Y3JNRXWO33OFZXXEZZPN5QXK5DIGIXTCN3CMI4DMNTDMMZTOMLFMZRWKYJZGI2DANDEGEZTKMBQME3TEMJ7OR4XAZJ5MF2XI2D2I5ZGC3TUEZ2HGPJRGY3TGOBSGU2TANRYGAYCM5TFOJZWS33OHV3DELRQEZWGSZTFORUW2ZJ5HEYDAMBQGA&state=cilogon
   */
  app.get("/:provider/login", async function (c) {
    const { provider } = c.req.param();
    const conf = configuration.api.authentication[provider];
    if (!conf) return c.notFound();
    log.debug(JSON.stringify(conf));
    // try {
    // } catch (error) {
    //   return next(new ServiceUnavailableError());
    // }

    // const client = new ClientOAuth2({
    //   clientId: conf.clientID,
    //   clientSecret: conf.clientSecret,
    //   accessTokenUri: conf.tokenHost,
    //   authorizationUri:  conf.authorizeHost,
    //   redirectUri: conf.redirectUri,
    //   scopes: conf.scope
    // });

    const client = new AuthorizationCode(authClientConf(conf));

    const code_verifier = generators.codeVerifier();
    // const code_challenge = generators.codeChallenge(code_verifier);
    // const code_challenge_method = "S256";
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
    return c.json({ url, code_verifier, provider });
  });

  /**
   * @openapi
   * /oauth/{provider}/code:
   *   post:
   *     tags:
   *       - auth
   *     description: |
   *                  ### Oauth Provider Code
   *                  Authorizes user with code returned
   *     consumes:
   *         - application/json
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             required:
   *               - code
   *               - state
   *             type: object
   *             properties:
   *               code:
   *                 type: string
   *               state:
   *                 type: string
   *     parameters:
   *       - in: path
   *         name: provider
   *         description: provider
   *         required: true
   *
   *     responses:
   *       '200':
   *         description: |
   *                      Return JSON Web Token to authorize user with corresponding code. The JWT is named oni-user-token. You need to include this JWT in subsequent requests. Configure its lifetime in session:lifetime:hours in configuration.json
   */
  app.post("/:provider/code", async function (c) {
    const { provider } = c.req.param();
    const conf = configuration.api.authentication[provider];
    if (!conf) return c.notFound();
    const body = await c.req.json();
    if (provider !== body.state) {
      return badRequest({ json: { message: 'Provider does not match' } });
    }
    if (!body.code) {
      return badRequest({ json: { message: 'Code not provided' } });
    }

    let token = await getOauthToken({
      code: body.code,
      state: body.state,
      conf
    });
    if (isEmpty(token) && !token['access_token']) {
      throw unauthorizedError();
    } else {
      let userData = await getUserToken({ conf, provider: body.state, token });
      log.debug('userData');
      let user;
      // Not all userData contains email
      userData.provider = body.state;
      if (configuration.api.administrators.includes(userData?.email)) {
        // admin account - set it up and login
        console.log(`Admin ${userData?.email}`);
        try {
          user = await createUser({ data: userData, configuration });
        } catch (error) {
          throw unauthorizedError();
        }
      } else {
        console.log(`Normal ${userData.provider} / ${userData.providerId}`);
        // normal user account - we are allowing access unless its locked
        // create will findOne and update the token
        try {
          user = await createUser({ data: userData, configuration });
          log.debug(`userCreated: ${user.provider} / ${user.providerUsername}`);
        } catch (e) {
          await logEvent({
            level: "error",
            owner: first(configuration.api.administrators),
            text: e.message,
            data: userData.providerId
          });
          throw unauthorizedError();
        }
        if (user?.locked) {
          log.info(`The account for '${user.providerId}' is locked. Denying user login.`);
          await logEvent({
            level: "info",
            owner: first(configuration.api.administrators),
            text: `The account is locked. Denying user login for ${user.providerId}`,
          });
          // user account exists but user is locked
          throw unauthorizedError();
        }
        if (!user?.provider || !user.providerId) {
          // user account looks like a stub account - create it properly
          log.info(`The account for '${user.providerId}' is being setup.`);
          await logEvent({
            level: "info",
            owner: first(configuration.api.administrators),
            text: `The account for ${user.providerId} is being setup.`,
          });
          try {
            user = await createUser({ data: userData, configuration });
          } catch (e) {
            await logEvent({
              level: "error",
              owner: first(configuration.api.administrators),
              text: e.message,
            });
            throw unauthorizedError();
          }
        }
      }
      log.debug(`Creating session for ${userData.provider} / ${userData.providerId} / ${user.providerUsername}`);
      let session = await createSession({ user, configuration });

      return c.json({ token: session.token });
    }
  });

  return app;
}

async function getOauthToken({ code, state, conf }) {
  try {
    const config = authClientConf(conf);
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

async function getUserToken({ conf, provider, token }) {
  try {
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
    log.debug(`${provider} with ${conf.username} : ${user[conf.username]}`)
    if (user) {
      return {
        email: user?.email,
        name: user?.name,
        provider: provider,
        providerId: user[conf.userid],
        providerUsername: user[conf.username],
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

export async function needsNewToken({ configuration, provider, user }) {
  try {
    const conf = configuration.api.authentication[provider];
    if (isTokenExpired({
      expirationWindowSeconds: conf['expirationWindowSeconds'],
      expires_at: user['accessTokenExpiresAt']
    })) {
      log.debug('token expired');
      const accessToken = await getNewToken({ configuration, provider: 'cilogon', user });
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

function isTokenExpired({ expirationWindowSeconds = 0, expires_at }) {
  return expires_at - (Date.now() + expirationWindowSeconds * 1000) <= 0;
}

async function getNewToken({ configuration, provider, user }) {
  try {
    log.debug(`getNewToken with refreshToken`);
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
          'Authorization': conf.bearer + ' ' + user?.refreshToken
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
        'refresh_token': user?.refreshToken
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
        accessToken: utils.encrypt(tokenConf.secret, accessToken.access_token),
        refreshToken: utils.encrypt(tokenConf.secret, accessToken.refresh_token),
        accessTokenExpiresAt: accessToken.expires_at
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

/**
 * Convert oni configuration to a form accepted by oauth client
 * @param {object} conf 
 */
function authClientConf(conf) {
  return {
    client: {
      id: conf.clientID,
      secret: conf.clientSecret
    },
    auth: {
      authorizeHost: conf.authorizeHost || conf.host,
      authorizePath: conf.authorizePath,
      tokenHost: conf.tokenHost || conf.host,
      tokenPath: conf.tokenPath
    }
  };
}