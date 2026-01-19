const express = require('express');
const router = express.Router();
const { db } = require('../database/mongodb');
const { authenticateToken } = require('../middleware/auth');

// Get all todos for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const todos = await db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
        res.json(todos);
    } catch (error) {
        console.error('Fetch todos error:', error);
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

// Create todo
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { text, scheduled_day, start_time } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const result = await db.prepare('INSERT INTO todos (user_id, text, scheduled_day, start_time) VALUES (?, ?, ?, ?)').run(
            req.userId, 
            text, 
            scheduled_day !== undefined ? scheduled_day : null,
            start_time || null
        );

        const todo = await db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(todo);
    } catch (error) {
        console.error('Create todo error:', error);
        res.status(500).json({ error: 'Failed to create todo' });
    }
});

// Update todo
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { completed, text, scheduled_day, completed_date, start_time } = req.body;
        const { id } = req.params;

        // Verify ownership
        const todo = await db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, req.userId);
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        await db.prepare('UPDATE todos SET completed = ?, text = ?, scheduled_day = ?, completed_date = ?, start_time = ? WHERE id = ?')
            .run(
                completed !== undefined ? completed : todo.completed, 
                text || todo.text, 
                scheduled_day !== undefined ? scheduled_day : todo.scheduled_day,
                completed_date !== undefined ? completed_date : todo.completed_date,
                start_time !== undefined ? start_time : todo.start_time,
                id
            );

        const updatedTodo = await db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
        res.json(updatedTodo);
    } catch (error) {
        console.error('Update todo error:', error);
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

// Delete todo
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const todo = await db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, req.userId);
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        await db.prepare('DELETE FROM todos WHERE id = ?').run(id);
        res.json({ message: 'Todo sent to the deadlights' });
    } catch (error) {
        console.error('Delete todo error:', error);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

// Get weekly summary
router.get('/summary/weekly', authenticateToken, async (req, res) => {
    try {
        const todos = await db.prepare('SELECT * FROM todos WHERE user_id = ?').all(req.userId);
        
        // Calculate weekly stats
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of this week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        // Group todos by scheduled days
        const dayStats = {
            0: { name: 'Sunday', scheduled: 0, completed: 0, onTime: 0 },
            1: { name: 'Monday', scheduled: 0, completed: 0, onTime: 0 },
            2: { name: 'Tuesday', scheduled: 0, completed: 0, onTime: 0 },
            3: { name: 'Wednesday', scheduled: 0, completed: 0, onTime: 0 },
            4: { name: 'Thursday', scheduled: 0, completed: 0, onTime: 0 },
            5: { name: 'Friday', scheduled: 0, completed: 0, onTime: 0 },
            6: { name: 'Saturday', scheduled: 0, completed: 0, onTime: 0 }
        };
        
        let totalScheduled = 0;
        let totalCompleted = 0;
        let completedOnTime = 0;
        
        todos.forEach(todo => {
            if (todo.scheduled_day !== null && todo.scheduled_day !== undefined) {
                const day = parseInt(todo.scheduled_day);
                if (dayStats[day]) {
                    dayStats[day].scheduled++;
                    totalScheduled++;
                    
                    if (todo.completed) {
                        dayStats[day].completed++;
                        totalCompleted++;
                        
                        // Check if completed on the scheduled day
                        if (todo.completed_date) {
                            const completedDate = new Date(todo.completed_date);
                            if (completedDate.getDay() === day) {
                                dayStats[day].onTime++;
                                completedOnTime++;
                            }
                        }
                    }
                }
            }
        });
        
        // Find most and least productive days
        let mostProductiveDay = null;
        let leastProductiveDay = null;
        let maxCompletion = -1;
        let minCompletion = 101;
        
        Object.entries(dayStats).forEach(([day, stats]) => {
            if (stats.scheduled > 0) {
                const completionRate = (stats.completed / stats.scheduled) * 100;
                
                if (completionRate > maxCompletion) {
                    maxCompletion = completionRate;
                    mostProductiveDay = { ...stats, day: parseInt(day), completionRate };
                }
                
                if (completionRate < minCompletion) {
                    minCompletion = completionRate;
                    leastProductiveDay = { ...stats, day: parseInt(day), completionRate };
                }
            }
        });
        
        res.json({
            dayStats,
            totalScheduled,
            totalCompleted,
            completedOnTime,
            completionRate: totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0,
            onTimeRate: totalCompleted > 0 ? Math.round((completedOnTime / totalCompleted) * 100) : 0,
            mostProductiveDay,
            leastProductiveDay
        });
    } catch (error) {
        console.error('Weekly summary error:', error);
        res.status(500).json({ error: 'Failed to get summary' });
    }
});

module.exports = router;
