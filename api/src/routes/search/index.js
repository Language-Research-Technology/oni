import { search, scroll, clearScroll } from '../../indexer/elastic';
import { getLogger, loadConfiguration, routeUser } from '../../services';
import { first, pullAt } from 'lodash';
import { boolQuery, aggsQueries } from "../../controllers/elastic";
import { getUser } from "../../controllers/user";
import { routeBrowse } from "../../middleware/auth";
import { filterResults } from "../../services/elastic";
import { licensesWithoutAccess } from "../../services/license";
import {
  boolLicenseQuery,
  disMaxLicenseQuery,
  matchLicenseQuery,
  noQueryLicenseQuery,
  matchAllLicenseQuery, boolFilterQuery, boolFilterQuery2
} from "../../controllers/elasticQueries";

const log = getLogger();

export function setupSearchRoutes({ server, configuration }) {
  /**
   * @openapi
   * /search/{index}:
   *   get:
   *     tags:
   *       - search
   *     description: |
   *                  ### Search Index (This endpoint is disabled)
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
   *       - in: query
   *         name: aggs
   *         description: override default aggregations required
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
  // server.get("/search/:index", routeBrowse(async (req, res, next) => {
  //   try {
  //     log.debug('search/index');
  //     let user = {};
  //     if (req?.session?.user) {
  //       user = await getUser({ where: { id: req.session.user.id } });
  //     }
  //     let exactMatch = false;
  //     let { aggregations, highlightFields, fields } = configuration['api']['elastic'];
  //     if (req.query['aggs']) {
  //       aggregations = decodeURIComponent(req.query['aggs']);
  //       aggregations = JSON.parse(aggregations);
  //     }
  //     let searchBody = {};
  //     let index = req.params?.index;
  //     let results;
  //     if (req.query['scroll']) {
  //       try {
  //         results = await scroll({ configuration, scrollId: req.query['scroll'] });
  //       } catch (e) {
  //         res.status(401);
  //         res.send({ error_type: 'scroll_error', error: 'Error scrolling', message: e.message });
  //         return next(false);
  //       }
  //     } else if (req.query['id']) {
  //       exactMatch = true;
  //       const id = req.query['id'].trim();
  //       const _crateId = req.query['_crateId'].trim();
  //       searchBody.query = {
  //         dis_max: {
  //           queries: [
  //             { match: { '@id': decodeURIComponent(id) } },
  //             { match: { '_crateId': decodeURIComponent(_crateId) } }
  //           ]
  //         }
  //       };
  //       results = await search({ configuration, index, searchBody });
  //       log.debug(`Total: ${results?.hits?.total?.value}`);
  //     } else if (req.query['_id']) {
  //       exactMatch = true;
  //       if (req.query['_id']) {
  //         const id = req.query['_id'].trim();
  //         searchBody.query = {
  //           match: {
  //             _id: decodeURIComponent(id)
  //           }
  //         }
  //       }
  //       if (req.query['_id'] && req.query['term']) {
  //         const id = req.query['_id'].trim();
  //         searchBody.query = {
  //           term: {
  //             _id: [decodeURIComponent(id)]
  //           }
  //         }
  //       }
  //       results = await search({ configuration, index, searchBody });
  //       log.debug(`Total: ${results?.hits?.total?.value}`);
  //     } else {
  //       const searchQuery = req.query?.multi?.trim() || '';
  //       console.log('searchQuery')
  //       console.log(searchQuery)
  //       let filters = [];
  //       if (req.query.filters) {
  //         filters = decodeURIComponent(req.query.filters);
  //         filters = JSON.parse(filters);
  //       }
  //       searchBody = boolQuery({ searchQuery, fields, filters, highlightFields });
  //       searchBody.aggs = aggsQueries({ aggregations });
  //       //log.debug(JSON.stringify({aggs: searchBody}));
  //       const needsScroll = req.query.withScroll;
  //       results = await search({ configuration, index, searchBody, explain: false, needsScroll });
  //     }
  //     const userId = user?.id;
  //     let payload = await filterResults({ userId, results, configuration });
  //     if (exactMatch) {
  //       payload = first(payload?.hits?.hits) || {};
  //     }
  //     res.send(payload);
  //     return next();
  //   } catch (e) {
  //     console.log(e);
  //     res.status(500);
  //     res.send({ error: 'Error searching index', message: e.message });
  //     return next();
  //   }
  // })
  // );

  /**
 * @openapi
 * /search/scroll:
 *   get:
 *     tags:
 *       - search
 *     description: |
 *                  ### Get search usign scroll id
 *                  gets search results with current scroll Id
 *     security:
 *       - Bearer: []
 *       - OAuth2:
 *         - openid
 *         - profile
 *         - email
 *         - org.cilogon.userinfo
 *         - offline_access
 *     parameters:
 *       - in: query
 *         name: id
 *         description: Elastic scroll id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a search result with the scroll id sent
 */
  server.get("/search/scroll", routeBrowse(async (req, res, next) => {
    try {
      let user = {};
      if (req?.session?.user) {
        user = await getUser({ where: { id: req.session.user.id } });
      }
      const scrollId = req.query['id'];
      const results = await scroll({ configuration, scrollId });
      const userId = user?.id;
      // if we use pre-filtering index this will not be required
      let payload = await filterResults({ userId, results, configuration });
      res.send(payload)
      return next();
    } catch (e) {
      log.error('/search/scroll');
      log.error(JSON.stringify(e));
      res.status(500);
      res.send({ error_type: 'scroll_error', error: 'Error scrolling', message: e.message });
      return next(false);
    }
  })
  );

  /**
   * @openapi
   * /search/scroll:
   *   delete:
   *     tags:
   *       - search
   *     description: |
   *                  ### Del search scroll
   *                  Deletes scroll Id
   *     security:
   *       - Bearer: []
   *       - OAuth2:
   *         - openid
   *         - profile
   *         - email
   *         - org.cilogon.userinfo
   *         - offline_access
   *     parameters:
   *       - in: query
   *         name: id
   *         description: scroll id  
   *     responses:
   *       200:
   *         description: Deletes scroll id.
   */
  server.del("/search/scroll", routeBrowse(async (req, res, next) => {
    try {
      log.debug('search/scroll');
      let scrollId = req.query['id'];
      const results = await clearScroll({ scrollId });
      res.status(202);
      res.send({ results });
      next();
    } catch (e) {
      res.status(500);
      res.send({ error: 'Error deleting scroll', message: e.message });
      next();
    }
  })
  );

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

  // server.post('/search/index-pre/:index', routeBrowse(async (req, res, next) => {
  //   try {
  //     let user = {};
  //     if (req?.session?.user) {
  //       user = await getUser({ where: { id: req.session.user.id } });
  //     }
  //     const userId = user?.id;
  //     let index = req.params?.index;
  //     let searchBody = req.body;
  //     if (searchBody) {
  //       //TODO: here is another step for getting the licenses
  //       let licenses = await licensesWithoutAccess({ userId, configuration });
  //       console.log('filtered:');
  //       //searchBody = boolFilterQuery({searchBody, licenses, clause: 'must_not'});

  //       if (!searchBody.hasOwnProperty('query')) {
  //         searchBody = noQueryLicenseQuery({ searchBody, licenses, clause: 'must_not' });
  //       } else if (searchBody.query.hasOwnProperty('bool')) {
  //         searchBody = boolLicenseQuery({ searchBody, licenses, clause: 'must_not' });
  //       } else if (searchBody.query.hasOwnProperty('dis_max')) {
  //         searchBody = disMaxLicenseQuery({ searchBody, licenses, clause: 'must_not' });
  //       } else if (searchBody.query.hasOwnProperty('match')) {
  //         searchBody = matchLicenseQuery({ searchBody, licenses, clause: 'must_not' });
  //       } else if (searchBody.query.hasOwnProperty('match_all')) {
  //         searchBody = matchAllLicenseQuery({ searchBody, licenses, clause: 'must_not' });
  //       } else {
  //         searchBody = false;
  //       }
  //       if (searchBody) {
  //         console.log(JSON.stringify(searchBody));
  //         const needsScroll = req.query.withScroll;
  //         let results = await search({
  //           configuration,
  //           index,
  //           searchBody,
  //           filterPath: '-hits.hits._source._text', // Append more fields by comma and omit fields with minus
  //           needsScroll
  //         });
  //         res.send(results);
  //         next();
  //       } else {
  //         res.status(500);
  //         const keyNames = Object.keys(searchBody.query);
  //         res.send({ error: `Query ${keyNames.toString()} not supported` });
  //         next();
  //       }
  //     }
  //   } catch (e) {
  //     console.log(e);
  //     res.status(500);
  //     res.send({ error: 'Error searching index', message: e.message });
  //     next();
  //   }
  // })
  // );

 /**
   * @openapi
   * /search/index-post/{index}:
   *   post:
   *     tags:
   *       - search
   *     description: |
   *                  ### Search Index
   *                  Searches the `index` provided in path
   *                  - ### TODO: To be renamed to /search/index/{index} when we decide whether to to post-fitlering or pre-filtering
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
   *       - in: query
   *         name: withScroll
   *         description: request a scroll id for pagination
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
  server.post('/search/index-post/:index', routeBrowse(async (req, res, next) => {
    try {
      let user = {};
      if (req?.session?.user) {
        user = await getUser({ where: { id: req.session.user.id } });
      }
      const userId = user?.id;
      let index = req.params?.index;
      let searchBody = req.body;
      const needsScroll = req.query.withScroll;
      console.log(JSON.stringify(searchBody));
      let results = await search({ configuration, index, searchBody, needsScroll });
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

}
