const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/pennywise.json');

function readDB() {
    if (!fs.existsSync(DB_PATH)) {
        return { users: [], todos: [] };
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, username);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);

        // Generate token
        const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({
            message: 'Welcome to Derry...',
            token,
            user: { id: result.lastInsertRowid, username, email }
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            message: 'You\'ll float too...',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, username, newPassword } = req.body;

        if (!email || !username || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Find user by both email and username for security
        const user = db.prepare('SELECT * FROM users WHERE email = ? AND username = ?').get(email, username);
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please check your email and username.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);

        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

module.exports = router;
