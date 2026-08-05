const express = require('express');
const path = require('path');
const fs = require('fs');

let BakongKHQR, khqrData, IndividualInfo;
try {
    const bakong = require('bakong-khqr');
    BakongKHQR = bakong.BakongKHQR;
    khqrData = bakong.khqrData;
    IndividualInfo = bakong.IndividualInfo;
} catch (e) {
    console.error("Warning: bakong-khqr package missing from dependencies!", e.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ១. Serve static files ពី folder public
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// ទិន្នន័យ User ក្នុង Memory
let usersData = [];

// API 1: Register/Sync User
app.post('/api/register', (req, res) => {
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    let user = usersData.find(u => u.email === email);
    if (!user) {
        user = { id: usersData.length + 1, name: name || email.split('@')[0], email, balance: 0.00 };
        usersData.push(user);
    }
    res.json({ success: true, user });
});

// API 2: Admin Get Users
app.get('/api/admin/users', (req, res) => res.json(usersData));

// API 3: Update Balance
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

// API 4: Generate KHQR String
app.post('/api/generate-khqr', (req, res) => {
    try {
        if (!BakongKHQR) {
            return res.status(500).json({ success: false, message: 'Bakong SDK Not Installed' });
        }
        const { amount } = req.body;
        const optionalData = {
            currency: khqrData.currency.usd,
            amount: parseFloat(amount || 0.50),
            mobileNumber: "85590217653",
            storeLabel: "KhmerSMM",
            terminalLabel: "OnlineStore"
        };

        const individualInfo = new IndividualInfo(
            "mon_samnang@bkrt",
            "SAMNANG MON",
            "Phnom Penh",
            optionalData
        );

        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo);

        if (response && response.status && response.status.code === 0) {
            res.json({ success: true, qrString: response.data.qr });
        } else {
            res.status(500).json({ success: false, message: response?.status?.message || 'KHQR Error' });
        }
    } catch (error) {
        console.error("KHQR Error:", error);
        res.status(500).json({ success: false, message: 'Server Internal Error' });
    }
});

// ២. Catch-all Route សម្រាប់ Send File index.html (ការពារ Not Found)
app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Error: index.html not found inside public/ folder.');
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
