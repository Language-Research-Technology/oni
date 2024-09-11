import { HTTPException } from 'hono/http-exception'
import * as archiver from 'archiver';
import {extname} from 'node:path';
import {Readable, Writable} from 'node:stream';


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
      archive.append(Readable.fromWeb(/**@type {ReadableStream}*/(c.res.body)), { name: c.get('filename')||'attachment.zip' });
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
export function zipMulti() {
  return async function zipMulti(c, next) {
    //read accept
    const headerAccept = c.req.header('Accept');
    const ext = extname(c.req.path);
    if (headerAccept === 'application/zip' || ext === '.zip') c.set('format', 'zip');
    await next();
    if (c.get('format') === 'zip') {
      c.header('X-Archive-Files', 'zip');
    }
  };
}