const userId = localStorage.getItem('workoutUserId');
const token = localStorage.getItem('workoutToken');

if (!userId || !token) {
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('workoutUserId');
    localStorage.removeItem('workoutToken');
    window.location.href = 'login.html';
}
