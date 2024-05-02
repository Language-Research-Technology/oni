import { resolve, join, basename } from 'node:path/posix';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
import { getLogger } from '../../services/logger.js';
import { getRecord, getFullRecords, getOauthToken, getCrate, getFilePath, getFile } from '../../controllers/record.js';
import { pagination } from '../../middleware/pagination.js';
import { checkIfAuthorized } from '../../services/license.js';
import { forbiddenError, notFoundError } from '../../helpers/errors.js'

const log = getLogger();
const factory = createFactory();

export function setupObjectRoutes({ configuration, repository, softAuth, streamHandlers }) {
  const app = new Hono({ strict: false });

  /**
   * @openapi
   * /object:
   *   get:
   *     tags:
   *       - object
   *     description: |
   *                  ### Object
   *                  Structural search and (limited) discovery end-point. Returns summaries only
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
   *         name: memberOf
   *         type: string
   *         nullable: true
   *         description: Indicates when an object is a member Of another object.
   *       - in: query
   *         name: conformsTo
   *         description: Indicates if an object conforms to a profile URI
   *       - in: query
   *         name: id
   *         description: The ID/crateId of a single record.
   *       - in: query
   *         name: offset
   *         description: The position in the dataset of a particular record.
   *       - in: query
   *         name: limit
   *         description: The limit of the results provided.
   *     responses:
   *       '200':
   *         description: |
   *                      Returns
   *                      - memberOf=id --> Get all the children of id (Not paginated)
   *                        - Example:
   *                        - /object?memberOf=arcp://name,sydney-speaks/corpus/root
   *                      - memberOf=id&conformsTo=Collection/Object --> Get members of an ID that conforms to a collection
   *                        - Example:
   *                        - /object?memberOf=arcp://name,sydney-speaks/corpus/root&conformsTo=https://purl.archive.org/language-data-commons/profile#Object
   *                      - memberOf=null --> (ie top-level) Get ALL objects which are not part of ANY collection
   *                        - Example:
   *                        - /object?memberOf=null
   *                      - memberOf=null&conformsTo=collectionProfileURI --> All TOP level collections
   *                        - Example:
   *                        - /object?memberOf=null&conformsTo=https://purl.archive.org/language-data-commons/profile#Collection
   *                      - id=id --> Get a single record
   *                        - Example:
   *                        - /object?id=arcp://name,sydney-speaks/corpus/root
   *                      - no parameters --> Get all root ConformsTos paginated
   *                        - Example:
   *                        - /object
   */
  app.get("/", pagination(), async (c) => {
    const id = c.req.query('id');
    if (id) {    
      return c.redirect(c.req.path + '/' + encodeURIComponent(id), 301);
    } else {
      const params = {};
      const { memberOf, conformsTo } = c.req.queries();
      params.offset = c.get('offset') ?? 0;
      params.limit = c.get('limit') ?? 10;
      if (memberOf) {
        params.memberOf = memberOf.map(m => m === '' || m.toLowerCase() in { null: 0, undefined: 0 } ? null : m);
      }
      if (conformsTo) {
        params.conformsTo = conformsTo.map(m => m === '' || m.toLowerCase() in { null: 0, undefined: 0 } ? null : m);
      }
      //console.log(params);
      const records = await getFullRecords(params);
      //const records2 = await getRecords(params);
      //console.log(records2);
      const end = Math.min(params.offset + params.limit, records.total);
      c.set('range', { start: params.offset, end, size: records.total });
      //return c.json(records.data);
      return c.json(records);
    }
  });

  /**
   * 
   * @param {string} crateId 
   */
  async function fetchExternal(crateId) {
    // redirect or proxy here
    for (const origin of configuration.api.origins) {
      if (crateId.startsWith(origin.host)) {
        const token = await getOauthToken(origin);
        const url = `${origin.host}/api/v1/oni/object/meta?id=${crateId}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          }
        });
        return response.body;
        // .then(resp => new Promise((resolve, reject) => {
        //   console.log(resp);
        //   resp.body.pipe(res);
        //   res.on('close', () => resolve());
        //   res.on('error', e => { console.log(e); reject() });
        // }));
      }
    }
  }


  /**
   * @openapi
   * /object/meta:
   *   get:
   *     tags:
   *       - object
   *     description: |
   *                  ### Object Meta
   *                  Get an RO-Crate Metadata Document with either IDs translated to api compatible or not
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
   *         description: Object id/crateId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: resolve-parts
   *         description: Get all the sub parts and deliver as a single ro-crate-metadata document
   *       - in: query
   *         name: types
   *         description: Returns the types of an RO-Crate it might have (Not sure if useful)
   *       - in: query
   *         name: noUrid
   *         schema:
   *           type: boolean
   *         description: Don’t replace the IDs in the RO-Crate to be API compatible (repeated for compatibility)
   *       - in: query
   *         name: version
   *         description: Not Implemented
   *       - in: query
   *         name: raw
   *         description: Don’t replace the IDs in the RO-Crate to be API compatible (repeated for compatibility)
   *       - in: query
   *         name: zip
   *         description: Not Implemented
   *     responses:
   *       '200':
   *         description: |
   *                      Returns a single whole RO-Crate metadata document
   *                      - Example:
   *                        - Return a complete ro-crate from storage
   *                        - /api/object/meta?id=arcp://name,corpus-of-oz-early-english&noUrid
   *                      - Example:
   *                        - Return an RO-Crate resolving all parts
   *                        - /api/object/meta?resolve-parts&noUrid&id=arcp://name,sydney-speaks/corpus/root
   *                      - Example:
   *                        - another example of returning an RO-Crate resolving all parts.
   *                        - /api/object/meta?resolve-parts&noUrid&id=arcp://name,sydney-speaks/SYDS/item/8
   *                      - Example:
   *                        - Return an RO-Crate resolving all parts and return each id prefixed with the https endpoint of the object so another machine can fetch all items
   *                        - /api/object/meta?resolve-parts&id=arcp://name,corpus-of-oz-early-english
   *
   */
  app.get('/meta', (c) => {
    const { id, ...q } = c.req.query();
    if (id) {
      if (q['resolve-parts']) {
        q.meta = 'all';
        delete q['resolve-parts'];
      } else {
        q.meta = 'original';
      }
      const newQuery = Object.entries(q).map(([key, value]) => value === undefined ? key : key + '=' + encodeURIComponent(value)).join('&');
      const basePath = resolve(c.req.path, '..', encodeURIComponent(id));
      return c.redirect(basePath + '?' + newQuery, 301);
    } else {
      return c.json({ message: 'id parameter value is required' }, 400);
    }
  });

  /**
   * @openapi
   * /object/meta/versions:
   *   get:
   *     tags:
   *       - object
   *     description: |
   *                  ### Object Metadata Version
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
   *         required: true
   *         schema:
   *           type: string
   *         description: ocfl version id
   *     responses:
   *       '200':
   *         description: |
   *                      Not implemented
   */
  app.get('/meta/versions', async (c) => {
    if (c.req.query('id')) {
      return c.json({ message: 'meta version: Not implemented' }, 400);
    } else {
      return c.json({ message: 'id parameter is required' }, 400);
    }
  });

  /**
   * @openapi
   * /object/open:
   *   get:
   *     tags:
   *       - object
   *     description: |
   *                  ### Object Open
   *                  Returns an object from path if path is not sent resolve its parts of the ro-crate. Same as /stream but /object/open uses the browser session and /stream requires the Bearer Token.
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
   *         required: true
   *       - in: query
   *         name: path
   *     responses:
   *       '200':
   *         description: Returns an object
   *       '400':
   *         description: |
   *                      Returns error when no id is sent
   *
   */
  app.get('/open', ...streamHandlers);

  app.get('/:id', async (c, next) => {
    const crateId = c.req.param('id');
    const query = c.req.query();
    let raw = false; //if true, return the ro-crate-metadata as it is, no modification
    //log.debug(crateId);
    if (query.version) {
      return c.json({ message: 'Version is not implemented' }, 400);
    }
    if (query.raw !== undefined || query.noUrid != undefined || query.nourid != undefined) {
      raw = true;
    }
    /** @type {object} */
    let result = await fetchExternal(crateId);
    if (!result) {
      if ('meta' in query) {
        result = await getCrate({
          baseUrl: c.get('baseUrl'),
          crateId,
          types: configuration.api.rocrate.dataTransform.types,
          //version,
          repository,
          raw,
          deep: query.meta === 'all'
        });
      } else {
        // show just summary from db
        const opt = { crateId };
        if (query.fields) {
          opt.attributes = query.fields.split(',');
        }
        if (query.types !== undefined) {
          opt.attributes = ['types'];
        }
        log.debug(`Get data ${crateId}`);
        result = await getRecord(opt);
      }
    }

    if (result) {
      if (!(result instanceof ReadableStream)) {
        result = JSON.stringify(result);
      }
      return c.newResponse(result, 200, { 'Content-Type': 'application/json; charset=UTF-8' });
    } else {
      return c.json({ id: crateId, message: 'Not Found' }, 404);
    }
  });

  function authorize(configuration) {
    return factory.createMiddleware(async (c, next) => {
      const { id, path } = c.req.param();
      log.debug(`authorize - id: ${id} - path: ${path}`);
      const record = await getRecord({ crateId: id });
      if (record) {
        if (configuration.api.licenses && record.license && !configuration.api.authorization.disabled) {
          const user = c.get('user');
          const access = await checkIfAuthorized({ userId: user?.id, license: record.license, configuration });
          if (!access.hasAccess) {
            log.debug(`Not authorized, id: ${id} with license: ${record.license}`);
            throw forbiddenError({json: { id, path, error: { message: 'User is not authorized' } }});
          }
        }
      } else {
        throw notFoundError(); 
      }
      await next();
    });
  };

  app.get('/:id/:path{.+$}', softAuth, authorize(configuration), async (c, next) => {
    const { id, path } = c.req.param();
    log.debug(`Get object file - id: ${id} - path: ${path}`);
    if (c.req.header('via') === 'nginx') {
      // try to auto-detect nginx proxy using `via` header
      // if detected, use the x-accel feature to let nginx serve the requested file directly
      const fp = await getFilePath({ crateId: id, repository, filePath: path });
      if (fp) {
        c.header('Content-Disposition', 'attachment; filename=' + basename(path));
        console.log(fp);
        c.header('X-Accel-Redirect', fp);
        return c.body('');
      }
    } else {
      const file = await getFile({ crateId: id, repository, filePath: path });
      if (file) {
        c.header('Content-Disposition', 'attachment; filename=' + file.filename);
        c.header('Content-Type', file.mimetype);
        return c.body(file.fileStream, 200);
      }
    }
    return c.notFound();
  });

  return app;
}

