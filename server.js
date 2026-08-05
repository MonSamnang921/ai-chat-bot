const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Point ទៅកាន់ folder public
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Sample Data
let usersData = [
    { id: '1', name: 'Mon Samnang', email: 'samnang@gmail.com', balance: 50.00 },
    { id: '2', name: 'Nang User', email: 'nang@gmail.com', balance: 12.50 }
];

// 1. Root Endpoint -> Direct ទៅកាន់ index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// 2. Admin Endpoint -> Direct ទៅកាន់ admin.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin.html'));
});

// 3. API Endpoints
app.get('/api/admin/users', (req, res) => {
    res.json({ success: true, users: usersData });
});

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

// Catch-all Route សម្រាប់ការពារ "Not Found" ពេលបាញ់ទៅ Path ផ្សេងៗ
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Port Handling សម្រាប់ Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
