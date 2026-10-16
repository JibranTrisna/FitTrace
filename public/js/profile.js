document.addEventListener('DOMContentLoaded', async () => {
    try {
        const userId = localStorage.getItem('workoutUserId');
        const token = localStorage.getItem('workoutToken');
        
        // Fetch User / Workout data
        const res = await fetch('/api/workouts/' + userId + '?t=' + Date.now(), {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const userData = await res.json();
        if (!userData.workouts || !userData.workouts.profile || !userData.workouts.profile.isSetup) { window.location.href = 'onboarding.html'; return; }
        
        // Ensure workouts is an object
        let workouts = userData.workouts;
        if (Array.isArray(workouts)) { workouts = { history: workouts }; }
        
        // Fetch Progress Data (for achievements)
        const progRes = await fetch('/api/progress/' + userId + '?t=' + Date.now(), {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const progData = await progRes.json();
        
        // 1. Setup Profile Headers
        document.getElementById('profile-name').innerText = userData.username || 'Unknown';
        
        const avatarEl = document.getElementById('profile-page-avatar');
        if (avatarEl) {
            const name = userData.username || 'User';
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=abd600&color=051424&bold=true&size=256`;
        }
        
        const exp = userData.exp || 0;
        const level = userData.user_level || 1;
        document.getElementById('profile-level-badge').innerText = 'LVL ' + level;
        
        // Titles based on level
        let title = "Novice Lifter";
        if (level >= 5) title = "Intermediate Athlete";
        if (level >= 10) title = "Advanced Kinetic";
        if (level >= 20) title = "Elite Precision";
        document.getElementById('profile-title').innerText = title;
        
        // Exp Progress
        const currentLevelExp = (level - 1) * 100;
        const nextLevelExp = level * 100;
        const expIntoLevel = exp - currentLevelExp;
        const pct = Math.min((expIntoLevel / 100) * 100, 100);
        
        document.getElementById('exp-bar').style.width = pct + '%';
        document.getElementById('exp-current').innerText = exp + ' Total EXP';
        document.getElementById('exp-next').innerText = 'Next Level: ' + nextLevelExp + ' EXP';

        // 1.5 Setup Body Metrics & AI Report
        if (workouts.metrics) {
            document.getElementById('metric-height').value = workouts.metrics.height || '';
            document.getElementById('metric-weight').value = workouts.metrics.weight || '';
            
            if (workouts.metrics.bmi) {
                document.getElementById('ai-recommendation-card').classList.remove('hidden');
                document.getElementById('ai-recommendation-card').classList.add('flex');
                document.getElementById('bmi-badge').innerText = 'BMI: ' + parseFloat(workouts.metrics.bmi).toFixed(1);
                document.getElementById('ai-category-title').innerText = workouts.metrics.reportTitle || workouts.metrics.category;
                document.getElementById('ai-recommendation-desc').innerText = workouts.metrics.reportDesc || ('Kamu berada di kategori ' + workouts.metrics.category);
            }
        }

        // Handle Analyze & Save
        document.getElementById('btn-analyze').addEventListener('click', async () => {
            const h = parseFloat(document.getElementById('metric-height').value);
            const w = parseFloat(document.getElementById('metric-weight').value);
            if (!h || !w) return alert('Mohon isi tinggi dan berat badan.');

            const btnAnalyze = document.getElementById('btn-analyze');
            btnAnalyze.innerHTML = '<span class="material-symbols-outlined animate-spin">autorenew</span> Menyimpan...';
            
            workouts.profile.height = h;
            workouts.profile.weight = w;
            
            // Re-run Generator
            const generated = window.generateAdvancedSchedule(workouts.profile, exerciseLibrary);
            const bmiStr = generated.bmi.toFixed(1);
            
            let repTitle = ''; let repDesc = '';
            if (generated.bmiCategory === 'Underweight') {
                repTitle = 'Fase Bulking & Hypertrophy';
                repDesc = 'Melihat dari BMI lu yang masih ' + bmiStr + ' (Kurus), fokus utama kita sekarang adalah nambah massa otot dan naikin berat badan lu secara sehat. Gak perlu terlalu banyak kardio, kita fokus angkat beban!';
            } else if (generated.bmiCategory === 'Normal') {
                repTitle = 'Fase Recomposition & Strength';
                repDesc = 'Kondisi lu udah cukup ideal dengan BMI ' + bmiStr + '. Sekarang saatnya kita bakar sisa lemak membandel dan ganti dengan massa otot yang padat supaya badan lu lebih berbentuk (Aesthetic).';
            } else {
                repTitle = 'Fase Fat Loss & Conditioning';
                repDesc = 'Dengan BMI ' + bmiStr + ', AI merekomendasikan lu untuk masuk ke fase Fat Loss. Jadwal lu bakal diisi dengan intensitas yang tinggi dan gerakan kardio yang membakar kalori secara maksimal.';
            }

            workouts.metrics = { height: h, weight: w, bmi: generated.bmi, category: generated.bmiCategory, reportTitle: repTitle, reportDesc: repDesc, lastUpdated: new Date().toISOString() };
            workouts.schedule = generated.schedule;

            try {
                await fetch('/api/workouts/' + userId, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ userId, workouts })
                });

                // Update UI
                document.getElementById('ai-recommendation-card').classList.remove('hidden');
                document.getElementById('ai-recommendation-card').classList.add('flex');
                document.getElementById('bmi-badge').innerText = 'BMI: ' + bmiStr;
                document.getElementById('ai-category-title').innerText = repTitle;
                document.getElementById('ai-recommendation-desc').innerText = repDesc;
                
                alert('Metrik & Jadwal AI berhasil diperbarui!');
                btnAnalyze.innerHTML = '<span class="material-symbols-outlined text-[18px]">psychology</span> Analisis & Simpan';
            } catch (err) {
                console.error(err);
                alert('Gagal menyimpan metrik baru.');
                btnAnalyze.innerHTML = '<span class="material-symbols-outlined text-[18px]">psychology</span> Analisis & Simpan';
            }
        });
        
        // Handle Generate Smart Schedule button
        const btnGen = document.getElementById('btn-generate-schedule');
        if (btnGen) {
            btnGen.addEventListener('click', () => {
                window.location.href = 'dashboard.html';
            });
            btnGen.innerHTML = '<span class="material-symbols-outlined text-[18px]">calendar_month</span> Lihat Jadwal di Dashboard';
        }

        // 2. Setup Achievements
        const history = (workouts.history) ? workouts.history : [];
        const logs = progData.logs || [];
        
        // Calculate Total Load
        let totalLoadKg = 0;
        logs.forEach(log => {
            totalLoadKg += (parseFloat(log.bench_press) || 0) + (parseFloat(log.squat) || 0) + (parseFloat(log.deadlift) || 0);
        });

        const achievements = [
            {
                name: "First Blood",
                desc: "Selesaikan 1 sesi latihan pertamamu.",
                icon: "whatshot",
                unlocked: history.length >= 1
            },
            {
                name: "Consistency Is Key",
                desc: "Selesaikan total 10 sesi latihan.",
                icon: "calendar_month",
                unlocked: history.length >= 10
            },
            {
                name: "Iron Mover",
                desc: "Log total angkatan (Kinetic Load) sebesar 1 Ton (1000kg).",
                icon: "weight",
                unlocked: totalLoadKg >= 1000
            },
            {
                name: "Titan Strength",
                desc: "Log total angkatan sebesar 10 Ton (10.000kg).",
                icon: "fitness_center",
                unlocked: totalLoadKg >= 10000
            },
            {
                name: "Level 5 Elite",
                desc: "Capai Level 5 dari perolehan EXP harian.",
                icon: "star",
                unlocked: level >= 5
            }
        ];

        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';
        
        achievements.forEach(ach => {
            const div = document.createElement('div');
            div.className = 'p-5 rounded-xl border flex gap-4 items-start ' + (ach.unlocked ? 'bg-primary-fixed-dim/10 border-primary-fixed-dim shadow-[0_0_15px_rgba(171,214,0,0.15)]' : 'bg-surface-container border-white/5 opacity-50 grayscale');
            
            div.innerHTML = `
                <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 ` + (ach.unlocked ? 'bg-primary-fixed-dim text-black' : 'bg-white/10 text-white') + `">
                    <span class="material-symbols-outlined">` + ach.icon + `</span>
                </div>
                <div>
                    <h4 class="font-headline-md text-on-surface text-sm mb-1 ` + (ach.unlocked ? 'text-primary-fixed-dim' : '') + `">` + ach.name + `</h4>
                    <p class="font-body-md text-xs text-on-surface-variant">` + ach.desc + `</p>
                </div>
            `;
            grid.appendChild(div);
        });
        
    } catch (e) {
        console.error("Profile error", e);
    }
});
