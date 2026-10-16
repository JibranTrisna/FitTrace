let workoutData = [];
let userId = localStorage.getItem('workoutUserId');
let token = localStorage.getItem('workoutToken');
let userExp = 0;
let userLevel = 1;

// Cek apakah user sudah login dan punya token
if (!userId || !token) {
    alert("Sesi tidak valid. Silakan Login terlebih dahulu.");
    window.location.href = 'auth.html';
}

// Fetch data dari Backend Node.js berdasarkan Sesi User
async function fetchWorkouts() {
    try {
        const response = await fetch(`/api/workouts/${userId}?t=${Date.now()}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Gagal mengambil data');
        
        const data = await response.json();
        workoutData = data.workouts;
        userExp = data.exp || 0;
        userLevel = data.user_level || 1;
        
        // Render Sapaan Username di Header
        const displayName = document.getElementById('user-display-name');
        if (displayName && data.username) displayName.innerText = data.username;

        renderApp(true);
        updateGamificationUI();
    } catch (error) {
        console.error("Error fetching workouts:", error);
        showToast("Sesi tidak valid / Gagal memuat data!", "error");
        setTimeout(() => window.location.href = 'auth.html', 2000);
    }
}

// Save data ke Backend
async function saveData(showSuccessMessage = false) {
    try {
        const response = await fetch(`/api/workouts/${userId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                workouts: workoutData,
                exp: userExp,
                user_level: userLevel
            })
        });
        
        if (!response.ok) throw new Error('Gagal menyimpan ke server');
        
        if (showSuccessMessage) {
            showToast("Tersimpan!", "success");
        }
        renderApp(false);
    } catch (error) {
        console.error("Error saving workouts:", error);
        showToast("Gagal menyimpan progress!", "error");
    }
}

// Fungsi utama untuk me-render UI
function renderApp(animate = false) {
    const container = document.getElementById('workout-container');
    container.innerHTML = '';
    
    let totalExercises = 0;
    let completedExercises = 0;

    workoutData.forEach((dayData, dayIndex) => {
        dayData.exercises.forEach(ex => {
            totalExercises++;
            if(ex.done) completedExercises++;
        });

        const card = document.createElement('article');
        card.className = 'card';
        if (animate) {
            card.style.animationDelay = `${dayIndex * 0.1}s`;
            card.classList.add('fade-in');
        } else {
            card.style.opacity = '1';
        }
        
        let exerciseHTML = dayData.exercises.map((ex, exIndex) => `
            <li>
                <label class="${ex.done ? 'completed' : ''}">
                    <input type="checkbox" 
                           onchange="toggleExercise(${dayIndex}, ${exIndex})" 
                           ${ex.done ? 'checked' : ''}> 
                    <span>${ex.name}</span>
                </label>
                <button class="btn-delete" onclick="deleteExercise(${dayIndex}, ${exIndex})" title="Hapus">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </li>
        `).join('');

        card.innerHTML = `
            <div class="card-header">
                <h2>${dayData.day}</h2>
                <span class="badge ${dayData.color}" onclick="changeDayType(${dayIndex})" style="cursor:pointer;" title="Ubah tipe">
                    ${dayData.type}
                </span>
                <button class="btn-close" style="position:absolute; top:16px; right:16px;" onclick="resetDay(${dayIndex})" title="Reset Hari">
                    <i class="fa-solid fa-rotate-left"></i>
                </button>
            </div>
            <div class="card-body">
                <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 12px;">
                    <i class="fa-solid fa-list-check"></i> ${dayData.exercises.length} Gerakan
                </p>
                
                <!-- Preview Gerakan -->
                ${dayData.exercises.length > 0 ? `
                <div style="margin-bottom: 16px; font-size: 0.85rem; color: var(--text-muted); background: var(--bg-elevated); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                    ${dayData.exercises.slice(0, 3).map(ex => `<div style="margin-bottom: 4px; ${ex.done ? 'text-decoration: line-through; opacity: 0.5;' : ''}">• ${ex.name}</div>`).join('')}
                    ${dayData.exercises.length > 3 ? `<div style="margin-top: 4px; font-style: italic;">...dan ${dayData.exercises.length - 3} lainnya</div>` : ''}
                </div>
                ` : ''}

                <button class="btn btn-primary" style="width:100%; margin-bottom: 12px;" onclick="openSession(${dayIndex})">
                    <i class="fa-solid fa-play"></i> Mulai Sesi Latihan
                </button>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-outline" style="flex: 1; padding: 10px; font-size:0.85rem;" onclick="openLibrary(${dayIndex})">
                        <i class="fa-solid fa-plus"></i> Tambah
                    </button>
                    <button class="btn btn-outline" style="flex: 1; padding: 10px; font-size:0.85rem;" onclick="openGuide(${dayIndex})">
                        <i class="fa-solid fa-book-open"></i> Panduan
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });

    const progressPercent = totalExercises === 0 ? 0 : Math.round((completedExercises / totalExercises) * 100);
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('progress-text-short').innerHTML = `<i class="fa-solid fa-bullseye"></i> Target: ${completedExercises}/${totalExercises} Latihan`;
    document.getElementById('progress-percentage').innerText = `${progressPercent}%`;

    if (progressPercent === 100 && totalExercises > 0 && !window.hasCelebrated) {
        triggerConfetti();
        window.hasCelebrated = true;
    } else if (progressPercent < 100) {
        window.hasCelebrated = false;
    }
}

// INTERACTIVE FUNCTIONS
window.toggleExercise = (dayIndex, exId) => {
    const exercise = workoutData[dayIndex].exercises.find(e => e.id === exId);
    if(exercise) {
        const wasDone = exercise.done;
        exercise.done = !wasDone;
        
        // --- LOGIKA GAMIFIKASI EXP ---
        if (exercise.done) {
            gainExp(10); // +10 EXP jika selesai
        } else {
            // Kurangi EXP jika dibatalkan (opsional)
            userExp = Math.max(0, userExp - 10);
            updateGamificationUI();
        }

        renderApp();
        saveData(); // Save background (tanpa notif)
    }
};

window.deleteExercise = (dayIndex, exIndex) => {
    if(confirm('Yakin mau hapus latihan ini?')) {
        workoutData[dayIndex].exercises.splice(exIndex, 1);
        saveData(true);
    }
};

window.addExercise = (dayIndex) => {
    const input = document.getElementById(`input-${dayIndex}`);
    const name = input.value.trim();
    if(name) {
        workoutData[dayIndex].exercises.push({ id: Date.now(), name: name, done: false });
        input.value = '';
        saveData(true);
    }
};

window.handleEnter = (event, dayIndex) => {
    if (event.key === 'Enter') addExercise(dayIndex);
}

window.changeDayType = (dayIndex) => {
    const types = [
        { name: 'Push Day', color: 'push' },
        { name: 'Pull Day', color: 'pull' },
        { name: 'Leg Day', color: 'legs' },
        { name: 'Rest Day', color: 'rest' }
    ];
    let currentTypeIndex = types.findIndex(t => t.name === workoutData[dayIndex].type);
    let nextType = types[(currentTypeIndex + 1) % types.length];
    
    workoutData[dayIndex].type = nextType.name;
    workoutData[dayIndex].color = nextType.color;
    saveData(false);
};

window.resetWeek = () => {
    if(confirm('Mulai minggu baru? Progress centang akan di-reset.')) {
        workoutData.forEach(day => day.exercises.forEach(ex => ex.done = false));
        saveData(true);
        showToast("Progress mingguan di-reset! 💪", "success");
    }
};

window.resetDefault = async () => {
    if(confirm('KEMBALI KE JADWAL BAWAAN? Semua editan lu bakal hilang.')) {
        try {
            const response = await fetch(`/api/workouts/${userId}/reset`, { 
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if(!response.ok) throw new Error("Gagal reset di server");
            
            document.getElementById('user-display-name').innerText = data.username;
            workoutData = data.workouts;
            userExp = data.exp || 0;
            userLevel = data.user_level || 1;
            
            renderApp();
            updateGamificationUI();
            showToast("Jadwal latihan berhasil dimuat!", "success");
        } catch (e) {
            showToast("Gagal reset!", "error");
        }
    }
};

window.logout = () => {
    localStorage.removeItem('workoutUserId');
    localStorage.removeItem('workoutToken');
    window.location.href = 'index.html';
};

// HELPER FUNCTIONS
function showToast(message, type = "success") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-triangle-exclamation"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { if(container.contains(toast)) container.removeChild(toast); }, 3500);
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#3b82f6', '#10b981', '#8b5cf6'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#3b82f6', '#10b981', '#8b5cf6'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', fetchWorkouts);

// --- AI CHAT FUNCTIONS ---
window.toggleChat = () => {
    const panel = document.getElementById('ai-chat-panel');
    panel.classList.toggle('hidden');
};

window.handleChatEnter = (e) => {
    if (e.key === 'Enter') sendChatMessage();
};

window.sendChatMessage = async () => {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    appendMessage(msg, 'user');
    input.value = '';

    const loadingId = appendMessage('Sabar bro, gw mikir dulu bentar...', 'ai');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const data = await response.json();
        updateMessage(loadingId, data.reply || data.error);
    } catch (err) {
        updateMessage(loadingId, 'Koneksi ke otak AI putus bro. Cek internet lu.');
    }
};

function appendMessage(text, sender) {
    const chatBody = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    const id = 'msg-' + Date.now();
    msgDiv.id = id;
    msgDiv.className = `message ${sender}-message`;
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return id;
}

function updateMessage(id, text) {
    const msgDiv = document.getElementById(id);
    if(msgDiv) {
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    }
}


// --- EXERCISE LIBRARY FUNCTIONS ---
let currentTargetDay = null;
let currentLibraryTab = 'gym';

window.openLibrary = (dayIndex) => {
    currentTargetDay = dayIndex;
    document.getElementById('exercise-library-modal').classList.add('active');
    document.getElementById('search-exercise').value = '';
    renderLibrary();
};

window.closeLibrary = () => {
    document.getElementById('exercise-library-modal').classList.remove('active');
    currentTargetDay = null;
};

window.switchLibraryTab = (tab) => {
    currentLibraryTab = tab;
    document.getElementById('tab-gym').classList.toggle('active', tab === 'gym');
    document.getElementById('tab-home').classList.toggle('active', tab === 'home');
    renderLibrary();
};

window.searchLibrary = () => {
    renderLibrary();
};

window.renderLibrary = () => {
    const grid = document.getElementById('exercise-grid');
    const searchTerm = document.getElementById('search-exercise').value.toLowerCase();
    
    // Filter dari array exerciseLibrary (berasal dari exercisesDB.js)
    const filtered = exerciseLibrary.filter(ex => 
        ex.category === currentLibraryTab && 
        (ex.name.toLowerCase().includes(searchTerm) || ex.muscle.toLowerCase().includes(searchTerm))
    );
    
    if(filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Gerakan tidak ditemukan.</p>';
        return;
    }

    grid.innerHTML = filtered.map(ex => `
        <div class="ex-card" onclick="${currentTargetDay !== null ? `selectExercise('${ex.name}')` : `showExerciseDetail('${ex.name}')`}">
            <div class="ex-visual">
                <i class="fa-solid ${ex.icon}"></i>
            </div>
            <div class="ex-info">
                <h4>${ex.name}</h4>
                <p>${ex.muscle}</p>
            </div>
        </div>
    `).join('');
};

window.showExerciseDetail = (exerciseName) => {
    const dbDetail = exerciseLibrary.find(item => item.name === exerciseName);
    if (!dbDetail) return;
    
    const contentDiv = document.getElementById('guide-dynamic-content');
    const modalTitle = document.getElementById('guide-modal-title');
    
    modalTitle.innerHTML = `<i class="fa-solid ${dbDetail.icon}"></i> ${dbDetail.name}`;
    
    let html = `
    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border-left: 4px solid var(--accent); overflow: hidden;">
        <span class="badge-muscle" style="margin-bottom: 15px; display: inline-block;">Target Otot: ${dbDetail.muscle}</span>
        
        <!-- Video Loop Illustration -->
        <div style="margin-bottom: 20px; border-radius: 12px; overflow: hidden; background: #000; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <video src="${dbDetail.video}" autoplay loop muted playsinline style="width: 100%; display: block;"></video>
            <div style="padding: 8px; text-align: center; font-size: 0.8rem; color: #888; background: #111;">
                <em>*Ilustrasi Video Loop (Bisa diganti dengan file .mp4 lu sendiri)</em>
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <strong style="color: #fff; font-size: 1rem; display: block; margin-bottom: 5px;"><i class="fa-solid fa-bullseye text-accent"></i> Fungsi Gerakan:</strong>
            <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;">${dbDetail.fungsi}</p>
        </div>
        
        <div>
            <strong style="color: #fff; font-size: 1rem; display: block; margin-bottom: 5px;"><i class="fa-solid fa-heart-pulse text-accent"></i> Manfaat:</strong>
            <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;">${dbDetail.manfaat}</p>
        </div>
    </div>`;
    
    contentDiv.innerHTML = html;
    
    // Sembunyikan library-modal, tampilkan guide-modal
    closeLibrary();
    document.getElementById('guide-modal').classList.add('active');
};

window.selectExercise = (exerciseName) => {
    if (currentTargetDay !== null) {
        workoutData[currentTargetDay].exercises.push({ 
            id: Date.now(), 
            name: exerciseName, 
            sets: 3, 
            reps: 10, 
            done: false 
        });
        saveData(true);
        closeLibrary();
    }
};


// --- GAMIFICATION LOGIC ---
window.updateGamificationUI = () => {
    const expReq = userLevel * 100;
    document.getElementById('ui-level').innerText = userLevel;
    document.getElementById('ui-exp').innerText = userExp;
    document.getElementById('ui-exp-max').innerText = expReq;
    
    const percentage = Math.min((userExp / expReq) * 100, 100);
    document.getElementById('ui-exp-fill').style.width = percentage + '%';
};

window.gainExp = (amount) => {
    userExp += amount;
    const expReq = userLevel * 100;
    
    if (userExp >= expReq) {
        userExp -= expReq;
        userLevel++;
        showToast(`🎉 LEVEL UP ke Level ${userLevel}!`, 'success');
        triggerConfetti(); // Rayakan!
    } else {
        showToast(`+${amount} EXP🔥`, 'success');
    }
    
    updateGamificationUI();
};

window.triggerConfetti = () => {
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#ffffff', '#60a5fa']
    });
};


// --- GUIDE MODAL FUNCTIONS (DYNAMIC ENCYCLOPEDIA) ---
window.openGuide = (dayIndex = null) => {
    const contentDiv = document.getElementById('guide-dynamic-content');
    const modalTitle = document.getElementById('guide-modal-title');
    let html = '';
    
    // Jika tombol ditekan dari kartu Hari (Day Container)
    if (dayIndex !== null && dayIndex !== undefined) {
        const dayData = workoutData[dayIndex];
        modalTitle.innerHTML = `<i class="fa-solid fa-graduation-cap text-accent"></i> Penjelasan: ${dayData.day}`;
        
        if (dayData.exercises.length === 0) {
            html = `<p style="color: var(--text-muted); text-align: center; margin-top: 30px;">Hari ini belum ada jadwal gerakan. Cari gerakan di pustaka latihan.</p>`;
        } else {
            html += `<p style="color: var(--text-muted); margin-bottom: 20px;">Berikut adalah panduan lengkap untuk gerakan yang harus lu selesaikan hari ini:</p>`;
            html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">`;
            
            dayData.exercises.forEach(ex => {
                const dbDetail = exerciseLibrary.find(item => item.name === ex.name);
                if (dbDetail) {
                    html += `
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border-left: 4px solid var(--accent); overflow: hidden;">
                        <h4 style="color: var(--accent); margin-bottom: 8px; font-size: 1.1rem;"><i class="fa-solid ${dbDetail.icon}"></i> ${dbDetail.name}</h4>
                        <span class="badge-muscle" style="margin-bottom: 12px; display: inline-block;">Target: ${dbDetail.muscle}</span>
                        
                        <!-- Video Loop -->
                        <div style="margin-bottom: 15px; border-radius: 8px; overflow: hidden; background: #000; position: relative;">
                            <video src="${dbDetail.video}" autoplay loop muted playsinline style="width: 100%; display: block; opacity: 0.9;"></video>
                        </div>
                        
                        <!-- Fungsi & Manfaat -->
                        <div style="margin-bottom: 10px;">
                            <strong style="color: #fff; font-size: 0.95rem;">Fungsi Gerakan:</strong>
                            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-top: 4px;">${dbDetail.fungsi}</p>
                        </div>
                        <div>
                            <strong style="color: #fff; font-size: 0.95rem;">Manfaat:</strong>
                            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-top: 4px;">${dbDetail.manfaat}</p>
                        </div>
                    </div>`;
                }
            });
            html += `</div>`;
        }
    } else {
        // Jika ditekan dari tombol di Pustaka Latihan (Tampilkan Semua / Kamus)
        modalTitle.innerHTML = `<i class="fa-solid fa-book-open text-accent"></i> Kamus Semua Gerakan`;
        html += `<p style="color: var(--text-muted); margin-bottom: 20px;">Ensiklopedia lengkap seluruh perpustakaan gerakan Workout Pro. Pelajari biomekanik otot dan efeknya.</p>`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">`;
        
        exerciseLibrary.forEach(dbDetail => {
            html += `
            <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border-top: 1px solid rgba(255,255,255,0.05);">
                <h4 style="color: white; margin-bottom: 8px; font-size: 1.1rem;"><i class="fa-solid ${dbDetail.icon} text-accent"></i> ${dbDetail.name}</h4>
                <span class="badge-muscle" style="margin-bottom: 12px; display: inline-block; font-size: 0.75rem;">Otot Utama: ${dbDetail.muscle}</span>
                <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">${dbDetail.desc}</p>
            </div>`;
        });
        html += `</div>`;
    }
    
    contentDiv.innerHTML = html;
    document.getElementById('guide-modal').classList.add('active');
};

window.closeGuide = () => {
    document.getElementById('guide-modal').classList.remove('active');
};


// --- FLOATING REST TIMER LOGIC ---
let timerInterval = null;
let timerSeconds = 0;

window.toggleTimerWidget = () => {
    document.getElementById('timer-panel').classList.toggle('hidden');
};

window.addTimerTime = (seconds) => {
    timerSeconds += seconds;
    updateTimerDisplay();
};

window.updateTimerDisplay = () => {
    const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const secs = (timerSeconds % 60).toString().padStart(2, '0');
    const displayStr = `${mins}:${secs}`;
    
    document.getElementById('timer-countdown').innerText = displayStr;
    document.getElementById('timer-badge').innerText = displayStr;
    
    // Warn if < 10s
    if (timerSeconds > 0 && timerSeconds <= 10) {
        document.getElementById('timer-countdown').style.color = 'var(--danger)';
    } else {
        document.getElementById('timer-countdown').style.color = 'var(--accent)';
    }
};

window.startTimer = () => {
    if (timerInterval) return;
    if (timerSeconds === 0) return showToast('Tambahkan waktu dulu!', 'error');
    
    document.getElementById('timer-panel').classList.remove('timer-alert');
    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();
        
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            triggerAlarm();
        }
    }, 1000);
};

window.pauseTimer = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    document.getElementById('timer-panel').classList.remove('timer-alert');
};

window.resetTimer = () => {
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
    document.getElementById('timer-panel').classList.remove('timer-alert');
};

window.triggerAlarm = () => {
    showToast('WAKTU ISTIRAHAT HABIS!', 'success');
    document.getElementById('timer-panel').classList.add('timer-alert');
    
    // Web Audio API Beep
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        for (let i = 0; i < 3; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + i * 0.4);
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime + i * 0.4);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.4 + 0.3);
            osc.start(audioCtx.currentTime + i * 0.4);
            osc.stop(audioCtx.currentTime + i * 0.4 + 0.3);
        }
    } catch(e) {
        console.error('Audio tidak didukung', e);
    }
};

// --- SESSION MODAL LOGIC ---
let currentSessionDay = null;

window.openSession = (dayIndex) => {
    currentSessionDay = dayIndex;
    const dayData = workoutData[dayIndex];
    document.getElementById('session-title').innerHTML = `<i class="fa-solid fa-play text-accent"></i> Sesi: ${dayData.day}`;
    
    // Rangkum Manfaat (Otot)
    const muscles = new Set();
    dayData.exercises.forEach(ex => {
        const dbEx = exerciseLibrary.find(item => item.name === ex.name);
        if (dbEx && dbEx.muscle) muscles.add(dbEx.muscle);
    });
    
    const benefitsText = document.getElementById('session-benefits');
    if (muscles.size > 0) {
        benefitsText.innerText = `Fokus latihan ini adalah: ${Array.from(muscles).join(', ')}.`;
    } else {
        benefitsText.innerText = `Belum ada otot spesifik yang ditargetkan hari ini.`;
    }
    
    // Render Latihan dengan Input
    const exContainer = document.getElementById('session-exercises');
    let html = '';
    
    if (dayData.exercises.length === 0) {
        html = `<p style="text-align:center; color:var(--text-muted);">Hari istirahat atau lu belum nambahin jadwal gerakan.</p>`;
    } else {
        dayData.exercises.forEach((ex, exIndex) => {
            const sets = ex.sets || 3;
            const reps = ex.reps || 10;
            const doneClass = ex.done ? 'text-accent' : 'text-main';
            const checkedAttr = ex.done ? 'checked' : '';
            
            html += `
            <div class="session-exercise-card">
                <div class="session-exercise-header">
                    <div class="session-exercise-title ${doneClass}">${ex.name}</div>
                    <button class="btn-close" onclick="deleteExercise(${dayIndex}, ${exIndex}); openSession(${dayIndex});"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                <div class="session-inputs">
                    <div class="input-group">
                        <label>Sets</label>
                        <input type="number" min="1" value="${sets}" onchange="updateExStats(${dayIndex}, ${exIndex}, 'sets', this.value)">
                    </div>
                    <div class="input-group">
                        <label>Reps</label>
                        <input type="number" min="1" value="${reps}" onchange="updateExStats(${dayIndex}, ${exIndex}, 'reps', this.value)">
                    </div>
                    <div style="margin-left: auto; display: flex; gap: 10px; align-items: center;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Selesai?</span>
                        <input type="checkbox" class="checkbox-done" ${checkedAttr} onchange="toggleExercise(${dayIndex}, ${ex.id}); openSession(${dayIndex});">
                    </div>
                </div>
            </div>`;
        });
    }
    
    exContainer.innerHTML = html;
    document.getElementById('session-modal').classList.add('active');
};

window.updateExStats = (dayIndex, exIndex, field, value) => {
    workoutData[dayIndex].exercises[exIndex][field] = parseInt(value) || 0;
    saveData(false);
};

window.closeSession = () => {
    document.getElementById('session-modal').classList.remove('active');
    renderApp();
};

