/**
 * @fileoverview The root routing app. Set up all routings.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createFactory } from 'hono/factory';
import { prettyJSON } from 'hono/pretty-json'
import { HTTPException } from 'hono/http-exception';
import { bearerAuth } from 'hono/bearer-auth'
//import { logger } from 'hono/logger';
import { getLogger } from '../services/logger.js';

// these endpoints will only return data they are responsible for
//
import { swaggerDoc } from '../services/swagger.js';
import { setupObjectRoutes } from './object/index.js';
import { setupUserRoutes } from './user/index.js';
import { setupAuthRoutes } from './auth/index.js';
import { setupOauthRoutes } from './auth/oauth2-auth.js';
import { setupSearchRoutes } from './search/index.js';
import { setupAdminRoutes } from "./admin/index.js";
import { authenticateUser, authorizationHeader, authorizeUser } from '../middleware/auth.js';
import { Session } from '../models/session.js';
import { getState } from '../services/indexer.js';

const log = getLogger();

async function passMiddleware(c, next) {
  await next();
}

export function setupRoutes({ configuration, repository }) {
  const secret = configuration.api.session.secret;
  const tokenSecret = configuration.api.tokens.secret;
  const tokenPassword = configuration.api.tokens.accessTokenPassword;
  /** auth middleware */
  const softAuth = authenticateUser({ secret, tokenSecret, tokenPassword });
  const auth = authenticateUser({ secret, tokenSecret, tokenPassword, isRequired: true });
  const authorize = configuration.api.authorization.disabled ? passMiddleware : authorizeUser(configuration.api.licenses);
  const basePath = configuration.api.basePath || '';
  const app = new Hono({ strict: false, }).basePath(basePath);

  app.use(cors({
    maxAge: 5,
    origin: ['*'],
    allowHeaders: ['DNT', 'User-Agent', 'X-Requested-With', 'If-Modified-Since', 'Cache-Control', 'Content-Type', 'Range', 'Authorization'],
    exposeHeaders: ['DNT', 'User-Agent', 'X-Requested-With', 'If-Modified-Since', 'Cache-Control', 'Content-Type', 'Range', 'Authorization']
  }));

  app.use(async function detectHost(c, next) {
    let url = new URL(c.req.url);
    //console.log(c.req.header());
    const reqProtocol = url.protocol.slice(0, -1);
    const protocol = configuration.api.protocol || c.req.header('x-forwarded-proto') || reqProtocol;
    const host = configuration.api.host || c.req.header('x-forwarded-host') || c.req.header('host') || url.host;
    c.set('protocol', protocol);
    c.set('host', host);
    c.set('baseUrl', configuration.api.baseUrl || (protocol + '://' + host + (configuration.api.basePath || '')));
    if (configuration.api.baseUrl) {
      url = new URL(configuration.api.baseUrl + url.pathname + url.search);
    } else {
      if (protocol !== reqProtocol) url.protocol = protocol + ':';
      if (host !== url.host) url.host = host;
    }
    c.set('url', url);
    //console.log(c.get('protocol'));
    await next();
  });
  //app.use(prettyJSON());

  if (process.env.NODE_ENV === "development") {
    //app.use(logger());
    app.use(async ({ req, res }, next) => {
      log.debug(`${req.method}: ${req.path}`);
      await next();
    });
  }

  //app.use(compress()) //better to handle this in nginx
  // server.use(restify.plugins.dateParser());
  // server.use(restify.plugins.queryParser()); // not needed
  // server.use(restify.plugins.jsonp());
  // server.use(
  //   restify.plugins.bodyParser({
  //     params: true,
  //     maxBodySize: 0,
  //     mapParams: true,
  //     mapFiles: false,
  //     overrideParams: false,
  //     multiples: true,
  //     hash: "sha1",
  //     rejectUnknown: true,
  //     requestBodyOnGet: false,
  //     reviver: undefined,
  //     maxFieldsSize: 2 * 1024 * 1024,
  //   })
  // );
  // app.get('/', (c) => {
  //   return c.text('Hello Hono!')
  // })
  // app.get('/version', (c) => {
  //   return c.text('123')
  // })

  const { version, name, homepage } = configuration.package;

  // if (process.env.NODE_ENV === 'development') {
  //   server.get('/test-middleware', routeUser((req, res, next) => {
  //     res.send({});
  //     next();
  //   }));
  // }

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
  app.get('/', ({ json }) => {
    return json({
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
      user_terms: '/user/terms',
      user_terms_accept: '/user/terms/accept',
      search_index: '/search/:index',
      search_fields_index: '/search/fields/:index',
      search_index_post_index: '/search/index-post/:index',
      search_scroll: '/search/scroll',
      auth_memberships: '/auth/memberships',
      oauth_provider_login: '/oauth/:provider/login',
      oauth_provider_code: '/oauth/:provider/code',
      authenticated: '/authenticated',
      logout: '/logout',
      status: '/status',
    });
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
  app.get('/configuration', ({ json }) => {
    const ui = { ...configuration.ui };
    ui.aggregations = configuration?.api?.elastic?.aggregations;
    ui.searchFields = configuration?.api?.elastic?.fields;
    ui.searchHighlights = configuration?.api?.elastic?.highlightFields;
    ui.hightlight = configuration?.api?.elastic.indexConfiguration?.highlight;
    ui.licenses = configuration?.api?.licenses;
    ui.conformsTo = configuration?.api?.conformsTo;
    ui.enrollment = configuration?.api?.authorization?.enrollment;
    return json({ ui });
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
  app.get('/version', ({ json }) => json({ version }));

  if (configuration.api.openapi?.enabled) {
    const swaggerSpec = swaggerDoc({ configuration, version, name, homepage });
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
    app.on('GET', ['/openapi.json', '/swagger.json'], ({ get, json }) => {
      swaggerSpec.servers[0].url = get('baseUrl');
      return json(swaggerSpec);
    });
  }

  // app.use(async ({ req, res }, next) => {
  //   console.log(`Testing route hierarchy ${req.method}: ${req.path}`);
  //   await next();
  // });

  /**
   * @openapi
   * /authenticated:
   *   get:
   *     tags:
   *       - auth
   *     security:
   *       - Bearer: []
   *       - OAuth2:
   *         - openid
   *         - profile
   *         - email
   *         - org.cilogon.userinfo
   *         - offline_access
   *     description: |
   *                  ### Authenticated
   *                  Test if user is authenticated
   *     responses:
   *       200:
   *         description: |
   *                      Returns true if authenticated
   */
  app.get('/authenticated', auth, async c => {
    log.debug('is authenticated');
    return c.json({ authenticated: true });
  });

  /**
   * @openapi
   * /logout:
   *   get:
   *     tags:
   *       - auth
   *     description: |
   *                  ### Logout
   *                  Logs out current user session
   *     security:
   *       - Bearer: []
   *       - OAuth2:
   *         - openid
   *         - profile
   *         - email
   *         - org.cilogon.userinfo
   *         - offline_access
   */
  app.get('/logout', bearerAuth({
    async verifyToken(token, c) {
      const count = await Session.destroy({ where: { token } });
      return count > 0;
    }
  }), async c => {
    return c.json({}, 204);
  });

  const factory = createFactory();
  const streamHandlers = factory.createHandlers((c, next) => {
    const { id, path } = c.req.query();
    if (id) {
      let newLoc = basePath + '/object/' + encodeURIComponent(id);
      if (path) newLoc = newLoc + '/' + path;
      else newLoc += '?meta=all';
      return c.redirect(newLoc, 301);
    } else {
      return c.json({ message: 'id parameter value is required' }, 400);
    }
  });


  /**
   * @openapi
   * /stream:
   *   get:
   *     tags:
   *       - object
   *     description: |
   *                  ### Stream File
   *                  Streams file with bearer token
   *                  if path is not included return the ro-crate with parts resolved.
   *                  Same as /object/open but /stream requires the Bearer Token and object/open the browser session
   *     security:
   *       - Bearer: []
   *       - OAuth2:
   *         - openid
   *         - profile
   *         - email
   *         - org.cilogon.userinfo
   *         - offline_access
   *     parameters:
   *       - in: query
   *         name: id
   *         required: true
   *       - in: query
   *         name: path
   *     responses:
   *       '200':
   *         description: |
   *                      Streams file requested
   *                      Example:
   *                      Stream the file of coooee with path data/1-215-plain.txt
   *                      /api/object/open?id=arcp://name,corpus-of-oz-early-english&path=data/1-215-plain.txt
   */
  app.get('/stream', ...streamHandlers);

  app.route('/auth', setupAuthRoutes({ configuration, auth }));
  app.route('/oauth', setupOauthRoutes({ configuration }));
  const appObject = setupObjectRoutes({ configuration, repository, softAuth, streamHandlers, authorize });
  app.route('/object', appObject);
  app.route('/objects', appObject);
  app.route('/user', setupUserRoutes({ configuration, auth }));
  app.route('/search', setupSearchRoutes({ configuration, softAuth }));

  //set true if you want to expose indexing via rest api
  //TODO: Add security
  if (configuration.api.admin?.indexRoutes) {
    app.route('/admin', setupAdminRoutes({ configuration, repository }));
  }

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    } else {
      log.error(err.stack);
      return c.json({ error: err.message }, 500);
    }
  });

  /**
   * @openapi
   * /status:
   *   get:
   *     tags:
   *       - general
   *     description: |
   *                  ### Status
   *                  Returns status of repository and indexers
   *                  - repository: ocfl version and error
   *                  - structuralIndex: isIndexed, isIndexing, isDeleting, objects, error
   *                  - searchIndex: isIndexed, isIndexing, isDeleting, objects, error
   *     responses:
   *       '200':
   *         description: |
   *                      Status of repository and indexers
   *                      - repository: ocfl version and error
   *                      - structuralIndex: isIndexed, isIndexing, isDeleting, objects, error
   *                      - searchIndex: isIndexed, isIndexing, isDeleting, objects, error
   *       '400':
   *         description: |
   *                      Returns error message if any
   *       '500':
   *         description: |
   *                      Returns error message if any
   *                      
   */
  app.get('/status', async c => {
    let structural = {};
    let search = {};
    try {
      structural = await getState('structural');
    }
    catch (e) {
      log.error(e);
      structural['error'] = 'Error checking structural indexer';
    }
    try {
      search = await getState('search');
    } catch (e) {
      log.error(e);
      search['error'] = 'Error checking search indexer';
    }
    const repo = {};
    try {
      await repository.load();
      repo['ocflVersion'] = repository?.ocflVersion;
    } catch (e) {
      log.error(e);
      repo['error'] = e.message;
    }
    return c.json({
      checkedOn: new Date(),
      repository: {
        ocflVersion: repo?.ocflVersion,
        error: repo?.error
      },
      structuralIndex: {
        isIndexed: structural?.isIndexed,
        isIndexing: structural?.isIndexing,
        isDeleting: structural?.isDeleting,
        objects: structural?.count,
        error: structural?.error
      },
      searchIndex: {
        items: search?.count,
        error: search?.error,
      }
    });
  });

  return app;
}

