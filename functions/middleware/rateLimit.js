const securityConfig = require('../config/security');

/**
 * Rate limiting middleware for Firebase Functions
 * Uses in-memory storage (for production, consider Redis)
 */

const rateLimitStore = new Map();

const createRateLimit = (endpoint, userRole = 'user') => {
  return (req, res, next) => {
    // Skip rate limiting for admin users in development
    if (req.user?.admin && process.env.NODE_ENV === 'development') {
      return next();
    }

    const key = req.user?.uid || req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    // Get rate limit for this endpoint and user role
    const roleConfig = securityConfig.rateLimiting[userRole] || securityConfig.rateLimiting.user;
    const maxRequests = roleConfig[endpoint] || roleConfig.default;
    
    // Initialize or get user's rate limit data
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 0, resetTime: now + windowMs });
    }
    
    const userLimit = rateLimitStore.get(key);
    
    // Reset window if expired
    if (now > userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = now + windowMs;
    }
    
    // Check if limit exceeded
    if (userLimit.count >= maxRequests) {
      const resetTimeSeconds = Math.ceil((userLimit.resetTime - now) / 1000);
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${resetTimeSeconds} seconds.`,
        retryAfter: resetTimeSeconds
      });
    }
    
    // Increment counter
    userLimit.count++;
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - userLimit.count),
      'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString()
    });
    
    next();
  };
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

module.exports = { createRateLimit };