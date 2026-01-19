// Backend notification scheduler for reliable push notifications
const { db } = process.env.MONGODB_URI ? require('../database/mongodb') : require('../database/db');

class NotificationScheduler {
    constructor() {
        this.checkInterval = 60000; // Check every 1 minute
        this.notificationWindow = 10; // Minutes before task to send notification
        this.intervalId = null;
        this.sentNotifications = new Set(); // Track sent notifications
    }

    start() {
        console.log('🔔 Notification scheduler started');
        this.intervalId = setInterval(() => this.checkAndSendNotifications(), this.checkInterval);
        // Run immediately on start
        this.checkAndSendNotifications();
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            console.log('🔕 Notification scheduler stopped');
        }
    }

    async checkAndSendNotifications() {
        try {
            const now = new Date();
            const tenMinutesFromNow = new Date(now.getTime() + this.notificationWindow * 60 * 1000);
            
            // Get all incomplete tasks with target_datetime
            const allTodos = await db.prepare('SELECT * FROM todos WHERE completed = 0').all();
            
            for (const todo of allTodos) {
                if (!todo.target_datetime || !todo.user_id) continue;
                
                const taskTime = new Date(todo.target_datetime);
                const reminderTime = new Date(taskTime.getTime() - this.notificationWindow * 60 * 1000);
                
                // Check if reminder time is within the next minute
                if (reminderTime >= now && reminderTime <= tenMinutesFromNow) {
                    const notificationKey = `${todo.id}_${reminderTime.getTime()}`;
                    
                    if (!this.sentNotifications.has(notificationKey)) {
                        await this.sendNotification(todo);
                        this.sentNotifications.add(notificationKey);
                        
                        // Clean up old notifications from Set (older than 1 hour)
                        if (this.sentNotifications.size > 1000) {
                            const oldEntries = Array.from(this.sentNotifications).slice(0, 500);
                            oldEntries.forEach(key => this.sentNotifications.delete(key));
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    async sendNotification(todo) {
        try {
            const taskTime = new Date(todo.target_datetime);
            const formattedTime = taskTime.toLocaleString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            console.log(`🔔 Sending notification for task: "${todo.text}" at ${formattedTime}`);
            
            // Store notification in database for client to fetch
            // In a production system, you'd use Web Push API here
            const notification = {
                id: Date.now(),
                todo_id: todo.id,
                user_id: todo.user_id,
                title: '⏰ Task Reminder - 10 minutes!',
                message: `"${todo.text}" starts in 10 minutes! Time to float... with productivity!`,
                created_at: new Date().toISOString(),
                read: false
            };
            
            // For now, log it (in production, send via Web Push API)
            console.log('Notification:', notification);
            
            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    async getNotifications(userId) {
        try {
            // In production, this would fetch from a notifications table
            // For now, return pending notifications for tasks
            const todos = await db.prepare('SELECT * FROM todos WHERE user_id = ? AND completed = 0').all(userId);
            const now = new Date();
            
            const pendingNotifications = todos
                .filter(todo => todo.target_datetime)
                .map(todo => {
                    const taskTime = new Date(todo.target_datetime);
                    const reminderTime = new Date(taskTime.getTime() - this.notificationWindow * 60 * 1000);
                    const minutesUntil = Math.round((reminderTime.getTime() - now.getTime()) / 60000);
                    
                    return {
                        todo_id: todo.id,
                        text: todo.text,
                        reminder_time: reminderTime,
                        minutes_until: minutesUntil,
                        should_notify: minutesUntil <= 1 && minutesUntil >= 0
                    };
                })
                .filter(n => n.should_notify);
            
            return pendingNotifications;
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }
}

// Export singleton instance
const scheduler = new NotificationScheduler();

module.exports = scheduler;
