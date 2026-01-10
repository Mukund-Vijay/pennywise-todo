const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

// Form switching
document.getElementById('showRegister').addEventListener('click', () => {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('resetForm').classList.remove('active');
    hideError();
});

document.getElementById('showLogin').addEventListener('click', () => {
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('resetForm').classList.remove('active');
    hideError();
});

document.getElementById('showReset').addEventListener('click', () => {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('resetForm').classList.add('active');
    hideError();
});

document.getElementById('backToLogin').addEventListener('click', () => {
    document.getElementById('resetForm').classList.remove('active');
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

// Reset Password
document.getElementById('resetFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    const username = document.getElementById('resetUsername').value;
    const newPassword = document.getElementById('resetNewPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showError('Password reset successful! Please login.');
            setTimeout(() => {
                document.getElementById('resetForm').classList.remove('active');
                document.getElementById('loginForm').classList.add('active');
                document.getElementById('resetFormElement').reset();
                hideError();
            }, 2000);
        } else {
            showError(data.error || 'Reset failed');
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
