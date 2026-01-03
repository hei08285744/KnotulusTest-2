# Firebase Functions Security Implementation

This repository implements a robust, scalable authentication and authorization system for Firebase Functions.

## 🛡️ Security Features

### 1. **Multi-Level Authentication**
- **Public endpoints**: No authentication required (e.g., `joinWaitlist`)
- **User endpoints**: Firebase Auth token required (e.g., `saveShopifyCredentials`)
- **Admin endpoints**: Admin role required (e.g., `getUsers`, `deleteUser`)

### 2. **Role-Based Access Control (RBAC)**
```javascript
// Available roles:
- ADMIN: Full system access
- VERIFIED_USER: Authenticated user with verified email  
- UNVERIFIED_USER: New user awaiting email verification
```

### 3. **Data Ownership Validation**
- Users can only access their own data
- Admins can access any data
- Automatic ownership validation for sensitive operations

### 4. **Rate Limiting**
- Per-endpoint rate limits
- Different limits for users vs admins
- Automatic cleanup of expired entries

### 5. **Data Sanitization**
- Sensitive fields automatically removed from responses
- Admin-only fields filtered for non-admin users
- Configurable field lists

## 🔧 Implementation

### Middleware Stack
```javascript
// Example protected endpoint
exports.myFunction = onRequest(corsOptions, requireAuth, async (req, res) => {
  // Your function logic here
  // req.user contains decoded Firebase token
});
```

### Available Middleware
- `requireAuth`: Authentication required
- `requireAdmin`: Admin role required  
- `optionalAuth`: Authentication optional
- `createRateLimit`: Rate limiting per endpoint

### Custom Validators
```javascript
// Ownership validation
const ownDataValidator = validators.ownDataOnly('userId');
exports.myFunction = onRequest(corsOptions, requireAuth, ownDataValidator, async (req, res) => {
  // User can only access their own data
});
```

## 📁 File Structure

```
functions/
├── config/
│   └── security.js          # Security configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── rateLimit.js         # Rate limiting middleware
│   └── sanitizer.js         # Data sanitization utilities
└── index.js                 # Main functions file
```

## 🚀 Usage Examples

### Protected User Endpoint
```javascript
exports.saveShopifyCredentials = onRequest(corsOptions, requireAuth, async (req, res) => {
  // Only authenticated users can access
  // req.user.uid contains the user's Firebase UID
});
```

### Admin-Only Endpoint
```javascript
exports.getUsers = onRequest(corsOptions, requireAdmin, async (req, res) => {
  // Only admins can access
  // Data automatically sanitized
});
```

### Custom Ownership Validation
```javascript
exports.fetchFinancialSummary = onRequest(corsOptions, requireAuth, async (req, res) => {
  // Users can only fetch their own data
  if (req.body.userId !== req.user.uid && !req.user.admin) {
    return res.status(403).json({ error: 'Access denied' });
  }
});
```

## 🔒 Security Best Practices Implemented

1. **Principle of Least Privilege**: Each endpoint has minimum required permissions
2. **Defense in Depth**: Multiple layers of security (auth + ownership + sanitization)
3. **Secure by Default**: All endpoints protected unless explicitly marked public
4. **Rate Limiting**: Prevents abuse and DoS attacks
5. **Data Sanitization**: Prevents sensitive data leakage
6. **CORS Protection**: Configured for specific allowed origins

## 📈 Scalability Features

1. **Modular Middleware**: Easy to add new security layers
2. **Configuration-Driven**: Security policies in centralized config
3. **Reusable Validators**: Common validation patterns abstracted
4. **Role-Based System**: Easy to add new roles and permissions
5. **Endpoint Categorization**: Automatic security based on endpoint type

## 🛠️ Adding New Functions

### For New Public Endpoints
```javascript
exports.newPublicFunction = onRequest(corsOptions, async (req, res) => {
  // No authentication required
});
```

### For New User Endpoints
```javascript
exports.newUserFunction = onRequest(corsOptions, requireAuth, async (req, res) => {
  // Authentication required
  // User data available in req.user
});
```

### For New Admin Endpoints
```javascript
exports.newAdminFunction = onRequest(corsOptions, requireAdmin, async (req, res) => {
  // Admin role required
  // Full access to system data
});
```

## 🔍 Testing Security

### Testing Authentication
```bash
# Without token (should fail)
curl -X POST https://your-function-url/api/saveShopifyCredentials

# With valid token (should succeed)
curl -X POST https://your-function-url/api/saveShopifyCredentials \
  -H "Authorization: Bearer FIREBASE_ID_TOKEN"
```

### Testing Admin Access
```bash
# With user token (should fail)
curl -X GET https://your-function-url/api/getUsers \
  -H "Authorization: Bearer USER_FIREBASE_TOKEN"

# With admin token (should succeed)
curl -X GET https://your-function-url/api/getUsers \
  -H "Authorization: Bearer ADMIN_FIREBASE_TOKEN"
```

## 🚨 Important Notes

1. **Firebase Auth Required**: All users must authenticate through Firebase Auth
2. **Admin Role Setup**: Admin users must have `admin: true` custom claim in Firebase Auth
3. **Environment Variables**: Consider using environment variables for sensitive config
4. **Production Rate Limiting**: For production, consider Redis-based rate limiting instead of in-memory

## 📞 Support

For security issues or questions about this implementation, please refer to the Firebase Functions documentation and security best practices.