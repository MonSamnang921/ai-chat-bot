const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files ចេញពី folder public ( CSS, JS, Images, HTML )
app.use(express.static(path.join(__dirname, 'public')));

// Sample Users Data
let usersData = [
    { id: '1', name: 'Mon Samnang', email: 'samnang@gmail.com', balance: 50.00 },
    { id: '2', name: 'Nang User', email: 'nang@gmail.com', balance: 12.50 }
];

// 1. Root Route -> Render ទំព័រដើម index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. Admin Route -> Render ទំព័រ admin.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
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

// Port Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
