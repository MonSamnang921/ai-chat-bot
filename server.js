const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot Settings
const BOT_TOKEN = '8884737754:AAHa6uxDX_ufkr6UVEo4e0HX1dOAGLySTQk';
const CHAT_ID = '6013620862';

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Middleware & CORS Header Fix
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Serve Index HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Mock Services
const mockServices = [
    { service: 101, name: "TikTok Followers | Real & Fast", category: "TikTok", rate: 1.20, min: 100, max: 100000 },
    { service: 102, name: "TikTok Likes | High Quality", category: "TikTok", rate: 0.50, min: 100, max: 50000 },
    { service: 201, name: "Facebook Page Likes + Followers", category: "Facebook", rate: 2.10, min: 500, max: 200000 },
    { service: 202, name: "Facebook Video Views", category: "Facebook", rate: 0.30, min: 1000, max: 1000000 },
    { service: 301, name: "YouTube Subscribers | Refill Guaranteed", category: "YouTube", rate: 5.00, min: 100, max: 10000 },
    { service: 401, name: "Telegram Channel Members", category: "Telegram", rate: 1.50, min: 500, max: 50000 }
];

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { loginKey, password } = req.body;
    if (!loginKey || !password) {
        return res.json({ success: false, message: "សូមបញ្ចូល Username និង Password!" });
    }
    res.json({
        success: true,
        user: {
            username: loginKey,
            email: `${loginKey}@gmail.com`,
            balance: 0.00,
            myOrders: 0,
            totalSpend: 0.0
        }
    });
});

// Register Endpoint
app.post('/api/register', (req, res) => {
    res.json({ success: true, message: "ការចុះឈ្មោះជោគជ័យ! សូមចូលប្រើប្រាស់។" });
});

// Services Endpoint
app.get('/api/services', (req, res) => {
    res.json({ success: true, services: mockServices });
});

// Submit Order Endpoint
app.post('/api/order', async (req, res) => {
    const { userEmail, serviceName, link, quantity, totalPrice } = req.body;
    const message = `🛒 **រៀបចំ Order ថ្មី!**\n\n👤 អ្នកប្រើប្រាស់: ${userEmail}\n🆔 Service ID: ${serviceName}\n🔗 Link: ${link}\n🔢 ចំនួន: ${quantity}\n💵 ទឹកប្រាក់សរុប: $${totalPrice}`;
    
    try {
        if (CHAT_ID) await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error("Telegram Notification Error:", err.message);
    }
    res.json({ success: true, message: "✅ បញ្ជូន Order ជោគជ័យ!" });
});

// Deposit Endpoint
app.post('/api/deposit', async (req, res) => {
    const { userEmail, amount } = req.body;
    const message = `💰 **មានសំណើបាញ់លុយចូល (Add Funds)!**\n\n👤 អ្នកប្រើប្រាស់: ${userEmail}\n💵 ចំនួនទឹកប្រាក់: $${amount}\n\nសូមពិនិត្យមើល App ធនាគារ រួចបញ្ចូល Balance ជូនគាត់។`;
    
    try {
        if (CHAT_ID) await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error("Telegram Notification Error:", err.message);
    }
    res.json({ success: true, message: "✅ បញ្ជូនសំណើដាក់លុយជោគជ័យ!" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
