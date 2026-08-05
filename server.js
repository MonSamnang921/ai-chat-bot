const express = require('express');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');

const app = express();
app.use(express.json());
app.use(cors());

// Serve Static Files
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// --- Config ព័ត៌មានរបស់អ្នក ---
const KHMER_SMM_API_URL = 'https://khmer-smm.com/api/v2';
const KHMER_SMM_API_KEY = 'e298922490c0ac5dce809a3239c0ad78';
const GOOGLE_CLIENT_ID = '781995105719-0no5v9433h4ce49gatkua0gposrc3e51.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const BAKONG_ACCOUNT_ID = 'mon_samnang@bkrt';
const MERCHANT_NAME = 'SAMNANG MON';

// បញ្ជីស្ដុកអ្នកប្រើប្រាស់ (In-Memory Database)
const users = [];

// ==========================================
// 0. ROOT ROUTE
// ==========================================
app.get('/', (req, res) => {
    const publicPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');

    if (fs.existsSync(publicPath)) {
        res.sendFile(publicPath);
    } else if (fs.existsSync(rootPath)) {
        res.sendFile(rootPath);
    } else {
        res.status(404).send("រកមិនឃើញ index.html ទេ!");
    }
});

// ==========================================
// 1. AUTHENTICATION APIs
// ==========================================

// Register (Sign Up)
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'សូមបញ្ចូលព័ត៌មានឱ្យបានគ្រប់គ្រាន់!' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'អ៉ីមែលនេះមានក្នុងប្រព័ន្ធរួចហើយ!' });
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        balance: 0.0000
    };

    users.push(newUser);
    res.json({ success: true, user: { name: newUser.name, email: newUser.email, balance: newUser.balance } });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ success: false, message: 'អ៉ីមែល ឬ លេខសំងាត់មិនត្រឹមត្រូវទេ!' });
    }

    res.json({ success: true, user: { name: user.name, email: user.email, balance: user.balance } });
});

// Google Login
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
            picture: payload['picture'],
            balance: 0.0000
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

        // បូកភាគរយចំណេញ 20% (0.20)
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
// 4. BAKONG DYNAMIC KHQR GENERATOR
// ==========================================
app.post('/api/generate-khqr', (req, res) => {
    const { amount, orderId } = req.body;

    try {
        const expirationTimestamp = Date.now() + (15 * 60 * 1000); // 15 នាទី

        const optionalData = {
            currency: khqrData.currency.usd,
            amount: parseFloat(amount),
            mobileNumber: "",
            storeLabel: "Khmer SMM",
            terminalLabel: "Online Store",
            billNumber: `SMM-${orderId || Date.now()}`,
            expirationTimestamp: expirationTimestamp
        };

        const individualInfo = new IndividualInfo(
            BAKONG_ACCOUNT_ID,
            MERCHANT_NAME,
            "Phnom Penh",
            optionalData
        );

        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo);

        if (response.status && response.status.code === 0) {
            res.json({
                success: true,
                qrString: response.data.qr,
                md5: response.data.md5
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: response.status ? response.status.message : "មិនអាចបង្កើត QR តាម Bakong បានទេ" 
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
