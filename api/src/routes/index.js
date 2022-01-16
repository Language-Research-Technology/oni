// these endpoints will only return data they are responsible for
//
import models from '../models';
import { UnauthorizedError, ForbiddenError } from 'restify-errors';
import { routeUser, loadConfiguration } from '../services';
import { setupObjectRoutes } from './object';
import { setupUserRoutes } from './user';
import { setupAuthRoutes } from './auth';
import { setupSearchRoutes } from './search';

const version = require('../../package.json')['version'];

export function setupRoutes({ server, configuration }) {

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
    res.send({ ui: configuration.ui });
    next();
  });

  server.get('/version', (req, res, next) => {
    res.send({ version: version });
  });

  setupObjectRoutes({ server, configuration });
  setupUserRoutes({ server, configuration });
  setupSearchRoutes({ server, configuration });
}
