const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const fetch = require('node-fetch');
const { requireAuth, requireAdmin, optionalAuth, validators } = require('./middleware/auth');
const { sanitizeUserList } = require('./middleware/sanitizer');

admin.initializeApp();

const db = admin.firestore();

const securityConfig = require('./config/security');
const corsOptions = { cors: securityConfig.cors.allowedOrigins };

// --- WAITLIST FUNCTIONS --- //

exports.joinWaitlist = onRequest(corsOptions, async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(400).send('Please send a POST request');
    }

    const { name, email } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "The function must be called with 'name' and 'email' arguments." });
    }

    try {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (!snapshot.empty) {
        const userId = snapshot.docs[0].id;
        await usersRef.doc(userId).update({ name });
        console.log(`Updated user ${userId} with new name: ${name}`);
        return res.status(200).json({ success: true, exists: true, userId: userId, message: `Welcome again, ${name}!` });
      }

      const userRef = await db.collection("users").add({
        name: name,
        email: email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Created new user with ID: ${userRef.id}`);
      return res.status(200).json({ success: true, userId: userRef.id });
    } catch (error) {
      console.error("Error adding user to waitlist:", error);
      return res.status(500).json({ error: "Error adding user to waitlist." });
    }
});

exports.getUsers = onRequest(corsOptions, requireAdmin, async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(400).send('Please send a GET request');
    }

    try {
      const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
      const users = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      // Sanitize user data based on role
      const sanitizedUsers = sanitizeUserList(users, req.user.admin);
      return res.status(200).json({ success: true, users: sanitizedUsers });
    } catch (error) {
      console.error("Error getting users:", error);
      return res.status(500).json({ error: "Error getting users." });
    }
});

exports.deleteUser = onRequest(corsOptions, requireAdmin, async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(400).send('Please send a POST request');
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "The function must be called with one argument 'userId'." });
    }

    try {
      await db.collection("users").doc(userId).delete();
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ error: "Error deleting user." });
    }
});

// --- NEW SHOPIFY FLOW --- //

exports.saveShopifyCredentials = onRequest(corsOptions, requireAuth, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(400).send('Please send a POST request');
    }

    const { shopName, accessToken, userId } = req.body;

    if (!shopName || !accessToken || !userId) {
        return res.status(400).json({ success: false, error: 'Missing required parameters: shopName, accessToken, userId' });
    }

    // Users can only save credentials for their own account (unless admin)
    if (userId !== req.user.uid && !req.user.admin) {
        return res.status(403).json({ success: false, error: 'You can only save credentials for your own account' });
    }

    try {
        await db.collection('users').doc(userId).collection('shops').doc(shopName).set({
            accessToken: accessToken,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving Shopify credentials:', error);
        res.status(500).json({ success: false, error: 'Error saving Shopify credentials.' });
    }
});


/**
 * Fetches various financial data points from the Shopify Admin API.
 */
async function fetchShopifyData(shopName, accessToken, period) {
    const shopUrl = `https://${shopName}/admin/api/2024-04`;
    const headers = {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
    };

    const makeRequest = async (endpoint) => {
        const response = await fetch(`${shopUrl}/${endpoint}`, { headers });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Shopify API request failed with status ${response.status}: ${errorText}`);
        }
        return response.json();
    };

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - period);

    const period1_end_date = new Date();
    period1_end_date.setDate(endDate.getDate() - period - 1);
    const period1_start_date = new Date();
    period1_start_date.setDate(endDate.getDate() - (period * 2) - 1);

    try {
        const ordersPeriod2Data = await makeRequest(`orders.json?created_at_min=${startDate.toISOString()}&created_at_max=${endDate.toISOString()}&status=any&limit=250`);
        const ordersPeriod2 = ordersPeriod2Data.orders;
        const totalRevenue = ordersPeriod2.reduce((total, order) => total + parseFloat(order.total_price), 0);

        const ordersPeriod1Data = await makeRequest(`orders.json?created_at_min=${period1_start_date.toISOString()}&created_at_max=${period1_end_date.toISOString()}&status=any&limit=250`);
        const ordersPeriod1 = ordersPeriod1Data.orders;
        const revenuePeriod1 = ordersPeriod1.reduce((total, order) => total + parseFloat(order.total_price), 0);
        
        const customerCountData = await makeRequest(`customers/count.json`);
        const customerCount = customerCountData.count;

        const productCountData = await makeRequest(`products/count.json`);
        const productCount = productCountData.count;

        const revenuePeriod2 = totalRevenue;
        const profitPeriod2 = revenuePeriod2 * 0.70;

        let revenueGrowthRate = 'N/A';
        if (revenuePeriod1 > 0) {
            revenueGrowthRate = (((revenuePeriod2 - revenuePeriod1) / revenuePeriod1) * 100).toFixed(2) + '%';
        }

        const valuationChange = revenuePeriod2 - revenuePeriod1;
        let valuationChangeIndicator = 'neutral';
        if (valuationChange > 0) {
            valuationChangeIndicator = 'positive';
        } else if (valuationChange < 0) {
            valuationChangeIndicator = 'negative';
        }

        return {
            orders: ordersPeriod2,
            totalRevenue,
            customerCount,
            productCount,
            revenueGrowthRate,
            profitPeriod2,
            valuationChangeIndicator,
        };
    } catch (error) {
        console.error('Error fetching Shopify data:', error);
        throw error; // Re-throw the specific error
    }
}

/**
 * Securely fetches financial summary by retrieving the access token from Firestore.
 */
exports.fetchFinancialSummary = onRequest(corsOptions, requireAuth, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(400).send('Please send a POST request');
    }

    const { userId, shopName, period } = req.body;

    if (!userId || !shopName || typeof shopName !== 'string' || !period || typeof period !== 'number') {
        return res.status(400).send({ success: false, error: 'Missing or invalid required parameters: userId, shopName, period' });
    }

    // Users can only fetch their own financial data (unless admin)
    if (userId !== req.user.uid && !req.user.admin) {
        return res.status(403).json({ success: false, error: 'You can only access your own financial data' });
    }

    try {
        const shopDoc = await db.collection('users').doc(userId).collection('shops').doc(shopName).get();
        if (!shopDoc.exists) {
            return res.status(401).send({ success: false, error: "Shop not found for this user. Please add your shop credentials." });
        }

        const { accessToken } = shopDoc.data();
        if (!accessToken) {
            return res.status(401).send({ success: false, error: "Access token not found. Please add your shop credentials again." });
        }

        const financialData = await fetchShopifyData(shopName, accessToken, period);
        res.status(200).send({ success: true, data: financialData });
    } catch (error) {
        console.error("Error fetching financial summary:", error.message);
        if (error.message.includes('401')) {
            res.status(401).send({ success: false, error: "Shopify token is invalid. Please check your credentials." });
        } else {
            res.status(500).send({ success: false, error: "Internal server error while fetching financial summary." });
        }
    }
});
