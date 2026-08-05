const express = require('express');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const { BakongKHQR, khqrData, MerchantInfo } = require("bakong-khqr");
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // សម្រាប់ Serve ឯកសារ Frontend

// --- Config ព័ត៌មានរបស់អ្នក ---
const KHMER_SMM_API_URL = 'https://khmer-smm.com/api/v2';
const KHMER_SMM_API_KEY = 'e298922490c0ac5dce809a3239c0ad78';
const GOOGLE_CLIENT_ID = '781995105719-0no5v9433h4ce49gatkua0gposrc3e51.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const BAKONG_ID = 'mon_samnang@bkrt';
const MERCHANT_NAME = 'SAMNANG MON';

// ==========================================
// 1. GOOGLE AUTHENTICATION API
// ==========================================
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        
        const user = {
            googleId: payload['sub'],
            email: payload['email'],
            name: payload['name'],
            picture: payload['picture']
        };

        res.json({ success: true, user: user });
    } catch (error) {
        console.error("Auth Error:", error.message);
        res.status(401).json({ success: false, message: 'Google Authentication Failed' });
    }
});

// ==========================================
// 2. KHMER SMM SERVICES API (FETCH & ADD MARGIN)
// ==========================================
app.get('/api/services', async (req, res) => {
    try {
        const response = await axios.post(KHMER_SMM_API_URL, {
            key: KHMER_SMM_API_KEY,
            action: 'services'
        });

        // បូកភាគរយចំណេញ 20% លើតម្លៃដើម
        const profitMargin = 0.20; 
        const adjustedServices = response.data.map(service => {
            const originalRate = parseFloat(service.rate);
            const myRate = originalRate + (originalRate * profitMargin);
            return {
                ...service,
                rate: myRate.toFixed(4)
            };
        });

        res.json({ success: true, services: adjustedServices });
    } catch (error) {
        res.status(500).json({ success: false, message: "មិនអាចទាញទិន្នន័យសេវាកម្មបានទេ" });
    }
});

// ==========================================
// 3. SUBMIT ORDER TO KHMER SMM
// ==========================================
app.post('/api/order', async (req, res) => {
    const { serviceId, link, quantity } = req.body;
    try {
        const response = await axios.post(KHMER_SMM_API_URL, {
            key: KHMER_SMM_API_KEY,
            action: 'add',
            service: serviceId,
            link: link,
            quantity: quantity
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        res.status(500).json({ success: false, message: "ការកុម្ម៉ង់មានបញ្ហា" });
    }
});

// ==========================================
// 4. BAKONG Dynamic KHQR GENERATOR
// ==========================================
app.post('/api/generate-khqr', (req, res) => {
    const { amount, orderId } = req.body;

    const optionalData = {
        currency: khqrData.currency.usd,
        amount: parseFloat(amount),
        billNumber: `SMM-${orderId}`,
        storeLabel: "KHMER SMM",
        terminalLabel: "Online POS",
        expirationTimestamp: Date.now() + (5 * 60 * 1000),
        merchantCategoryCode: "5999"
    };

    const merchantInfo = new MerchantInfo(
        BAKONG_ID,
        MERCHANT_NAME,
        "Phnom Penh",
        orderId.toString(),
        "BAKONG",
        optionalData
    );

    const khqr = new BakongKHQR();
    const response = khqr.generateMerchant(merchantInfo);

    if (response.status.code === 0) {
        res.json({
            success: true,
            qrString: response.data.qr,
            md5: response.data.md5
        });
    } else {
        res.status(400).json({ success: false, message: "មិនអាចបង្កើត QR បានទេ" });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
