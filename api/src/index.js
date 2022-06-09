import assert from "assert";

require('regenerator-runtime');
import restify from 'restify';
import models from './models';
import {loadConfiguration, getLogger} from './services/index';
import {setupRoutes} from './routes';
import {bootstrap} from './services/bootstrap';
import {elasticInit, elasticBootstrap, elasticIndex} from './indexer/elastic';
import {ocfltools} from "oni-ocfl";

import corsMiddleware from 'restify-cors-middleware2';

const log = getLogger();
const server = restify.createServer();

// DEVELOPER NOTE
//
//  Do not import fetch anywhere in your code. Use global.fetch
//   instead.
//
//  This way, jest fetch mock will override fetch when you need it to.
global.fetch = require('node-fetch');
let configuration;
let repository;

(async () => {
  try {
    configuration = await loadConfiguration();
  } catch (error) {
    console.error(error);
    console.error("configuration.json error found - stopping now");
    process.exit();
  }
  await models.sequelize.sync();

  const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: ["*"],
    allowHeaders: [
      "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization",
    ],
    exposeHeaders: [
      "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization",
    ],
  });
  server.pre(cors.preflight);
  server.use(cors.actual);
  if (process.env.NODE_ENV === "development") {
    server.use((req, res, next) => {
      log.debug(`${req.route.method}: ${req.route.path}`);
      return next();
    });
  }
  server.use(restify.plugins.dateParser());
  server.use(restify.plugins.queryParser());
  server.use(restify.plugins.jsonp());
  server.use(restify.plugins.gzipResponse());
  server.use(
    restify.plugins.bodyParser({
      params: true,
      maxBodySize: 0,
      mapParams: true,
      mapFiles: false,
      overrideParams: false,
      multiples: true,
      hash: "sha1",
      rejectUnknown: true,
      requestBodyOnGet: false,
      reviver: undefined,
      maxFieldsSize: 2 * 1024 * 1024,
    })
  );

  if (configuration['api']['bootstrap']) {
    await bootstrap({configuration});
  }

  const ocfl = configuration.api.ocfl;
  const repository = await ocfltools.connectRepo({ocflRoot: ocfl.ocflPath, ocflScratch: ocfl.ocflScratch});
  assert(await repository.isRepository(), 'Aborting: Bad OCFL repository');

  await elasticInit({configuration});
  if (configuration['api']['elastic']?.bootstrap) {
    await elasticBootstrap({configuration});
    await elasticIndex({configuration, repository});
  }

  setupRoutes({server, configuration, repository});

  server.listen("8080", function () {
    console.log("ready on %s", server.url);
  });
})();
