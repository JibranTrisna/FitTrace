document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch 1: Log Angkatan Beban (Progress)
        const progressRes = await fetch(`/api/progress/${userId}?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Fetch 2: Data Workout (Sessions/Schedule)
        const workoutRes = await fetch(`/api/workouts/${userId}?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!progressRes.ok || !workoutRes.ok) throw new Error('Gagal mengambil data analitik');
        
        const progData = await progressRes.json();
        const workData = await workoutRes.json();
        
        const logs = progData.logs || [];
        let dbWorkouts = workData.workouts || [];
        let workouts = [];
        if (Array.isArray(dbWorkouts)) {
            workouts = dbWorkouts;
        } else {
            workouts = dbWorkouts.history || [];
        }
        
        // 1. Kalkulasi Total Kinetic Load (Sum of all lifts in tons) dari Progress Logs
        let totalLoadKg = 0;
        logs.forEach(log => {
            totalLoadKg += (parseFloat(log.bench_press) || 0) + (parseFloat(log.squat) || 0) + (parseFloat(log.deadlift) || 0);
        });
        const totalLoadTons = (totalLoadKg / 1000).toFixed(2);
        
        const loadEl = document.querySelectorAll('.font-data-point')[0];
        if(loadEl) loadEl.innerText = totalLoadTons;

        // 2. Sessions Completed (Dari jumlah daily workout yang diselesaikan)
        const sessionsEl = document.querySelectorAll('.font-data-point')[1];
        if(sessionsEl) sessionsEl.innerText = workouts.length;

        // 3. Active Streak (Menghitung hari berturut-turut dari workouts log)
        let streak = 0;
        if (workouts.length > 0) {
            // Urutkan workout dari yang terbaru
            const sortedWorkouts = workouts.sort((a,b) => new Date(b.date) - new Date(a.date));
            let currentDate = new Date();
            currentDate.setHours(0,0,0,0);
            
            // Cek jika workout terbaru adalah hari ini atau kemarin
            let lastWorkoutDate = new Date(sortedWorkouts[0].date);
            lastWorkoutDate.setHours(0,0,0,0);
            
            const diffTime = Math.abs(currentDate - lastWorkoutDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays <= 1) {
                streak = 1;
                // Hitung ke belakang
                for (let i = 0; i < sortedWorkouts.length - 1; i++) {
                    let d1 = new Date(sortedWorkouts[i].date);
                    let d2 = new Date(sortedWorkouts[i+1].date);
                    d1.setHours(0,0,0,0); d2.setHours(0,0,0,0);
                    
                    const diff = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
                    if (diff === 1) {
                        streak++;
                    } else if (diff > 1) {
                        break;
                    }
                }
            }
        }
        
        const streakEl = document.querySelectorAll('.font-data-point')[2];
        if(streakEl) streakEl.innerText = streak;

        // 4. Render Charts (Chart.js)
        if (logs.length > 0 && typeof Chart !== 'undefined') {
            const sortedLogs = [...logs].sort((a,b) => new Date(a.log_date) - new Date(b.log_date));
            const labels = sortedLogs.map(l => {
                const d = new Date(l.log_date);
                return `${d.getDate()}/${d.getMonth()+1}`;
            });
            const dataBench = sortedLogs.map(l => l.bench_press);
            const dataSquat = sortedLogs.map(l => l.squat);
            const dataDeadlift = sortedLogs.map(l => l.deadlift);
            const dataBW = sortedLogs.map(l => l.body_weight);

            const chartConfig = {
                responsive: true,
                maintainAspectRatio: false,
                color: '#d4e4fa',
                plugins: { legend: { labels: { color: '#d4e4fa' } } },
                scales: {
                    x: { ticks: { color: '#c4c9ac' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#c4c9ac' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            };

            const ctxKinetic = document.getElementById('kineticChart');
            if (ctxKinetic) {
                new Chart(ctxKinetic, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: 'Bench Press (kg)', data: dataBench, borderColor: '#abd600', backgroundColor: 'rgba(171,214,0,0.1)', fill: true, tension: 0.4 },
                            { label: 'Squat (kg)', data: dataSquat, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
                            { label: 'Deadlift (kg)', data: dataDeadlift, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 }
                        ]
                    },
                    options: chartConfig
                });
            }

            const ctxBW = document.getElementById('bodyweightChart');
            if (ctxBW) {
                new Chart(ctxBW, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: 'Body Mass (kg)', data: dataBW, backgroundColor: '#c3f400', borderRadius: 4 }
                        ]
                    },
                    options: chartConfig
                });
            }
        }

        // 5. Render Achievements di Progress
        const achievementsGrid = document.getElementById('progress-achievements');
        if (achievementsGrid) {
            const achievements = [
                { name: "First Blood", desc: "Selesaikan 1 sesi latihan pertamamu.", icon: "whatshot", unlocked: workouts.length >= 1 },
                { name: "Consistency Is Key", desc: "Selesaikan total 10 sesi latihan.", icon: "calendar_month", unlocked: workouts.length >= 10 },
                { name: "Iron Mover", desc: "Log total angkatan (Kinetic Load) sebesar 1 Ton (1000kg).", icon: "weight", unlocked: totalLoadKg >= 1000 },
                { name: "Titan Strength", desc: "Log total angkatan sebesar 10 Ton (10.000kg).", icon: "fitness_center", unlocked: totalLoadKg >= 10000 },
                { name: "Level 5 Elite", desc: "Capai Level 5 dari perolehan EXP harian.", icon: "star", unlocked: (workData.user_level || 1) >= 5 }
            ];

            achievementsGrid.innerHTML = '';
            achievements.forEach(ach => {
                const div = document.createElement('div');
                div.className = `p-4 rounded-xl border flex gap-3 items-center ${ach.unlocked ? 'bg-primary-fixed-dim/10 border-primary-fixed-dim' : 'bg-surface-container border-white/5 opacity-50 grayscale'}`;
                div.innerHTML = `
                    <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ach.unlocked ? 'bg-primary-fixed-dim text-black' : 'bg-white/10 text-white'}">
                        <span class="material-symbols-outlined text-[20px]">${ach.icon}</span>
                    </div>
                    <div>
                        <h4 class="font-headline-md text-on-surface text-sm ${ach.unlocked ? 'text-primary-fixed-dim' : ''}">${ach.name}</h4>
                        <p class="font-body-md text-[10px] text-on-surface-variant">${ach.desc}</p>
                    </div>
                `;
                achievementsGrid.appendChild(div);
            });
        }

    } catch (error) {
        console.error("Error fetching progress data:", error);
    }
});

// Modal UI for Log New Entry (Weightlifting stats)
const modalHTML = `
<div id="progress-modal" class="fixed inset-0 z-[100] flex items-center justify-center hidden">
    <div class="absolute inset-0 bg-background/90 backdrop-blur-sm" onclick="closeProgressModal()"></div>
    <div class="relative z-10 w-full max-w-md glass-panel rounded-2xl p-8 m-4 shadow-[0_0_40px_rgba(171,214,0,0.2)] border border-primary-fixed-dim/30">
        <h3 class="font-headline-md text-2xl text-primary mb-6">Log Kinetic Output</h3>
        <form id="progress-form" class="space-y-4">
            <div>
                <label class="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase">Date</label>
                <input required id="log-date" type="date" class="w-full bg-surface-container-high border border-white/10 rounded-lg py-2 px-3 text-on-surface font-body-md focus:outline-none focus:border-primary-fixed-dim" />
            </div>
            <div>
                <label class="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase">Body Mass (kg)</label>
                <input required id="log-bw" type="number" step="0.1" class="w-full bg-surface-container-high border border-white/10 rounded-lg py-2 px-3 text-on-surface font-body-md focus:outline-none focus:border-primary-fixed-dim" />
            </div>
            <div>
                <label class="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase">Bench Press (kg)</label>
                <input required id="log-bench" type="number" step="0.1" class="w-full bg-surface-container-high border border-white/10 rounded-lg py-2 px-3 text-on-surface font-body-md focus:outline-none focus:border-primary-fixed-dim" />
            </div>
            <div>
                <label class="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase">Squat (kg)</label>
                <input required id="log-squat" type="number" step="0.1" class="w-full bg-surface-container-high border border-white/10 rounded-lg py-2 px-3 text-on-surface font-body-md focus:outline-none focus:border-primary-fixed-dim" />
            </div>
            <div>
                <label class="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase">Deadlift (kg)</label>
                <input required id="log-deadlift" type="number" step="0.1" class="w-full bg-surface-container-high border border-white/10 rounded-lg py-2 px-3 text-on-surface font-body-md focus:outline-none focus:border-primary-fixed-dim" />
            </div>
            <div class="pt-4 flex gap-4">
                <button type="button" onclick="closeProgressModal()" class="flex-1 bg-surface border border-white/20 text-on-surface font-label-caps py-3 rounded-lg hover:bg-white/5 transition-all font-bold">Cancel</button>
                <button type="submit" class="flex-1 bg-primary-fixed-dim text-black font-label-caps py-3 rounded-lg hover:brightness-110 transition-all font-bold">Save Log</button>
            </div>
        </form>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

document.getElementById('add-progress-btn').addEventListener('click', () => {
    document.getElementById('log-date').valueAsDate = new Date();
    document.getElementById('progress-modal').classList.remove('hidden');
});

function closeProgressModal() {
    document.getElementById('progress-modal').classList.add('hidden');
}

document.getElementById('progress-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dateVal = document.getElementById('log-date').value;
    const dataObj = {
        log_date: dateVal,
        body_weight: parseFloat(document.getElementById('log-bw').value) || 0,
        bench_press: parseFloat(document.getElementById('log-bench').value) || 0,
        squat: parseFloat(document.getElementById('log-squat').value) || 0,
        deadlift: parseFloat(document.getElementById('log-deadlift').value) || 0
    };

    try {
        const response = await fetch(`/api/progress/${userId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dataObj)
        });
        
        if (!response.ok) throw new Error("Gagal menyimpan progress");
        
        closeProgressModal();
        window.location.reload();
    } catch(err) {
        console.error(err);
        alert(err.message);
    }
});

