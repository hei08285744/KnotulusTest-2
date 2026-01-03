const securityConfig = require('../config/security');

/**
 * Data sanitization utilities for API responses
 */

const sanitizeUserData = (userData, isAdmin = false) => {
  if (!userData) return userData;

  const sanitized = { ...userData };
  
  // Remove sensitive fields for all users
  securityConfig.dataAccess.sensitiveFields.forEach(field => {
    delete sanitized[field];
  });

  // Remove admin-only fields for non-admin users
  if (!isAdmin) {
    securityConfig.dataAccess.adminOnlyFields.forEach(field => {
      delete sanitized[field];
    });
  }

  return sanitized;
};

const sanitizeUserList = (users, isAdmin = false) => {
  return users.map(user => sanitizeUserData(user, isAdmin));
};

const validateOwnership = (req, resourceUserId) => {
  // Admin can access any resource
  if (req.user?.admin) return true;
  
  // User can only access their own resources
  return req.user?.uid === resourceUserId;
};

const createOwnershipValidator = (userIdField = 'userId') => {
  return async (decodedToken, req) => {
    const resourceUserId = req.body[userIdField] || req.query[userIdField];
    return validateOwnership({ user: decodedToken }, resourceUserId);
  };
};

module.exports = {
  sanitizeUserData,
  sanitizeUserList,
  validateOwnership,
  createOwnershipValidator
};