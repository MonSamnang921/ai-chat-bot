async function generatePayment() {
    const playerId = document.getElementById('playerId').value;

    if (!playerId) {
        alert('សូមបញ្ចូល Player ID!');
        return;
    }
    if (selectedDiamond === 0) {
        alert('សូមជ្រើសរើសកញ្ចប់ពេជ្រ!');
        return;
    }

    document.getElementById('orderSummary').innerText = `ID: ${playerId} | 💎 ${selectedDiamond} ពេជ្រ | $${selectedPrice}`;

    try {
        // ហៅទៅ Backend ដើម្បីយក KHQR String ពិតប្រាកដ
        const res = await fetch('/api/generate-khqr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: selectedPrice })
        });
        
        const data = await res.json();

        if (data.success) {
            // យក KHQR String ស្តង់ដារទៅបង្កើតជា QR Code
            QRCode.toCanvas(document.getElementById('qrcodeCanvas'), data.qrString, { width: 220 });
            
            document.getElementById('qrModal').style.display = 'flex';
        } else {
            alert('មិនអាចបង្កើត KHQR បានទេ!');
        }
    } catch (err) {
        console.error(err);
        alert('មានបញ្ហាក្នុងការទាក់ទងទៅ Server!');
    }
}
