import { verify } from 'hono/jwt';
import { createMiddleware } from 'hono/factory';
import { bearerAuth } from 'hono/bearer-auth';
import { getCookie } from 'hono/cookie';

import { getLogger } from "../services/logger.js";
import { User } from '../models/user.js';
import { encrypt } from '../services/utils.js';
import { badRequestError, unauthorizedError, forbiddenError, notFoundError } from '../helpers/errors.js';
import { checkIfAuthorized } from '../services/license.js';
import { getRecord } from '../controllers/record.js';

const log = getLogger();

/**
 * @param  {boolean} [isRequired] If true, invalid header will throw HTTPException
 * @return
 */
export function authorizationHeader(isRequired) {
  return createMiddleware(async (c, next) => {
  //return async function authHeader(c, next) {
    c.set('bearer', '');
    const headerToken = c.req.header('Authorization');
    if (!headerToken) {
      if (isRequired) throw unauthorizedError({ headers: { 'WWW-Authenticate': 'Bearer realm="user"' } });
    } else {
      const match = headerToken.match(/^Bearer\s+(\S*)$/i);
      if (match && match[1]) {
        c.set('bearer', match[1]);
      } else {
        if (isRequired) throw badRequestError({ headers: { 'WWW-Authenticate': 'Bearer error="invalid_request"' } });
      }
    }
    await next();
  });
}

/**
 * @param {object} opt 
 * @param {boolean} [opt.isRequired]  If true, invalid header will throw HTTPException
 * @param {object} opt.secret
 * @param {object} opt.tokenSecret
 * @param {object} opt.tokenPassword
 * @return 
 */
export function authenticateUser({ isRequired, secret, tokenSecret, tokenPassword }) {
  async function verifyToken(authToken, c) {
    let user;
    let where;
    if (authToken) {
      //const tokenConf = configuration.api.tokens;
      //const tokenEncrypted = encrypt(tokenConf.secret, authToken, tokenConf.accessTokenPassword);
      try {
        //user = await verify(authToken, configuration.api.session.secret);
        user = await verify(authToken, secret);
        where = { 'id': user.id };
        log.debug('user '+JSON.stringify(user));
      } catch (error) {
        where = { apiToken: encrypt(tokenSecret, authToken, tokenPassword) };
      }
      try {
        user = await User.findOne({ where });
      } catch (error) {
        user = null;
      }
    }
    if (user && user.id) {
      const { accessToken, refreshToken, apiToken, ...filtered } = user.get();
      user = filtered;
      if (where.apiToken) user.apiToken = authToken;
      c.set('user', user);
      return true;
    }
    return false;
  }

  const bearer = bearerAuth({ verifyToken });

  return createMiddleware(async (c, next) => {
  //return async function auth(c, next) {
    const token = getCookie(c, 'session');
    let verified = await verifyToken(token, c);
    //console.log('cookie', cookie);
    if (!verified) {
      try {
        await bearer(c, next);
        return;
      } catch (error) {
        if (isRequired) throw error;
      }
    }
    await next();
  });
}

/**
 * Check if a user is allowed access to a resource according to it's license
 * A resource is specified by the id parameter in the request url
 * @param {*} licenseConfiguration 
 * @returns 
 */
export function authorizeUser(licenseConfiguration) {
  return createMiddleware(async (c, next) => {
  //return async function authz(c, next) {
    const id = c.get('crateId') || c.req.param('id');
    log.debug(`[authorize middleware] check id=${id}`);
    if (id) {
      const record = await getRecord({ crateId: id });
      if (record) {
        if (licenseConfiguration && record.license) {
          const user = c.get('user');
          const access = await checkIfAuthorized({ userId: user?.id, license: record.license, licenseConfiguration });
          if (!access.hasAccess) {
            log.debug(`[authorize middleware] Not authorized: id=${id} with license=${record.license}`);
            throw forbiddenError({ json: { id, error: { message: 'User is not authorized' } } });
          }
        }
      } else {
        throw notFoundError();
      }
    }
    await next();
  });
};
