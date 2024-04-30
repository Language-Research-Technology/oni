export function badRequest({ body = '400 Bad Request', json = undefined, headers = {} }={}) {
  body = json ? JSON.stringify(json) : body;
  return new Response(body, { status: 400, headers });
}

export function unauthorized({ body = '401 Unauthorized', json = undefined, headers = {} }={}) {
  body = json ? JSON.stringify(json) : body;
  return new Response(body, { status: 401, headers });
}

export function forbidden({ body = '403 Forbidden', json = undefined, headers = {} }={}) {
  body = json ? JSON.stringify(json) : body;
  return new Response(body, { status: 403, headers });
}

export function notFound({ body = '404 Not Found', json = undefined, headers = {} }={}) {
  body = json ? JSON.stringify(json) : body;
  return new Response(body, { status: 404, headers });
}
