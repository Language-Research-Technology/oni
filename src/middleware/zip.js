import { HTTPException } from 'hono/http-exception'
import { createMiddleware } from 'hono/factory';

import * as archiver from 'archiver';
import { extname, join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { downloadZip, makeZip, predictLength } from 'client-zip';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';

/** 
 * @typedef {import('node:stream/web').ReadableStream} ReadableStream
 */

/* 
 * Middleware to serve and stream any resources as zip
 */
export function zip() {
  return createMiddleware(async function zip(c, next) {
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
  });
}

