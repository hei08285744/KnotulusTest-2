const {auth} = require("firebase-admin");

/**
 * Authentication middleware factory for Firebase Functions
 * Provides different auth levels for different endpoints
 */

const createAuthMiddleware = (options = {}) => {
  const {
    required = true,
    adminOnly = false,
    allowAnonymous = false,
    customValidator = null
  } = options;

  return async (req, res, next) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') return next();
    
    // Skip auth if explicitly allowed
    if (allowAnonymous) return next();

    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token && required) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid Firebase ID token in Authorization header'
      });
    }

    try {
      if (token) {
        const decodedToken = await auth().verifyIdToken(token);
        req.user = decodedToken;
        
        // Check admin privileges if required
        if (adminOnly && !decodedToken.admin) {
          return res.status(403).json({ 
            error: 'Admin access required',
            message: 'This endpoint requires admin privileges'
          });
        }

        // Apply custom validation if provided
        if (customValidator && typeof customValidator === 'function') {
          const customResult = await customValidator(decodedToken, req);
          if (customResult !== true) {
            return res.status(403).json({ 
              error: 'Access denied',
              message: customResult || 'Custom validation failed'
            });
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ 
        error: 'Invalid authentication token',
        message: 'Please check your token and try again'
      });
    }
  };
};

// Predefined auth middleware configurations
const requireAuth = createAuthMiddleware({ required: true });
const requireAdmin = createAuthMiddleware({ required: true, adminOnly: true });
const optionalAuth = createAuthMiddleware({ required: false, allowAnonymous: true });

// Custom validators for specific use cases
const validators = {
  // User can only access their own data
  ownDataOnly: (userIdField = 'userId') => async (decodedToken, req) => {
    const requestedUserId = req.body[userIdField] || req.query[userIdField];
    return decodedToken.uid === requestedUserId || decodedToken.admin;
  },
  
  // User must have completed profile
  profileComplete: async (decodedToken, req) => {
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    return userData && userData.profileComplete;
  }
};

module.exports = { 
  createAuthMiddleware, 
  requireAuth, 
  requireAdmin, 
  optionalAuth,
  validators 
};