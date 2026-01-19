const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationScheduler = require('../utils/notificationScheduler');

// Get pending notifications for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const notifications = await notificationScheduler.getNotifications(req.userId);
        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

// Mark notification as read (for future use)
router.post('/read/:id', authenticateToken, async (req, res) => {
    try {
        // In production, mark notification as read in database
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

module.exports = router;
