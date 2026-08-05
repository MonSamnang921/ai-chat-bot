const express = require('express');
const path = require('path');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ទិន្នន័យ User ក្នុង Memory (In-Memory Storage)
let usersData = [];

// API 1: ចុះឈ្មោះ ឬ Sign-in រួច Sync ទៅ Admin
app.post('/api/register', (req, res) => {
    const { name, email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let user = usersData.find(u => u.email === email);
    if (!user) {
        user = {
            id: usersData.length + 1,
            name: name || email.split('@')[0],
            email: email,
            balance: 0.00
        };
        usersData.push(user);
    }
    res.json({ success: true, user });
});

// API 2: ទាញយកបញ្ជី User ទាំងអស់សម្រាប់ Admin
app.get('/api/admin/users', (req, res) => {
    res.json(usersData);
});

// API 3: កែប្រែ Balance របស់ User ដោយ Admin
app.post('/api/admin/update-balance', (req, res) => {
    const { email, balance } = req.body;
    const user = usersData.find(u => u.email === email);
    if (user) {
        user.balance = parseFloat(balance);
        res.json({ success: true, user });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
});

// API 4: បង្កើត Bakong KHQR String ផ្លូវការ (ប្រើ Bakong ID របស់អ្នក)
app.post('/api/generate-khqr', (req, res) => {
    try {
        const { amount } = req.body;

        const optionalData = {
            currency: khqrData.currency.usd,
            amount: parseFloat(amount || 0.50),
            mobileNumber: "85590217653",
            storeLabel: "KhmerSMM",
            terminalLabel: "OnlineStore"
        };

        const individualInfo = new IndividualInfo(
            "mon_samnang@bkrt",   // Bakong ID របស់អ្នក
            "SAMNANG MON",        // ឈ្មោះគណនី Bakong របស់អ្នក
            "Phnom Penh",
            optionalData
        );

        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo);

        if (response && response.status && response.status.code === 0) {
            res.json({ success: true, qrString: response.data.qr });
        } else {
            res.status(500).json({ 
                success: false, 
                message: response?.status?.message || ' Failed to generate KHQR string' 
            });
        }
    } catch (error) {
        console.error("KHQR Generation Error:", error);
        res.status(500).json({ success: false, message: 'Server Internal Error' });
    }
});

// Handling fallback route 
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
