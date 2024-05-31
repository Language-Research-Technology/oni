import { Hono } from 'hono';
import { getLogger, logEvent } from "../../services/logger.js";
import { getUser } from '../../controllers/user.js';
import { Session } from '../../models/session.js';
//import { unauthorizedError } from '../../helpers/errors.js';
import { getGithubMemberships } from '../../controllers/github.js';
import { getCiLogonMemberships } from '../../controllers/cilogon.js';
import { getREMSMemberships } from '../../controllers/rems.js';

import { some } from "lodash-es";
import { getUserMemberships } from "../../controllers/userMembership.js";
import { createUser } from '../../controllers/user.js';
import { createSession } from '../../controllers/session.js';
import { Issuer, generators } from 'openid-client';
import { jwtVerify, createRemoteJWKSet } from "jose";
import { badRequest, unauthorized } from '#src/helpers/responses.js';
import { User } from '#src/models/user.js';

const log = getLogger();
/*
 * TODO: How to setup your social login dynamically
*/

export function setupAuthRoutes({ configuration, auth }) {
  const app = new Hono({ strict: false });

  /**
   * @openapi
   * /auth/memberships:
   *   get:
   *     tags:
   *       - auth
   *     description: |
   *                  ### Auth Memberships
   *                  Retrieve user permissions from provider configured and store them in user database. Use /user/memberships for only getting stored memberships
   *     security:
   *       - Bearer: []
   *       - OAuth2:
   *         - openid
   *         - profile
   *         - email
   *         - org.cilogon.userinfo
   *         - offline_access
   *     responses:
   *       '200':
   *         description: |
   *                      Returns memberships array
   *
   */
  app.get('/memberships', auth, async function (c) {
    const user = c.get('user');
    log.debug('checking memberships');
    log.debug('User: ' + user.id);
    // TODO: Design group configuration
    const authorization = configuration["api"]["authorization"];
    const group = configuration['api']['licenseGroup'];
    // TODO: load dynamically the memberships functions
    let memberships = [];
    //const user = await getUser({ id: req.session?.user?.id });
    log.debug(`user.provider: ${user?.provider}`);
    if (!user?.provider) {
      return c.json({ error: "no provider sent when authorizing" }, 403);
    } else {
      log.debug(`user.providerUsername: ${user?.providerUsername}`);
      if (authorization.provider === "rems") {
        memberships = await getREMSMemberships({ configuration, user, group });
      } else if (authorization.provider === "github") {
        memberships = await getGithubMemberships({ configuration, user, group });
      } else if (authorization.provider === "cilogon") {
        memberships = await getCiLogonMemberships({ configuration, user, group });
      }
      if (authorization?.enrollment && authorization?.enrollment?.enforced) {
        log.debug('enrollment enforced');
        if (memberships.error) {
          return c.json({ memberships: [], error: "Server requires enrollment" }, 403);
        } else if (some(memberships, (m) => authorization.enrollment.groups.includes(m))) {
          return c.json({ memberships });
        } else {
          return c.json({ memberships: [], unenrolled: true, error: "No enrollment found" });
        }
      } else {
        if (memberships.error) {
          return c.json({ memberships: [], error: memberships.error });
        } else {
          return c.json({ memberships });
        }
      }
    }
  });

  app.get("/:provider/login", async function ({ get, req, json }) {
    const { provider } = req.param();
    configuration = configuration.api.authentication[provider];
    log.debug(configuration);
    // try {
    // } catch (error) {
    //   return next(new ServiceUnavailableError());
    // }
    let issuer = await Issuer.discover(configuration.discover);
    log.debug('Discovered issuer %s %O', issuer.issuer, issuer.metadata);
    const client = new issuer.Client({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      redirect_uris: [configuration.redirect_uri || configuration.redirectUri || get('baseUrl') + configuration.redirectPath],
      response_types: ["code"],
    });
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    const code_challenge_method = "S256";
    const url = client.authorizationUrl({
      scope: "openid email profile",
      code_challenge,
      code_challenge_method,
      state: provider,
    });
    return json({ url, code_verifier });
  });

  app.post("/:provider/code", async function (c) {
    const { provider } = c.req.param();
    const body = await c.req.json();
    if (!body.code) {
      return badRequest({ body: 'Code not provided' });
    }

    let { token, jwks } = await getOauthToken({
      provider,
      code: body.code,
      code_verifier: body.code_verifier,
      configuration,
    });
    let userData = await extractUserDataFromIdToken({ configuration, provider, jwks, token });
    let user;

    if (configuration.api.administrators.includes(userData.email)) {
      // admin account - set it up and login
      user = await createUser({ data: userData, configuration });
      // try {
      //   user = await createUser({data: userData, configuration});
      // } catch (error) {
      //   return next(new UnauthorizedError());
      // }
    } else {
      // normal user account - are we allowing access
      user = await User.findOne({ where: { email: userData.email } });
      if (!user) {
        // no user found with that email - not whitelisted so deny access
        log.info(`The account for '${userData.email}' is not whitelisted. Denying user login.`);
        return unauthorized();
      }
      if (user?.locked) {
        log.info(`The account for '${user.email}' is locked. Denying user login.`);
        await logEvent({
          level: "info",
          owner: user.email,
          text: `The account is locked. Denying user login.`,
        });
        // user account exists but user is locked
        return unauthorized();
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
          user = await createUser({ data: userData, configuration });
        } catch (error) {
          return unauthorized();
        }
      }
    }
    log.debug(`Creating session for ${user.email}`);
    let session = await createSession({ user, configuration });

    return c.json({ token: session.token });
  });

  return app;

}

async function getOauthToken({ provider, code, code_verifier, configuration, host }) {
  configuration = configuration.api.authentication[provider];
  const redirectUri = configuration.redirectUri || host + configuration.redirectPath;
  let issuer = await Issuer.discover(configuration.discover);
  const client = new issuer.Client({
    client_id: configuration.clientId,
    client_secret: configuration.clientSecret,
    redirect_uris: [redirectUri],
    response_types: ["code"],
  });
  let token = await client.callback(redirectUri, { code }, { code_verifier });
  return { token, jwks: issuer.jwks_uri };
}

export async function extractUserDataFromIdToken({ configuration, provider, jwks, token }) {
  configuration = configuration.api.authentication[provider];
  const JWKS = createRemoteJWKSet(new URL(jwks));
  let tokenData = await jwtVerify(token.id_token, JWKS, {
    audience: configuration.clientId,
  });
  let { email, given_name, family_name } = tokenData.payload;
  return { provider, email, givenName: given_name, familyName: family_name };
}

