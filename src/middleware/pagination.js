import { nextDay } from 'date-fns';
import { HTTPException } from 'hono/http-exception'

/** 
 * @typedef {import('hono').MiddlewareHandler} MiddlewareHandler
 * 
 * @return {MiddlewareHandler} 
 */
export function pagination() {
  return async function pagination(c, next) {
    //console.log('pagination');
    const headerRange = c.req.header('Range');
    if (headerRange) {
      const [unit, rangesStr] = headerRange.split('=');
      const ranges = rangesStr.split(',');
      if (unit === 'object' && ranges.length === 1) {
        const [start, end] = ranges[0].split('-').map(n => parseInt(n));
        if (!isNaN(start) && !isNaN(end)) {
          c.set('offset', start);
          c.set('limit', end - start);
        } else {
          throw new HTTPException(416, { message: 'Range not satisfiable' });
        }
      } else {
        throw new HTTPException(416, { message: 'Unit must be object and multiple ranges is not supported' });
      }
      //const res = new Response('Range Not Satisfiable', { status: 416,  });
    } else {
      const rq = c.req.query();
      for (let q of ['offset', 'limit']) {
        /** @type {string|number} */
        let n = rq[q];
        if (n !== undefined) {
          n = parseInt(n);
          if (!isNaN(n)) {
            c.set(q, n);
          } else {
            throw new HTTPException(400, { message: 'Bad Request' });
          }
        }
      }
    }
    await next();
    const r = c.get('range');
    if (r) {
      c.res.headers.set('Accept-Ranges', 'object');
      c.res.headers.set('Content-Range', `object ${r.start}-${r.end}/${r.size}`);
      if (r.start > 0 || r.end < r.size) c.status(206);
    }
    // return new Response(null, {
    //   headers: c.res.headers,
    //   status: 204,
    //   statusText: c.res.statusText,
    // })
  }
}