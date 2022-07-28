import { UnauthorizedError, ForbiddenError } from "restify-errors";
import { verifyToken } from "../services/jwt";
import { getLogger } from "../services/logger";
import { loadConfiguration } from "../services/configuration"
import { getUser } from '../controllers/user';
import * as utils from '../services/utils'

const log = getLogger();

export function routeUser(handler) {
  return [ demandAuthenticatedUser, handler ];
}

export function routeAdmin(handler) {
  return [ demandAuthenticatedUser, demandAdministrator, handler ];
}

export function routeBearer(handler) {
  return [ demandBearerUser, handler ];
}

/**
 * Allow browse if there is not an user do not error, manage session when using
 * @param handler
 * @return {((function(*, *, *): Promise<*|undefined>)|*)[]}
 */
export function routeBrowse(handler) {
  return [ softAuthenticateUser, handler]
}

export async function demandBearerUser(req, res, next) {
  if (!req.headers.authorization) {
    return next(new UnauthorizedError());
  }
  try {
    const token = req.headers.authorization.split("Bearer ")[1];
    const configuration = await loadConfiguration();
    const tokenConf = configuration.api.tokens;
    //Using the same initVector when encrypted to be able to compare it.
    const tokenEncrypted = utils.encrypt(tokenConf.secret, token, tokenConf.accessTokenPassword);
    const user = await getUser({ where: { apiToken: tokenEncrypted } });
    if (!user) {
      return next(new UnauthorizedError());
    }
    req.user = user;
  } catch (error) {
    return next(new UnauthorizedError());
  }
  next();
}

export async function demandAuthenticatedUser(req, res, next) {
  if (!req.headers.authorization) {
    return next(new UnauthorizedError());
  }
  try {
    const configuration = await loadConfiguration();
    let user = await verifyToken({
      token: req.headers.authorization.split("Bearer ")[1],
      configuration,
    });
    req.session = {
      user,
    };
  } catch (error) {
    return next(new UnauthorizedError());
  }
  next();
}

/**
 * Allow browse but test if there is a user, if it is return it in the session
 * @param req
 * @param res
 * @param next
 * @return {Promise<*>}
 */
export async function softAuthenticateUser(req, res, next) {
  if (!req.headers.authorization) {
    return next();
  }else{
    try {
      const configuration = await loadConfiguration();
      let user = await verifyToken({
        token: req.headers.authorization.split("Bearer ")[1],
        configuration,
      });
      req.session = {
        user,
      };
    } catch (error) {
      return next();
    }
    next();
  }
}

export async function demandAdministrator({ req, res, next }) {
  if (!req.session.user.administrator) {
    return next(new ForbiddenError());
  }
  next();
}

