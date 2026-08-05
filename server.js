const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot Token (Polling: false ដើម្បីកុំឱ្យជាន់ Session Conflict)
const BOT_TOKEN = '8884737754:AAHa6uxDX_ufkr6UVEo4e0HX1dOAGLySTQk';
const CHAT_ID = '6013620862'; // ជំនួស Telegram Chat ID របស់បង ប្រសិនបើមាន

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (index.html, khqr.jpg, etc.) ចេញពី Root Directory
app.use(express.static(__dirname));

// Route សម្រាប់ទំព័រដើម Main Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Mock Services Data
const mockServices = [
    { service: 1, name: "TikTok Followers | Real & Active", category: "TikTok", rate: 1.20, min: 100, max: 100000 },
    { service: 2, name: "TikTok Likes | Fast Speed", category: "TikTok", rate: 0.50, min: 100, max: 50000 },
    { service: 3, name: "Facebook Page Likes + Followers", category: "Facebook", rate: 2.10, min: 500, max: 200000 },
    { service: 4, name: "Facebook Video Views", category: "Facebook", rate: 0.30, min: 1000, max: 1000000 },
    { service: 5, name: "YouTube Subscribers | Refill Guaranteed", category: "YouTube", rate: 5.00, min: 100, max: 10000 },
    { service: 6, name: "Telegram Channel Members", category: "Telegram", rate: 1.50, min: 500, max: 50000 }
];

// Mock API Login
app.post('/api/login', (req, res) => {
    const { loginKey, password } = req.body;
    if (!loginKey || !password) {
        return res.json({ success: false, message: "សូមបញ្ចូល Username និង Password!" });
    }
    // Return mock user profile
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

// Mock API Register
app.post('/api/register', (req, res) => {
    res.json({ success: true, message: "ការចុះឈ្មោះជោគជ័យ! សូមចូលប្រើប្រាស់។" });
});

// Get Services List
app.get('/api/services', (req, res) => {
    res.json({ success: true, services: mockServices });
});

// Submit Order API
app.post('/api/order', async (req, res) => {
    const { userEmail, serviceName, link, quantity, totalPrice } = req.body;
    
    // ផ្ញើសារប្រាប់ Admin តាម Telegram
    const message = `🛒 **រៀបចំ Order ថ្មី!**\n\n👤 អ្នកប្រើប្រាស់: ${userEmail}\n🆔 Service ID: ${serviceName}\n🔗 Link: ${link}\n🔢 ចំនួន: ${quantity}\n💵 ទឹកប្រាក់សរុប: $${totalPrice}`;
    
    try {
        if (CHAT_ID) {
            await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
        }
    } catch (err) {
        console.error("Telegram Notification Error:", err.message);
    }

    res.json({ success: true, message: "✅ បញ្ជូន Order ជោគជ័យ!" });
});

// Submit Deposit (KHQR) API
app.post('/api/deposit', async (req, res) => {
    const { userEmail, amount } = req.body;
    
    const message = `💰 **មានសំណើបាញ់លុយចូល (Add Funds)!**\n\n👤 អ្នកប្រើប្រាស់: ${userEmail}\n💵 ចំនួនទឹកប្រាក់: $${amount}\n\nសូមពិនិត្យមើល App ធនាគារ រួចបញ្ចូល Balance ជូនគាត់។`;
    
    try {
        if (CHAT_ID) {
            await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
        }
    } catch (err) {
        console.error("Telegram Notification Error:", err.message);
    }

    res.json({ success: true, message: "✅ បញ្ជូនសំណើដាក់លុយជោគជ័យ!" });
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
