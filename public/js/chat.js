document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('workoutUserId');
    const token = localStorage.getItem('workoutToken');
    if (!userId || !token) { window.location.href = 'login.html'; return; }

    let userProfile = null;
    let userMetrics = null;
    let userSchedule = null;

    try {
        const res = await fetch('/api/workouts/' + userId, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const userData = await res.json();
        
        if (userData && userData.workouts) {
            let w = userData.workouts;
            if (Array.isArray(w)) w = { history: w };
            userProfile = w.profile || null;
            userMetrics = w.metrics || null;
            userSchedule = w.schedule || null;
        }
    } catch (e) {
        console.error("Gagal mengambil data user:", e);
    }

    const chatHistory = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send');
    const suggestionChips = document.getElementById('suggestion-chips');

    // Create typing indicator element
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.className = 'flex items-start space-x-3 w-full max-w-3xl hidden';
    typingIndicator.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center border border-white/10">
            <span class="material-symbols-outlined text-on-surface-variant text-lg">smart_toy</span>
        </div>
        <div class="bg-surface-container-high p-4 rounded-2xl rounded-tl-sm text-on-surface font-body-md border border-white/5 shadow-sm flex space-x-1 items-center h-[56px]">
            <div class="w-2 h-2 bg-primary-fixed-dim rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-2 h-2 bg-primary-fixed-dim rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-primary-fixed-dim rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
    `;
    chatHistory.appendChild(typingIndicator);

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function appendUserMessage(text) {
        if (suggestionChips) suggestionChips.style.display = 'none';
        
        const div = document.createElement('div');
        div.className = 'flex items-start space-x-3 w-full max-w-3xl self-end flex-row-reverse space-x-reverse mb-6 fade-in';
        div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-primary-fixed-dim/20 flex-shrink-0 flex items-center justify-center border border-primary-fixed-dim/30">
                <span class="material-symbols-outlined text-primary-fixed-dim text-lg">person</span>
            </div>
            <div class="bg-primary-fixed-dim/10 p-4 rounded-2xl rounded-tr-sm text-on-surface font-body-md border border-primary-fixed-dim/20 shadow-sm text-right break-words">
                <p>${escapeHtml(text)}</p>
            </div>
        `;
        // Insert before typing indicator
        chatHistory.insertBefore(div, typingIndicator);
        scrollToBottom();
    }

    function appendAiMessage(htmlText) {
        const div = document.createElement('div');
        div.className = 'flex items-start space-x-3 w-full max-w-3xl mb-6 fade-in';
        div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(171,214,0,0.2)]">
                <span class="material-symbols-outlined text-primary-fixed-dim text-lg">smart_toy</span>
            </div>
            <div class="bg-surface-container-high p-4 rounded-2xl rounded-tl-sm text-on-surface font-body-md border border-white/5 shadow-sm break-words">
                ${htmlText}
            </div>
        `;
        chatHistory.insertBefore(div, typingIndicator);
        scrollToBottom();
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Smart Engine Logic
    function getAiResponse(text) {
        const lower = text.toLowerCase();
        
        // 1. Jadwal / Program
        if (lower.includes('jadwal') || lower.includes('program') || lower.includes('latihan')) {
            if (userSchedule) {
                const daysCount = Object.keys(userSchedule).length;
                return `<p>Berdasarkan profil lu, lu punya <strong>${daysCount} Hari Latihan</strong> dalam seminggu.</p>
                        <p class="mt-2">Cek halaman <a href="dashboard.html" class="text-primary-fixed-dim underline font-bold">Dashboard</a> buat lihat detail gerakan apa aja yang harus lu lakuin hari ini!</p>`;
            } else {
                return `<p>Lu belum bikin profil atau jadwal nih bro. Ke menu <a href="profile.html" class="text-primary-fixed-dim underline font-bold">Profil</a> terus klik Analisis buat di-generate jadwalnya!</p>`;
            }
        }
        
        // 2. BMI / Kurus / Gemuk
        if (lower.includes('kurus') || lower.includes('bulking') || lower.includes('berat badan')) {
            if (userMetrics && userMetrics.category === 'Underweight') {
                return `<p>Melihat BMI lu yang masih <strong>${userMetrics.bmi.toFixed(1)} (Underweight)</strong>, prioritas utama lu sekarang adalah <strong>Kalori Surplus</strong> (makan lebih banyak dari kalori harian lu).</p>
                        <p class="mt-2">Fokus angkat beban yang berat dengan repetisi 8-12, dan kurangi kardio berlebih biar otot bisa berkembang maksimal!</p>`;
            } else {
                return `<p>Kalau tujuan lu naikin berat badan (Bulking), pastikan lu makan surplus kalori (sekitar 300-500 kalori di atas TDEE lu) dan banyakin protein (1.6g - 2g per kg berat badan). Jangan lupa latihan beban buat memicu hipertrofi otot!</p>`;
            }
        }
        
        if (lower.includes('gemuk') || lower.includes('fat loss') || lower.includes('diet')) {
            if (userMetrics && (userMetrics.category === 'Overweight' || userMetrics.category === 'Obese')) {
                return `<p>Menurut data, BMI lu ada di <strong>${userMetrics.bmi.toFixed(1)} (${userMetrics.category})</strong>. Jangan khawatir bro, semua butuh proses!</p>
                        <p class="mt-2">Langkah wajib lu sekarang adalah <strong>Defisit Kalori</strong> dan rutin olahraga. Usahakan tambah durasi kardio ringan (jalan cepat/sepeda statis) setiap selesai angkat beban biar pembakaran lemak makin mantap.</p>`;
            } else {
                return `<p>Untuk Fat Loss, kuncinya cuma satu: <strong>Defisit Kalori</strong>. Makan di bawah kalori harian lu (TDEE) sekitar 300-500 kalori, perbanyak protein biar otot gak susut, dan tidur yang cukup!</p>`;
            }
        }
        
        // 3. Nutrisi / Kalori
        if (lower.includes('kalori nasi') || lower.includes('kalori')) {
            return `<p>Satu porsi nasi putih matang (sekitar 100 gram) mengandung kurang lebih <strong>130 kalori</strong> dan 28g karbohidrat.</p>
                    <p class="mt-2">Kalau lu lagi diet, porsi ini penting banget buat ditakar biar kalori lu gak kebobolan tanpa sadar!</p>`;
        }
        
        // 4. Form / Cedera / Tips
        if (lower.includes('cedera') || lower.includes('nyeri') || lower.includes('sakit')) {
            return `<p class="text-red-400 font-bold"><span class="material-symbols-outlined align-middle text-sm">warning</span> Peringatan Keselamatan</p>
                    <p class="mt-2">Kalau lo ngerasa nyeri yang tajam atau menusuk (bukan pegal otot biasa), <strong>BERHENTI</strong> latihan di area tersebut!</p>
                    <p class="mt-1">Jangan dipaksain. Istirahatkan otot yang nyeri 2-3 hari. Kalau sakitnya menetap, lebih baik konsultasi ke fisioterapi atau dokter olahraga.</p>`;
        }
        
        if (lower.includes('deadlift')) {
            return `<p><strong>Tips Form Deadlift:</strong></p>
                    <ul class="list-disc pl-5 mt-2 space-y-1">
                        <li>Jaga punggung tetap lurus (jangan melengkung / bungkuk).</li>
                        <li>Engage (kencangkan) otot Lats lu kayak lagi ngapit kertas di ketiak.</li>
                        <li>Posisi barbel harus rapat sama tulang kering lu pas ditarik.</li>
                        <li>Gunakan dorongan kaki (leg drive) pas ngangkat dari lantai, bukan narik pakai pinggang!</li>
                    </ul>`;
        }
        
        // 5. Default Response
        return `<p>Menarik banget bro. Sayangnya fitur Pemrosesan Bahasa Alami (NLP) gw lagi dalam tahap pengembangan, jadi gw cuma paham instruksi spesifik tentang <strong>jadwal, kalori, kurus/gemuk, dan tips deadlift/cedera</strong>.</p>
                <p class="mt-2">Coba klik salah satu tombol saran di atas, atau tanya hal spesifik lainnya!</p>`;
    }

    async function handleChat(msg) {
        if (!msg.trim()) return;
        
        // Clear input
        chatInput.value = '';
        
        // Append user msg
        appendUserMessage(msg);
        
        // Show typing
        typingIndicator.classList.remove('hidden');
        scrollToBottom();
        
        // Simulate network delay
        setTimeout(() => {
            typingIndicator.classList.add('hidden');
            const responseHtml = getAiResponse(msg);
            appendAiMessage(responseHtml);
        }, 1500); // 1.5s delay
    }

    // Events
    btnSend.addEventListener('click', () => {
        handleChat(chatInput.value);
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleChat(chatInput.value);
        }
    });

    // Suggestion Chips Click Event
    if (suggestionChips) {
        const buttons = suggestionChips.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                handleChat(btn.innerText);
            });
        });
    }
    
    // Add fade-in CSS dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);
});
