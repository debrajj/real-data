/**
 * Session Authentication Middleware
 * Validates session tokens and attaches credentials to request
 */
const sessionService = require('../services/sessionService');

/**
 * Extract session token from request
 * Checks: Authorization header, cookies, query params
 */
function extractSessionToken(req) {
  // 1. Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Check cookies
  if (req.cookies && req.cookies.session_token) {
    return req.cookies.session_token;
  }

  // 3. Check query params (for SSE and special cases)
  if (req.query.session_token) {
    return req.query.session_token;
  }

  // 4. Check custom header
  if (req.headers['x-session-token']) {
    return req.headers['x-session-token'];
  }

  return null;
}

/**
 * Required authentication middleware
 * Returns 401 if no valid session
 */
async function requireAuth(req, res, next) {
  try {
    const sessionToken = extractSessionToken(req);
    
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_SESSION',
      });
    }

    const session = await sessionService.validateSession(sessionToken);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION',
      });
    }

    // Attach session data to request
    req.session = session;
    req.clientKey = session.clientKey;
    req.shopDomain = session.shopDomain;
    req.adminToken = session.adminToken;
    req.storefrontToken = session.storefrontToken;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches session if present, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const sessionToken = extractSessionToken(req);
    
    if (sessionToken) {
      const session = await sessionService.validateSession(sessionToken);
      if (session) {
        req.session = session;
        req.clientKey = session.clientKey;
        req.shopDomain = session.shopDomain;
        req.adminToken = session.adminToken;
        req.storefrontToken = session.storefrontToken;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even on error
  }
}

/**
 * Get credentials from session or fallback to request params
 * Useful for backward compatibility
 */
function getCredentials(req) {
  // Session credentials take priority
  if (req.session) {
    return {
      shopDomain: req.shopDomain,
      adminToken: req.adminToken,
      storefrontToken: req.storefrontToken,
      clientKey: req.clientKey,
    };
  }

  // Fallback to request params/headers (for backward compatibility)
  const shopDomain = req.query.shop || 
                     req.params.shopDomain || 
                     req.headers['x-shopify-shop-domain'];
  
  return {
    shopDomain,
    adminToken: null,
    storefrontToken: null,
    clientKey: req.params.clientKey || req.query.clientKey,
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  extractSessionToken,
  getCredentials,
};
