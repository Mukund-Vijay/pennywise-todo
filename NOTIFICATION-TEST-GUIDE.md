# 🔔 Notification Testing Guide

## ✅ Server Status
Your server is now running at http://localhost:3000 with the notification scheduler active!

## 📋 Step-by-Step Testing Instructions

### Step 1: Enable Notifications in Browser
1. Open http://localhost:3000 in your browser
2. Login to your account
3. Look for the notification permission prompt - **CLICK "ALLOW"**
4. You should see: "🔔 Notifications enabled! You'll get reminders 10 minutes before tasks."

### Step 2: Test Basic Notification
1. Click the **🔔 Test Notification** button (should be visible after allowing permissions)
2. You should immediately see a test notification pop up
3. If this works, your browser notifications are working correctly ✅

### Step 3: Create a Task with Notification
1. Set a time that's **15-20 minutes from now**
   - Example: If it's 2:00 PM now, set time to 2:18 PM
   
2. Check the **"Set start time"** checkbox

3. Pick a date (today's date)

4. Enter your task text (e.g., "Test notification task")

5. Click **Add** button

6. **Open browser console (F12)** to see detailed logs

### Step 4: What to Look For

#### In Browser Console (F12 → Console tab):
You should see logs like:
```
📝 === CREATING TODO ===
Text: Test notification task
Start time: 14:18
Target date: 2026-01-19

🔔 === SCHEDULING NOTIFICATION ===
Todo: {...}
📅 Target datetime: 2026-01-19T14:18:00
⏰ Reminder time: 2026-01-19T14:08:00
✅ Scheduled notification for "Test notification task" at 1/19/2026, 2:08:00 PM (in 6 minutes)

🔄 Checking backend for notifications... (every 30 seconds)
```

#### In Server Terminal:
Look for:
```
🔔 Notification scheduler started
🔍 Checking for notifications... (every 60 seconds)
📝 Found X todos to check
```

### Step 5: Wait for Notification
- **Frontend check**: Runs every 30 seconds via polling
- **Backend check**: Runs every 60 seconds
- **Direct setTimeout**: If task is within 24 hours

You should get a notification **10 minutes before** your set time!

## 🐛 Troubleshooting

### "Notifications blocked" message?
1. Click the 🔒 or ℹ️ icon in browser address bar
2. Change "Notifications" to **Allow**
3. Refresh the page

### No test notification button?
- Notification permission not granted
- Refresh page and allow permissions

### Task created but no notification?
Check these in browser console (F12):
1. **Notification permission**: Should show "Notification permission already granted"
2. **Scheduled notification log**: Should show "✅ Scheduled notification..."
3. **Target datetime**: Should show correct future date/time
4. **Minutes until reminder**: Should be positive number

### Server logs showing errors?
Check the terminal where `node server.js` is running for any error messages.

## 📊 Expected Behavior

### Immediate (when creating task):
- ✅ Task appears in list with date and time badge
- ✅ Console shows scheduling confirmation
- ✅ Task grouped under correct date

### Every 30 seconds:
- ✅ Frontend polls backend for pending notifications
- ✅ Console shows "🔄 Checking backend for notifications..."

### Every 60 seconds:
- ✅ Backend scheduler checks database
- ✅ Server logs "🔍 Checking for notifications..."

### 10 minutes before task time:
- ✅ Browser notification appears
- ✅ Sound plays (if allowed)
- ✅ Notification stays until dismissed

## 🎯 Quick Test (5 Minutes)

For fastest testing:
1. Set task time to **5 minutes from now**
2. You'll get notification in **5 minutes minus 10 minutes** = notification will fail (time already passed)

Better: Set task time to **15 minutes from now** = notification in 5 minutes ✅

## 📞 Still Not Working?

If notifications still don't work after following all steps:

1. **Share your browser console logs** (F12 → Console tab)
2. **Share your server terminal logs**
3. **Confirm**:
   - ✅ Browser allowed notifications
   - ✅ Test notification button worked
   - ✅ Task time is at least 11 minutes in future
   - ✅ Task has both date and time set
   - ✅ You waited long enough (10 min before task time)

