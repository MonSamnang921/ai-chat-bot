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

// ================= AUTH APIs ================= //
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

// ================= FETCH SMM SERVICES API ================= //
app.get('/api/services', async (req, res) => {
    try {
        // ទាញយកទិន្នន័យសេវាកម្មពី SMM Provider (អាចប្តូរ URL និង API Key តាមតម្រូវការ)
        const response = await fetch('https://khmer-smm.com/api/v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: 'YOUR_SMM_API_KEY_HERE', // ដាក់ API Key របស់បង
                action: 'services'
            })
        });
        const data = await response.json();
        res.json(Array.isArray(data) ? data : []);
    } catch (error) {
        // Mock Data បម្រុងទុក ក្នុងករណី API ខាងក្រៅមិនទាន់ភ្ជាប់ Key
        const mockServices = [
            { service: 1, name: 'Telegram Members (Real)', category: 'Telegram', rate: '1.50' },
            { service: 2, name: 'Telegram Views Post', category: 'Telegram', rate: '0.10' },
            { service: 3, name: 'Facebook Page Likes', category: 'Facebook', rate: '2.00' },
            { service: 4, name: 'TikTok Followers', category: 'TikTok', rate: '1.20' }
        ];
        res.json(mockServices);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
