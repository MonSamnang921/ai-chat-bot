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

        // ចាប់យកតម្លៃ Price ចេញពី Option Value 
        const parsedAmount = parseFloat(amount) || 1.0;

        // កំណត់ Optional Data តាមទម្រង់ Standard របស់ Bakong SDK
        const optionalData = {
            currency: khqrData.currency.usd,
            amount: parsedAmount,
            mobileNumber: '85590217653',
            storeLabel: 'KhmerSMM',
            terminalLabel: service ? String(service).substring(0, 25) : 'Service',
            billNumber: 'INV-' + Date.now().toString().slice(-6)
        };

        const individualInfo = new IndividualInfo(
            'mon_samnang@bkrt',
            'SAMNANG MON',
            'Phnom Penh',
            optionalData
        );

        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo);

        // បើជោគជ័យ និងមាន string qr
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
                message: 'មិនអាចបង្កើត KHQR Code បានទេ (SDK Error)'
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
