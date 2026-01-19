const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Use JSON file database for local development
const { db } = process.env.MONGODB_URI ? require('../database/mongodb') : require('../database/db');

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, username);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);

        // Generate token
        const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({
            message: 'Welcome to Derry...',
            token,
            user: { id: result.lastInsertRowid, username, email }
        });
    } catch (error) {
        console.error('Register error:', error);
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
        const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
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
        console.error('Login error:', error);
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
        const user = await db.prepare('SELECT * FROM users WHERE email = ? AND username = ?').get(email, username);
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please check your email and username.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);

        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

// Delete Account
router.delete('/delete-account', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access denied' });
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const userId = verified.userId;

        // Delete user's todos first
        await db.prepare('DELETE FROM todos WHERE user_id = ?').run(userId);
        
        // Delete user
        await db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        res.json({ message: 'Account deleted successfully. You have left Derry...' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
