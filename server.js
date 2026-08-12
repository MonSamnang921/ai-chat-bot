const express = require('express');
const path = require('path');
const cors = require('cors');

let BakongKHQR, khqrData, IndividualInfo;
try {
    const bakong = require('bakong-khqr');
    BakongKHQR = bakong.BakongKHQR;
    khqrData = bakong.khqrData;
    IndividualInfo = bakong.IndividualInfo;
} catch (e) {
    console.error("Warning: bakong-khqr package not loaded yet.", e.message);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// API បង្កើត KHQR Code
app.post('/api/generate-khqr', (req, res) => {
    try {
        const { amount } = req.body;

        if (!BakongKHQR) {
            return res.status(500).json({ success: false, error: "Bakong SDK Not Loaded" });
        }

        const optionalData = {
            currency: khqrData.currency.usd,
            amount: parseFloat(amount || 0.99),
            mobileNumber: "855973777105",
            storeLabel: "FF Topup",
            terminalLabel: "Web"
        };

        const individualInfo = new IndividualInfo(
            "samnang_mon@bkrt",
            "SAMNANG MON",
            "Phnom Penh",
            optionalData
        );

        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo);

        if (response && response.status && response.status.code === 0) {
            return res.json({ success: true, qrString: response.data.qr });
        } else {
            return res.status(500).json({ success: false, error: "Cannot generate QR" });
        }
    } catch (err) {
        console.error("Error generating KHQR:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Route ទំព័រដើម
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// កំណត់ Port សម្រាប់ Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
