// File: public/js/workouts.js

const listContainer = document.querySelector('#workout-list .grid');
const filterContainer = document.getElementById('category-filters');
const searchInput = document.getElementById('library-search');

let currentCategory = 'All';
let searchQuery = '';

let userData = null;
let weeklySchedule = {};
let currentExerciseToAdd = null;

// userId and token are globally provided by guard.js
if (!userId || !token) { window.location.href = 'login.html'; }

// Create Modal Element with Add to Plan Feature
const modalHTML = `
<div id="exercise-modal" class="fixed inset-0 z-[100] flex items-center justify-center hidden">
    <div class="absolute inset-0 bg-background/90 backdrop-blur-sm" onclick="closeModal()"></div>
    <div class="relative z-10 w-full max-w-lg glass-panel rounded-2xl p-6 m-4 shadow-[0_0_40px_rgba(171,214,0,0.2)] border border-primary-fixed-dim/30 flex flex-col max-h-[90vh]">
        <button onclick="closeModal()" class="absolute top-4 right-4 text-on-surface-variant hover:text-primary-fixed-dim transition-colors z-20">
            <span class="material-symbols-outlined">close</span>
        </button>
        <h3 id="modal-title" class="font-headline-md text-2xl text-primary mb-4 pr-8"></h3>
        
        <div class="overflow-y-auto pr-2 no-scrollbar flex-1">
            <div class="w-full h-[300px] md:h-[400px] bg-black rounded-lg overflow-hidden mb-4 border border-white/10 relative">
                <video id="modal-video" src="" loop muted playsinline preload="metadata" class="lazy-video w-full h-full object-contain"></video>
                <div class="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg "></div>
            </div>
            
            <div class="space-y-4 mb-6">
                <div>
                    <h4 class="font-label-caps text-xs text-primary-fixed-dim uppercase mb-1">Fungsi</h4>
                    <p id="modal-fungsi" class="font-body-md text-on-surface-variant text-sm"></p>
                </div>
                <div>
                    <h4 class="font-label-caps text-xs text-primary-fixed-dim uppercase mb-1">Manfaat</h4>
                    <p id="modal-manfaat" class="font-body-md text-on-surface-variant text-sm"></p>
                </div>
            </div>
            
            <!-- Add to Plan Section -->
            <div class="p-4 bg-surface-container rounded-xl border border-white/5 mt-4">
                <h4 class="font-label-caps text-xs text-on-surface uppercase mb-3"><span class="material-symbols-outlined text-[14px] align-middle mr-1">calendar_add_on</span> Tambah ke Jadwal</h4>
                <div class="flex gap-2">
                    <select id="modal-day-select" class="flex-1 bg-surface-container-high border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary-fixed-dim">
                        <option value="1">Senin</option>
                        <option value="2">Selasa</option>
                        <option value="3">Rabu</option>
                        <option value="4">Kamis</option>
                        <option value="5">Jumat</option>
                        <option value="6">Sabtu</option>
                        <option value="0">Minggu</option>
                    </select>
                    <button onclick="addToPlan()" id="btn-add-plan" class="bg-primary-fixed-dim text-black font-label-caps px-4 py-2 rounded-lg hover:scale-105 transition-all text-sm font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">add</span> Add
                    </button>
                </div>
                <p id="add-plan-msg" class="text-xs text-primary-fixed-dim mt-2 hidden">Berhasil ditambahkan!</p>
            </div>
        </div>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

async function initApp() {
    try {
        const res = await fetch('/api/workouts/' + userId, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.workouts) {
                let w = data.workouts;
                if (Array.isArray(w)) w = { history: w }; // Legacy fix
                userData = w;
                weeklySchedule = w.schedule || {};
                
                // Update Hero Banner
                if (w.metrics && w.metrics.reportTitle) {
                    document.getElementById('hero-title').innerText = w.metrics.reportTitle;
                    document.getElementById('hero-desc').innerText = w.metrics.reportDesc || "Berikut adalah protokol yang dirancang khusus oleh AI berdasarkan komposisi tubuh lo.";
                    document.getElementById('hero-badge').innerText = w.metrics.category || "AI Generated";
                    
                    const bgEl = document.getElementById('hero-bg');
                    if (w.metrics.category === 'Underweight') {
                        bgEl.style.backgroundImage = "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop')";
                    } else if (w.metrics.category === 'Normal') {
                        bgEl.style.backgroundImage = "url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop')";
                    } else {
                        bgEl.style.backgroundImage = "url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop')";
                    }
                } else {
                    document.getElementById('hero-title').innerText = "Personalized Protocol";
                    document.getElementById('hero-desc').innerText = "Buka Profil lo dan jalankan Analisis AI untuk mendapatkan protokol latihan yang sesuai.";
                    document.getElementById('hero-badge').innerText = "Belum Disinkronisasi";
                }
            }
        }
    } catch (e) {
        console.error("Gagal load AI Data:", e);
    }

    initFilters();
    renderLibrary();
}
initApp();

function initFilters() {
    try {
        const muscles = new Set();
        exerciseLibrary.forEach(ex => muscles.add(ex.muscle));
        
        const categories = ['Semua', 'Pakai Alat', 'Tanpa Alat', ...Array.from(muscles)];
        
        filterContainer.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.innerText = cat;
            
            if (cat === currentCategory || (cat === 'Semua' && currentCategory === 'All')) {
                btn.className = "whitespace-nowrap px-4 py-1.5 text-xs rounded-full border border-primary-fixed-dim bg-primary-fixed-dim/10 text-primary-fixed-dim font-label-caps transition-colors";
            } else {
                btn.className = "whitespace-nowrap px-4 py-1.5 text-xs rounded-full border border-white/10 bg-transparent text-on-surface hover:border-white/30 hover:bg-white/5 font-label-caps transition-colors";
            }
            
            btn.onclick = () => {
                currentCategory = cat === 'Semua' ? 'All' : cat;
                initFilters();
                renderLibrary();
            };
            
            filterContainer.appendChild(btn);
        });
    } catch (err) {
        if (filterContainer) filterContainer.innerHTML = `<p class="text-red-500">Filter Error: ${err.message}</p>`;
        console.error(err);
    }
}

function renderLibrary() {
    try {
        if (!listContainer) return;
        listContainer.innerHTML = '';
        
        if (typeof exerciseLibrary === 'undefined') {
            listContainer.innerHTML = `<p class="col-span-full text-center text-red-500 py-8">Error: Database latihan gagal dimuat. Silakan muat ulang halaman.</p>`;
            return;
        }

        const filtered = exerciseLibrary.filter(ex => {
            let matchCategory = false;
            if (currentCategory === 'All') matchCategory = true;
            else if (currentCategory === 'Pakai Alat') matchCategory = ex.category === 'gym';
            else if (currentCategory === 'Tanpa Alat') matchCategory = ex.category === 'home';
            else matchCategory = ex.muscle === currentCategory;
            
            const matchSearch = ex.name.toLowerCase().includes(searchQuery) || 
                                (ex.manfaat && ex.manfaat.toLowerCase().includes(searchQuery)) ||
                                (ex.fungsi && ex.fungsi.toLowerCase().includes(searchQuery));
            return matchCategory && matchSearch;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `<p class="col-span-full text-center text-on-surface-variant py-8">Tidak ada latihan yang cocok dengan pencarian.</p>`;
            return;
        }

        filtered.forEach(ex => {
            const card = document.createElement('div');
            card.className = "glass-panel rounded-xl overflow-hidden flex flex-col group card-hover-effect cursor-pointer";
            card.onclick = () => openModal(ex);
            
            let mediaHTML = '';
            if (ex.thumbnail) {
                if (ex.thumbnail.toLowerCase().endsWith('.mp4') || ex.thumbnail.toLowerCase().endsWith('.webm')) {
                    mediaHTML = `<video src="${ex.thumbnail}" loop muted playsinline preload="metadata" class="lazy-video absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"></video>`;
                } else {
                    mediaHTML = `<img src="${ex.thumbnail}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${ex.name}">`;
                }
            } else {
                let fallbackUrl = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop';
                if(ex.category === 'home') fallbackUrl = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop';
                mediaHTML = `<div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${fallbackUrl}')"></div>`;
            }
            
            card.innerHTML = `
                <div class="h-56 relative overflow-hidden bg-surface-container">
                    ${mediaHTML}
                    <div class="absolute inset-0 bg-black/40"></div>
                    <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-full font-label-caps text-[9px] text-primary-fixed-dim flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px]">bolt</span> ${ex.muscle}
                    </div>
                </div>
                <div class="p-4 flex-1 flex flex-col">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-headline-md text-base text-primary font-semibold leading-tight group-hover:text-primary-fixed-dim transition-colors">${ex.name}</h4>
                    </div>
                    <p class="font-body-md text-on-surface-variant text-xs mb-4 flex-1 line-clamp-2">${ex.fungsi}</p>
                    <button class="w-full bg-transparent group-hover:bg-primary-fixed-dim/10 border border-primary-fixed-dim text-primary-fixed-dim font-label-caps py-1.5 text-xs rounded-lg transition-colors flex justify-center items-center gap-2">
                        <span class="material-symbols-outlined text-[16px]">visibility</span> Detail
                    </button>
                </div>
            `;
            listContainer.appendChild(card);
        });
        observeVideos();
    } catch (err) {
        if (listContainer) listContainer.innerHTML = `<p class="col-span-full text-center text-red-500 py-8">Error Rendering: ${err.message}</p>`;
        console.error(err);
    }
}

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderLibrary();
});

function openModal(ex) {
    currentExerciseToAdd = ex;
    document.getElementById('modal-title').innerText = ex.name;
    
    // Gunakan video custom kalau ada
    const videoSrc = (ex.thumbnail && (ex.thumbnail.endsWith('.mp4') || ex.thumbnail.endsWith('.webm'))) ? ex.thumbnail : ex.video;
    document.getElementById('modal-video').src = videoSrc;
    
    document.getElementById('modal-fungsi').innerText = ex.fungsi || '-';
    document.getElementById('modal-manfaat').innerText = ex.manfaat || '-';
    
    document.getElementById('add-plan-msg').classList.add('hidden');
    document.getElementById('exercise-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('exercise-modal').classList.add('hidden');
    document.getElementById('modal-video').pause();
    currentExerciseToAdd = null;
}

async function addToPlan() {
    if (!userData || !currentExerciseToAdd) return;
    
    const day = document.getElementById('modal-day-select').value;
    const btn = document.getElementById('btn-add-plan');
    const msg = document.getElementById('add-plan-msg');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[16px]">autorenew</span> Saving...';
    
    try {
        if (!weeklySchedule[day]) {
            weeklySchedule[day] = { name: "Custom Protocol", exercises: [] };
        }
        
        // Add to schedule
        // Update format: store as object for CRUD sets/reps compatibility
        weeklySchedule[day].exercises.push({
            id: currentExerciseToAdd.id,
            sets: 3,
            reps: '10'
        });
        
        userData.schedule = weeklySchedule; // ensure it's referenced
        
        // Save to DB
        await fetch('/api/workouts/' + userId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ userId, workouts: userData })
        });
        
        msg.innerText = `${currentExerciseToAdd.name} ditambahkan!`;
        msg.classList.remove('hidden', 'text-red-500');
        msg.classList.add('text-primary-fixed-dim');
        
        setTimeout(() => {
            msg.classList.add('hidden');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">add</span> Add';
        }, 2000);
        
    } catch (e) {
        console.error(e);
        msg.innerText = "Gagal menyimpan!";
        msg.classList.remove('text-primary-fixed-dim', 'hidden');
        msg.classList.add('text-red-500');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">add</span> Add';
    }
}





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
