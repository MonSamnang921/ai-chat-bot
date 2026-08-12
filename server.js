const path = require('path');
const express = require('express');
const app = express();

// កែកូដត្រង់ចំណុច Serve Static Files
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
