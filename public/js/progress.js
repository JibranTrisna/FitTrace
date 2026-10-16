const userId = localStorage.getItem('workoutUserId');
const token = localStorage.getItem('workoutToken');

if (!userId || !token) {
    alert("Sesi tidak valid. Silakan Login terlebih dahulu.");
    window.location.href = 'auth.html';
}

// Inisialisasi Chart.js
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Poppins';

let weightChartInstance = null;
let strengthChartInstance = null;

// Fungsi Tampilkan Toast Notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Fetch Data dan Render Chart
async function fetchAndRenderProgress() {
    try {
        // Ambil data User Info (EXP, Level, Name)
        const userRes = await fetch(`/api/workouts/${userId}?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
            const userData = await userRes.json();
            document.getElementById('user-display-name').innerText = userData.username;
            document.getElementById('user-level').innerText = userData.user_level || 1;
            document.getElementById('user-exp').innerText = `${userData.exp || 0} / ${(userData.user_level || 1) * 100} EXP`;
        }

        const response = await fetch(`/api/progress/${userId}?t=${Date.now()}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        });
        const data = await response.json();
        
        if (response.ok) {
            globalLogs = data.logs;
            renderCharts(data.logs);
            populateFormForDate(document.getElementById('log_date').value);
        } else {
            showToast('Gagal memuat grafik', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Koneksi server bermasalah', 'error');
    }
}

function renderCharts(logs) {
    const dates = logs.map(log => {
        const d = new Date(log.log_date);
        return `${d.getDate()}/${d.getMonth()+1}`;
    });
    
    const weights = logs.map(log => log.body_weight ? parseFloat(log.body_weight) : null);
    const bench = logs.map(log => log.bench_press ? parseFloat(log.bench_press) : null);
    const squat = logs.map(log => log.squat ? parseFloat(log.squat) : null);
    const deadlift = logs.map(log => log.deadlift ? parseFloat(log.deadlift) : null);

    // Destroy lama
    if (weightChartInstance) weightChartInstance.destroy();
    if (strengthChartInstance) strengthChartInstance.destroy();

    // Chart Berat Badan
    const ctxWeight = document.getElementById('weightChart').getContext('2d');
    weightChartInstance = new Chart(ctxWeight, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Berat Badan (kg)',
                data: weights,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                spanGaps: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#3b82f6'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Chart Kekuatan (1RM)
    const ctxStrength = document.getElementById('strengthChart').getContext('2d');
    strengthChartInstance = new Chart(ctxStrength, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Bench Press (kg)',
                    data: bench,
                    borderColor: '#f59e0b',
                    borderWidth: 3,
                    tension: 0.4,
                    spanGaps: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#f59e0b'
                },
                {
                    label: 'Squat (kg)',
                    data: squat,
                    borderColor: '#10b981',
                    borderWidth: 3,
                    tension: 0.4,
                    spanGaps: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#10b981'
                },
                {
                    label: 'Deadlift (kg)',
                    data: deadlift,
                    borderColor: '#ef4444',
                    borderWidth: 3,
                    tension: 0.4,
                    spanGaps: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#ef4444'
                }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Auto Populate Form
let globalLogs = [];
function populateFormForDate(dateStr) {
    const log = globalLogs.find(l => {
        const localDate = new Date(l.log_date);
        // Konversi ke format YYYY-MM-DD sesuai zona waktu lokal klien
        const localString = localDate.toLocaleDateString('en-CA'); 
        return localString === dateStr || l.log_date.startsWith(dateStr);
    });
    
    if (log) {
        document.getElementById('body_weight').value = log.body_weight || '';
        document.getElementById('bench_press').value = log.bench_press || '';
        document.getElementById('squat').value = log.squat || '';
        document.getElementById('deadlift').value = log.deadlift || '';
    } else {
        document.getElementById('body_weight').value = '';
        document.getElementById('bench_press').value = '';
        document.getElementById('squat').value = '';
        document.getElementById('deadlift').value = '';
    }
}

document.getElementById('log_date').addEventListener('change', (e) => {
    populateFormForDate(e.target.value);
});

// Handle Form Submit
document.getElementById('progress-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        log_date: document.getElementById('log_date').value,
        body_weight: document.getElementById('body_weight').value || null,
        bench_press: document.getElementById('bench_press').value || null,
        squat: document.getElementById('squat').value || null,
        deadlift: document.getElementById('deadlift').value || null
    };

    try {
        const response = await fetch(`/api/progress/${userId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showToast('Data berhasil disimpan!', 'success');
            fetchAndRenderProgress();
        } else {
            showToast('Gagal menyimpan data', 'error');
        }
    } catch(e) {
        showToast('Koneksi bermasalah', 'error');
    }
});

// Set default date to today (Local Timezone)
const today = new Date();
document.getElementById('log_date').value = today.toLocaleDateString('en-CA');

// Load On Start
fetchAndRenderProgress();
