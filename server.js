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
        
        // កំណត់តម្លៃ Amount និងព័ត៌មាន KHQR
        const qrAmount = parseFloat(amount) || 1.00;
        
        const optionalData = {
            currency: khqrData.currency.usd,
            amount: qrAmount,
            mobileNumber: '85590217653',
            storeLabel: 'KhmerSMM',
            terminalLabel: service || 'Online Service'
        };

        const individualInfo = new IndividualInfo(
            'mon_samnang@bkrt',
            'SAMNANG MON',
            'Phnom Penh',
            optionalData
        );

        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo);

        if (response && response.data && response.data.qr) {
            return res.json({
                success: true,
                qrImage: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(response.data.qr)}`,
                md5: response.data.md5
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'មិនអាចបង្កើត KHQR Code បានទេ'
            });
        }
    } catch (error) {
        console.error('KHQR Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error: ' + error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
