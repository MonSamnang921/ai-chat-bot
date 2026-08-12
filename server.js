const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// Serve static files ចេញពី folder បច្ចុប្បន្ន (Root) ឬ public
app.use(express.static(__dirname));

// Route សម្រាប់ទំព័រដើម
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// កំណត់ Port សម្រាប់ Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
