const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const http = require('http');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const SMM_API_URL = 'https://khmer-smm.com/api/v2';
const SMM_API_KEY = 'e298922490c0ac5dce809a3239c0ad78';
let globalPriceMarginPercent = 10;

const users = [];

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'សូមបំពេញព័ត៌មានឱ្យបានគ្រប់!' });
    }

    const existingUser = users.find(u => 
        u.username.toLowerCase() === username.trim().toLowerCase() || 
        u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username ឬ Email នេះមានគេប្រើរួចហើយ!' });
    }

    const newUser = { 
        id: Date.now(), 
        username: username.trim(), 
        email: email.trim().toLowerCase(), 
        password, 
        balance: 0.00, 
        myOrders: 0, 
        totalSpend: 0.00 
    };
    users.push(newUser);
    return res.json({ success: true, message: 'ចុះឈ្មោះជោគជ័យ! សូម Sign In ដើម្បីចូលប្រើប្រាស់' });
});

app.post('/api/login', (req, res) => {
    const { loginKey, password } = req.body;
    const inputKey = (loginKey || '').trim().toLowerCase();
    
    const user = users.find(u => (u.email.toLowerCase() === inputKey || u.username.toLowerCase() === inputKey) && u.password === password);
    if (!user) {
        return res.status(401).json({ success: false, message: 'ឈ្មោះ/អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!' });
    }

    return res.json({ success: true, message: 'ចូលប្រើប្រាស់ជោគជ័យ!', user });
});

app.get('/api/services', async (req, res) => {
    try {
        const response = await axios.post(SMM_API_URL, new URLSearchParams({
            key: SMM_API_KEY,
            action: 'services'
        }));

        if (Array.isArray(response.data)) {
            const servicesWithMargin = response.data.map(item => {
                const originalRate = parseFloat(item.rate) || 0;
                const finalRate = originalRate + (originalRate * (globalPriceMarginPercent / 100));
                return {
                    ...item,
                    rate: finalRate.toFixed(4)
                };
            });
            return res.json({ success: true, services: servicesWithMargin });
        } else {
            return res.status(400).json({ success: false, message: 'មិនអាចទាញយកសេវាកម្មបានទេ!' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error ក្នុងការទាញយក Services' });
    }
});

app.post('/api/order', async (req, res) => {
    try {
        const { username, service, link, quantity, charge } = req.body;
        
        const user = users.find(u => u.username === username || u.email === username);
        if (!user) {
            return res.status(403).json({ success: false, message: 'សូមចូលប្រើប្រាស់ប្រព័ន្ធជាមុនសិន!' });
        }

        const parsedCharge = parseFloat(charge) || 0;
        if (user.balance < parsedCharge) {
            return res.status(400).json({ success: false, message: 'ទឹកប្រាក់ក្នុងគណនីមិនគ្រប់គ្រាន់ទេ! សូមបញ្ចូលប្រាក់បន្ថែម។' });
        }

        const apiRes = await axios.post(SMM_API_URL, new URLSearchParams({
            key: SMM_API_KEY,
            action: 'add',
            service: service,
            link: link,
            quantity: quantity
        }));

        if (apiRes.data && apiRes.data.order) {
            user.balance -= parsedCharge;
            user.totalSpend += parsedCharge;
            user.myOrders += 1;

            return res.json({
                success: true,
                message: `បញ្ជាទិញជោគជ័យ! Order ID: ${apiRes.data.order}`,
                newBalance: user.balance,
                myOrders: user.myOrders,
                totalSpend: user.totalSpend
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: apiRes.data.error || 'មានបញ្ហាក្នុងការបង្កើត Order!' 
            });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error ក្នុងការបញ្ជូន Order' });
    }
});

// -------------------------------------------------------------
// BAKONG KHQR GENERATOR (ប្ដូរឈ្មោះទៅ KHMERSMM)
// -------------------------------------------------------------
app.post('/generate-qr', (req, res) => {
    try {
        const { amount } = req.body;
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 0.50) {
            return res.status(400).json({ success: false, message: 'ចំនួនទឹកប្រាក់យ៉ាងតិច $0.50' });
        }

        const expirationTime = Date.now() + (10 * 60 * 1000); // 10 នាទី

        const optionalData = {
            currency: khqrData.currency.usd,
            amount: parsedAmount,
            mobileNumber: '85590217653',
            storeLabel: 'KhmerSMM',
            terminalLabel: 'Deposit',
            billNumber: 'INV-' + Date.now().toString().slice(-6),
            expirationTimestamp: expirationTime
        };

        // កែសម្រួលឈ្មោះ Merchant Name ទៅជា KHMERSMM នៅត្រង់នេះ
        const individualInfo = new IndividualInfo('mon_samnang@bkrt', 'KHMERSMM', 'Phnom Penh', optionalData);
        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo);

        if (response && response.data && response.data.qr) {
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(response.data.qr)}`;
            return res.json({ 
                success: true, 
                qrImage: qrImageUrl, 
                amount: parsedAmount.toFixed(2), 
                merchantName: 'KHMERSMM' 
            });
        }
        return res.status(400).json({ success: false, message: 'មិនអាចបង្កើត KHQR បានទេ' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error!' });
    }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
