/**
 * Session Service - Manages user sessions for multi-tenant app
 * Sessions are stored in MongoDB for persistence across server restarts
 */
const crypto = require('crypto');
const mongoose = require('mongoose');

// Session schema - stored in appconfig database
const sessionSchema = new mongoose.Schema({
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  clientKey: {
    type: String,
    required: true,
    index: true,
  },
  shopDomain: {
    type: String,
    required: true,
  },
  adminToken: {
    type: String,
    required: true,
  },
  storefrontToken: {
    type: String,
    required: true,
  },
  shopInfo: {
    name: String,
    email: String,
    currency: String,
    timezone: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30, // Auto-delete after 30 days (TTL index)
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Get or create Session model
let Session;
try {
  Session = mongoose.model('Session');
} catch {
  Session = mongoose.model('Session', sessionSchema, 'sessions');
}

class SessionService {
  /**
   * Generate a secure session token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate clientKey from shop domain
   */
  generateClientKey(shopDomain) {
    // Extract store name from domain (e.g., "mystore" from "mystore.myshopify.com")
    const storeName = shopDomain.replace('.myshopify.com', '').toLowerCase();
    // Add random suffix for uniqueness
    const suffix = crypto.randomBytes(2).toString('hex');
    return `${storeName}-${suffix}`;
  }

  /**
   * Create a new session after successful login
   */
  async createSession(data) {
    const { shopDomain, adminToken, storefrontToken, shopInfo, clientKey } = data;
    
    const sessionToken = this.generateToken();
    const finalClientKey = clientKey || this.generateClientKey(shopDomain);
    
    const session = await Session.create({
      sessionToken,
      clientKey: finalClientKey,
      shopDomain,
      adminToken,
      storefrontToken,
      shopInfo,
      lastActivity: new Date(),
    });

    return {
      sessionToken,
      clientKey: finalClientKey,
      shopDomain,
      shopInfo,
    };
  }

  /**
   * Validate session token and return session data
   */
  async validateSession(sessionToken) {
    if (!sessionToken) return null;

    const session = await Session.findOne({ 
      sessionToken, 
      isActive: true 
    });

    if (!session) return null;

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    return {
      clientKey: session.clientKey,
      shopDomain: session.shopDomain,
      adminToken: session.adminToken,
      storefrontToken: session.storefrontToken,
      shopInfo: session.shopInfo,
    };
  }

  /**
   * Get session by shop domain
   */
  async getSessionByShop(shopDomain) {
    return Session.findOne({ 
      shopDomain, 
      isActive: true 
    }).sort({ lastActivity: -1 });
  }

  /**
   * Get session by client key
   */
  async getSessionByClientKey(clientKey) {
    return Session.findOne({ 
      clientKey, 
      isActive: true 
    }).sort({ lastActivity: -1 });
  }

  /**
   * Invalidate/logout session
   */
  async invalidateSession(sessionToken) {
    const result = await Session.findOneAndUpdate(
      { sessionToken },
      { isActive: false },
      { new: true }
    );
    return !!result;
  }

  /**
   * Invalidate all sessions for a shop
   */
  async invalidateAllShopSessions(shopDomain) {
    const result = await Session.updateMany(
      { shopDomain },
      { isActive: false }
    );
    return result.modifiedCount;
  }

  /**
   * Get credentials for API calls
   */
  async getCredentials(sessionToken) {
    const session = await this.validateSession(sessionToken);
    if (!session) return null;

    return {
      shopDomain: session.shopDomain,
      adminToken: session.adminToken,
      storefrontToken: session.storefrontToken,
      clientKey: session.clientKey,
    };
  }

  /**
   * Update session with new shop info
   */
  async updateShopInfo(sessionToken, shopInfo) {
    return Session.findOneAndUpdate(
      { sessionToken, isActive: true },
      { shopInfo, lastActivity: new Date() },
      { new: true }
    );
  }
}

module.exports = new SessionService();
module.exports.Session = Session;
