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

// បញ្ជី Users ដំបូង (Sample Data - អាចកែសម្រួល ឬភ្ជាប់ Database តាមក្រោយបាន)
let usersData = [
    { id: '1', name: 'Mon Samnang', email: 'samnang@gmail.com', balance: 50.00 },
    { id: '2', name: 'Nang User', email: 'nang@gmail.com', balance: 12.50 },
    { id: '3', name: 'Test Account', email: 'test@gmail.com', balance: 0.00 }
];

// 1. API: Get all users
app.get('/api/admin/users', (req, res) => {
    try {
        res.json({ success: true, users: usersData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2. API: Update user balance
app.post('/api/admin/update-balance', (req, res) => {
    const { email, amount, action } = req.body;

    let user = usersData.find(u => u.email === email || u.name === email);
    if (!user) {
        return res.status(404).json({ success: false, message: 'រកមិនឃើញ User នេះទេ!' });
    }

    const val = parseFloat(amount) || 0;
    if (action === 'add' || action === '+') {
        user.balance += val;
    } else if (action === 'subtract' || action === '-') {
        user.balance = Math.max(0, user.balance - val);
    } else {
        user.balance = val;
    }

    return res.json({ 
        success: true, 
        message: `កែប្រែ Balance ឱ្យ ${user.name} ជោគជ័យ!`,
        newBalance: user.balance 
    });
});

// Serve Admin Dashboard HTML File
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
