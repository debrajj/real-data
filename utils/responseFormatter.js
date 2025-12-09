/**
 * Response Formatter Utility
 * Provides consistent response format across all API endpoints
 */

/**
 * Format success response
 */
function successResponse(req, message = 'Success', id = null, additionalData = null) {
  const response = {
    id,
    timestamp: new Date().toISOString(),
    message,
    path: req.originalUrl || req.path || req.url,
    status: 'OK',
    statusCode: 200,
    success: true,
  };

  if (additionalData) {
    Object.assign(response, additionalData);
  }

  return response;
}

/**
 * Format error response
 */
function errorResponse(req, message, statusCode = 500, status = 'ERROR') {
  return {
    id: null,
    timestamp: new Date().toISOString(),
    message,
    path: req.originalUrl || req.path || req.url,
    status,
    statusCode,
    success: false,
  };
}

/**
 * Format bad request (400)
 */
function badRequestResponse(req, message) {
  return errorResponse(req, message, 400, 'BAD_REQUEST');
}

/**
 * Format not found (404)
 */
function notFoundResponse(req, message) {
  return errorResponse(req, message, 404, 'NOT_FOUND');
}

/**
 * Format conflict (409)
 */
function conflictResponse(req, message) {
  return errorResponse(req, message, 409, 'CONFLICT');
}

/**
 * Format internal server error (500)
 */
function serverErrorResponse(req, message) {
  return errorResponse(req, message, 500, 'INTERNAL_SERVER_ERROR');
}

module.exports = {
  successResponse,
  errorResponse,
  badRequestResponse,
  notFoundResponse,
  conflictResponse,
  serverErrorResponse,
};
