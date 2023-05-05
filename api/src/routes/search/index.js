import { search } from '../../indexer/elastic';
import { getLogger } from '../../services';
import { getUser } from "../../controllers/user";
import { routeBrowse } from "../../middleware/auth";
import { filterResults } from "../../services/elastic";


const log = getLogger();

export function setupSearchRoutes({ server, configuration }) {

/**
  * @openapi
  * /search/fields/{index}:
  *   get:
  *     tags:
  *       - search
  *     description: |
  *                  ### Find an elastic object
  *     security:
  *       - Bearer: []
  *       - OAuth2:
  *         - openid
  *         - profile
  *         - email
  *         - org.cilogon.userinfo
  *         - offline_access
  *     parameters:
  *       - in: path
  *         name: index
  *         description: Elastic index name
  *         required: true
  *         schema:
  *           type: string
  *       - in: query
  *         name: field
  *         description: Elastic field
  *         required: true
  *         schema:
  *           type: string
  *       - in: query
  *         name: value
  *         description: Elastic value (Should be url encoded)
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: |
  *                      Returns a search result based on a field and a value
  *                      - Example
  *                          - /search/fields/items?field=license.@id&value=https%3A%2F%2Fwww.ldaca.edu.au%2Flicenses%2Fltcsause%2Ftranscripts%2Fv1%2F
  */
  server.get('/search/fields/:index', routeBrowse(async (req, res, next) => {
    try {
      let user = {};
      if (req?.session?.user) {
        user = await getUser({ where: { id: req.session.user.id } });
      }
      let searchBody = {};
      let index = req.params?.index;
      let results;
      if (req.query['field'] && req.query['value']) {
        const field = req.query['field'].trim();
        searchBody.query = { match: {} };
        searchBody.query['match'][field] = decodeURIComponent(req.query['value']);
        results = await search({ configuration, index, searchBody });
        log.debug(`Total: ${results?.hits?.total?.value}`);
      }
      const userId = user?.id;
      const filtered = await filterResults({ userId, results, configuration });
      res.send(filtered);
      next();
    } catch (e) {
      console.log(e);
      res.status(500);
      res.send({ error: 'Error searching index', message: e.message });
      next();
    }
  })
  );

 /**
   * @openapi
   * /search/index/{index}:
   *   post:
   *     tags:
   *       - search
   *     description: |
   *                  ### Search Index
   *                  Searches the `index` provided in path
   *     security:
   *       - Bearer: []
   *       - OAuth2:
   *         - openid
   *         - profile
   *         - email
   *         - org.cilogon.userinfo
   *         - offline_access
   *     parameters:
   *       - in: path
   *         name: index
   *         description: Elastic index name
   *         example: 'items'
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:    
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *           example:
   *             { "query": {"bool":{"must":{"terms":{"@type.keyword":["RepositoryCollection"]}}}} }
   *     responses:
   *       '200':
   *         description: |
   *                      Search results either unique or a list of results
   *                      - Example
   *                        - Search in index items with filters: @type=Dataset,RepositoryCollection, _isTopLevel=true
   *                        - /api/search/index-post/items
   *                        - Request body: 
   *                           ```json
   *                           { "query": {"bool":{"must":{"terms":{"@type.keyword":["RepositoryCollection"]}}}} }
   *                           ```
   *                      - Example
   *                        - Search in index items and request a Scroll Id with filters memberOf cooee that conformsTo Objects
   *                        - /api/search/items?withScroll=true
   *                        - Request body:
   *                           ```json
   *                           { "query": {"bool":{"must":[{"terms":{"_memberOf.@id.keyword":["arcp://name,cooee-corpus/corpus/root"]}},{"terms":{"conformsTo.@id.keyword":["https://purl.archive.org/language-data-commons/profile#Object"]}}]}} }
   *                           ```
   *                      - Example
   *                        - Search in index vocabs the exact match of the citation vocab
   *                        - /api/search/index-post/vocabs
   *                        - Request body: 
   *                           ```json
   *                           { "query": {"match":{"_id":"schema:identifier"}} }
   *                           ```
   *                      - Example
   *                        - Search in index items the files that are of type csv
   *                        - /api/search/items?withScroll=true
   *                        - Request body: 
   *                           ```json
   *                           { "query":  {"bool":{"must":{"terms":{"encodingFormat.@value.keyword":["text/csv"]}}}} }
   *                           ```
   *                      - Example
   *                        - Search for the object with id data/1-215-plain.txt in the cooee corpus
   *                        - /api/search/items
   *                        - Request body: 
   *                           ```json
   *                           { "query": {"dis_max":{"queries":[{"match":{"@id":"data/1-215-plain.txt"}},{"match":{"_crateId":"arcp://name,cooee-corpus/corpus/root"}}]}} }
   *                           ```
   */
  //TODO: change the endpoint path to just /search/index/:items
  server.post('/search/index/:index', routeBrowse(async (req, res, next) => {
    try {
      let user = {};
      if (req?.session?.user) {
        user = await getUser({ where: { id: req.session.user.id } });
      }
      const userId = user?.id;
      let index = req.params?.index;
      let searchBody = req.body;
      log.silly(JSON.stringify(searchBody));
      let results = await search({ configuration, index, searchBody });
      if(results) {
        const filtered = await filterResults({ userId, results, configuration });
        res.send(filtered);
      } else {
       res.send({});
      }
      next();
    } catch (e) {
      log.error(e);
      res.status(500);
      res.send({ error: 'Error searching index', message: e.message });
      next();
    }
  })
  );

}
