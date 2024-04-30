import { HTTPException } from 'hono/http-exception';
import { badRequest, forbidden, unauthorized, notFound } from './responses.js';

export function badRequestError(opt) {
  const res = badRequest(opt);
  // @ts-ignore
  return new HTTPException(res.status, { res });
}

export function unauthorizedError(opt) {
  const res = unauthorized(opt);
  // @ts-ignore
  return new HTTPException(res.status, { res });
}

export function forbiddenError(opt) {
  const res = forbidden(opt);
  // @ts-ignore
  return new HTTPException(res.status, { res });
}

export function notFoundError(opt) {
  const res = notFound(opt);
  // @ts-ignore
  return new HTTPException(res.status, { res });
}
