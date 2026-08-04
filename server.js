const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('uploads')) { fs.mkdirSync('uploads'); }
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ------------------- SMM PROVIDER CONFIG -------------------
const SMM_API_URL = 'https://khmer-smm.com/api/v2';
const SMM_API_KEY = 'e298922490c0ac5dce809a3239c0ad78';

let globalPricePercentage = 10;

// Admin Account: 090217653 / 090217653
const users = [
    { id: 1, username: '090217653', email: '090217653', password: '090217653', balance: 1000.00, role: 'admin', isBlocked: false, myOrders: 0, totalSpend: 0.00 }
];

// ------------------- AUTHENTICATION -------------------

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'សូមបំពេញ ឈ្មោះអ្នកប្រើ, អ៊ីមែល និង ពាក្យសម្ងាត់!' });
    }

    const existingUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() || u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username ឬ Email នេះមានគេចុះឈ្មោះរួចហើយ!' });
    }

    const newUser = { id: Date.now(), username: username.trim(), email: email.trim().toLowerCase(), password, balance: 0.00, role: 'user', isBlocked: false, myOrders: 0, totalSpend: 0.00 };
    users.push(newUser);
    return res.json({ success: true, message: 'ចុះឈ្មោះជោគជ័យ! សូម Sign In ដើម្បីចូលប្រើប្រាស់' });
});

app.post('/api/login', (req, res) => {
    const { loginKey, password } = req.body;
    const inputKey = (loginKey || '').trim().toLowerCase();

    const user = users.find(u => (u.email.toLowerCase() === inputKey || u.username.toLowerCase() === inputKey) && u.password === password);
    
    if (!user) return res.status(401).json({ success: false, message: 'ឈ្មោះ/អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!' });
    if (user.isBlocked) return res.status(403).json({ success: false, message: 'គណនីរបស់អ្នកត្រូវ បានបិទ!' });

    return res.json({
        success: true,
        message: 'ចូលប្រើប្រាស់ជោគជ័យ!',
        user: { username: user.username, email: user.email, balance: user.balance, role: user.role, myOrders: user.myOrders, totalSpend: user.totalSpend }
    });
});

// ------------------- ADMIN CONTROLS -------------------

app.get('/api/admin/users', (req, res) => {
    const safeUsers = users.map(u => ({ username: u.username, email: u.email, balance: u.balance, role: u.role, isBlocked: u.isBlocked, myOrders: u.myOrders, totalSpend: u.totalSpend }));
    return res.json({ success: true, users: safeUsers, currentPercentage: globalPricePercentage });
});

app.post('/api/admin/add-balance', (req, res) => {
    const { email, amount } = req.body;
    const user = users.find(u => u.email.toLowerCase() === (email || '').trim().toLowerCase() || u.username.toLowerCase() === (email || '').trim().toLowerCase());
    if (!user) return res.status(404).json({ success: false, message: `រកមិនឃើញ User "${email}" ទេ!` });

    const addAmount = parseFloat(amount) || 0;
    user.balance += addAmount;
    return res.json({ success: true, message: `បានបញ្ចូល $${addAmount.toFixed(2)} ទៅកាន់ ${user.username} រួចរាល់!`, newBalance: user.balance });
});

app.post('/api/admin/toggle-block', (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email.toLowerCase() === (email || '').trim().toLowerCase() || u.username.toLowerCase() === (email || '').trim().toLowerCase());
    if (!user) return res.status(404).json({ success: false, message: 'រកមិនឃើញ User នេះទេ!' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'មិនអាច Block Admin បានទេ!' });

    user.isBlocked = !user.isBlocked;
    return res.json({ success: true, message: user.isBlocked ? `បានបិទ ${user.username}!` : `បានបើក ${user.username}!`, isBlocked: user.isBlocked });
});

app.post('/api/admin/set-price-margin', (req, res) => {
    globalPricePercentage = parseFloat(req.body.percentage) || 0;
    return res.json({ success: true, message: `បានកែប្រែភាគរយទៅ ${globalPricePercentage}% រួចរាល់!` });
});

// ------------------- CHAT FILE UPLOAD -------------------

app.post('/api/upload-media', upload.single('mediaFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'គ្មានឯកសារត្រូវបាន Upload ទេ' });
    const fileUrl = `/uploads/${req.file.filename}`;
    const isVideo = req.file.mimetype.startsWith('video/');
    return res.json({ success: true, url: fileUrl, isVideo });
});

// ------------------- BAKONG KHQR GENERATOR -------------------

app.post('/generate-qr', (req, res) => {
    try {
        const { amount, service } = req.body;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount < 0.50 || parsedAmount > 100000) {
            return res.status(400).json({ success: false, message: 'ចំនួនទឹកប្រាក់ត្រូវតែចាប់ពី $0.50 រហូតដល់ $100,000.00!' });
        }

        const expirationTime = Date.now() + 10 * 60 * 1000;
        const optionalData = {
            currency: khqrData.currency.usd,
            amount: parsedAmount,
            mobileNumber: '85590217653',
            storeLabel: 'KhmerSMM',
            terminalLabel: service ? String(service).substring(0, 25) : 'Deposit',
            billNumber: 'INV-' + Date.now().toString().slice(-6),
            expirationTimestamp: expirationTime
        };

        const individualInfo = new IndividualInfo('mon_samnang@bkrt', 'SAMNANG MON', 'Phnom Penh', optionalData);
        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo);

        if (response && response.data && response.data.qr) {
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(response.data.qr)}`;
            return res.json({ 
                success: true, 
                qrImage: qrImageUrl, 
                amount: parsedAmount.toFixed(2),
                merchantName: 'SAMNANG MON',
                billNo: optionalData.billNumber
            });
        } else {
            return res.status(400).json({ success: false, message: 'មិនអាចបង្កើត KHQR បានទេ' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// ------------------- SERVICES & ORDERS -------------------

app.get('/api/services', async (req, res) => {
    try {
        const response = await axios.post(SMM_API_URL, new URLSearchParams({ key: SMM_API_KEY, action: 'services' }));
        const modifiedServices = response.data.map(item => {
            const originalRate = parseFloat(item.rate) || 0;
            const newRate = originalRate + (originalRate * (globalPricePercentage / 100));
            return { ...item, rate: newRate.toFixed(4) };
        });
        return res.json({ success: true, services: modifiedServices });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'មិនអាចទាញយក Services បានទេ!' });
    }
});

app.post('/api/order', async (req, res) => {
    try {
        const { username, service, link, quantity, charge } = req.body;
        const user = users.find(u => u.username === username || u.email === username);
        if (!user || user.isBlocked) return res.status(403).json({ success: false, message: 'Account មិនអាចដំណើរការបានទេ!' });

        const parsedCharge = parseFloat(charge) || 0;
        if (user.balance < parsedCharge) return res.status(400).json({ success: false, message: 'ទឹកប្រាក់មិនគ្រប់គ្រាន់ទេ!' });

        const response = await axios.post(SMM_API_URL, new URLSearchParams({ key: SMM_API_KEY, action: 'add', service, link, quantity }));
        if (response.data && response.data.order) {
            user.balance -= parsedCharge;
            user.totalSpend += parsedCharge;
            user.myOrders += 1;
            return res.json({ success: true, message: `បញ្ជាទិញជោគជ័យ! Order ID: ${response.data.order}`, newBalance: user.balance, myOrders: user.myOrders, totalSpend: user.totalSpend });
        } else {
            return res.status(400).json({ success: false, message: response.data.error || 'មានបញ្ហា!' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error!' });
    }
});

// ------------------- REAL-TIME CHAT -------------------

io.on('connection', (socket) => {
    socket.on('join_chat', (userData) => {
        socket.userData = userData;
        socket.join('support_room');
    });

    socket.on('send_message', (data) => {
        io.to('support_room').emit('receive_message', data);
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
