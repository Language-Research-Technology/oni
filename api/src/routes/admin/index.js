import {getLogger, routeUser} from "../../services";
import {elasticBootstrap, elasticIndex, elasticInit} from "../../indexer/elastic";
import {bootstrap} from "../../services/bootstrap";
import {routeBasicBearer} from "../../middleware/auth";

const log = getLogger();

export function setupAdminRoutes({server, configuration, repository}) {

  server.get("/admin/info", async (req, res, next) => {

  });

  /**
   * @openapi
   * /admin/elastic/index:
   *   get:
   *     description: Runs elastic indexer
   *     security:
   *       - Bearer: []
   *     responses:
   *       '200':
   *         description: |
   *           - Enter the token with the `Bearer: ` prefix, e.g. "Bearer abcde12345".
   *           - Returns a message that it has started indexing.
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
   *     description: Runs structural indexer
   *     security:
   *       - Bearer: []
   *     responses:
   *       200:
   *         description: |
   *           - Enter the token with the `Bearer: ` prefix, e.g. "Bearer abcde12345".
   *           - Returns a message that it has started indexing.
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
