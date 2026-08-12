const express = require('express');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// API សម្រាប់បង្កើត KHQR String ត្រឹមត្រូវតាមស្តង់ដារ Bakong
app.post('/api/generate-khqr', (req, res) => {
    const { amount } = req.body;

    const optionalData = {
        currency: khqrData.currency.usd, // ប្រើ usd ឬ khr
        amount: parseFloat(amount),
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

    if (response.status.code === 0) {
        res.json({ success: true, qrString: response.data.qr });
    } else {
        res.status(500).json({ success: false, error: response.status.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
