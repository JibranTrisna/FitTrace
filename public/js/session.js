let userData = null;
let workoutHistory = [];
let weeklySchedule = {};
let todayIndex = new Date().getDay();

// Timer State
let timerInterval = null;
let timeLeft = 0;
let totalTime = 60; 
let isRunning = false;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/workouts/' + userId + '?t=' + Date.now(), {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (!response.ok) throw new Error('Gagal mengambil data');
        userData = await response.json();
        
        let dbWorkouts = userData.workouts;
        if (dbWorkouts && dbWorkouts.schedule) {
            weeklySchedule = dbWorkouts.schedule;
            workoutHistory = dbWorkouts.history || [];
        }
        
        renderSession();
        
    } catch (error) {
        console.error("Error fetching session data:", error);
        document.getElementById('exercise-list-container').innerHTML = '<p class="text-red-500">Gagal memuat data sesi.</p>';
    }
});

function renderSession() {
    const plan = weeklySchedule[todayIndex];
    if (!plan || !plan.exercises || plan.exercises.length === 0) {
        document.getElementById('session-title').innerText = "Rest Day";
        document.getElementById('exercise-list-container').innerHTML = '<div class="glass-card p-10 text-center rounded-2xl"><span class="material-symbols-outlined text-6xl text-primary-fixed-dim mb-4">self_improvement</span><h2 class="text-2xl font-bold mb-2">Rest Day</h2><p class="text-on-surface-variant">Tidak ada latihan yang dijadwalkan hari ini. Waktunya istirahat.</p></div>';
        return;
    }
    
    document.getElementById('session-title').innerText = plan.name || "Today's Protocol";
    
    const container = document.getElementById('exercise-list-container');
    let finalHTML = '';
    
    plan.exercises.forEach((exObj, index) => {
        const exId = typeof exObj === 'string' ? exObj : exObj.id;
        const ex = exerciseLibrary.find(e => e.id === exId);
        if (!ex) return;
        
        const sets = exObj.sets || 3;
        const reps = exObj.reps || '10';
        
        
        let mediaHTML = '<div class="w-full md:w-[220px] h-40 md:h-full shrink-0 bg-cover bg-center" style="background-image: url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop)"></div>';
        if (ex.thumbnail) {
            if (ex.thumbnail.toLowerCase().endsWith('.mp4') || ex.thumbnail.toLowerCase().endsWith('.webm')) {
                mediaHTML = '<video src="' + ex.thumbnail + '" autoplay loop muted playsinline preload="auto" class="w-full md:w-[220px] h-40 md:h-full shrink-0 object-cover object-center"></video>';
            } else {
                mediaHTML = '<div class="w-full md:w-[220px] h-40 md:h-full shrink-0 bg-cover bg-center" style="background-image: url(' + ex.thumbnail + ')"></div>';
            }
        }
        
        let tips = "Fokus pada kontraksi dan atur napas (tarik saat turun, buang saat naik).";
        
        const html = `
            <div class="glass-card rounded-xl overflow-hidden border border-white/10 shadow-lg mb-4 flex flex-col md:flex-row">
                <div class="relative flex shrink-0">
                    ${mediaHTML}
                    <div class="absolute top-2 left-2 bg-black/80 backdrop-blur border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-full bg-primary-fixed-dim text-black flex items-center justify-center font-bold text-[10px]">${index + 1}</span>
                        <span class="font-label-caps text-[10px] text-primary-fixed-dim uppercase tracking-wider">${ex.muscle}</span>
                    </div>
                </div>
                
                <div class="p-4 flex-1 flex flex-col justify-center">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                            <h2 class="font-headline-md text-lg font-bold text-on-surface leading-tight">${ex.name}</h2>
                            <p class="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">${ex.category === 'gym' ? 'Menggunakan Alat' : 'Bodyweight'}</p>
                        </div>
                        
                        <div class="flex gap-3 bg-surface-container-high/50 px-3 py-1.5 rounded-lg border border-white/5 shrink-0 w-fit">
                            <div class="text-center">
                                <p class="font-label-caps text-[9px] text-on-surface-variant uppercase">Sets</p>
                                <p class="font-data-point text-lg text-primary-fixed-dim font-bold leading-none">${sets}</p>
                            </div>
                            <div class="w-px bg-white/10"></div>
                            <div class="text-center">
                                <p class="font-label-caps text-[9px] text-on-surface-variant uppercase">Reps</p>
                                <p class="font-data-point text-lg text-primary-fixed-dim font-bold leading-none">${reps}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-1.5 bg-black/20 p-2.5 rounded-lg border border-white/5">
                        <div class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-[14px] text-on-surface-variant mt-0.5">psychology</span>
                            <p class="text-[11px] text-on-surface-variant leading-snug"><strong class="text-on-surface font-medium">Fungsi:</strong> ${ex.fungsi || 'Membangun kekuatan.'}</p>
                        </div>
                        <div class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-[14px] text-on-surface-variant mt-0.5">fitness_center</span>
                            <p class="text-[11px] text-on-surface-variant leading-snug"><strong class="text-on-surface font-medium">Manfaat:</strong> ${ex.manfaat || 'Meningkatkan stabilitas.'}</p>
                        </div>
                        <div class="flex items-start gap-2 mt-1">
                            <span class="material-symbols-outlined text-[14px] text-primary-fixed-dim mt-0.5">lightbulb</span>
                            <p class="text-[11px] text-primary-fixed-dim leading-snug"><strong class="font-bold">Tips:</strong> ${tips}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        finalHTML += html;

    });
    container.innerHTML = finalHTML;
}

// Timer Logic
function updateTimerDisplay() {
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${mins}:${secs}`;
    
    const circle = document.getElementById('timer-progress');
    // stroke-dasharray is 553
    const dashoffset = 553 - (timeLeft / totalTime) * 553;
    circle.style.strokeDashoffset = isNaN(dashoffset) ? 0 : dashoffset;
}

function addTime(seconds) {
    if (!isRunning && timeLeft === 0) {
        totalTime = seconds;
        timeLeft = seconds;
    } else {
        timeLeft += seconds;
        if (timeLeft > totalTime) totalTime = timeLeft;
    }
    updateTimerDisplay();
}

function toggleTimer() {
    const btnText = document.getElementById('timer-toggle-text');
    const btnIcon = document.getElementById('timer-toggle-icon');
    const status = document.getElementById('timer-status');
    const btn = document.getElementById('timer-toggle-btn');
    
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        btnText.innerText = "Resume";
        btnIcon.innerText = "play_arrow";
        status.innerText = "Paused";
        btn.classList.replace('bg-red-500', 'bg-primary-fixed-dim');
        btn.classList.replace('text-white', 'text-black');
    } else {
        if (timeLeft <= 0) {
            timeLeft = 60; // default 60s
            totalTime = 60;
        }
        isRunning = true;
        btnText.innerText = "Pause";
        btnIcon.innerText = "pause";
        status.innerText = "Running";
        btn.classList.replace('bg-primary-fixed-dim', 'bg-red-500');
        btn.classList.replace('text-black', 'text-white');
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                timeLeft = 0;
                updateTimerDisplay();
                btnText.innerText = "Start Rest";
                btnIcon.innerText = "play_arrow";
                status.innerText = "Time's Up!";
                btn.classList.replace('bg-red-500', 'bg-primary-fixed-dim');
                btn.classList.replace('text-white', 'text-black');
                
                // Play alarm sound (optional)
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(440, ctx.currentTime);
                    osc.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 1);
                } catch(e) {}
            }
        }, 1000);
    }
    updateTimerDisplay();
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = 0;
    
    document.getElementById('timer-toggle-text').innerText = "Start Rest";
    document.getElementById('timer-toggle-icon').innerText = "play_arrow";
    document.getElementById('timer-status').innerText = "Ready";
    
    const btn = document.getElementById('timer-toggle-btn');
    btn.classList.replace('bg-red-500', 'bg-primary-fixed-dim');
    btn.classList.replace('text-white', 'text-black');
    
    updateTimerDisplay();
}

document.getElementById('finish-session-btn').addEventListener('click', async () => {
    const plan = weeklySchedule[todayIndex];
    if (!plan || !plan.exercises.length) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    const confirmFinish = confirm(`Tandai sesi "${plan.name}" selesai untuk hari ini?`);
    if (!confirmFinish) return;

    const todayISO = new Date().toISOString().split('T')[0];
    workoutHistory.push({
        date: todayISO,
        name: plan.name,
        completed: true
    });

    const newExp = (userData.exp || 0) + 50; 
    const newLevel = Math.floor(newExp / 100) + 1;
    userData.exp = newExp;
    userData.user_level = Math.max(userData.user_level || 1, newLevel);
    
    document.getElementById('finish-session-btn').innerText = 'Saving...';
    
    try {
        await fetch('/api/workouts/' + userId, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                workouts: { schedule: weeklySchedule, history: workoutHistory },
                exp: userData.exp,
                user_level: userData.user_level
            })
        });
        alert("Sesi Latihan berhasil diselesaikan! +50 EXP");
        window.location.href = 'dashboard.html';
    } catch(e) {
        console.error("Gagal save", e);
        alert("Terjadi kesalahan saat menyimpan sesi.");
    }
});

updateTimerDisplay();
