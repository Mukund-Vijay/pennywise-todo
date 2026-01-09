const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || '{}');
let todos = [];
let currentFilter = 'all';

// Audio System
const sounds = {
    ambient: document.getElementById('ambientSound'),
    jumpscare: document.getElementById('jumpscareSound'),
    balloonPop: document.getElementById('balloonPopSound'),
    click: document.getElementById('clickSound')
};

// Initialize audio
let audioInitialized = false;
function initAudio() {
    if (!audioInitialized) {
        if (sounds.ambient) sounds.ambient.volume = 0.2;
        if (sounds.jumpscare) sounds.jumpscare.volume = 0.7;
        if (sounds.balloonPop) sounds.balloonPop.volume = 0.5;
        if (sounds.click) sounds.click.volume = 0.3;
        if (sounds.ambient) sounds.ambient.play().catch(() => {});
        audioInitialized = true;
    }
}

// Sound toggle button
const soundBtn = document.createElement('button');
soundBtn.id = 'soundToggle';
soundBtn.innerHTML = '🔊';
soundBtn.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 10px 15px; background: rgba(255, 0, 0, 0.3); border: 2px solid #ff0000; border-radius: 50%; color: #fff; font-size: 1.5rem; cursor: pointer; z-index: 1000;`;
document.body.appendChild(soundBtn);

let soundEnabled = true;
soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.innerHTML = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) {
        if (sounds.ambient) sounds.ambient.play().catch(() => {});
    } else {
        Object.values(sounds).forEach(sound => {
            if (sound) sound.pause();
        });
    }
});

function playSound(soundName) {
    if (soundEnabled && sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(() => {});
    }
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

balloonCanvas.width = window.innerWidth;
balloonCanvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    balloonCanvas.width = window.innerWidth;
    balloonCanvas.height = window.innerHeight;
});

// Check auth
if (!token) window.location.href = '/auth.html';

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

// Logout button
const logoutBtn = document.createElement('button');
logoutBtn.textContent = `👋 ${user.username}`;
logoutBtn.style.cssText = `position: fixed; top: 20px; left: 20px; padding: 10px 20px; background: rgba(255, 0, 0, 0.2); border: 2px solid #ff0000; border-radius: 20px; color: #fff; cursor: pointer; z-index: 1000;`;
logoutBtn.addEventListener('click', () => {
    playSound('click');
    localStorage.clear();
    window.location.href = '/auth.html';
});
document.body.appendChild(logoutBtn);

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
    } catch (e) {
        console.error('Error fetching todos:', e);
        showNotification('Failed to load tasks');
    }
}

async function createTodo(text, scheduled_day) {
    try {
        console.log('Creating todo:', text, 'Day:', scheduled_day);
        const res = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text, scheduled_day })
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
        await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        await fetchTodos();
    } catch (e) {}
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

function init() {
    console.log('Initializing app...');
    initAudio();
    fetchTodos();
    
    console.log('Setting up event listeners...');
    console.log('Add button:', addBtn);
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
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
    });
    console.log('Event listeners set up successfully');
}

function addTodo() {
    console.log('addTodo called');
    initAudio();
    const text = todoInput.value.trim();
    const selectedDay = document.querySelector('.day-checkbox input[type="radio"]:checked');
    
    console.log('Text:', text, 'Selected Day:', selectedDay?.value);
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
    createTodo(text, scheduled_day);
    todoInput.value = '';
    dayRadios.forEach(rb => rb.checked = false);
}

async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    const wasCompleted = Boolean(todo.completed);
    await updateTodo(id, { completed: wasCompleted ? 0 : 1 });
    if (!wasCompleted) {
        playSound('balloonPop');
        burstBalloon();
    }
}

function handleDelete(id) {
    deleteTodo(id);
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
            html += `<li class="todo-item ${isCompleted?'completed':''}" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${isCompleted?'checked':''} onchange="toggleTodo(${todo.id})">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button class="delete-btn" onclick="handleDelete(${todo.id})">DELETE</button>
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

init();
