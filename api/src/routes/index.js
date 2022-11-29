// these endpoints will only return data they are responsible for
//
import {routeUser, loadConfiguration} from '../services';
import {setupObjectRoutes} from './object';
import {setupUserRoutes} from './user';
import {setupAuthRoutes} from './auth';
import {setupSearchRoutes} from './search';
import {setupAdminRoutes} from "./admin";

const version = require('../../package.json')['version'];

export function setupRoutes({server, configuration, repository}) {

  setupAuthRoutes({server, configuration});

  if (process.env.NODE_ENV === 'development') {
    /**
     * @openapi
     * /test-middleware:
     *   get:
     *     description: Test Middleware
     *     responses:
     *       200:
     *         description: None.
     */
    server.get('/test-middleware', routeUser((req, res, next) => {
      res.send({});
      next();
    }));
  }

  /**
   * @openapi
   * /:
   *   get:
   *     description: Root
   *     responses:
   *       200:
   *         description: None.
   */
  server.get('/', (req, res, next) => {
    res.json({hello: 'from Oni'});
    res.status(200);
    next();
  });

  /**
   * @openapi
   * /configuration:
   *   get:
   *     description: Configuration
   *     responses:
   *       200:
   *         description: Returns ui configuration including licenses and aggregations.
   */
  server.get('/configuration', async (req, res, next) => {
    let configuration = await loadConfiguration();
    const ui = configuration.ui;
    ui.aggregations = configuration?.api?.elastic?.aggregations;
    ui.licenses = configuration?.api?.licenses;
    ui.conformsTo = configuration?.api?.conformsTo;
    ui.enrollment = configuration?.api?.authorization?.enrollment;
    res.send({ui: configuration.ui});
    next();
  });

  /**
   * @openapi
   * /version:
   *   get:
   *     description: Version
   *     responses:
   *       200:
   *         description: Returns package version.
   */
  server.get('/version', (req, res, next) => {
    res.send({version});
  });

  setupObjectRoutes({server, configuration, repository});
  setupUserRoutes({server, configuration});
  setupSearchRoutes({server, configuration});

  const admin = configuration['api']['admin'];
  if (admin) {
    //set true if you want to expose indexing via rest api
    //TODO: Add security
    if (admin['indexRoutes']) {
      setupAdminRoutes({server, configuration, repository});
    }
  }
}

