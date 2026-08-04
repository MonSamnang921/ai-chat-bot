// ================= ADMIN ADD/DEDUCT BALANCE ================= //
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
