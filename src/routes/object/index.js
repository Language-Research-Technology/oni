import { createReadStream } from "node:fs";
import { resolve, join, basename, extname } from 'node:path/posix';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
import { makeZip, predictLength } from 'client-zip';


import { getLogger } from '../../services/logger.js';
import { getRecord, getFullRecords, getOauthToken, getCrate, getFilePath, getFile } from '../../controllers/record.js';
import { pagination } from '../../middleware/pagination.js';
import { streamMultipart } from '#src/helpers/multipart.js';
import { badRequest } from '#src/helpers/responses.js';
import { File } from '#src/models/file.js';
import { Readable } from "node:stream";
import { previewRoute } from "#src/helpers/preview.js";

const log = getLogger();
const factory = createFactory();

/**
 * 
 * @param {object} p
 * @param {import('#src/services/configuration.js').Configuration} p.configuration
 * @param {import('@ocfl/ocfl').OcflStorage} p.repository
 * @param {*} p.softAuth
 * @param {*} p.streamHandlers
 * @param {*} p.authorize
 * @returns 
 */
export function setupObjectRoutes({ configuration, repository, softAuth, streamHandlers, authorize }) {
  const app = new Hono({ strict: false });
  const catalogFilename = configuration.api.ocfl.catalogFilename;

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
      const end = Math.min(params.offset + params.limit, records.total);
      c.set('range', { start: params.offset, end, size: records.total });
      let url = c.get('url');
      for (const r of records.data) {
        let base = new URL(url);
        base.search = '?meta';
        base.pathname = join(base.pathname, encodeURIComponent(r.crateId));
        r.url = base.href;
      }
      if (params.offset) {
        url.searchParams.set('offset', '' + (params.offset < params.limit ? 0 : params.offset - params.limit));
        records.prevUrl = url.href;
      }
      if (end < records.total) {
        url.searchParams.set('offset', '' + (params.offset + params.limit));
        records.nextUrl = url.href;
      }
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
      if (q['resolve-parts'] !== undefined) {
        q.meta = 'all';
        delete q['resolve-parts'];
      } else {
        q.meta = 'original';
      }
      const newQuery = Object.entries(q).map(([key, value]) => key + (value ? '=' + encodeURIComponent(value) : '')).join('&');
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

  const ocflPath = configuration.api.ocfl.ocflPath;
  const ocflPathInternal = configuration.api.ocfl.ocflPathInternal;

  /** 
   * Middleware to processs a list of files and stream those files as zip
   */
  const zipMulti = factory.createMiddleware(async (c, next) => {
    // Check if zip is requested by reading accept header and file extension (.zip) in the url
    const headerAccept = c.req.header('Accept');
    const ext = extname(c.req.path);
    if (headerAccept === 'application/zip' || ext === '.zip') {
      const crateId = c.req.param('id').replace(/\.zip$/, ''); //remove extension if exists
      c.set('crateId', crateId);
      const files = await File.findAll({ where: { crateId } });
      if (!files.length) {
        return c.notFound();
      }
      let ocflObject;
      let crate;
      try {
        ocflObject = repository.object(crateId);
        const inv = await ocflObject.getInventory();
        c.header('Last-Modified', (new Date(inv.created)).toUTCString());
        crate = await getRecord({ crateId });
      } catch (e) {
        return c.notFound();
      }
      c.header('Archive-File-Count', '' + files.length);
      c.header('Content-Disposition', 'attachment; filename=' + crate.name + '.zip');
      c.header('Content-Type', 'application/zip; charset=UTF-8');
      const estimatedSize = 22 + files.reduce((total, f) => total + (+f.size) + (2 * f.logicalPath.length) + 98, 0);
      c.header('Content-Length-Estimate', '' + estimatedSize);
      await authorize(c, async () => { });
      if (c.req.method == 'HEAD') {
        return c.body(null);
      }
      //const textRes = files.map(f => f.crc32 + ' ' + f.size + ' ' + encodeURI(f.path.replace('/opt/storage/oni', '')) + ' ' + f.logicalPath).join('\n');
      //c.header('Content-Disposition', 'attachment; filename='+encodeURIComponent(crateId)+'.zip');
      //return c.text(textRes);

      let body;
      if (c.req.header('via')?.includes('nginx') && c.req.header('Nginx-Enabled-Modules')?.includes('zip')) {
        // Use Nginx http_zip module if enabled
        c.header('X-Archive-Files', 'zip');
        body = files.map(f => f.crc32 + ' ' + f.size + ' ' + encodeURI(join(ocflPathInternal, f.path)) + ' ' + f.logicalPath).join('\n');
      } else {
        // Use internal zip handling as default
        const metadata = files.map(f => ({ name: f.logicalPath, size: parseInt(f.size) }));
        async function* genFiles() {
          for (const f of files) {
            const ocflFile = ocflObject.getFile(f.logicalPath);
            yield {
              name: f.logicalPath,
              lastModified: f.lastModified,
              input: await ocflFile.stream()
            };
          }
        }
        body = makeZip(genFiles(), { buffersAreUTF8: true, metadata });
        var cl = predictLength(metadata);
        c.header('Content-Type', 'application/zip; charset=UTF-8');
        c.header('Content-Length', cl.toString());
      }
      //console.log(body);
      return c.body(body);
    } else {
      await next();
    }
  });

  app.get('/:id', softAuth, zipMulti, async (c) => {
    let crateId = c.req.param('id');
    const query = c.req.query();
    //if true, return the ro-crate-metadata as it is, no modification
    const raw = (query.raw != undefined || query.noUrid != undefined || query.nourid != undefined) ? true : false;
    //log.debug(crateId);
    if (query.version) {
      return c.json({ message: 'Version is not implemented' }, 400);
    }
    /** @type {object} */
    let result = await fetchExternal(crateId);
    if (result) {
      return c.body(result, 200, { 'Content-Type': 'application/json; charset=UTF-8' });
    }

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
      if (result) result = result.toJSON();
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

    if (result) {
      return c.json(result);
    } else {
      return c.json({ id: crateId, message: 'Not Found' }, 404);
    }
  });

  // create a new object, imply id from the crate
  app.post('/', async (c, next) => {
    // must read root id from req body 
  });
  // update existing object with partial data
  app.post('/:id', async (c, next) => {

  });

  // create or replace object, if content type is json, it is an alias for PUT /:id/ro-crate-metadata.json
  app.put('/:id', async (c, next) => {
    const { id } = c.req.param();
    const contentType = c.req.header('content-type');
    let files;
    let errorMsg = 'No metadata file found in the request body';
    if (c.req.header('content-type') === 'application/json') {
      files = (async function* () {
        yield ['file', { name: catalogFilename, stream: c.req.raw.body, type: 'application/json' }];
      })();
    } else if (contentType.startsWith('multipart/')) {
      files = streamMultipart(c.req.raw.body, { headers: c.req.header(), preservePath: true });
      // let form = await c.req.parseBody({ all: true });
      // let files = [].concat(form?.['file'] || []);
    }
    if (files) {
      let meta;
      //save to ocfl
      const ocflObject = repository.object(id);
      const trx = await ocflObject.update();
      // todo: remove all existing files
      for await (const [name, value] of files) {
        if (typeof value !== 'string') {
          const { name, type, stream } = value;
          /** @type {string|ReadableStream} */
          let content = stream;
          if (name === catalogFilename && type === 'application/json') {
            content = await (new Response(stream)).text();
            try {
              meta = JSON.parse(content);
            } catch (error) {
              errorMsg = `Cannot parse ${catalogFilename}: Invalid JSON format`;
            }
          }
          //todo: update ocfl-js to accept aysnciterable
          await trx.write(name, content);
        }
      }
      // check ro-crate-metadata.json
      if (meta) {
        await trx.commit();
        //index the rocrate
        //await indexCrate(meta)
        return c.json({});
      } else {
        await trx.rollback();
      }
    }
    return badRequest('Invalid request payload');
  });

  app.put('/:id/:path{.+$}', async (c, next) => {
    const { id, path } = c.req.param();
    const contentType = c.req.header('content-type');
    if (contentType.includes('multipart/form-data')) {
    } else {
      const ocflObject = repository.object(id);
      await ocflObject.update(async (t) => {
        const ws = await t.createWriteStream(path);
      });
    }
    return c.json({}, 200);
  });

  app.get('/:id/ro-crate-preview.html', softAuth, 
    ...previewRoute(configuration.api.ocfl.previewPath, configuration.api.ocfl.previewPathInternal));

  app.get('/:id/:path{.+$}', softAuth, authorize, async (c, next) => {
    const { id, path } = c.req.param();
    log.debug(`Get object file - id: ${id} - path: ${path}`);
    if (c.req.header('via')?.includes('nginx')) {
      // try to auto-detect nginx proxy using `via` header
      // if detected, use the x-accel feature to let nginx serve the requested file directly
      const fp = await getFilePath({ crateId: id, repository, filePath: path });
      if (fp) {
        c.header('Content-Disposition', 'attachment; filename=' + basename(path));
        console.log(fp);
        c.header('X-Accel-Redirect', encodeURI('/ocfl/' + fp));
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

  const uploadHandlers = factory.createHandlers((c, next) => {
    const { id, path } = c.req.query();
    if (id) {
    } else {
      return c.json({ message: 'id parameter value is required' }, 400);
    }
  });

  return app;
}

