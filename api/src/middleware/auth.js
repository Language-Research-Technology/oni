import { UnauthorizedError, ForbiddenError } from "restify-errors";
import { verifyToken } from "../controllers/jwt";
import { getLogger } from "../services/logger";
import { loadConfiguration } from "../services/configuration"
import { getUser } from '../controllers/user';

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

export async function demandBearerUser(req, res, next) {
  if (!req.headers.authorization) {
    return next(new UnauthorizedError());
  }
  try {
    const user = await getUser({ where: { apiToken: req.headers.authorization.split("Bearer ")[1], } });
    if (!user?.dataValues) {
      return next(new UnauthorizedError());
    }
    req.user = user?.dataValues;
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

export async function demandAdministrator({ req, res, next }) {
  if (!req.session.user.administrator) {
    return next(new ForbiddenError());
  }
  next();
}

