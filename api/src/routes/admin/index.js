import {getLogger, routeUser} from "../../services";
import {elasticBootstrap, elasticIndex, elasticInit} from "../../indexer/elastic";
import {bootstrap} from "../../services/bootstrap";
import {routeBasicBearer} from "../../middleware/auth";

const log = getLogger();

export function setupAdminRoutes({server, configuration, repository}) {

  server.get("/admin/info", async (req, res, next) => {
    res.status(200);
    res.json({});
  });

  /**
   * @openapi
   * /admin/elastic/index:
   *   get:
   *     description: |
   *                  ### Admin Elastic Index
   *                  Runs elastic indexer used only with the admin api key
   *     security:
   *       - Bearer: []
   *     responses:
   *       '200':
   *         description: |
   *                      - Returns a message that it has started indexing.
   */
  server.get("/admin/elastic/index", routeBasicBearer(async (req, res, next) => {
      try {
        log.debug('running elastic indexer');
        res.json({message: 'Started: Elastic indexer'});
        res.status(200);
        await elasticInit({configuration});
        await elasticBootstrap({configuration});
        await elasticIndex({configuration, repository});
        next();
      } catch (e) {
        log.error(e);
        res.status(500);
        res.send({error: 'Error debugging index', message: e.message});
      }
    })
  );

  /**
   * @openapi
   * /admin/database/index:
   *   get:
   *     description: |
   *                  ### Admin Database Index
   *                  Runs structural indexer used only with the admin api key
   *     security:
   *       - Bearer: []
   *     responses:
   *       200:
   *         description: |
   *                      - Returns a message that it has started indexing.
   */
  server.get("/admin/database/index", routeBasicBearer(async (req, res, next) => {
      try {
        log.debug('running database indexer');
        res.json({message: 'Started: database indexer'});
        res.status(200);
        await bootstrap({configuration});
        next();
      } catch (e) {
        log.error(e);
        res.status(500);
        res.send({error: 'Error database index', message: e.message})
      }
    })
  );
}
