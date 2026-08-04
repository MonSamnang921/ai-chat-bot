const express = require('express');
const path = require('path');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/generate-qr', (req, res) => {
    try {
        const { amount, service } = req.body;

        const parsedAmount = parseFloat(amount) || 1.0;

        // កំណត់ Expiration Time (ឧទាហរណ៍៖ ១០ នាទីបន្ទាប់ពីបង្កើត QR)
        const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds

        const optionalData = {
            currency: khqrData.currency.usd,
            amount: parsedAmount,
            mobileNumber: '85590217653',
            storeLabel: 'KhmerSMM',
            terminalLabel: service ? String(service).substring(0, 25) : 'Service',
            billNumber: 'INV-' + Date.now().toString().slice(-6),
            expirationTimestamp: expirationTime // បន្ថែមចំណុចនេះដើម្បីបំបាត់ Error 46
        };

        const individualInfo = new IndividualInfo(
            'mon_samnang@bkrt',
            'KhmerSmm',
            'Phnom Penh',
            optionalData
        );

        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo);

        if (response && response.data && response.data.qr) {
            const qrText = response.data.qr;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;

            return res.json({
                success: true,
                qrImage: qrImageUrl,
                md5: response.data.md5
            });
        } else {
            console.error('Bakong Response Invalid:', response);
            return res.status(400).json({
                success: false,
                message: 'មិនអាចបង្កើត KHQR Code បានទេ'
            });
        }
    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
