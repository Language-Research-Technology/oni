import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';

import { getLogger } from "../../services/logger.js";
import { deleteRecords } from '#src/controllers/record.js';
import { indexRepository } from '#src/services/indexer.js';
import { Record } from '#src/models/record.js';

const log = getLogger();
const elastic = {};

export function setupAdminRoutes({ configuration, repository }) {

  const token = configuration.api?.tokens?.admin;
  const app = new Hono({ strict: false });
  const state = { structural: '', search: '' };

  app.get("/info", (c) => c.json({}));

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
  app.post("/index/:type", ({ req, json, notFound }) => {
    const { type } = req.param();
    if (type in state) {
      try {
        if (state[type] === 'deleting') {
          return json({ state: state[type] }, 409);
        }
        if (state[type] !== 'indexing') {
          log.debug(`running [${type}] indexer`);
          state[type] = 'indexing';
          indexRepository({
            types: [type],
            repository,
            defaultLicense: configuration.api.license?.default?.['@id'],
            skipByMatch: configuration.api.skipByMatch
          }).catch(e => log.error(e)).then((counts) => state[type] = counts[type] ? 'indexed' : '');
        }
        return json({ state: state[type] }, 202);
      } catch (e) {
        log.error(e);
        return json({ error: `Error indexing [${type}]`, message: e.message }, 500);
      }
    } else {
      return notFound();
    }
  });

  app.get("/index/:type", async ({ req, json, notFound }) => {
    const { type } = req.param();
    if (!state[type] || state[type] === 'indexed') {
      let count = 0;
      if (type === 'structural') {
        count = await Record.count();
      }
      state[type] = count ? 'indexed' : '';
    }
    if (state[type]) {
      return json({ state: state[type] });
    } else {
      return notFound();
    }
  });

  app.delete("/index/:type", ({ req, json, notFound }) => {
    const { type } = req.param();
    if (state[type]) {
      if (state[type] === 'indexing') {
        return json({ state: state[type] }, 409);
      }
      if (state[type] !== 'deleting') {
        state[type] = 'deleting';
        if (type === 'structural') {
          deleteRecords().catch(e => e).then(() => state[type] = '');
        }
      }
      return json({ state: state[type] }, 202);
    } else {
      return notFound();
    }
  });

  return app;
}
