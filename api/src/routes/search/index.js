import {search, scroll, clearScroll} from '../../indexer/elastic';
import {getLogger, loadConfiguration, routeUser} from '../../services';
import {first, pullAt} from 'lodash';
import {boolQuery, aggsQueries} from "../../controllers/elastic";
import {getUser} from "../../controllers/user";
import {routeBrowse} from "../../middleware/auth";
import {filterResults} from "../../services/elastic";

const log = getLogger();

export function setupSearchRoutes({server, configuration}) {
  /**
   * @openapi
   * /search/{index}:
   *   get:
   *     description: |
   *                  ### Search Index
   *                  Searches Index provided
   *     security:
   *      - Bearer: []
   *     parameters:
   *       - in: path
   *         name: index
   *         description: Elastic index name
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: id
   *         description: Elastic object id
   *         required: false
   *         schema:
   *           type: string
   *       - in: query
   *         name: _id
   *         description: Exact elastic object id
   *         required: false
   *         schema:
   *           type: string
   *       - in: query
   *         name: _crateId
   *         description: ID of crate in ocfl repository
   *         required: false
   *       - in: query
   *         name: filters
   *         description: json elastic filter
   *         required: false
   *         schema:
   *           type: json
   *       - in: query
   *         name: scroll
   *         description: scroll id for next item results
   *         required: false
   *         schema:
   *          type: string
   *       - in: query
   *         name: withScroll
   *         description: request a scroll id for pagination
   *     responses:
   *       '200':
   *         description: |
   *                      Search results either unique or a list of results
   *                      - Example:
   *                        - Search in index items with filters: @type=Dataset,RepositoryCollection, _isTopLevel=true
   *                        - /api/search/items?filters={"@type":["Dataset","RepositoryCollection"],"_isTopLevel.@value":["true"]}
   *                      - Example:
   *                        - Search in index items and request a Scroll Id with filters memberOf cooee that conformsTo Objects
   *                        - /api/search/items?withScroll=true&filters={"_memberOf.@id":["arcp://name,cooee-corpus/corpus/root"],"conformsTo.@id":["https://purl.archive.org/language-data-commons/profile#Object"]}
   *                      - Example:
   *                        - Search in index vocabs the exact match of the citation vocab
   *                        - /api/search/vocabs?_id=https://purl.archive.org/language-data-commons/terms#citation
   *                      - Example:
   *                        - Search in index items the files that are of type csv
   *                        - /api/search/items?withScroll=true&filters={"@type":["File"],"encodingFormat.@value":["text/csv"]}
   *                      - Example:
   *                        - Search for the object with id data/1-215-plain.txt in the cooee corpus
   *                        - /api/search/items?id=data/1-215-plain.txt&_crateId=arcp://name,cooee-corpus/corpus/root
   */
  //Usability: Do we want users to be authenticated or let users browse without? if so use routeUser
  server.get("/search/:index", routeBrowse(async (req, res, next) => {
      try {
        log.debug('search/index');
        let user = {};
        if (req?.session?.user) {
          user = await getUser({where: {id: req.session.user.id}});
        }
        let exactMatch = false;
        const {aggregations, highlightFields, fields} = configuration['api']['elastic'];
        let searchBody = {};
        let index = req.params?.index;
        let results;
        if (req.query['scroll']) {
          try {
            results = await scroll({configuration, scrollId: req.query['scroll']});
          } catch (e) {
            res.status(401);
            res.send({error_type: 'scroll_error', error: 'Error scrolling', message: e.message});
          }
        } else if (req.query['id']) {
          exactMatch = true;
          const id = req.query['id'].trim();
          const _crateId = req.query['_crateId'].trim();
          searchBody.query = {
            dis_max: {
              queries: [
                {match: {'@id': decodeURIComponent(id)}},
                {match: {'_crateId': decodeURIComponent(_crateId)}}
              ]
            }
          };
          results = await search({configuration, index, searchBody});
          log.debug(`Total: ${results?.hits?.total?.value}`);
        } else if (req.query['_id']) {
          exactMatch = true;
          if (req.query['_id']) {
            const id = req.query['_id'].trim();
            searchBody.query = {
              match: {
                _id: decodeURIComponent(id)
              }
            }
          }
          if (req.query['_id'] && req.query['term']) {
            const id = req.query['_id'].trim();
            searchBody.query = {
              term: {
                _id: [decodeURIComponent(id)]
              }
            }
          }
          results = await search({configuration, index, searchBody});
          log.debug(`Total: ${results?.hits?.total?.value}`);
        } else {
          const searchQuery = req.query?.multi?.trim() || '';
          let filters = [];
          if (req.query.filters) {
            filters = decodeURIComponent(req.query.filters);
            filters = JSON.parse(filters);
          }
          searchBody = boolQuery({searchQuery, fields, filters, highlightFields});
          searchBody.aggs = aggsQueries({aggregations});
          //log.debug(JSON.stringify({aggs: searchBody}));
          const needsScroll = req.query.withScroll;
          results = await search({configuration, index, searchBody, explain: false, needsScroll});
        }
        const userId = user?.id;
        const filtered = await filterResults({userId, results, configuration});
        if (exactMatch) {
          const result = first(filtered?.hits?.hits) || {};
          res.send(result);
        } else {
          res.send(filtered);
        }
        next();
      } catch
        (e) {
        console.log(e);
        res.status(500);
        res.send({error: 'Error searching index', message: e.message});
        next();
      }
    })
  );
  server.get("/search/scroll", routeBrowse(async (req, res, next) => {
  }));
  /**
   * @openapi
   * /:
   *   del:
   *     description: |
   *                  ### Del search scroll
   *                  Deletes scroll Id
   *     parameters:
   *       - scroll
   *     responses:
   *       200:
   *         description: Deletes scroll id.
   */
  server.del("/search/scroll", routeBrowse(async (req, res, next) => {
      try {
        log.debug('search/scroll');
        let scrollId = req.query['id'];
        const results = await clearScroll({scrollId});
        res.status(202);
        res.send({results});
        next();
      } catch (e) {
        res.status(500);
        res.send({error: 'Error deleting scroll', message: e.message});
        next();
      }
    })
  );
}
