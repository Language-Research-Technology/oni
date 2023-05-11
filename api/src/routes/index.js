// these endpoints will only return data they are responsible for
//
import {routeUser, loadConfiguration, swaggerDoc} from '../services';
import {setupObjectRoutes} from './object';
import {setupUserRoutes} from './user';
import {setupAuthRoutes} from './auth';
import {setupSearchRoutes} from './search';
import {setupAdminRoutes} from "./admin";

const {version, name, homepage} = require('../../package.json');

export function setupRoutes({server, configuration, repository}) {

  setupAuthRoutes({server, configuration});

  if (process.env.NODE_ENV === 'development') {
    server.get('/test-middleware', routeUser((req, res, next) => {
      res.send({});
      next();
    }));
  }

  /**
   * @openapi
   * /:
   *   get:
   *     tags:
   *       - general
   *     description: |
   *                  ### Root
   *                  List of Api endpoints available
   *     responses:
   *       200:
   *         description: Returns a list of current Api Requests
   */
  server.get('/', (req, res, next) => {
    res.json({
      configuration: '/configuration',
      version: '/version',
      swagger: '/swagger.json',
      admin_elastic_index: '/admin/elastic/index',
      admin_database_index: '/admin/database/index',
      object: '/object{memberOf}{id}',
      object_meta: '/object/meta{id}',
      object_meta_versions: '/object/meta/versions',
      stream: '/stream',
      object_open: '/object/open',
      user: '/user',
      user_token: '/user/token',
      search_index: '/search/:index',
      search_fields_index: '/search/fields/:index',
      search_index_post_index: '/search/index-post/:index',
      search_scroll: '/search/scroll',
      auth_memberships: '/auth/memberships',
      oauth_provider_login: '/oauth/:provider/login',
      oauth_provider_code:'/oauth/:provider/code',
      authenticated: '/authenticated',
      logout: '/logout'
    });
    res.status(200);
    next();
  });

  /**
   * @openapi
   * /configuration:
   *   get:
   *     tags:
   *       - general
   *     description: |
   *                  ### Configuration
   *                  Configuration
   *     responses:
   *       200:
   *         description: Returns ui configuration including licenses and aggregations.
   */
  server.get('/configuration', async (req, res, next) => {
    let configuration = await loadConfiguration();
    const ui = configuration.ui;
    ui.aggregations = configuration?.api?.elastic?.aggregations;
    ui.searchFields = configuration?.api?.elastic?.fields;
    ui.searchHighlights = configuration?.api?.elastic?.highlightFields;
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
   *     tags:
   *       - general
   *     description: |
   *                  ### Version
   *                  Oni Version
   *     responses:
   *       200:
   *         description: Returns Oni's current version.
   */
  server.get('/version', (req, res, next) => {
    res.send({version});
  });

    /**
   * @openapi
   * /swagger.json:
   *   get:
   *     tags:
   *       - general
   *     description: |
   *                  ### swagger spec
   *                  swagger.json
   *     responses:
   *       200:
   *         description: Returns swagger spec of this api
   */
    server.get('/swagger.json', async (req, res, next) => {
      let configuration = await loadConfiguration();
      const spec = swaggerDoc({configuration, version, name, homepage});
      res.send(spec)
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

