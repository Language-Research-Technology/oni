import { HTTPException } from 'hono/http-exception'
import * as archiver from 'archiver';
import { extname, join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { downloadZip, makeZip, predictLength } from 'client-zip';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';

/** 
 * @typedef {import('node:stream/web').ReadableStream} ReadableStream
 * @typedef {import('hono').MiddlewareHandler} MiddlewareHandler
 */

/* 
 * Middleware to serve and stream any resources as zip
 * @return {MiddlewareHandler} 
 */
export function zip() {
  return async function zip(c, next) {
    //read accept
    const headerAccept = c.req.header('Accept');
    const ext = extname(c.req.path);
    await next();
    if (headerAccept === 'application/zip' || ext === '.zip') {
      //zip the result here
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.append(Readable.fromWeb(/**@type {ReadableStream}*/(c.res.body)), { name: c.get('filename') || 'attachment.zip' });
      let headers = {
        'Content-Type': 'application/zip',
        //        'Content-Disposition': 'attachment; filename=devices.zip',
        //        'Content-Length': size
      };
      c.res = new Response(Readable.toWeb(archive), c.res);
      c.res.headers.delete('Content-Length');
      c.res.headers.set('Content-Type', 'application/zip');
      archive.finalize();
    }
  };
}

/** 
 * Middleware to processs a list of files and stream those files as zip
 * @return {MiddlewareHandler} 
 */
export function zipMulti({ocflPath, ocflPathInternal}) {
  return async function zipMulti(c, next) {
    // Check if zip is requested by reading accept header and file extension (.zip) in the url
    const headerAccept = c.req.header('Accept');
    const ext = extname(c.req.path);
    if (headerAccept === 'application/zip' || ext === '.zip') {
      c.set('format', 'zip');
      await next();
      if (c.req.method == 'GET' && c.res.status === 200) {
        let headers = new Headers(c.res.headers);
        let body;
        const files = await c.res.json();
        if (c.req.header('via')?.includes('nginx') && c.req.header('Nginx-Enabled-Modules')?.includes('zip')) {
          // Use Nginx http_zip module if enabled
          headers.set('X-Archive-Files', 'zip');
          body = files.map(f => f.crc32 + ' ' + f.size + ' ' + encodeURI(join(ocflPathInternal, f.path)) + ' ' + f.logicalPath).join('\n');
        } else {
          // Use internal zip handling as default
          const metadata = files.map(f => ({ name: f.logicalPath, size: parseInt(f.size) }));
          async function* genFiles() {
            for (const f of files) {
              yield { 
                name: f.logicalPath,
                lastModified: f.lastModified,
                input: createReadStream(join(ocflPath, f.path))
              };
            }
          }
          body = makeZip(genFiles(), { buffersAreUTF8: true, metadata });
          var cl = predictLength(metadata);
          headers.set('Content-Type', 'application/zip; charset=UTF-8');
          headers.set('Content-Length', cl.toString());
        }
        //console.log(body);
        c.res = undefined;
        c.res = new Response(body, { status: 200, headers });
      }
    } else {
      await next();
    }
  };
}
