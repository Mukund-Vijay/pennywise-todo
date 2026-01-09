const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
app.use(express.static('public'));

// Serve service worker and manifest from root
app.get('/service-worker.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'service-worker.js'));
});

app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'manifest.json'));
});

// Initialize database
db.initialize();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🎈 Pennywise Todo Server floating on port ${PORT}`);
    console.log(`🤡 Open http://localhost:${PORT} to enter Derry...`);
});
