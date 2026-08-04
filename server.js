// ប្រកាស Array រក្សាទុក Users (ដាក់នៅខាងលើ Admin API)
let users = [];

// ================= SIGN UP API ================= //
app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'សូមបញ្ចូលព័ត៌មានឲ្យគ្រប់!' });
    }

    // ពិនិត្យមើលក្រែងលោមាន account ហ្នឹងហើយ
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username ឬ Email នេះមានគេប្រើហើយ!' });
    }

    // បង្កើត user ថ្មី (ផ្តល់ balance ដំបូង 0$)
    const newUser = {
        id: Date.now(),
        username,
        email,
        password,
        balance: 0.00
    };

    users.push(newUser);

    return res.json({
        success: true,
        message: 'ចុះឈ្មោះជោគជ័យ!',
        user: newUser
    });
});
