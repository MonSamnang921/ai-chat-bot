const express = require('express');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

// Serve Static Files
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// --- Config ---
const KHMER_SMM_API_URL = 'https://khmer-smm.com/api/v2';
const KHMER_SMM_API_KEY = 'e298922490c0ac5dce809a3239c0ad78';
const GOOGLE_CLIENT_ID = '781995105719-0no5v9433h4ce49gatkua0gposrc3e51.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ==========================================
// ROOT ROUTE (ស្វែងរក index.html ដោយស្វ័យប្រវត្តិ)
// ==========================================
app.get('/', (req, res) => {
    const publicPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');

    if (fs.existsSync(publicPath)) {
        res.sendFile(publicPath);
    } else if (fs.existsSync(rootPath)) {
        res.sendFile(rootPath);
    } else {
        res.status(404).send("រកមិនឃើញ index.html ទេ! សូមពិនិត្យមើលឈ្មោះឯកសារក្នុង GitHub របស់អ្នក។");
    }
});

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
        res.status(401).json({ success: false, message: 'Google Authentication Failed' });
    }
});

// ==========================================
// 2. KHMER SMM SERVICES API
// ==========================================
app.get('/api/services', async (req, res) => {
    try {
        const response = await axios.post(KHMER_SMM_API_URL, {
            key: KHMER_SMM_API_KEY,
            action: 'services'
        });

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

    try {
        const qrString = `00020101021230520016mon_samnang@bkrt0111SAMNANG MON5204599953038405404${parseFloat(amount).toFixed(2)}5802KH5911SAMNANG MON6010Phnom Penh62160712SMM-${orderId}6304`;
        const md5 = crypto.createHash('md5').update(qrString).digest('hex');

        res.json({
            success: true,
            qrString: qrString,
            md5: md5
        });
    } catch (error) {
        res.status(400).json({ success: false, message: "មិនអាចបង្កើត QR បានទេ" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
