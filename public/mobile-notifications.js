// Mobile-specific notification handler using Capacitor
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';

class MobileNotificationManager {
    constructor() {
        this.isInitialized = false;
        this.isMobile = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        // Check if we're running in a Capacitor environment
        if (window.Capacitor) {
            this.isMobile = true;
            await this.setupMobileNotifications();
        } else {
            // Fallback to web notifications
            this.setupWebNotifications();
        }
        
        this.isInitialized = true;
    }

    async setupMobileNotifications() {
        try {
            // Request permission for local notifications
            const permissionStatus = await LocalNotifications.requestPermissions();
            
            if (permissionStatus.display === 'granted') {
                console.log('✅ Mobile notification permissions granted');
                
                // Set up notification channels for Android
                await LocalNotifications.createChannel({
                    id: 'todo_reminders',
                    name: 'Todo Reminders',
                    description: 'Notifications for todo task reminders',
                    importance: 5,
                    visibility: 1,
                    sound: 'beep.wav',
                    vibration: true
                });

                // Listen for notification actions
                await LocalNotifications.addListener('localNotificationReceived', (notification) => {
                    console.log('Notification received:', notification);
                });

                await LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
                    console.log('Notification action performed:', notificationAction);
                    // Handle notification tap - could navigate to the specific todo
                    if (notificationAction.notification.extra?.todoId) {
                        this.handleNotificationTap(notificationAction.notification.extra.todoId);
                    }
                });

                // Setup push notifications
                await this.setupPushNotifications();
                
            } else {
                console.warn('⚠️ Notification permissions denied');
                alert('Please enable notifications in your device settings for todo reminders.');
            }
        } catch (error) {
            console.error('Error setting up mobile notifications:', error);
        }
    }

    async setupPushNotifications() {
        try {
            // Request push notification permissions
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.warn('Push notification permission denied');
                return;
            }

            // Register with Apple / Google to receive push via APNS/FCM
            await PushNotifications.register();

            // Listen for registration
            await PushNotifications.addListener('registration', (token) => {
                console.log('Push registration success, token: ' + token.value);
                // Send this token to your backend
                this.sendTokenToBackend(token.value);
            });

            await PushNotifications.addListener('registrationError', (error) => {
                console.error('Error on registration: ' + JSON.stringify(error));
            });

            // Show us the notification payload if the app is open
            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('Push notification received: ' + JSON.stringify(notification));
            });

            // Handle notification tap
            await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                console.log('Push notification action performed', JSON.stringify(notification));
                if (notification.notification.data?.todoId) {
                    this.handleNotificationTap(notification.notification.data.todoId);
                }
            });
        } catch (error) {
            console.error('Error setting up push notifications:', error);
        }
    }

    setupWebNotifications() {
        // Existing web notification code
        if ('Notification' in window && 'serviceWorker' in navigator) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('✅ Web notification permissions granted');
                }
            });
        }
    }

    async scheduleNotification(todo) {
        if (!this.isMobile) {
            // Use existing web notification system
            return this.scheduleWebNotification(todo);
        }

        try {
            const taskTime = new Date(todo.target_datetime);
            const reminderTime = new Date(taskTime.getTime() - 10 * 60 * 1000); // 10 minutes before
            const now = new Date();

            if (reminderTime <= now) {
                console.log('Reminder time is in the past, skipping notification');
                return;
            }

            // Schedule local notification
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: '🎈 Todo Reminder',
                        body: `"${todo.text}" is due in 10 minutes!`,
                        id: todo.id,
                        schedule: { at: reminderTime },
                        sound: 'beep.wav',
                        attachments: null,
                        actionTypeId: '',
                        extra: {
                            todoId: todo.id
                        },
                        channelId: 'todo_reminders'
                    }
                ]
            });

            console.log(`📱 Mobile notification scheduled for ${reminderTime.toLocaleString()}`);
            return true;
        } catch (error) {
            console.error('Error scheduling mobile notification:', error);
            return false;
        }
    }

    async cancelNotification(todoId) {
        if (!this.isMobile) {
            return;
        }

        try {
            await LocalNotifications.cancel({
                notifications: [{ id: todoId }]
            });
            console.log(`🚫 Cancelled notification for todo ${todoId}`);
        } catch (error) {
            console.error('Error cancelling notification:', error);
        }
    }

    async cancelAllNotifications() {
        if (!this.isMobile) {
            return;
        }

        try {
            await LocalNotifications.getPending().then(async (pending) => {
                const ids = pending.notifications.map(n => ({ id: n.id }));
                if (ids.length > 0) {
                    await LocalNotifications.cancel({ notifications: ids });
                    console.log(`🚫 Cancelled ${ids.length} pending notifications`);
                }
            });
        } catch (error) {
            console.error('Error cancelling all notifications:', error);
        }
    }

    scheduleWebNotification(todo) {
        // Existing web notification logic
        console.log('Using web notifications for:', todo.text);
    }

    handleNotificationTap(todoId) {
        // Handle when user taps on a notification
        console.log('User tapped notification for todo:', todoId);
        
        // Scroll to the todo item or highlight it
        const todoElement = document.querySelector(`[data-todo-id="${todoId}"]`);
        if (todoElement) {
            todoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            todoElement.classList.add('highlight');
            setTimeout(() => todoElement.classList.remove('highlight'), 2000);
        }
    }

    async sendTokenToBackend(token) {
        try {
            const response = await fetch('/api/notifications/register-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ deviceToken: token })
            });
            
            if (response.ok) {
                console.log('✅ Device token registered with backend');
            }
        } catch (error) {
            console.error('Error registering device token:', error);
        }
    }
}

// Export singleton instance
export const mobileNotifications = new MobileNotificationManager();
