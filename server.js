const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files ចេញពី folder public
app.use(express.static(path.join(__dirname, 'public')));

// Sample Data (ឬប្រើ database របស់អ្នក)
let users = [
    { username: 'nang', balance: 0.00 }
];

// Admin Secret Passcode (កែតាមចិត្ត)
const ADMIN_PASSCODE = "123456";

// API Endpoint សម្រាប់ Update Balance
app.post('/api/admin/update-balance', (req, res) => {
    const { adminPass, username, amount, action } = req.body;

    // ពិនិត្យ Passcode សុវត្ថិភាព
    if (adminPass !== ADMIN_PASSCODE) {
        return res.status(401).json({ success: false, message: 'Passcode មិនត្រឹមត្រូវទេ!' });
    }

    let user = users.find(u => u.username === username);
    if (!user) {
        // បើមិនទាន់មាន user នោះទេ អាចបង្កើតថ្មី
        user = { username, balance: 0 };
        users.push(user);
    }

    const val = parseFloat(amount) || 0;
    if (action === 'add' || action === '+') {
        user.balance += val;
    } else if (action === 'subtract' || action === '-') {
        user.balance = Math.max(0, user.balance - val);
    } else {
        user.balance = val; // Set ផ្ទាល់
    }

    return res.json({ 
        success: true, 
        message: `ធ្វើបច្ចុប្បន្នភាពជោគជ័យ! ${username} មាន Balance ថ្មីគឺ $${user.balance.toFixed(2)}`,
        newBalance: user.balance 
    });
});

// Fallback Route
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
