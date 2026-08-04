const express = require('express');
const cors = require('cors');
const { KHQR, BakongKHQR } = require('bakong-khqr');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // សម្រាប់ឱ្យ Server រកឃើញ index.html

// Database បណ្តោះអាសន្នសម្រាប់ទុកគណនី (In-memory storage)
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

    console.log('User registered:', newUser);
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

app.post('/generate-qr', async (req, res) => {
    try {
        const { amount } = req.body;
        const bakongKhqr = new BakongKHQR();
        
        const optionalData = {
            currency: KHQR.currency.usd,
            amount: parseFloat(amount) || 1.00,
            mobileNumber: "85512345678",
            storeLabel: "KhmerSMM",
            terminalLabel: "Online Store",
            expirationTimestamp: Date.now() + (10 * 60 * 1000) // ពន្យារពេល 10 នាទី
        };

        const individualInfo = new KHQR.IndividualInfo(
            "mon_samnang@bkrt",
            "MON SAMNANG",
            "PHNOM PENH",
            optionalData
        );

        const khqrData = bakongKhqr.generateIndividual(individualInfo);

        if (khqrData && khqrData.data) {
            const qrImageBase64 = await bakongKhqr.generateDataDataUrl(khqrData.data.qr);
            return res.json({
                success: true,
                qrCode: khqrData.data.qr,
                qrImage: qrImageBase64,
                md5: khqrData.data.md5
            });
        } else {
            return res.status(500).json({ success: false, message: "មិនអាចបង្កើត KHQR បានទេ" });
        }
    } catch (error) {
        console.error("KHQR Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
