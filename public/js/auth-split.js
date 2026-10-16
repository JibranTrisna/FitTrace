function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'px-4 py-3 rounded text-sm font-label-caps uppercase flex items-center gap-2 shadow-lg ' + 
        (type === 'success' ? 'bg-[#c3f400] text-black' : 'bg-red-800 text-white');
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => { if(container.contains(toast)) container.removeChild(toast); }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
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
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
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
    }
});
