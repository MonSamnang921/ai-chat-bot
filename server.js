const express = require('express');
const { KHQR, BakongKHQR } = require('bakong-khqr');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
app.use(express.json());

// បង្កើត API សម្រាប់បង្កើត Bakong KHQR
app.post('/generate-qr', async (req, res) => {
    try {
        const { amount, serviceName } = req.body;
        
        const optionalData = {
            currency: BakongKHQR.currency.usd,
            amount: parseFloat(amount),
            mobileNumber: "85512345678",
            storeLabel: "KhmerSMM",
            terminalLabel: "Online Store",
            billNumber: "INV-" + Date.now().toString().slice(-6)
        };

        const khqr = new BakongKHQR();
        const response = khqr.generateMerchantWithOptional({
            bakongAccountId: "mon_samnang@bkrt",
            merchantName: "KhmerSMM",
            merchantCity: "Phnom Penh",
            merchantId: "123456",
            acquiringBank: "Dev Bank"
        }, optionalData);

        if (response.status.code === 0) {
            const qrImageDataUrl = await QRCode.toDataURL(response.data.qr);
            res.json({
                success: true,
                qrCode: qrImageDataUrl,
                md5: response.data.md5,
                amount: amount,
                service: serviceName
            });
        } else {
            res.status(400).json({ success: false, message: "ការបង្កើត QR បរាជ័យ" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
