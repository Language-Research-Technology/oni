// these endpoints will only return data they are responsible for
//
const models = require('../models');
const { UnauthorizedError, ForbiddenError } = require('restify-errors');
const { route, loadConfiguration } = require('../services');
const { setupRecordRoutes } = require('./data/record');
const { setupUserRoutes } = require('./user');
const { setupAuthRoutes } = require('./auth');
const passport = require('passport');

function setupRoutes({ server, configuration }) {

  setupAuthRoutes({ server, passport, configuration });

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
    res.send({ ui: configuration.ui});
    next();
  });

  setupRecordRoutes({ server, passport, configuration });
  setupUserRoutes({ server, passport, configuration });
}

module.exports = {
  setupRoutes: setupRoutes
}
