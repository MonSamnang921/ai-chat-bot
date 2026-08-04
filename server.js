const express = require('express');
const path = require('path');
const { BakongKHQR } = require('bakong-khqr');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// បម្រើទំព័រដើម HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API សម្រាប់បង្កើត KHQR Code
app.post('/generate-qr', (req, res) => {
    try {
        const { amount } = req.body;

        const optionalData = {
            currency: 'USD',
            amount: parseFloat(amount) || 1.00,
            mobileNumber: '85512345678', // អាចប្តូរតាមលេខទូរស័ព្ទគណនីបាគងរបស់អ្នក
            storeLabel: 'KhmerSMM Store',
            terminalLabel: 'Online Web',
            billNumber: 'INV-' + Date.now()
        };

        // បង្កើតទិន្នន័យ KHQR តាមរយៈ Instance របស់ BakongKHQR
        const khqr = new BakongKHQR();
        const khqrResponse = khqr.generateIndividual(optionalData);

        if (khqrResponse && khqrResponse.data) {
            return res.json({
                success: true,
                qrImage: khqrResponse.data.qr,
                md5: khqrResponse.data.md5
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'មិនអាចបង្កើត KHQR Code បានទេ'
            });
        }
    } catch (error) {
        console.error('KHQR Generation Error:', error);
        return res.status(500).json({
            success: false,
            message: 'មានបញ្ហាបច្ចេកទេសក្នុង Server: ' + error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
