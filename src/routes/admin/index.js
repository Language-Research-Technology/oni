import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';

import { getLogger } from "../../services/logger.js";
import { createIndex, getState, deleteIndex } from '#src/services/indexer.js';
import { conflict, internal, notFound } from '#src/helpers/responses.js';

const log = getLogger();
const elastic = {};

export function setupAdminRoutes({ configuration, repository }) {

  const token = configuration.api?.tokens?.admin;
  const app = new Hono({ strict: false });

  app.use(bearerAuth({ token }));

  /**
   * @openapi
   * /admin/index/{type}:
   *   get:
   *     tags:
   *       - general
   *     description: Runs indexer of the specified type, used only with the admin api key
   *     security:
   *       - Bearer: []
   *     responses:
   *       '202':
   *         description: |
   *                      - Returns a message that it has started indexing.
   */
  app.post("/index/:type/:crateId?", async ({ req, json }) => {
    const { type, crateId } = req.param();
    const force = req.query('force') != null;
    const state = await getState(type);
    if (state) {
      try {
        if (state.isIndexed && !crateId && !force) {
          return conflict('Index already exists');
        } else if (state.isDeleting) {
          return conflict('Deleting is in progress');
        }
        if (!state.isIndexing) {
          log.debug(`running [${type}] indexer`);
          createIndex(type, crateId, force);
        }
        return json(state, 202);
      } catch (e) {
        log.error(e);
        return internal({ message: `Error indexing [${type}] ${e.message}`, stack: e.stack });
      }
    } else {
      return notFound('Indexer does not exist');
    }
  });

  app.get("/index/:type", async ({ req, json }) => {
    const { type } = req.param();
    const state = await getState(type);
    if (state) {
      return json(state, state.isIndexed ? 200 : 404);
    } else {
      return notFound('Indexer does not exist');
    }
  });

  app.delete("/index/:type/:crateId?", async ({ req, json }) => {
    const { type, crateId } = req.param();
    const state = await getState(type);
    if (state) {
      if (state.isIndexing) {
        return conflict('Indexing is in progress');
      }
      if (!state.isDeleting) {
        deleteIndex(type, crateId);
      }
      return json(state, 202);
    } else {
      return notFound('Indexer does not exist');
    }
  });

    /**
   * @openapi
   * /admin/configuration:
   *   get:
   *     tags:
   *       - general
   *     description: |
   *                  ### Configuration
   *                  Configuration
   *     responses:
   *       200:
   *         description: Returns all configuration
   */
    app.get('/configuration', ({ json }) => {  
      return json(configuration);
    });

  return app;
}
