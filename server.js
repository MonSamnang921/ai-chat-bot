const express = require('express');
const cors = require('cors');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CONFIGURATION ====================
// Telegram Bot Config (Token ថ្មីរបស់បង)
const TELEGRAM_BOT_TOKEN = '8884737754:AAHa6uxDX_ufkr6UVEo4e0HX1dOAGLySTQk';

// ⚠️ សូមប្តូរ ADMIN_CHAT_ID នេះទៅជា Telegram Chat ID ពិតប្រាកដរបស់បង
const ADMIN_CHAT_ID = '123456789'; 

// Initialize Telegram Bot (polling: false ដើម្បីការពារ Error 409 Conflict)
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper Function: ផ្ញើសារចូល Telegram Admin
function sendTelegramNotification(message) {
  if (ADMIN_CHAT_ID === '123456789') {
    console.log('⚠️ សូមប្តូរ ADMIN_CHAT_ID ក្នុង server.js ជាមុនសិន!');
  }
  
  bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'HTML' })
    .then(() => console.log('✅ Telegram alert sent successfully!'))
    .catch((err) => console.error('❌ Telegram Send Error:', err.message));
}

// ==================== API ROUTES ====================

// 1. API សម្រាប់ទទួលសំណើបញ្ជូនប្រាក់ (Submit Deposit / Add Funds)
app.post('/api/deposit', (req, res) => {
  const { userEmail, amount } = req.body;

  if (!userEmail || !amount) {
    return res.status(400).json({ success: false, message: 'ព័ត៌មានមិនគ្រប់គ្រាន់!' });
  }

  // សារជូនដំណឹងទៅ Telegram Admin
  const telegramMsg = `
<b>💰 មានសំណើបាញ់លុយថ្មី (New Deposit Request)</b>
----------------------------------
📧 <b>អ៊ីមែលអតិថិជន:</b> ${userEmail}
💵 <b>ចំនួនទឹកប្រាក់:</b> $${parseFloat(amount).toFixed(2)}
🏦 <b>ទូទាត់តាម:</b> Bakong KHQR (mon_samnang@bkrt)
⏰ <b>ម៉ោង:</b> ${new Date().toLocaleString('km-KH')}
----------------------------------
<i>សូមពិនិត្យមើលគណនីធនាគារ និងបញ្ចូលសមតុល្យជូនអតិថិជន!</i>
  `;

  sendTelegramNotification(telegramMsg);

  res.json({
    success: true,
    message: 'សំណើដាក់ប្រាក់ត្រូវបានផ្ញើទៅកាន់ Admin រួចរាល់!'
  });
});

// 2. API សម្រាប់ទទួលការកម្ម៉ង់សេវាកម្ម (New Order)
app.post('/api/order', (req, res) => {
  const { userEmail, serviceName, link, quantity, totalPrice } = req.body;

  if (!userEmail || !serviceName || !link || !quantity) {
    return res.status(400).json({ success: false, message: 'ព័ត៌មានមិនគ្រប់គ្រាន់!' });
  }

  // សារជូនដំណឹងទៅ Telegram Admin
  const telegramMsg = `
<b>🛒 មានការកម្ម៉ង់ថ្មី (New Order Alert)</b>
----------------------------------
📧 <b>អតិថិជន:</b> ${userEmail}
📦 <b>សេវាកម្ម:</b> ${serviceName}
🔗 <b>Link:</b> ${link}
🔢 <b>ចំនួន:</b> ${quantity}
កាត់ប្រាក់អស់: <b>$${parseFloat(totalPrice).toFixed(2)}</b>
⏰ <b>ម៉ោង:</b> ${new Date().toLocaleString('km-KH')}
----------------------------------
  `;

  sendTelegramNotification(telegramMsg);

  res.json({
    success: true,
    message: 'ការកម្ម៉ង់ត្រូវបានបញ្ជូនជោគជ័យ!'
  });
});

// Serve index.html សម្រាប់ Root Path
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
