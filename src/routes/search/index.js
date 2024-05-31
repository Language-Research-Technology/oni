import { Hono } from 'hono';
import { getIndexer } from '#src/services/indexer.js';
import { getLogger } from '../../services/logger.js';

//import { routeBrowse } from "../../middleware/auth";
import { filterResults } from "../../services/elastic.js";

const log = getLogger();

export function setupSearchRoutes({ configuration, softAuth }) {
  /**@type {import('#src/indexer/search.js').SearchIndexer}*/
  const searchIndexer = getIndexer('search');
  async function search({ index, searchBody }) {
    return searchIndexer.search({ index, searchBody });
  }
  const app = new Hono({ strict: false });
  app.use(softAuth);

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
  app.get('/fields/:index', async ({req, json, get}, next) => {
    try {
      let user = get('user');
      let searchBody = {};
      let {index} = req.param();
      let results;
      if (req.query['field'] && req.query['value']) {
        const field = req.query['field'].trim();
        searchBody.query = { match: {} };
        searchBody.query['match'][field] = decodeURIComponent(req.query['value']);
        results = await search({ index, searchBody });
        log.debug(`Total: ${results?.hits?.total?.value}`);
      }
      const userId = user?.id;
      const filtered = await filterResults({ userId, results, configuration });
      return json(filtered);
    } catch (e) {
      log.error(e);
      return json({ error: 'Error searching index', message: e.message }, 500);
    }
  });

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
  app.post('/index/:index', async ({req, json, get}, next) => {
    try {
      let user = get('user');
      const userId = user?.id;
      let {index} = req.param();
      let searchBody = await req.json();
      // filter object based on access?
      
      log.silly(JSON.stringify(searchBody));
      let results = await search({ index, searchBody });
      if(results) {
        const filtered = await filterResults({ userId, results, configuration });
        return json(filtered);
      } else {
        return json({});
      }
    } catch (e) {
      log.error(e);
      return json({ error: 'Error searching index', message: e.message }, 500);
    }
  });

  return app;
}
