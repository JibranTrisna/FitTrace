document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('workoutUserId');
    const token = localStorage.getItem('workoutToken');
    if (!userId || !token) {
        window.location.href = 'login.html';
        return;
    }

    let currentStep = 1;
    const totalSteps = 6;
    const answers = {
        height: null,
        weight: null,
        experience: null,
        equipment: null,
        busy: null,
        mealsFreq: null,
        dietType: '',
        cardio: null,
        cardioType: '',
        cardioFreq: null
    };

    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const progressBar = document.getElementById('progress-bar');
    const navButtons = document.getElementById('nav-buttons');

    // Handle Option Selections
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const group = card.getAttribute('data-group');
            const val = card.getAttribute('data-val');
            
            // Remove selected class from others in the same group
            document.querySelectorAll(`.option-card[data-group="${group}"]`).forEach(c => c.classList.remove('selected'));
            
            // Add selected
            card.classList.add('selected');
            answers[group] = val;
            
            if (group === 'cardio') {
                const details = document.getElementById('cardio-details');
                if (val === 'Ya') {
                    details.classList.remove('hidden');
                } else {
                    details.classList.add('hidden');
                }
            }
        });
    });

    function validateStep() {
        if (currentStep === 1) {
            const h = document.getElementById('inp-height').value;
            const w = document.getElementById('inp-weight').value;
            if (!h || !w) return false;
            answers.height = parseFloat(h);
            answers.weight = parseFloat(w);
        } else if (currentStep === 2) {
            if (!answers.experience || !answers.equipment) return false;
        } else if (currentStep === 3) {
            if (!answers.busy) return false;
        } else if (currentStep === 4) {
            const m = document.getElementById('inp-meals').value;
            if (!m) return false;
            answers.mealsFreq = parseInt(m);
            answers.dietType = document.getElementById('inp-diet').value;
        } else if (currentStep === 5) {
            if (!answers.cardio) return false;
            if (answers.cardio === 'Ya') {
                answers.cardioType = document.getElementById('inp-cardio-type').value;
                answers.cardioFreq = parseInt(document.getElementById('inp-cardio-freq').value) || 1;
            }
        }
        return true;
    }

    function showStep(step) {
        document.querySelectorAll('.step').forEach(el => el.classList.add('step-hidden'));
        document.getElementById(`step-${step}`).classList.remove('step-hidden');
        document.getElementById(`step-${step}`).classList.add('fade-in');
        
        progressBar.style.width = ((step - 1) / (totalSteps - 1) * 100) + '%';
        
        if (step === 1) {
            btnPrev.classList.add('invisible');
        } else {
            btnPrev.classList.remove('invisible');
        }

        if (step === totalSteps - 1) {
            btnNext.innerHTML = `Analisis <span class="material-symbols-outlined text-[18px]">psychology</span>`;
        } else if (step === totalSteps) {
            navButtons.classList.add('hidden');
            processAndSave();
        } else {
            btnNext.innerHTML = `Lanjut <span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
        }
    }

    btnNext.addEventListener('click', () => {
        if (!validateStep()) {
            alert('Mohon isi semua data di langkah ini sebelum melanjutkan.');
            return;
        }
        currentStep++;
        showStep(currentStep);
    });

    btnPrev.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });

    async function processAndSave() {
        try {
            // Call Advanced Generator immediately
            const generated = window.generateAdvancedSchedule(answers, exerciseLibrary);
            
            // Generate Report Texts
            const bmi = generated.bmi.toFixed(1);
            let title = '';
            let desc = '';
            let activeDays = Object.keys(generated.schedule).filter(day => generated.schedule[day].exercises && generated.schedule[day].exercises.length > 0).length;
            
            if (generated.bmiCategory === 'Underweight') {
                title = 'Fase Bulking & Hypertrophy';
                desc = `Melihat dari BMI lu yang masih ${bmi} (Kurus), fokus utama kita sekarang adalah nambah massa otot dan naikin berat badan lu secara sehat. Gak perlu terlalu banyak kardio, kita fokus angkat beban!`;
            } else if (generated.bmiCategory === 'Normal') {
                title = 'Fase Recomposition & Strength';
                desc = `Kondisi lu udah cukup ideal dengan BMI ${bmi}. Sekarang saatnya kita bakar sisa lemak membandel dan ganti dengan massa otot yang padat supaya badan lu lebih berbentuk (Aesthetic).`;
            } else {
                title = 'Fase Fat Loss & Conditioning';
                desc = `Dengan BMI ${bmi}, AI merekomendasikan lu untuk masuk ke fase Fat Loss. Jadwal lu bakal diisi dengan intensitas yang tinggi dan gerakan kardio yang membakar kalori secara maksimal.`;
            }

            document.getElementById('report-bmi').innerText = `BMI: ${bmi}`;
            document.getElementById('report-title').innerText = title;
            document.getElementById('report-desc').innerText = desc;
            document.getElementById('report-plan').innerText = `${activeDays} Hari Latihan / Minggu`;
            
            // Simulate processing time
            setTimeout(async () => {
                // Show Step 7
                document.querySelectorAll('.step').forEach(el => el.classList.add('step-hidden'));
                document.getElementById('step-7').classList.remove('step-hidden');
                document.getElementById('header-container').classList.add('hidden');
                document.getElementById('progress-container').classList.add('hidden');
                document.getElementById('progress-bar').style.width = '100%';
                
                // Attach Event to Apply button securely
                const btnApply = document.getElementById('btn-apply');
                const newBtnApply = btnApply.cloneNode(true);
                btnApply.parentNode.replaceChild(newBtnApply, btnApply);
                
                newBtnApply.addEventListener('click', async () => {
                    newBtnApply.innerHTML = `<span class="material-symbols-outlined animate-spin">autorenew</span> Menyimpan...`;
                    newBtnApply.disabled = true;
                    
                    try {
                        const res = await fetch(`/api/workouts/${userId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (!res.ok) throw new Error('Gagal memuat data lama. Status: ' + res.status);
                        const userData = await res.json();
                        
                        let workouts = userData.workouts || {};
                        if (Array.isArray(workouts)) { workouts = { history: workouts }; }
                        
                        workouts.profile = { isSetup: true, ...answers, lastUpdated: new Date().toISOString() };
                        workouts.schedule = generated.schedule;
                        workouts.metrics = { height: answers.height, weight: answers.weight, bmi: generated.bmi, category: generated.bmiCategory, reportTitle: title, reportDesc: desc, lastUpdated: new Date().toISOString() };

                        const postRes = await fetch(`/api/workouts/${userId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ userId, workouts })
                        });
                        
                        if (!postRes.ok) throw new Error('Gagal menyimpan ke server. Status: ' + postRes.status);
                        
                        newBtnApply.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Sukses! Mengalihkan...`;
                        newBtnApply.classList.replace('text-black', 'text-white');
                        newBtnApply.classList.replace('bg-primary-fixed-dim', 'bg-green-500');
                        
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1000);
                        
                    } catch (err) {
                        console.error(err);
                        alert("Error System: " + err.message);
                        newBtnApply.innerHTML = `Mulai Transformasi <span class="material-symbols-outlined">rocket_launch</span>`;
                        newBtnApply.disabled = false;
                    }
                });
            }, 2500);

        } catch (e) {
            console.error(e);
            alert("Terjadi kesalahan saat mengkalkulasi jadwal. Silakan coba lagi.");
            navButtons.classList.remove('hidden');
            currentStep--;
            showStep(currentStep);
        }
    }
});




