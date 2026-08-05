const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(__dirname));

// In-Memory Database (ប្រព័ន្ធរក្សាទុកទិន្នន័យបណ្តោះអាសន្ន)
let users = [];
let orders = [];

// ================= TELEGRAM BOT ================= //
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8749297297:AAEvWT7qku12vRkcsbkX9oE117cCWWpPrCY';
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text === '/start') {
        bot.sendMessage(chatId, `🤖 **KhmerSMM Deposit Bot ដំណើរការជោគជ័យ!**\n\n🆔 Chat ID របស់បង៖ \`${chatId}\``, { parse_mode: 'Markdown' });
    }
});

// Danh sách Service
const servicesList = [
    { service: 101, name: 'Telegram Post Views [Fast]', category: 'Telegram Services', rate: 0.05 },
    { service: 102, name: 'Telegram Channel Members [Non-Drop]', category: 'Telegram Services', rate: 1.20 },
    { service: 103, name: 'Telegram Reaction (Thumbs Up)', category: 'Telegram Services', rate: 0.10 },
    { service: 201, name: 'Facebook Page Likes & Followers', category: 'Facebook Services', rate: 1.80 },
    { service: 202, name: 'Facebook Video Views', category: 'Facebook Services', rate: 0.30 },
    { service: 301, name: 'TikTok Video Views', category: 'TikTok Services', rate: 0.02 },
    { service: 302, name: 'TikTok Followers [Real]', category: 'TikTok Services', rate: 1.10 },
    { service: 401, name: 'YouTube Subscribers', category: 'YouTube Services', rate: 8.00 }
];

// ================= SIGN UP / LOGIN API ================= //
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

// ================= GET SERVICES ================= //
app.get('/api/services', (req, res) => {
    res.json(servicesList);
});

// ================= CREATE ORDER API (មុខងារទិញសេវាកម្ម + កាត់ Balance) ================= //
app.post('/api/orders/create', (req, res) => {
    const { username, serviceId, link, quantity } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ success: false, message: 'រកមិនឃើញ Member ឡើយ!' });

    const service = servicesList.find(s => s.service == serviceId);
    if (!service) return res.status(400).json({ success: false, message: 'សូមជ្រើសរើស Service ឱ្យបានត្រឹមត្រូវ!' });

    if (!link || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'សូមបញ្ចូល Link និង ចំនួន (Quantity) ឲ្យបានត្រឹមត្រូវ!' });
    }

    // គណនាប្រាក់ត្រូវកាត់
    const charge = parseFloat(((service.rate / 1000) * quantity).toFixed(4));

    // ពិនិត្យមើលថា Balance គ្រប់ឬអត់
    if (user.balance < charge) {
        return res.status(400).json({ 
            success: false, 
            message: `សមតុល្យទឹកប្រាក់មិនគ្រប់គ្រាន់ទេ! តម្លៃសរុបគឺ $${charge} ប៉ុន្តែអ្នកមានត្រឹមតែ $${user.balance.toFixed(2)}។` 
        });
    }

    // កាត់ Balance របស់ User
    user.balance -= charge;

    // បង្កើត Order Record
    const newOrder = {
        orderId: Math.floor(100000 + Math.random() * 900000),
        username: user.username,
        serviceName: service.name,
        link: link,
        quantity: parseInt(quantity),
        charge: charge,
        status: 'Processing',
        date: new Date().toLocaleString()
    };
    orders.push(newOrder);

    return res.json({
        success: true,
        message: '🎉 បញ្ជាទិញសេវាកម្មជោគជ័យ!',
        order: newOrder,
        newBalance: user.balance
    });
});

// ================= GET USER ORDERS (ទាញយកប្រវត្តិ Order របស់ User) ================= //
app.get('/api/orders/:username', (req, res) => {
    const username = req.params.username;
    const userOrders = orders.filter(o => o.username === username);
    res.json(userOrders);
});

// ================= DEPOSIT REQUEST API ================= //
app.post('/api/deposit', async (req, res) => {
    const { username, amount } = req.body;

    if (!username || !amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: 'សូមបញ្ចូលចំនួនទឹកប្រាក់ឲ្យបានត្រឹមត្រូវ!' });
    }

    const telegramMessage = `
💰 <b>មានសំណើដាក់លុយថ្មី (New Deposit Request)</b>
━━━━━━━━━━━━━━━━━━━
👤 <b>User:</b> <code>${username}</code>
💵 <b>ចំនួន:</b> $${parseFloat(amount).toFixed(2)}
⏰ <b>ម៉ោង:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━
👉 សូមពិនិត្យមើលគណនីធនាគារ រួចបូក Balance ជូន Member!
    `;

    const chatId = '8363306657';
    try {
        await bot.sendMessage(chatId, telegramMessage, { parse_mode: 'HTML' });
        return res.json({
            success: true,
            message: 'សំណើដាក់លុយត្រូវបានបញ្ជូនទៅកាន់ Admin រួចរាល់!'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'បរាជ័យក្នុងការផ្ញើសារជូនដំណឹងទៅ Admin' });
    }
});

// ================= ADMIN ADD BALANCE API ================= //
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
    if (type === 'add') user.balance += value;
    else if (type === 'deduct') user.balance = Math.max(0, user.balance - value);

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
