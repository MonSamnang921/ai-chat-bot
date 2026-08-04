const express = require('express');
const cors = require('cors');
const path = require('path');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database បណ្តោះអាសន្នសម្រាប់ទុកគណនី
const users = [];

// ------------------- API AUTHENTICATION -------------------

// 1. API ចុះឈ្មោះ (Register)
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'សូមបំពេញព័ត៌មានឱ្យបានគ្រប់!' });
    }

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username នេះមានគេប្រើរួចហើយ!' });
    }

    const newUser = { username, email, password };
    users.push(newUser);

    return res.json({ success: true, message: 'ចុះឈ្មោះជោគជ័យ! សូមចូលប្រើប្រាស់ (Sign In)' });
});

// 2. API ចូលប្រើប្រាស់ (Login)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        return res.json({
            success: true,
            message: 'ចូលប្រើប្រាស់ជោគជ័យ!',
            user: { username: user.username, email: user.email }
        });
    } else {
        return res.status(401).json({ success: false, message: 'Username ឬ Password មិនត្រឹមត្រូវទេ!' });
    }
});

// ------------------- API KHQR GENERATOR -------------------

app.post('/generate-qr', (req, res) => {
    try {
        const { amount, service } = req.body;
        const parsedAmount = parseFloat(amount) || 0.50;
        const expirationTime = Date.now() + 10 * 60 * 1000;

        const optionalData = {
            currency: khqrData.currency.usd,
            amount: parsedAmount,
            mobileNumber: '85590217653',
            storeLabel: 'KhmerSMM',
            terminalLabel: service ? String(service).substring(0, 25) : 'Service',
            billNumber: 'INV-' + Date.now().toString().slice(-6),
            expirationTimestamp: expirationTime
        };

        const individualInfo = new IndividualInfo(
            'mon_samnang@bkrt',
            'SAMNANG MON',
            'Phnom Penh',
            optionalData
        );

        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo);

        if (response && response.data && response.data.qr) {
            const qrText = response.data.qr;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;

            return res.json({
                success: true,
                qrImage: qrImageUrl,
                md5: response.data.md5
            });
        } else {
            return res.status(400).json({ success: false, message: 'មិនអាចបង្កើត KHQR បានទេ' });
        }
    } catch (error) {
        console.error('KHQR Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
