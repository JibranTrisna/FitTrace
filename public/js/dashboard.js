let userData = null;
let workoutHistory = [];
let weeklySchedule = {};
let currentEditDay = null; // 0 to 6

const defaultSchedule = {
    1: { name: "Hypertrophy: Push", exercises: ["g1", "g2", "g4", "g8"] }, // Senin
    2: { name: "Hypertrophy: Pull", exercises: ["g9", "g11", "g15", "g16"] }, // Selasa
    3: { name: "Power: Legs", exercises: ["g15"] }, // Rabu
    4: { name: "Active Recovery", exercises: [] }, // Kamis
    5: { name: "Strength: Upper", exercises: ["g1", "g9"] }, // Jumat
    6: { name: "Strength: Lower", exercises: [] }, // Sabtu
    0: { name: "Rest", exercises: [] } // Minggu
};

const dayNames = {
    1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu", 0: "Minggu"
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`/api/workouts/${userId}?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Gagal mengambil data');
        userData = await response.json();
        if (!userData.workouts || !userData.workouts.profile || !userData.workouts.profile.isSetup) {
            window.location.href = 'onboarding.html';
            return;
        }
        
        // Parse DB data
        let dbWorkouts = userData.workouts;
        if (!dbWorkouts) {
            workoutHistory = [];
            weeklySchedule = JSON.parse(JSON.stringify(defaultSchedule));
        } else if (Array.isArray(dbWorkouts)) {
            // Old format migration
            workoutHistory = dbWorkouts;
            weeklySchedule = JSON.parse(JSON.stringify(defaultSchedule));
        } else {
            // New format
            workoutHistory = dbWorkouts.history || [];
            weeklySchedule = dbWorkouts.schedule || JSON.parse(JSON.stringify(defaultSchedule));
        }
        
        // Update Nama
        const overviewTitle = document.querySelector('h2.text-on-surface');
        if(overviewTitle && userData.username) {
            overviewTitle.innerText = `Welcome, ${userData.username}`;
        }
        
        // Update Status and Avatar
        const statusEl = document.getElementById('dash-user-status');
        const avatarEl = document.getElementById('dash-user-avatar');
        
        if (statusEl && avatarEl) {
            const level = userData.user_level || 1;
            let status = "Active";
            if (level >= 5) status = "Optimal";
            if (level >= 10) status = "Advanced";
            if (level >= 20) status = "Elite";
            
            // Check streak for status override
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentWorkouts = workoutHistory.filter(w => new Date(w.date) >= sevenDaysAgo);
            if (recentWorkouts.length === 0) status = "Needs Recovery";
            if (recentWorkouts.length >= 4) status = "Prime Condition";
            
            statusEl.innerText = status;
            
            // Avatar based on username and gender
            const name = userData.username || 'Lifter';
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=abd600&color=051424&bold=true&size=128`;
        }
        
        renderWeeklyGrid();
        renderModalFilters();
        renderAvailableExercises();
        updateStreakUI();
        initTodayProtocol();

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    }
});



function startLiveClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;
    
    setInterval(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
        clockEl.innerText = timeStr;
    }, 1000);
}

function initTodayProtocol() {
    startLiveClock();
    
    const todayIndex = new Date().getDay();
    const plan = weeklySchedule[todayIndex];
    
    const nameEl = document.getElementById('today-plan-name');
    const descEl = document.getElementById('today-plan-desc');
    const timelineEl = document.getElementById('today-exercises-timeline');
    
    if (!nameEl || !timelineEl) return;
    
    if (!plan || !plan.exercises || plan.exercises.length === 0) {
        nameEl.innerText = "Rest Day / Kosong";
        descEl.innerText = "Gunakan hari ini untuk pemulihan atau peregangan ringan.";
        timelineEl.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 opacity-70">
                <span class="material-symbols-outlined text-4xl mb-2 text-on-surface-variant">self_improvement</span>
                <p class="text-on-surface-variant text-sm">Tidak ada latihan yang dijadwalkan hari ini.</p>
            </div>
        `;
        return;
    }
    
    nameEl.innerText = plan.name || "Custom Protocol";
    descEl.innerText = `${plan.exercises.length} gerakan dijadwalkan untuk hari ini.`;
    
    let finalHTML = '';
    
    plan.exercises.forEach((exObj, index) => {
        const exId = typeof exObj === 'string' ? exObj : exObj.id;
        const ex = exerciseLibrary.find(e => e.id === exId);
        if (!ex) return;
        
        const sets = exObj.sets || 3;
        const reps = exObj.reps || '10';
        
        let mediaHTML = `<div class="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 border border-white/10 shadow-lg" style="background-image: url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop')"></div>`;
        if (ex.thumbnail) {
            if (ex.thumbnail.toLowerCase().endsWith('.mp4') || ex.thumbnail.toLowerCase().endsWith('.webm')) {
                mediaHTML = `<div class="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black relative shadow-lg "><video src="${ex.thumbnail}" loop muted playsinline preload="metadata" class="lazy-video w-full h-full object-cover"></video></div>`;
            } else {
                mediaHTML = `<div class="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 border border-white/10 shadow-lg" style="background-image: url('${ex.thumbnail}')"></div>`;
            }
        }
        
        const isLast = index === plan.exercises.length - 1;
        
        finalHTML += `
            <div class="flex gap-4 group">
                <div class="flex flex-col items-center relative">
                    <div class="w-8 h-8 rounded-full bg-surface-container border-2 border-primary-fixed-dim/30 flex items-center justify-center z-10 font-bold text-[10px] text-primary-fixed-dim shrink-0 group-hover:bg-primary-fixed-dim group-hover:text-black transition-colors">
                        ${index + 1}
                    </div>
                    ${!isLast ? '<div class="w-0.5 h-full bg-white/5 absolute top-8 bottom-[-16px]"></div>' : ''}
                </div>
                
                <div class="flex-1 bg-surface-container/30 hover:bg-surface-container border border-white/5 hover:border-primary-fixed-dim/30 rounded-xl p-3 flex items-center gap-4 transition-all duration-300 mb-2 shadow-sm cursor-pointer" onclick="window.location.href='session.html'">
                    ${mediaHTML}
                    <div class="flex-1 overflow-hidden">
                        <h5 class="text-on-surface font-bold text-sm truncate group-hover:text-primary-fixed-dim transition-colors">${ex.name}</h5>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[9px] bg-black/40 px-1.5 py-0.5 rounded border border-white/5 text-on-surface-variant uppercase tracking-wider">${ex.muscle}</span>
                            <span class="w-1 h-1 rounded-full bg-white/20"></span>
                            <span class="text-[10px] text-primary-fixed-dim font-bold">${sets} Sets &times; ${reps}</span>
                        </div>
                    </div>
                    <div class="shrink-0 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="material-symbols-outlined text-primary-fixed-dim text-lg">play_arrow</span>
                    </div>
                </div>
            </div>
        `;
    });
    timelineEl.innerHTML = finalHTML;
    observeVideos();
}

function renderWeeklyGrid() {


    const grid = document.getElementById('weekly-grid');
    grid.innerHTML = '';
    const todayIndex = new Date().getDay();

    // Order: Senin (1) to Minggu (0)
    const order = [1, 2, 3, 4, 5, 6, 0];
    
    // Background images map
    const bgImages = {
        1: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop',
        2: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
        3: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop',
        4: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop',
        5: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop',
        6: 'https://images.unsplash.com/photo-1526506114642-9992f0365775?q=80&w=800&auto=format&fit=crop',
        0: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop'
    };
    
    order.forEach(day => {
        const plan = weeklySchedule[day];
        const isToday = day === todayIndex;
        
        const card = document.createElement('div');
        card.className = `min-w-[280px] w-[280px] md:min-w-[350px] md:w-[350px] shrink-0 h-[400px] bg-cover bg-center rounded-xl relative overflow-hidden group cursor-pointer border-2 select-none transition-all duration-300 ${isToday ? 'border-primary-fixed-dim shadow-[0_0_20px_rgba(171,214,0,0.3)]' : 'border-transparent hover:border-white/30'}`;
        card.onclick = () => openScheduleModal(day);
        
        card.innerHTML = `
            <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style="background-image: url('${bgImages[day]}');"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
            <div class="relative z-10 p-6 h-full flex flex-col justify-end">
                <div class="mb-auto flex justify-between items-start">
                    <span class="bg-primary-fixed-dim/20 text-primary-fixed-dim border border-primary-fixed-dim/30 font-label-caps px-3 py-1 rounded-full backdrop-blur-md">
                        ${dayNames[day]} ${isToday ? '(Today)' : ''}
                    </span>
                    ${isToday ? '<span class="material-symbols-outlined text-primary-fixed-dim animate-pulse">adjust</span>' : ''}
                </div>
                <div>
                    <h3 class="font-headline-md text-2xl text-on-surface mb-2">${plan.name}</h3>
                    <p class="font-body-md text-on-surface-variant mb-4">${plan.exercises.length} Exercises Scheduled</p>
                    <button class="w-full bg-white/10 border border-white/20 text-on-surface group-hover:bg-primary-fixed-dim group-hover:text-black group-hover:border-primary-fixed-dim transition-all py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined">edit</span> View / Edit
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

let currentModalCategory = 'All';

function renderModalFilters() {
    const container = document.getElementById('modal-filters');
    container.innerHTML = '';
    
    const muscles = new Set();
    exerciseLibrary.forEach(ex => muscles.add(ex.muscle));
    const categories = ['Semua', 'Pakai Alat', 'Tanpa Alat', ...Array.from(muscles)];
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.innerText = cat;
        
        if (cat === currentModalCategory || (cat === 'Semua' && currentModalCategory === 'All')) {
            btn.className = "whitespace-nowrap px-3 py-1 rounded-full border border-primary-fixed-dim bg-primary-fixed-dim/10 text-primary-fixed-dim font-label-caps text-[10px] transition-colors";
        } else {
            btn.className = "whitespace-nowrap px-3 py-1 rounded-full border border-white/10 bg-transparent text-on-surface hover:border-white/30 hover:bg-white/5 font-label-caps text-[10px] transition-colors";
        }
        
        btn.onclick = () => {
            currentModalCategory = cat === 'Semua' ? 'All' : cat;
            renderModalFilters();
            renderAvailableExercises(document.getElementById('modal-search').value);
        };
        
        container.appendChild(btn);
    });
}

function renderActiveExercises() {
    const list = document.getElementById('active-exercises-list');
    list.innerHTML = '';
    
    const plan = weeklySchedule[currentEditDay];
    if (!plan || !plan.exercises || plan.exercises.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full py-16 text-center opacity-80">
                <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                    <span class="material-symbols-outlined text-4xl text-on-surface-variant">fitness_center</span>
                </div>
                <p class="font-headline-md text-lg text-on-surface mb-2">Rest Day / Kosong</p>
                <p class="text-sm text-on-surface-variant max-w-[220px]">Klik gerakan di pustaka sebelah kanan untuk mulai menyusun jadwal hari ini.</p>
            </div>
        `;
        return;
    }
    
    plan.exercises.forEach((exObj, index) => {
        const exId = typeof exObj === 'string' ? exObj : exObj.id;
        const ex = exerciseLibrary.find(e => e.id === exId);
        if (!ex) return;
        
        let mediaHTML = `<div class="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 border border-white/10 shadow-lg" style="background-image: url(\'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop\')"></div>`;
        if (ex.thumbnail) {
            if (ex.thumbnail.toLowerCase().endsWith('.mp4') || ex.thumbnail.toLowerCase().endsWith('.webm')) {
                mediaHTML = '<div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black relative shadow-lg "><video src="' + ex.thumbnail + '" loop muted playsinline preload="metadata" class="lazy-video w-full h-full object-cover transition-transform duration-500"></video></div>';
            } else {
                mediaHTML = '<div class="w-16 h-16 rounded-xl bg-cover bg-center shrink-0 border border-white/10 shadow-lg" style="background-image: url(\'' + ex.thumbnail + '\')"></div>';
            }
        }
        
        const sets = exObj.sets || 3;
        const reps = exObj.reps || '10';

        const item = document.createElement('div');
        
        item.innerHTML = `
            <div class="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-surface-container-high/40 hover:bg-surface-container-high border border-white/5 hover:border-primary-fixed-dim/30 rounded-2xl transition-all duration-300 overflow-hidden shadow-sm">
                
                <!-- Left: Reorder & Image -->
                <div class="flex items-center gap-3 w-full sm:w-auto">
                    <div class="flex sm:flex-col gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                        <button onclick="moveExercise(${index}, -1)" class="hover:bg-white/10 rounded text-on-surface-variant hover:text-primary-fixed-dim transition-colors disabled:opacity-20 disabled:cursor-not-allowed" ${index === 0 ? 'disabled' : ''}>
                            <span class="material-symbols-outlined text-[16px] block">expand_less</span>
                        </button>
                        <button onclick="moveExercise(${index}, 1)" class="hover:bg-white/10 rounded text-on-surface-variant hover:text-primary-fixed-dim transition-colors disabled:opacity-20 disabled:cursor-not-allowed" ${index === plan.exercises.length - 1 ? 'disabled' : ''}>
                            <span class="material-symbols-outlined text-[16px] block">expand_more</span>
                        </button>
                    </div>
                    ${mediaHTML}
                </div>

                <!-- Middle: Info & Inputs -->
                <div class="flex-1 w-full min-w-0 pr-8 sm:pr-0">
                    <h5 class="text-on-surface text-base font-headline-md font-bold truncate mb-2 group-hover:text-primary-fixed-dim transition-colors">${ex.name}</h5>
                    
                    <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div class="bg-black/40 rounded-lg border border-white/5 p-1.5 flex items-center gap-2 hover:border-white/20 transition-colors focus-within:border-primary-fixed-dim/50">
                            <span class="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider ml-1">Sets</span>
                            <input type="number" min="1" max="20" value="${sets}" onchange="updateExerciseDetail(${index}, 'sets', parseInt(this.value))" class="w-10 sm:w-12 bg-transparent text-primary-fixed-dim font-bold text-center focus:outline-none text-sm transition-colors" />
                        </div>
                        <div class="bg-black/40 rounded-lg border border-white/5 p-1.5 flex items-center gap-2 hover:border-white/20 transition-colors focus-within:border-primary-fixed-dim/50">
                            <span class="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider ml-1">Reps</span>
                            <input type="text" value="${reps}" onchange="updateExerciseDetail(${index}, 'reps', this.value)" class="w-14 sm:w-16 bg-transparent text-primary-fixed-dim font-bold text-center focus:outline-none text-sm transition-colors" />
                        </div>
                    </div>
                </div>

                <!-- Right: Actions -->
                <button onclick="removeActiveExercise(${index})" class="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto w-10 h-10 rounded-full bg-red-500/10 text-red-500/70 hover:text-red-500 hover:bg-red-500/20 hover:scale-110 flex items-center justify-center transition-all shrink-0 border border-red-500/20">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </div>
        `;
        
        list.appendChild(item.firstElementChild);
    });
}

function renderAvailableExercises(filterText = '') {
    const list = document.getElementById('available-exercises-list');
    list.innerHTML = '';
    
    const query = filterText.toLowerCase();
    const filtered = exerciseLibrary.filter(ex => {
        let matchCat = false;
        if (currentModalCategory === 'All') matchCat = true;
        else if (currentModalCategory === 'Pakai Alat') matchCat = ex.category === 'gym';
        else if (currentModalCategory === 'Tanpa Alat') matchCat = ex.category === 'home';
        else matchCat = ex.muscle === currentModalCategory;
        
        const matchSearch = ex.name.toLowerCase().includes(query) || 
                            ex.muscle.toLowerCase().includes(query) || 
                            (ex.manfaat && ex.manfaat.toLowerCase().includes(query));
                            
        return matchCat && matchSearch;
    });
    
    if(filtered.length === 0) {
        list.innerHTML = `
            <div class="col-span-full py-8 flex flex-col items-center justify-center opacity-70">
                <span class="material-symbols-outlined text-3xl text-on-surface-variant mb-2">search_off</span>
                <p class="text-sm text-on-surface-variant">Tidak ada gerakan yang cocok.</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(ex => {
        const item = document.createElement('div');
        
        let mediaHTML = `<div class="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 border border-white/10 shadow-lg" style="background-image: url(\'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop\')"></div>`;
        if (ex.thumbnail) {
            if (ex.thumbnail.toLowerCase().endsWith('.mp4') || ex.thumbnail.toLowerCase().endsWith('.webm')) {
                mediaHTML = '<div class="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black relative "><video src="' + ex.thumbnail + '" loop muted playsinline preload="metadata" class="lazy-video w-full h-full object-cover transition-transform duration-500"></video></div>';
            } else {
                mediaHTML = '<div class="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 border border-white/10" style="background-image: url(\'' + ex.thumbnail + '\')"></div>';
            }
        }
        
        item.innerHTML = `
            <div class="group flex items-center p-3 rounded-xl border border-white/5 bg-surface-container-high/30 hover:bg-surface-container hover:border-primary-fixed-dim/50 transition-all duration-300 gap-4 cursor-pointer shadow-sm" onclick="addExerciseToDay('${ex.id}')">
                ${mediaHTML}
                <div class="flex-1 overflow-hidden">
                    <h5 class="text-on-surface text-sm font-bold mb-1 truncate group-hover:text-primary-fixed-dim transition-colors">${ex.name}</h5>
                    <div class="flex items-center gap-2">
                        <span class="text-[9px] font-label-caps text-on-surface-variant uppercase tracking-widest">${ex.muscle}</span>
                        <span class="w-1 h-1 rounded-full bg-white/20"></span>
                        <span class="text-[9px] text-on-surface-variant truncate">${ex.category.toUpperCase()}</span>
                    </div>
                </div>
                <div class="w-8 h-8 rounded-full bg-primary-fixed-dim/10 text-primary-fixed-dim border border-primary-fixed-dim/20 flex items-center justify-center group-hover:bg-primary-fixed-dim group-hover:text-black group-hover:scale-110 transition-all shrink-0">
                    <span class="material-symbols-outlined text-[18px]">add</span>
                </div>
            </div>
        `;
        list.appendChild(item.firstElementChild);
    });
}

window.moveExercise = function(index, dir) {
    const plan = weeklySchedule[currentEditDay];
    if (!plan || !plan.exercises) return;
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= plan.exercises.length) return;
    
    const temp = plan.exercises[index];
    plan.exercises[index] = plan.exercises[newIndex];
    plan.exercises[newIndex] = temp;
    
    renderActiveExercises();
};

window.updateExerciseDetail = function(index, field, value) {
    const plan = weeklySchedule[currentEditDay];
    if (plan && plan.exercises && plan.exercises[index]) {
        plan.exercises[index][field] = value;
    }
};

window.removeActiveExercise = function(index) {
    const plan = weeklySchedule[currentEditDay];
    if (plan && plan.exercises) {
        plan.exercises.splice(index, 1);
        updatePlanName();
        renderActiveExercises();
    }
};

window.addExerciseToDay = function(exId) {
    const plan = weeklySchedule[currentEditDay];
    if (!plan) return;
    plan.exercises.push({ id: exId, sets: 3, reps: '10' });
    updatePlanName();
    renderActiveExercises();
};
function openScheduleModal(day) {
    currentEditDay = day;
    const plan = weeklySchedule[day];
    
    document.getElementById('modal-day-name').innerText = dayNames[day];
    document.getElementById('modal-plan-name').value = plan.name;
    document.getElementById('modal-search').value = '';
    
    renderActiveExercises();
    renderAvailableExercises();
    
    const todayIndex = new Date().getDay();
    const btnComplete = document.getElementById('complete-session-btn');
    
    if (day === todayIndex) {
        const todayISO = new Date().toISOString().split('T')[0];
        const isCompletedToday = workoutHistory.some(w => w.date === todayISO);
        
        if (isCompletedToday) {
            btnComplete.style.display = 'flex';
            btnComplete.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Session Completed';
            btnComplete.className = "w-full sm:flex-1 bg-primary-fixed-dim/20 border border-primary-fixed-dim/50 text-primary-fixed-dim py-3 rounded-lg font-bold flex justify-center items-center gap-2 cursor-not-allowed";
            btnComplete.disabled = true;
        } else {
            btnComplete.style.display = 'flex';
            btnComplete.innerHTML = '<span class="material-symbols-outlined">play_arrow</span> Selesaikan Sesi';
            btnComplete.className = "w-full sm:flex-1 bg-surface-container-high border border-white/20 text-on-surface hover:text-primary-fixed-dim font-label-caps py-3 rounded-lg transition-all flex justify-center items-center gap-2 hover:border-primary-fixed-dim";
            btnComplete.disabled = false;
        }
    } else {
        btnComplete.style.display = 'none';
    }
    
    document.getElementById('schedule-modal').classList.remove('hidden');
}


function closeScheduleModal() {
    document.getElementById('schedule-modal').classList.add('hidden');
    initTodayProtocol(); // Re-render today protocol when modal closes just in case edits were made
}


function updatePlanName() {
    const plan = weeklySchedule[currentEditDay];
    if (plan.exercises.length === 0) {
        document.getElementById('modal-plan-name').value = "Rest / Empty";
        plan.name = "Rest / Empty";
        return;
    }
    
    const muscles = new Set();
    plan.exercises.forEach(exObj => {
        const exId = typeof exObj === "string" ? exObj : exObj.id;
        const ex = exerciseLibrary.find(e => e.id === exId);
        if (ex) muscles.add(ex.muscle.toLowerCase());
    });
    
    const hasPush = muscles.has('dada') || muscles.has('bahu') || muscles.has('triceps');
    const hasPull = muscles.has('punggung') || muscles.has('biceps');
    const hasLegs = muscles.has('kaki');
    const hasCore = muscles.has('perut');
    const hasCardio = muscles.has('cardio');

    let autoName = "Custom Protocol";

    if (hasPush && hasPull && hasLegs) {
        autoName = "Full Body Workout";
    } else if (hasPush && hasPull && !hasLegs) {
        autoName = "Upper Body Workout";
    } else if (hasLegs && !hasPush && !hasPull) {
        autoName = hasCore ? "Legs & Core" : "Leg Day";
    } else if (hasPush && !hasPull && !hasLegs) {
        autoName = "Push Day";
    } else if (hasPull && !hasPush && !hasLegs) {
        autoName = "Pull Day";
    } else if (hasCore && !hasPush && !hasPull && !hasLegs) {
        autoName = "Core & Abs";
    } else if (hasCardio && !hasPush && !hasPull && !hasLegs && !hasCore) {
        autoName = "Cardio Session";
    } else {
        const capMuscles = Array.from(muscles).map(m => m.charAt(0).toUpperCase() + m.slice(1));
        autoName = capMuscles.join(' & ') + " Workout";
    }
    
    document.getElementById('modal-plan-name').value = autoName;
    plan.name = autoName;
}

document.getElementById('save-schedule-btn').addEventListener('click', async () => {
    // Simpan nama
    weeklySchedule[currentEditDay].name = document.getElementById('modal-plan-name').value;
    
    await saveToServer();
    renderWeeklyGrid();
    closeScheduleModal();
    alert('Jadwal berhasil diperbarui!');
});

document.getElementById('complete-session-btn').addEventListener('click', async () => {
    const plan = weeklySchedule[currentEditDay];
    const confirmFinish = confirm(`Tandai sesi "${plan.name}" selesai untuk hari ini?`);
    if (!confirmFinish) return;

    const todayISO = new Date().toISOString().split('T')[0];
    workoutHistory.push({
        date: todayISO,
        name: plan.name,
        completed: true
    });

    // Update EXP
    const newExp = (userData.exp || 0) + 50; 
    const newLevel = Math.floor(newExp / 100) + 1;
    userData.exp = newExp;
    userData.user_level = Math.max(userData.user_level || 1, newLevel);

    document.getElementById('complete-session-btn').innerHTML = `<span class="material-symbols-outlined animate-spin">refresh</span> Saving...`;
    
    await saveToServer();
    alert("Sesi Latihan berhasil diselesaikan!");
    window.location.reload();
});

async function saveToServer() {
    try {
        const payload = {
            workouts: {
                schedule: weeklySchedule,
                history: workoutHistory
            },
            exp: userData.exp,
            user_level: userData.user_level
        };
        
        await fetch(`/api/workouts/${userId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
    } catch(e) {
        console.error("Gagal save", e);
    }
}

function updateStreakUI() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentWorkouts = workoutHistory.filter(w => new Date(w.date) >= sevenDaysAgo);
    
    const streakEl = document.getElementById('dash-streak');
    if(streakEl) streakEl.innerText = `${recentWorkouts.length}/5`;
    
    const progressFill = document.getElementById('dash-progress-bar');
    if(progressFill) {
        const pct = Math.min((recentWorkouts.length / 5) * 100, 100);
        progressFill.style.width = `${pct}%`;
    }
}
document.getElementById('modal-search').addEventListener('input', (e) => { renderAvailableExercises(e.target.value); });








// Drag to scroll functionality for weekly grid (Desktop testing)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const slider = document.getElementById('weekly-grid');
        if(!slider) return;
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('cursor-grabbing');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('cursor-grabbing');
        });
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('cursor-grabbing');
        });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed multiplier
            slider.scrollLeft = scrollLeft - walk;
        });
    }, 1000);
});





// --- SMART VIDEO OBSERVER ---
const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.play().catch(e => {}); // Play if visible
        } else {
            entry.target.pause(); // Pause if out of view
        }
    });
}, { threshold: 0.1 });

function observeVideos() {
    setTimeout(() => {
        document.querySelectorAll('video.lazy-video').forEach(vid => {
            videoObserver.observe(vid);
        });
    }, 100);
}
