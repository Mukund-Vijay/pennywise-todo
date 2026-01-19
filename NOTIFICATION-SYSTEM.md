# Pennywise Todo - Notification System Documentation

## Overview
The app uses a **hybrid notification system (Option C)** combining frontend and backend approaches for maximum reliability.

## Architecture

### 1. Frontend Notifications (Short-term, < 24 hours)
- Uses browser's `setTimeout` API
- Schedules notifications when app is open
- Works for tasks within the next day
- **Limitation**: Requires browser/tab to stay open

### 2. Backend Scheduler (Long-term)
- Node.js scheduler checks database every minute
- Sends notifications for tasks with `target_datetime`
- Works even when browser is closed
- Logs notifications server-side

### 3. Frontend Polling (Hybrid sync)
- Frontend polls backend every 30 seconds
- Checks for pending notifications
- Shows browser notifications from backend
- Bridges gap between frontend and backend

## Database Fields

### New Fields Added:
```javascript
{
  target_date: "2026-01-26",           // Selected date (YYYY-MM-DD)
  target_datetime: "2026-01-26T18:00:00", // Full datetime for notifications
  start_time: "18:00",                 // Time component (HH:MM)
  scheduled_day: 0                     // Day of week (0-6, optional)
}
```

## Features

### ✅ Date Picker
- Select specific dates for tasks
- Shows formatted dates: "Sunday, Jan 26"
- Groups tasks by actual dates

### ✅ Date-based Grouping
- Tasks organized chronologically
- Shows day name + date: "Monday, Jan 27"
- Sorts by actual date, not just day-of-week

### ✅ Reliable Notifications
- **Frontend**: Immediate notifications for nearby tasks
- **Backend**: Scheduled notifications for future tasks
- **Polling**: Syncs backend notifications to frontend
- 10-minute advance warning before task time

### ✅ Test Notification Button
- 🔔 Test Notification button in footer
- Verifies notification permissions work
- Appears after granting permissions

## How It Works

### Creating a Task with Notifications:
1. Enter task text
2. Select day OR choose specific date
3. (Optional) Enable "Set start time"
4. Choose time → System calculates `target_datetime`
5. Backend scheduler tracks this datetime
6. Notification sent 10 minutes before

### Notification Flow:
```
Task Created
    ↓
target_datetime stored in DB
    ↓
Backend scheduler checks every 60 seconds
    ↓
10 minutes before task time:
    ├─→ Backend logs notification
    └─→ Frontend polls and shows browser notification
```

## Configuration

### Backend Scheduler Settings:
```javascript
checkInterval: 60000,      // Check every 1 minute (60000ms)
notificationWindow: 10     // Notify 10 minutes before
```

### Frontend Polling:
```javascript
pollInterval: 30000        // Check backend every 30 seconds
```

## API Endpoints

### Get Pending Notifications
```
GET /api/notifications
Authorization: Bearer <token>

Response:
[
  {
    todo_id: "123",
    text: "Task name",
    reminder_time: "2026-01-26T17:50:00",
    minutes_until: 5,
    should_notify: true
  }
]
```

## Browser Requirements
- Notification API support
- Must grant notification permissions
- Works in: Chrome, Firefox, Edge, Safari 16+

## Production Enhancements (Future)
1. **Web Push API**: True push notifications via service worker
2. **Email notifications**: Fallback for users without browser access
3. **SMS integration**: For critical tasks
4. **Notification preferences**: Per-task notification settings
5. **Snooze feature**: Delay notifications
6. **Notification history**: View past notifications

## Testing

### Test Notifications Locally:
1. Start server: `npm start`
2. Open http://localhost:3000
3. Grant notification permissions
4. Click "🔔 Test Notification" button
5. Create task for 15 minutes from now
6. Keep browser open - notification appears at -10 min mark

### Verify Backend Scheduler:
Check server logs for:
```
🔔 Notification scheduler started
🔔 Sending notification for task: "Task name" at Jan 26, 6:00 PM
```

## Troubleshooting

**No notifications appearing:**
- Check browser notification permissions (click lock icon in address bar)
- Ensure task has both date and time set
- Verify `target_datetime` is stored (check browser console logs)
- Keep browser tab open for testing
- Check backend logs for scheduler activity

**Backend scheduler not running:**
- Check server logs for "Notification scheduler started"
- Verify MongoDB connection (scheduler needs database access)
- Ensure PORT environment variable is set

**Notifications for past tasks:**
- System skips notifications if reminder time has passed
- Check console: "⏭️ Skipping past notification..."
- Create new task with future datetime to test

## File Structure
```
routes/
  └── notifications.js      # Notification API endpoints
utils/
  └── notificationScheduler.js  # Backend scheduler
public/
  └── app.js               # Frontend notification logic
```

## Dependencies
- None! Uses built-in Node.js and browser APIs
- Future: `web-push` for Web Push API
