// Get all users
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, 'id name email balance');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update user balance
app.post('/api/admin/update-balance', async (req, res) => {
    const { email, newBalance } = req.body;
    try {
        await User.updateOne({ email }, { balance: parseFloat(newBalance) });
        res.json({ success: true, message: 'ធ្វើបច្ចុប្បន្នភាព Balance ជោគជ័យ!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'មិនអាចកែប្រែ Balance បានទេ' });
    }
});
