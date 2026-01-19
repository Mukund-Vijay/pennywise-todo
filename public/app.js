const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || '{}');
let todos = [];
let currentFilter = 'all';

// Audio System - Disabled (audio files removed)
const sounds = {};

// Initialize audio
let audioInitialized = false;
function initAudio() {
    audioInitialized = true;
}

function playSound(soundName) {
    // Audio disabled
}

// DOM Elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const itemCount = document.getElementById('itemCount');
const clearCompleted = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');
const jumpscareModal = document.getElementById('jumpscareModal');
const closeJumpscare = document.getElementById('closeJumpscare');
const balloonCanvas = document.getElementById('balloonCanvas');
const ctx = balloonCanvas.getContext('2d');
const summaryModal = document.getElementById('summaryModal');
const weeklySummaryBtn = document.getElementById('weeklySummaryBtn');
const closeSummary = document.getElementById('closeSummary');
const dayRadios = document.querySelectorAll('.day-checkbox input[type="radio"]');
const logoutBtn = document.getElementById('logoutBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const enableTimeCheckbox = document.getElementById('enableTimeCheckbox');
const timeInputWrapper = document.getElementById('timeInputWrapper');
const todoTime = document.getElementById('todoTime');
const testNotificationBtn = document.getElementById('testNotificationBtn');

// Notification permission state
let notificationPermissionGranted = false;
let scheduledNotifications = new Map(); // Store timeout IDs for scheduled notifications

balloonCanvas.width = window.innerWidth;
balloonCanvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    balloonCanvas.width = window.innerWidth;
    balloonCanvas.height = window.innerHeight;
});

// Check auth
if (!token) window.location.href = '/auth.html';

// Request notification permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return;
    }
    
    if (Notification.permission === 'granted') {
        notificationPermissionGranted = true;
        console.log('Notification permission already granted');
    } else if (Notification.permission === 'default') {
        console.log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        notificationPermissionGranted = permission === 'granted';
        
        if (notificationPermissionGranted) {
            showNotification('🔔 Notifications enabled! You\'ll get reminders 10 minutes before tasks.');
            console.log('Notification permission granted');
            // Show test button
            if (testNotificationBtn) testNotificationBtn.style.display = 'inline-block';
        } else {
            console.warn('Notification permission denied');
            showNotification('⚠️ Notifications blocked. Enable them in browser settings for reminders.');
        }
    } else {
        console.warn('Notification permission denied');
    }
}

// Show browser notification
function showBrowserNotification(title, body, icon = '🎈') {
    if (!notificationPermissionGranted || !('Notification' in window)) {
        console.log('Cannot show notification - permission not granted');
        return;
    }
    
    try {
        console.log('Showing notification:', title);
        const notification = new Notification(title, {
            body: body,
            icon: icon,
            tag: 'pennywise-reminder',
            requireInteraction: true,
            silent: false,
            vibrate: [200, 100, 200]
        });
        
        playSound('click');
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        // Auto close after 30 seconds
        setTimeout(() => notification.close(), 30000);
    } catch (error) {
        console.error('Notification error:', error);
    }
}

// Schedule notification for a task
function scheduleNotification(todo) {
    if (!todo.start_time) {
        console.log(`No start time for todo ${todo.id}`);
        return;
    }
    
    if (!notificationPermissionGranted) {
        console.log('Notification permission not granted');
        return;
    }
    
    // Cancel existing notification for this todo if any
    if (scheduledNotifications.has(todo.id)) {
        clearTimeout(scheduledNotifications.get(todo.id));
        scheduledNotifications.delete(todo.id);
    }
    
    // Parse the scheduled day and time
    const now = new Date();
    const scheduledDate = new Date(now);
    
    // Set the scheduled day
    const currentDay = now.getDay();
    const targetDay = todo.scheduled_day;
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) daysUntil += 7;
    
    // Parse time to check if it's passed today
    const [taskHours, taskMinutes] = todo.start_time.split(':').map(Number);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const taskMinutesOfDay = taskHours * 60 + taskMinutes;
    
    // If same day but time has passed (including the 10-min reminder buffer), schedule for next week
    if (daysUntil === 0 && nowMinutes >= (taskMinutesOfDay - 10)) {
        daysUntil = 7;
        console.log(`Time has passed today, scheduling for next ${getDayName(targetDay)}`);
    }
    
    scheduledDate.setDate(now.getDate() + daysUntil);
    
    // Parse and set the time
    const [hours, minutes] = todo.start_time.split(':').map(Number);
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    // Calculate reminder time (10 minutes before)
    const reminderTime = new Date(scheduledDate.getTime() - 10 * 60 * 1000);
    
    // Calculate time until reminder
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    // Only schedule if reminder is in the future
    if (timeUntilReminder > 0) {
        const timeoutId = setTimeout(() => {
            console.log('Triggering notification for todo:', todo.id);
            showBrowserNotification(
                '⏰ Task Reminder - 10 minutes!',
                `"${todo.text}" starts in 10 minutes! Time to float... with productivity!`,
                '🎈'
            );
            scheduledNotifications.delete(todo.id);
        }, timeUntilReminder);
        
        scheduledNotifications.set(todo.id, timeoutId);
        console.log(`✅ Scheduled notification for "${todo.text}" at ${reminderTime.toLocaleString()} (in ${Math.round(timeUntilReminder/1000/60)} minutes)`);
    } else {
        console.log(`⏭️ Skipping past notification for "${todo.text}" (was ${Math.abs(Math.round(timeUntilReminder/1000/60))} minutes ago)`);
    }
}

// Schedule all pending notifications
function scheduleAllNotifications() {
    todos.forEach(todo => {
        if (!todo.completed && todo.start_time) {
            scheduleNotification(todo);
        }
    });
}

// PWA Install
let deferredPrompt;
const installBtn = document.createElement('button');
installBtn.id = 'installBtn';
installBtn.innerHTML = '📱 Install App';
installBtn.className = 'install-btn hidden';
document.body.appendChild(installBtn);

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
        installBtn.classList.add('hidden');
    }
});

window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    installBtn.classList.add('hidden');
    showNotification('App installed successfully! 🎪');
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.log('Service Worker registration failed', err));
}

// API Functions
async function fetchTodos() {
    try {
        console.log('Fetching todos...');
        const res = await fetch(`${API_URL}/todos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Fetch response status:', res.status);
        if (res.status === 401) {
            localStorage.clear();
            window.location.href = '/auth.html';
            return;
        }
        todos = await res.json();
        console.log('Fetched todos:', todos);
        renderTodos();
        updateCount();
        scheduleAllNotifications(); // Schedule notifications for all pending tasks
    } catch (e) {
        console.error('Error fetching todos:', e);
        showNotification('Failed to load tasks');
    }
}

async function createTodo(text, scheduled_day, start_time = null) {
    try {
        console.log('Creating todo:', text, 'Day:', scheduled_day, 'Time:', start_time);
        const res = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text, scheduled_day, start_time })
        });
        console.log('Response status:', res.status);
        const responseData = await res.json();
        console.log('Response data:', responseData);
        if (res.ok) {
            await fetchTodos();
            showNotification('Task added!');
            playSound('click');
        } else {
            console.error('Error creating todo:', responseData);
            showNotification('Failed to add task: ' + (responseData.error || 'Unknown error'));
        }
    } catch (e) {
        console.error('Exception in createTodo:', e);
        showNotification('Error: ' + e.message);
    }
}

async function updateTodo(id, updates) {
    try {
        console.log('Updating todo:', id, 'with updates:', updates);
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        console.log('Update response status:', response.status);
        const data = await response.json();
        console.log('Updated todo:', data);
        await fetchTodos();
    } catch (e) {
        console.error('Update error:', e);
    }
}

async function toggleTodo(id) {
    console.log('Toggling todo:', id);
    const todo = todos.find(t => t.id === id);
    console.log('Found todo:', todo);
    const wasCompleted = Boolean(todo.completed);
    console.log('Was completed:', wasCompleted, 'Setting to:', !wasCompleted);
    await updateTodo(id, { completed: wasCompleted ? 0 : 1 });
    if (!wasCompleted) {
        playSound('balloonPop');
        burstBalloon();
    }
}

async function deleteTodo(id) {
    try {
        const res = await fetch(`${API_URL}/todos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            await fetchTodos();
            showNotification('Task deleted!');
            playSound('click');
        }
    } catch (e) {}
}

function handleDelete(id) {
    deleteTodo(id);
}

// Expose functions globally for inline event handlers
window.toggleTodo = toggleTodo;
window.handleDelete = handleDelete;

function init() {
    console.log('Initializing app...');
    initAudio();
    requestNotificationPermission(); // Request notification permission on init
    fetchTodos();
    
    console.log('Setting up event listeners...');
    console.log('Add button:', addBtn);
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    
    // Toggle time input visibility
    enableTimeCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            timeInputWrapper.style.display = 'block';
        } else {
            timeInputWrapper.style.display = 'none';
            todoTime.value = '';
        }
    });
    
    clearCompleted.addEventListener('click', clearCompletedTodos);
    closeJumpscare.addEventListener('click', () => {
        jumpscareModal.classList.remove('show');
    });
    weeklySummaryBtn.addEventListener('click', showWeeklySummary);
    closeSummary.addEventListener('click', () => {
        summaryModal.classList.remove('show');
    });
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    
    // Test notification button
    if (testNotificationBtn) {
        testNotificationBtn.addEventListener('click', () => {
            if (notificationPermissionGranted) {
                showBrowserNotification('🎈 Test Notification', 'This is how your reminders will look!', '🎈');
                showNotification('Test notification sent!');
            } else {
                showNotification('Please enable notifications first!');
            }
        });
    }
    });
    console.log('Event listeners set up successfully');
}

function addTodo() {
    console.log('addTodo called');
    initAudio();
    const text = todoInput.value.trim();
    const selectedDay = document.querySelector('.day-checkbox input[type="radio"]:checked');
    const startTime = enableTimeCheckbox.checked ? todoTime.value : null;
    
    console.log('Text:', text, 'Selected Day:', selectedDay?.value, 'Start Time:', startTime);
    if (!text) {
        console.log('No text, returning');
        showNotification('Please enter a task');
        return;
    }
    if (!selectedDay) {
        showNotification('Please select a day');
        return;
    }
    
    const scheduled_day = parseInt(selectedDay.value);
    createTodo(text, scheduled_day, startTime);
    todoInput.value = '';
    dayRadios.forEach(rb => rb.checked = false);
    enableTimeCheckbox.checked = false;
    timeInputWrapper.style.display = 'none';
    todoTime.value = '';
}

async function clearCompletedTodos() {
    const completed = todos.filter(t => t.completed);
    if (completed.length === 0) return;
    for (const todo of completed) await deleteTodo(todo.id);
}

function burstBalloon() {
    playSound('balloonPop');
    const particles = [];
    const particleCount = 50;
    const centerX = window.innerWidth / 2;
    const centerY = 200;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: centerX, y: centerY,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 5,
            size: Math.random() * 8 + 3,
            color: `hsl(${Math.random() * 60}, 100%, 50%)`,
            life: 1
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, balloonCanvas.width, balloonCanvas.height);
        let stillAlive = false;
        particles.forEach(p => {
            if (p.life > 0) {
                stillAlive = true;
                p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= 0.02;
                ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
        if (stillAlive) requestAnimationFrame(animate);
        else ctx.clearRect(0, 0, balloonCanvas.width, balloonCanvas.height);
    }
    animate();
}

function filterTodos() {
    if (currentFilter === 'active') return todos.filter(t => !t.completed);
    if (currentFilter === 'completed') return todos.filter(t => t.completed);
    return todos;
}

function renderTodos() {
    const filtered = filterTodos();
    if (filtered.length === 0) {
        todoList.innerHTML = `<li style="text-align:center;padding:40px;color:#666;"><p style="font-size:1.2rem;">No tasks...</p></li>`;
        return;
    }
    
    // Group todos by day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const groupedByDay = {};
    
    filtered.forEach(todo => {
        const day = todo.scheduled_day !== undefined ? todo.scheduled_day : -1;
        if (!groupedByDay[day]) groupedByDay[day] = [];
        groupedByDay[day].push(todo);
    });
    
    let html = '';
    const today = new Date().getDay();
    
    // Render each day's tasks
    Object.keys(groupedByDay).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
        const dayNum = parseInt(day);
        if (dayNum === -1) return; // Skip unscheduled
        
        const isToday = dayNum === today;
        const dayTodos = groupedByDay[day];
        
        html += `<li class="day-separator ${isToday?'today-day':''}">
            <div class="day-header">
                <span class="day-name">${dayNames[dayNum]}</span>
                <span class="day-count">${dayTodos.length} task${dayTodos.length !== 1 ? 's' : ''}</span>
            </div>
        </li>`;
        
        dayTodos.forEach(todo => {
            const isCompleted = Boolean(todo.completed);
            const timeDisplay = todo.start_time ? `<span class="todo-time">⏰ ${formatTime(todo.start_time)}</span>` : '';
            html += `<li class="todo-item ${isCompleted?'completed':''}" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${isCompleted?'checked':''} onchange="toggleTodo('${todo.id}')">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                ${timeDisplay}
                <button class="delete-btn" onclick="handleDelete('${todo.id}')">DELETE</button>
            </li>`;
        });
    });
    
    todoList.innerHTML = html || `<li style="text-align:center;padding:40px;color:#666;"><p style="font-size:1.2rem;">No tasks...</p></li>`;
}

function updateCount() {
    const active = todos.filter(t => !t.completed).length;
    itemCount.textContent = `${active} task${active !== 1 ? 's' : ''} remaining`;
}

function showNotification(message) {
    const div = document.createElement('div');
    div.style.cssText = `position:fixed;top:20px;right:80px;background:linear-gradient(135deg,#ff0000,#cc0000);color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 20px rgba(255,0,0,0.4);z-index:1000;animation:slideInRight 0.3s ease;`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 2500);
}

function escapeHtml(text) {
    const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function getDayName(day) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
}

function formatScheduledDay(day) {
    if (day === undefined || day === null) return '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[day];
}

function isTodayScheduled(day) {
    if (day === undefined || day === null) return false;
    const today = new Date().getDay();
    return day === today;
}

async function showWeeklySummary() {
    playSound('click');
    try {
        const res = await fetch(`${API_URL}/todos/summary/weekly`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            showNotification('Failed to load summary');
            return;
        }
        
        const data = await res.json();
        
        // Update overall stats
        document.getElementById('totalScheduled').textContent = data.overall.scheduled;
        document.getElementById('totalCompleted').textContent = data.overall.completed;
        document.getElementById('onTimeRate').textContent = `${Math.round(data.overall.onTimeRate * 100)}%`;
        document.getElementById('completionRate').textContent = `${Math.round(data.overall.completionRate * 100)}%`;
        
        // Update most productive day
        if (data.mostProductiveDay) {
            document.getElementById('mostProductiveDay').textContent = data.mostProductiveDay.day;
            document.getElementById('mostProductiveStats').innerHTML = `
                ${data.mostProductiveDay.stats.completed}/${data.mostProductiveDay.stats.scheduled} completed 
                (${Math.round(data.mostProductiveDay.rate * 100)}%)
            `;
        } else {
            document.getElementById('mostProductiveDay').textContent = 'No data yet';
            document.getElementById('mostProductiveStats').textContent = '';
        }
        
        // Update least productive day
        if (data.leastProductiveDay && data.overall.scheduled > 0) {
            document.getElementById('leastProductiveDay').textContent = data.leastProductiveDay.day;
            document.getElementById('leastProductiveStats').innerHTML = `
                ${data.leastProductiveDay.stats.completed}/${data.leastProductiveDay.stats.scheduled} completed 
                (${Math.round(data.leastProductiveDay.rate * 100)}%)
            `;
        } else {
            document.getElementById('leastProductiveDay').textContent = 'No data yet';
            document.getElementById('leastProductiveStats').textContent = '';
        }
        
        // Update daily breakdown
        const dailyStatsHtml = Object.entries(data.dayStats).map(([day, stats]) => {
            const rate = stats.scheduled > 0 ? Math.round((stats.completed / stats.scheduled) * 100) : 0;
            return `
                <div class="day-stat-card">
                    <div class="day-stat-name">${stats.name}</div>
                    <div class="day-stat-progress">
                        <div class="progress-bar" style="width: ${rate}%"></div>
                    </div>
                    <div class="day-stat-numbers">${stats.completed}/${stats.scheduled} tasks</div>
                    <div class="day-stat-rate">${rate}% completion</div>
                </div>
            `;
        }).join('');
        
        document.getElementById('dailyStats').innerHTML = dailyStatsHtml;
        
        // Show modal
        summaryModal.classList.add('show');
    } catch (error) {
        console.error('Error loading summary:', error);
        showNotification('Failed to load summary');
    }
}

// Logout
logoutBtn.addEventListener('click', () => {
    if (confirm('Leave Derry? Your tasks will be waiting when you return...')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth.html';
    }
});

// Delete Account
deleteAccountBtn.addEventListener('click', async () => {
    const confirmation = prompt('⚠️ WARNING: This will permanently delete your account and ALL tasks!\n\nType "DELETE" to confirm:');
    
    if (confirmation === 'DELETE') {
        try {
            const response = await fetch(`${API_URL}/auth/delete-account`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth.html';
            } else {
                showNotification(data.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Delete account error:', error);
            showNotification('Connection failed');
        }
    }
});

init();
