const API_URL = 'http://localhost:3000/api';

// Form switching
document.getElementById('showRegister').addEventListener('click', () => {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
    hideError();
});

document.getElementById('showLogin').addEventListener('click', () => {
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
    hideError();
});

// Login
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/index.html';
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        showError('Connection failed. Is the server running?');
    }
});

// Register
document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/index.html';
        } else {
            showError(data.error || 'Registration failed');
        }
    } catch (error) {
        showError('Connection failed. Is the server running?');
    }
});

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

function hideError() {
    const errorEl = document.getElementById('errorMessage');
    errorEl.classList.remove('show');
}

// Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = '/index.html';
}
