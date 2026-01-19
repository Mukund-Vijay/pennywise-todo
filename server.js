const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const notificationRoutes = require('./routes/notifications');
const { connectDB } = require('./database/mongodb');
const notificationScheduler = require('./utils/notificationScheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for production
app.set('trust proxy', 1);

// Prevent caching for dynamic files
app.use((req, res, next) => {
    if (req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.html')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
    next();
});

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server with MongoDB connection
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🎈 Pennywise Todo Server floating on port ${PORT}`);
            console.log(`🤡 Open http://localhost:${PORT} to enter Derry...`);
            
            // Start notification scheduler
            notificationScheduler.start();
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    notificationScheduler.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    notificationScheduler.stop();
    process.exit(0);
});

startServer();
