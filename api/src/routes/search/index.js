import { search } from '../../indexer/elastic';
import { getLogger } from '../../services';

const log = getLogger();

export function setupSearchRoutes({ server, configuration }) {
  server.get("/search/:index", async (req, res, next) => {
    try {
      //TODO: Is this where we use Marco's suggestion of building queries?
      // https://elastic-builder.js.org/
      let query;
      let index = req.params?.index;
      //TODO: How do we make this more dynamic
      //Do we send all queries straight to api?
      log.debug(req.query.name)
      if (req.query.name) {
        query = { match: { name: req.query.name.trim() } };
      } else {
        query = { match_all: {} };
      }
      const hits = await search({ configuration, index, query });

      res.send(hits);
    } catch (e) {
      console.log(e);
      res.send({ error: 'Error searching index', message: e.message }).status(500);
    }

  });
}
