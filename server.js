const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(__dirname));

let users = [];

// ================= TELEGRAM BOT ================= //
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8749297297:AAEvWT7qku12vRkcsbkX9oE117cCWWpPrCY';
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text === '/start') {
        bot.sendMessage(chatId, `🤖 **KhmerSMM Deposit Bot ដំណើរការជោគជ័យ!**\n\n🆔 Chat ID របស់បង៖ \`${chatId}\``, { parse_mode: 'Markdown' });
    }
});

// ================= SIGN UP API ================= //
app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, message: 'សូមបញ្ចូលព័ត៌មានឲ្យគ្រប់!' });

    if (users.find(u => u.username === username || u.email === email)) {
        return res.status(400).json({ success: false, message: 'Username ឬ Email នេះមានគេប្រើហើយ!' });
    }

    const newUser = { id: Date.now(), username, email, password, balance: 0.00 };
    users.push(newUser);
    return res.json({ success: true, message: 'ចុះឈ្មោះជោគជ័យ!', user: newUser });
});

// ================= GOOGLE LOGIN API ================= //
app.post('/api/google-login', (req, res) => {
    const { email, name, googleId } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Google Authentication បរាជ័យ' });

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
    return res.json({ success: true, message: 'Google Login ជោគជ័យ!', user: user });
});

// ================= SERVICES LISTING API ================= //
app.get('/api/services', (req, res) => {
    const services = [
        { service: 101, name: 'Telegram Post Views [Fast]', category: 'Telegram Services', rate: '0.05' },
        { service: 102, name: 'Telegram Channel Members [Non-Drop]', category: 'Telegram Services', rate: '1.20' },
        { service: 103, name: 'Telegram Reaction (Thumbs Up)', category: 'Telegram Services', rate: '0.10' },
        { service: 201, name: 'Facebook Page Likes & Followers', category: 'Facebook Services', rate: '1.80' },
        { service: 202, name: 'Facebook Video Views', category: 'Facebook Services', rate: '0.30' },
        { service: 301, name: 'TikTok Video Views', category: 'TikTok Services', rate: '0.02' },
        { service: 302, name: 'TikTok Followers [Real]', category: 'TikTok Services', rate: '1.10' },
        { service: 401, name: 'YouTube Subscribers', category: 'YouTube Services', rate: '8.00' }
    ];
    res.json(services);
});

// ================= DEPOSIT REQUEST API (SEND TO TELEGRAM) ================= //
app.post('/api/deposit', async (req, res) => {
    const { username, amount, txnId } = req.body;

    if (!username || !amount || !txnId) {
        return res.status(400).json({ success: false, message: 'សូមបញ្ចូលទិន្នន័យឲ្យបានត្រឹមត្រូវ!' });
    }

    const telegramMessage = `
💰 <b>មានសំណើដាក់លុយថ្មី (New Deposit Request)</b>
━━━━━━━━━━━━━━━━━━━
👤 <b>User:</b> <code>${username}</code>
💵 <b>ចំនួន:</b> $${parseFloat(amount).toFixed(2)}
🧾 <b>TID:</b> <code>${txnId}</code>
⏰ <b>ម៉ោង:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━
👉 សូមពិនិត្យមើលក្នុង ABA/Bakong រួចបូក Balance ជូន Member!
    `;

    const chatId = '8363306657';
    try {
        await bot.sendMessage(chatId, telegramMessage, { parse_mode: 'HTML' });
        return res.json({
            success: true,
            message: 'សំណើដាក់លុយត្រូវ បានបញ្ជូនទៅកាន់ Admin រួចរាល់! Admin នឹងពិនិត្យ និងបន្ថែម Balance ជូនក្នុងពេលឆាប់ៗ។'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'បរាជ័យក្នុងការផ្ញើសារជូនដំណឹងទៅ Admin' });
    }
});

// ================= ADMIN ADD/DEDUCT BALANCE API ================= //
app.post('/api/admin/update-balance', (req, res) => {
    const { username, amount, type, adminKey } = req.body;

    if (adminKey !== '123456') {
        return res.status(403).json({ success: false, message: 'Admin Key មិនត្រឹមត្រូវ!' });
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
    }

    return res.json({
        success: true,
        message: 'បច្ចុប្បន្នភាពជោគជ័យ!',
        username: user.username,
        newBalance: user.balance
    });
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
