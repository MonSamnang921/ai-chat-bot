const express = require('express');
const app = express(); // 👈 ប្រកាស app នៅលើគេបែបនេះ

app.use(express.json());
app.use(express.static(__dirname)); // 👈 សម្រាប់ឱ្យដើរ admin.html

// ... កូដចាស់ៗរបស់បងទាំងអស់នៅកណ្តាលនេះ ...

// ================= ADMIN ADD/DEDUCT BALANCE ================= //
// 👈 យកកូដ API មកដាក់នៅខាងក្រោមនេះ (ក្រោម app និងក្រោម users array)
app.post('/api/admin/update-balance', (req, res) => {
    const { username, amount, type, adminKey } = req.body;

    if (adminKey !== '123456') {
        return res.status(403).json({ success: false, message: 'Admin Key មិនត្រឹមត្រូវ!' });
    }

    if (!username || !amount || isNaN(amount)) {
        return res.status(400).json({ success: false, message: 'សូមបញ្ចូលទិន្នន័យឲ្យបានត្រឹមត្រូវ' });
    }

    const user = users.find(u => u.username === username || u.email === username);

    if (!user) {
        return res.status(404).json({ success: false, message: 'រកមិនឃើញ User នេះទេ!' });
    }

    const value = parseFloat(amount);
    
    if (type === 'add') {
        user.balance += value;
    } else if (type === 'deduct') {
        user.balance = Math.max(0, user.balance - value);
    } else {
        return res.status(400).json({ success: false, message: 'Type ត្រូវតែជា add ឬ deduct' });
    }

    return res.json({
        success: true,
        message: `បច្ចុប្បន្នភាពជោគជ័យ!`,
        username: user.username,
        newBalance: user.balance
    });
});

// 👈 ដាក់ app.listen នៅក្រោមគេបង្អស់
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
