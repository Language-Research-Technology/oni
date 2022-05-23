// these endpoints will only return data they are responsible for
//
import models from '../models';
import { UnauthorizedError, ForbiddenError } from 'restify-errors';
import { routeUser, loadConfiguration } from '../services';
import { setupObjectRoutes } from './object';
import { setupUserRoutes } from './user';
import { setupAuthRoutes } from './auth';
import { setupSearchRoutes } from './search';
import { setupAdminRoutes } from "./admin";

const version = require('../../package.json')['version'];

export function setupRoutes({ server, configuration, repository }) {

  setupAuthRoutes({ server, configuration });

  if (process.env.NODE_ENV === 'development') {
    server.get('/test-middleware', routeUser((req, res, next) => {
      res.send({});
      next();
    }));
  }

  server.get('/', (req, res, next) => {
    res.send({});
    next();
  });

  server.get('/configuration', async (req, res, next) => {
    let configuration = await loadConfiguration();
    const ui = configuration.ui;
    ui.aggregations = configuration?.api?.elastic?.aggregations;
    res.send({ ui: configuration.ui });
    next();
  });

  server.get('/version', (req, res, next) => {
    res.send({ version: version });
  });

  setupObjectRoutes({ server, configuration, repository });
  setupUserRoutes({ server, configuration });
  setupSearchRoutes({ server, configuration });

  const admin = configuration['api']['admin'];
  if (admin) {
    //set true if you want to expose indexing via rest api
    //TODO: Add security
    if (admin['indexRoutes']) {
      setupAdminRoutes({server, configuration, repository});
    }
  }
}
