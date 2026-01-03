/**
 * Security Configuration for Knotulus Firebase Functions
 * 
 * This file defines security policies and role-based access control
 * for different API endpoints and user types.
 */

const securityConfig = {
  // User roles and their permissions
  roles: {
    ADMIN: {
      permissions: ['read:all_users', 'write:all_users', 'delete:all_users', 'read:system_metrics'],
      description: 'Full system access'
    },
    VERIFIED_USER: {
      permissions: ['read:own_data', 'write:own_data', 'read:public_leaderboard'],
      description: 'Authenticated user with verified email'
    },
    UNVERIFIED_USER: {
      permissions: ['read:own_data', 'write:own_profile', 'read:public_leaderboard'],
      description: 'New user awaiting email verification'
    }
  },

  // Endpoint security configurations
  endpoints: {
    // Public endpoints (no auth required)
    public: [
      'joinWaitlist'
    ],

    // User endpoints (require authentication)
    user: [
      'saveShopifyCredentials',
      'fetchFinancialSummary'
    ],

    // Admin endpoints (require admin role)
    admin: [
      'getUsers',
      'deleteUser'
    ]
  },

  // Rate limiting configurations
  rateLimiting: {
    // Requests per minute per user
    user: {
      'joinWaitlist': 5,
      'saveShopifyCredentials': 10,
      'fetchFinancialSummary': 30,
      default: 20
    },
    // Admin users get higher limits
    admin: {
      'getUsers': 100,
      'deleteUser': 50,
      default: 200
    }
  },

  // Data access policies
  dataAccess: {
    // Users can only access their own data unless admin
    ownDataOnly: [
      'saveShopifyCredentials',
      'fetchFinancialSummary'
    ],
    
    // Fields that should never be returned to clients
    sensitiveFields: [
      'accessToken',
      'password',
      'secretKey',
      'privateKey'
    ],

    // Fields to sanitize for non-admin users
    adminOnlyFields: [
      'createdAt',
      'lastLogin',
      'ipAddress',
      'userAgent'
    ]
  },

  // CORS configuration
  cors: {
    allowedOrigins: [
      'https://knotulus-test2.web.app',
      'http://127.0.0.1:5002',
      'http://localhost:3000',
      'https://knotulus.com' // Production domain
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ],
    maxAge: 3600 // 1 hour
  }
};

module.exports = securityConfig;