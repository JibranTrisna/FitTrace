document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'register') {
        window.toggleFormUI('register');
    }
});

window.toggleFormUI = function(type) {
    const loginSec = document.getElementById('login-section');
    const regSec = document.getElementById('register-section');
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');
    
    if (type === 'login') {
        loginSec.classList.remove('hidden');
        regSec.classList.add('hidden');
        tabLogin.className = 'font-label-md text-label-md uppercase tracking-wider text-primary-fixed border-b-2 border-primary-fixed pb-1 transition-colors';
        tabReg.className = 'font-label-md text-label-md uppercase tracking-wider text-secondary hover:text-primary transition-colors pb-1 border-b-2 border-transparent';
    } else {
        loginSec.classList.add('hidden');
        regSec.classList.remove('hidden');
        tabReg.className = 'font-label-md text-label-md uppercase tracking-wider text-primary-fixed border-b-2 border-primary-fixed pb-1 transition-colors';
        tabLogin.className = 'font-label-md text-label-md uppercase tracking-wider text-secondary hover:text-primary transition-colors pb-1 border-b-2 border-transparent';
    }
};

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'px-4 py-3 rounded text-sm font-label-md uppercase flex items-center gap-2 shadow-lg ' + 
        (type === 'success' ? 'bg-primary-fixed text-black' : 'bg-error-container text-white');
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => { if(container.contains(toast)) container.removeChild(toast); }, 3500);
}

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        showToast('Registrasi berhasil! Menginisialisasi...', 'success');
        
        localStorage.setItem('workoutUserId', data.userId);
        localStorage.setItem('workoutToken', data.token);
        
        setTimeout(() => { window.location.href = 'quiz.html'; }, 1500);
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        showToast('Access Granted.', 'success');
        
        localStorage.setItem('workoutUserId', data.userId);
        localStorage.setItem('workoutToken', data.token);
        
        setTimeout(() => {
            if(data.needsQuiz) {
                window.location.href = 'quiz.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1500);
    } catch (err) {
        showToast(err.message, 'error');
    }
});
