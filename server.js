const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Database จำลอง (Array สำหรับเก็บ Users)
let users = [];

// ================= TELEGRAM BOT ================= //
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8749297297:AAEvWT7qku12vRkcsbkX9oE117cCWWpPrCY';
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (text === '/start') {
        bot.sendMessage(chatId, `🤖 **KhmerSMM Deposit Bot ដំណើរការជោគជ័យ!**\n\n🆔 Chat ID របស់បង៖ \`${chatId}\``, { parse_mode: 'Markdown' });
    }
});

// ================= SIGN UP API ================= //
app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'សូមបញ្ចូលព័ត៌មានឲ្យគ្រប់!' });
    }

    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username ឬ Email នេះមានគេប្រើហើយ!' });
    }

    const newUser = {
        id: Date.now(),
        username,
        email,
        password,
        balance: 0.00
    };

    users.push(newUser);

    return res.json({
        success: true,
        message: 'ចុះឈ្មោះជោគជ័យ!',
        user: newUser
    });
});

// ================= GOOGLE LOGIN API ================= //
app.post('/api/google-login', (req, res) => {
    const { email, name, googleId } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Google Authentication បរាជ័យ' });
    }

    let user = users.find(u => u.email === email);

    if (!user) {
        user = {
            id: Date.now(),
            username: name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
            email: email,
            password: 'google_auth_' + googleId,
            balance: 0.00
        };
        users.push(user);
    }

    return res.json({
        success: true,
        message: 'Google Login ជោគជ័យ!',
        user: user
    });
});

// ================= ADMIN ADD/DEDUCT BALANCE API ================= //
app.post('/api/admin/update-balance', (req, res) => {
    const { username, amount, type, adminKey } = req.body;

    if (adminKey !== '123456') {
        return res.status(403).json({ success: false, message: 'Admin Key មិនត្រឹមត្រូវ!' });
    }

    if (!username || !amount || isNaN(amount)) {
        return res.status(400).json({ success: false, message: 'សូមបញ្ចូលទិន្នន័យឲ្យបានត្រឹមត្រូវ' });
    }

    const user = users.find(u => u.username === username || u.email === username);

    if (!user) {
        return res.status(404).json({ success: false, message: 'រកមិនឃើញ User នេះទេ!' });
    }

    const value = parseFloat(amount);
    
    if (type === 'add') {
        user.balance += value;
    } else if (type === 'deduct') {
        user.balance = Math.max(0, user.balance - value);
    } else {
        return res.status(400).json({ success: false, message: 'Type ត្រូវតែជា add ឬ deduct' });
    }

    return res.json({
        success: true,
        message: 'បច្ចុប្បន្នភាពជោគជ័យ!',
        username: user.username,
        newBalance: user.balance
    });
});

// Route for admin.html
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
