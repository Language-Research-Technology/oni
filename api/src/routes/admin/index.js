import {getLogger} from "../../services";
import {elasticBootstrap, elasticIndex, elasticInit} from "../../indexer/elastic";
import {bootstrap} from "../../services/bootstrap";

const log = getLogger();

export function setupAdminRoutes({server, configuration, repository}) {

  server.get("/admin/info", async (req, res, next) => {

  });

  server.get("/admin/elastic/index", async (req, res, next) => {
    try {
      log.debug('running elastic indexer');
      await elasticInit({configuration});
      await elasticBootstrap({configuration});
      await elasticIndex({configuration, repository});
      res.send({message: 'Done: Elastic indexer'});
    } catch (e) {
      log.error(e);
      res.send({error: 'Error debugging index', message: e.message}).status(500);
    }
  });
  server.get("/admin/database/index", async (req, res, next) => {
    try {
      log.debug('running database indexer');
      await bootstrap({configuration});
      res.send({message: 'done: database indexer'});
    } catch (e) {
      log.error(e);
      res.send({error: 'Error database index', message: e.message}).status(500);
    }
  });
}
