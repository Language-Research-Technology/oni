// these endpoints will only return data they are responsible for
//
import models from "../models";
import {UnauthorizedError, ForbiddenError} from "restify-errors";
import {route, loadConfiguration} from "../common";
import {setupRoutes as setupRecordRoutes} from "./record";

export function setupRoutes({server, configuration}) {
  if (process.env.NODE_ENV === "development") {
    server.get(
      "/test-middleware",
      route((req, res, next) => {
        res.send({});
        next();
      })
    );
  }
  server.get("/", (req, res, next) => {
    res.send({});
    next();
  });
  server.get("/configuration", async (req, res, next) => {
    let configuration = await loadConfiguration();
    res.send({ui: configuration.ui});
    next();
  });
  server.get(
    "/authenticated",
    route(async (req, res, next) => {
      res.send({});
      next();
    })
  );
  server.get("/logout", async (req, res, next) => {
    let token = req.headers.authorization.split("Bearer ")[1];
    if (token) {
      let session = await models.session.findOne({where: {token}});
      if (session) await session.destroy();
    }
    next(new UnauthorizedError());
  });

  setupRecordRoutes({server, configuration});

}
