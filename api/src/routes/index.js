// these endpoints will only return data they are responsible for
//
import models from '../models';
import { UnauthorizedError, ForbiddenError } from 'restify-errors';
import { route, loadConfiguration } from '../services';
import { setupObjectRoutes } from './object';
import { setupUserRoutes } from './user';
import { setupAuthRoutes } from './auth';

const version = require('../../package.json')['version'];

function setupRoutes({ server, configuration }) {

  setupAuthRoutes({ server, configuration });

  if (process.env.NODE_ENV === 'development') {
    server.get('/test-middleware', route((req, res, next) => {
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
}

module.exports = {
  setupRoutes
}
