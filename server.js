const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ------------------- SMM PROVIDER API CONFIG -------------------
const SMM_API_URL = 'https://khmer-smm.com/api/v2';
const SMM_API_KEY = 'e298922490c0ac5dce809a3239c0ad78';

// Database បណ្តោះអាសន្នទុកទិន្នន័យ User
const users = [];

// ------------------- API AUTHENTICATION -------------------

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'សូមបំពេញព័ត៌មានឱ្យបានគ្រប់!' });
    }

    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username ឬ Email នេះមានគេប្រើរួចហើយ!' });
    }

    const newUser = { id: Date.now(), username, email, password, balance: 10.00, myOrders: 0, totalSpend: 0.00 };
    users.push(newUser);

    return res.json({ success: true, message: 'ចុះឈ្មោះជោគជ័យ! សូមចូលប្រើប្រាស់ (Sign In)' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        return res.json({
            success: true,
            message: 'ចូលប្រើប្រាស់ជោគជ័យ!',
            user: { 
                username: user.username, 
                email: user.email, 
                balance: user.balance,
                myOrders: user.myOrders,
                totalSpend: user.totalSpend
            }
        });
    } else {
        return res.status(401).json({ success: false, message: 'Username ឬ Password មិនត្រឹមត្រូវទេ!' });
    }
});

// ------------------- SMM SERVICES & ORDER API -------------------

// 1. Fetch Services ទាំងអស់ពី Provider
app.get('/api/services', async (req, res) => {
    try {
        const response = await axios.post(SMM_API_URL, new URLSearchParams({
            key: SMM_API_KEY,
            action: 'services'
        }));

        return res.json({ success: true, services: response.data });
    } catch (error) {
        console.error('Fetch Services Error:', error.message);
        return res.status(500).json({ success: false, message: 'មិនអាចទាញយក Services ពី Provider បានទេ!' });
    }
});

// 2. Auto Submit Order ទៅ Provider
app.post('/api/order', async (req, res) => {
    try {
        const { service, link, quantity } = req.body;

        if (!service || !link || !quantity) {
            return res.status(400).json({ success: false, message: 'សូមបំពេញ Link និង Quantity ឱ្យបានត្រឹមត្រូវ!' });
        }

        const response = await axios.post(SMM_API_URL, new URLSearchParams({
            key: SMM_API_KEY,
            action: 'add',
            service: service,
            link: link,
            quantity: quantity
        }));

        if (response.data && response.data.order) {
            return res.json({
                success: true,
                message: `បញ្ជាទិញជោគជ័យ! Order ID: ${response.data.order}`,
                orderId: response.data.order
            });
        } else {
            return res.status(400).json({
                success: false,
                message: response.data.error || 'មានបញ្ហាក្នុងការបង្កើត Order!'
            });
        }
    } catch (error) {
        console.error('Submit Order Error:', error.message);
        return res.status(500).json({ success: false, message: 'Server Error ក្នុងការផ្ញើ Order!' });
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
