/**
 * @callback CreateResponse
 * @param {object|string} [body]
 * @param {object} [headers]
 * @returns {Response}
 **/ 

/**
 * @param {number} code
 * @param {string} label
 * @returns {CreateResponse}
 **/  
function createErrorResponse(code, label) {
  return function (body = {}, headers = {}) {
    const text = JSON.stringify({
      error: {
        status: code + ' ' + label,
        ...(typeof body === 'object' ? body : { message: body })
      }
    });
    return new Response(text, { status: code, headers });
  }
}

export const badRequest = createErrorResponse(400, 'Bad Request');
export const unauthorized = createErrorResponse(401, 'Unauthorized');
export const forbidden = createErrorResponse(403, 'Forbidden');
export const notFound = createErrorResponse(404, 'Not Found');
export const conflict = createErrorResponse(409, 'Conflict');
export const internal = createErrorResponse(500, 'Internal Server Error');