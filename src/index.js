/**
 * @fileoverview The main entry point of the app. Create the routing app (Hono) and connect it with Node HTTP server
 */
import { serve } from '@hono/node-server';
import ocfl from "@ocfl/ocfl-fs";
import { loadConfiguration } from './services/configuration.js';
import { getLogger } from './services/logger.js';
import { sequelize } from './models/sequelize.js';
import { indexRepository } from './services/indexer.js';
//import { elasticInit, elasticBootstrap, elasticIndex } from './indexer/elastic';
import { setupRoutes } from './routes/index.js';
import { elasticInit } from './indexer/elastic.js';
const log = getLogger();

let configuration;
try {
  configuration = await loadConfiguration();
} catch (error) {
  log.error("[configuration.json] Error found - stopping now");
  log.error(error);
  process.exit(1);
}

await sequelize.sync();

const ocflConf = configuration.api.ocfl;
const repository = ocfl.storage({
  root: ocflConf.ocflPath,
  workspace: ocflConf.ocflScratch,
  ocflVersion: '1.1',
  layout: {
    extensionName: '000N-path-direct-storage-layout'
  }
});
try {
  await repository.load();
} catch (e) {
  log.error('=======================================');
  log.error('Repository Error please check your OCFL');
  log.error(e.message);
  log.error(JSON.stringify(ocflConf));
  log.error('=======================================');
  process.exit(1);
}

const types = [
  ... configuration.api.bootstrap ? ['structural'] : [],
  ... configuration.api.elastic.bootstrap ? ['search'] : [],
];

await elasticInit({ configuration });
await indexRepository({ types, repository, 
  skipByMatch: configuration.api.skipByMatch,
  defaultLicense: configuration.api.license?.default?.['@id']
});

const app = setupRoutes({ configuration, repository });

const server = serve({
  fetch: app.fetch,
  port: process.env.ONI_PORT || 8080
}, ({ address, port }) => {
  log.info(`Oni server listening at http://${address}:${port}`);

});

function shutdown() {
  console.log("Graceful shutdown");
  // add more clean up code here
  server.close();
  sequelize.close();
}

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(s => process.on(s, shutdown));
