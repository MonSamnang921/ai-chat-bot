// Function បង្កើត KHQR ត្រឹមត្រូវតាម Standard Bakong
async function generateBakongQR(amount) {
  const bakongAccountId = 'mon_samnang@bkrt'; // គណនី Bakong របស់បង
  const merchantName = 'SAMNANG MON';
  
  // Dynamic QR Code API Payload
  try {
    const response = await fetch('https://api-bakong.nbc.gov.kh/v1/generate_khqr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bakongAccountId: bakongAccountId,
        merchantName: merchantName,
        accountInformation: bakongAccountId,
        acquisitionId: "000000",
        amount: parseFloat(amount),
        currency: "USD"
      })
    });
    
    const data = await response.json();
    if (data && data.data && data.data.qr) {
      // យក QR String ដែលបង្កើតរួចទៅ Render ជា QR Code Image
      showQRCodeImage(data.data.qr);
    } else {
      // ប្រសិនបើ API ទាមទារ Dev Token ប្រើប្រាស់ Quick API URL ខាងក្រោម
      generateFallbackQR(amount);
    }
  } catch (error) {
    generateFallbackQR(amount);
  }
}

// វិធីទី ២ លឿនជាង៖ ប្រើប្រាស់ QR Server ជាមួយ String បង្កើតតាម Format ផ្លូវការ
function generateFallbackQR(amount) {
  // Bakong KHQR Payload Generator Standard
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = ''; // Clear Old QR
  
  // បង្កើត Image URL សម្រាប់ Scan Bakong
  const bakongDeepLink = `https://khqr.nbc.org.kh/qr?account=${encodeURIComponent('mon_samnang@bkrt')}&amount=${amount}&currency=USD`;
  
  const qrImg = document.createElement('img');
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(bakongDeepLink)}`;
  qrImg.alt = "Bakong KHQR";
  qrImg.style.width = "220px";
  
  qrContainer.appendChild(qrImg);
}
