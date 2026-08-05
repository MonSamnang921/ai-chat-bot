const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// បញ្ជី Users រក្សាទុកក្នុង Memory (Global Array)
let usersData = [
    { id: '1', name: 'Mon Samnang', email: 'samnang@gmail.com', balance: 50.00 },
    { id: '2', name: 'Nang User', email: 'nang@gmail.com', balance: 12.50 }
];

// 1. Route សម្រាប់ទទួលទិន្នន័យពេល User ចុះឈ្មោះ (Register / Google Login)
app.post('/api/register', (req, res) => {
    const { name, email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'សូមបញ្ចូល Email!' });
    }

    // ពិនិត្យមើលថាបើមាន Email ហ្នឹងរួចហើយ មិនបាច់បង្កើតស្ទួនទេ
    let existingUser = usersData.find(u => u.email === email);
    if (existingUser) {
        return res.json({ success: true, message: 'User មានរួចហើយ', user: existingUser });
    }

    // បង្កើត User ថ្មី ហើយបញ្ចូលទៅក្នុងបញ្ជី usersData
    const newUser = {
        id: (usersData.length + 1).toString(),
        name: name || email.split('@')[0],
        email: email,
        balance: 0.00 // ឱ្យសសមតុល្យដើម 0.00$
    };

    usersData.push(newUser);
    return res.json({ success: true, message: 'ចុះឈ្មោះជោគជ័យ!', user: newUser });
});

// 2. Route សម្រាប់ Admin ទាញយកបញ្ជី Users ទាំងអស់
app.get('/api/admin/users', (req, res) => {
    res.json({ success: true, users: usersData });
});

// 3. Route សម្រាប់ Admin កែសម្រួល Balance
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

// Front-end Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'), (err) => {
        if (err) res.sendFile(path.join(__dirname, 'admin.html'));
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
