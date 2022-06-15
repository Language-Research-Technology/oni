import {getLogger} from "../../services";
import {elasticBootstrap, elasticIndex, elasticInit} from "../../indexer/elastic";
import {bootstrap} from "../../services/bootstrap";

const log = getLogger();

export function setupAdminRoutes({server, configuration, repository}) {

  server.get("/admin/info", async (req, res, next) => {

  });

  /**
   * @openapi
   * /:
   *   get:
   *     description: Runs elastic indexer
   *     responses:
   *       200:
   *         description: Returns a message that it has started indexing.
   */
  server.get("/admin/elastic/index", async (req, res, next) => {
    try {
      log.debug('running elastic indexer');
      res.send({message: 'Started: Elastic indexer'});
      await elasticInit({configuration});
      await elasticBootstrap({configuration});
      await elasticIndex({configuration, repository});
    } catch (e) {
      log.error(e);
      res.status(500);
      res.send({error: 'Error debugging index', message: e.message});
    }
  });

  /**
   * @openapi
   * /:
   *   get:
   *     description: Runs structural indexer
   *     responses:
   *       200:
   *         description: Returns a message that it has finished indexing.
   */
  server.get("/admin/database/index", async (req, res, next) => {
    try {
      log.debug('running database indexer');
      await bootstrap({configuration});
      res.send({message: 'done: database indexer'});
    } catch (e) {
      log.error(e);
      res.status(500);
      res.send({error: 'Error database index', message: e.message})
    }
  });
}
