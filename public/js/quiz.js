const questions = [
    {
        q: "1. Berapa lama Anda sudah menjalani latihan fisik atau olahraga secara rutin dan konsisten?",
        options: [
            { val: "A", text: "Kurang dari 6 bulan, atau baru mau mulai." },
            { val: "B", text: "Sekitar 6 bulan hingga 1 tahun dengan rutinitas dasar." },
            { val: "C", text: "1 hingga 3 tahun dengan jadwal dan target yang cukup konsisten." },
            { val: "D", text: "3 hingga 5 tahun dengan program latihan yang sangat terstruktur." },
            { val: "E", text: "Lebih dari 5 tahun, atau berstatus sebagai atlet/praktisi profesional." }
        ]
    },
    {
        q: "2. Sejauh mana pemahaman Anda tentang teknik dasar dan postur (form) dalam melakukan gerakan latihan?",
        options: [
            { val: "A", text: "Saya tidak yakin dan butuh panduan/video detail untuk setiap gerakan." },
            { val: "B", text: "Saya tahu gerakan dasarnya, tapi mungkin masih butuh sedikit koreksi agar aman." },
            { val: "C", text: "Saya menguasai postur dasar dengan baik dan sudah mulai mencoba variasi gerakan." },
            { val: "D", text: "Saya sangat paham biomekanika gerakan dan tahu persis cara mencegah cedera." },
            { val: "E", text: "Saya memiliki pemahaman tingkat lanjut dan mampu menginstruksikan atau mengoreksi teknik orang lain." }
        ]
    },
    {
        q: "3. Bagaimana cara Anda menyusun program atau jadwal latihan selama ini?",
        options: [
            { val: "A", text: "Saya biasanya hanya melakukan gerakan acak tanpa jadwal pasti." },
            { val: "B", text: "Saya mengikuti jadwal umum atau kelas kebugaran yang sudah ada." },
            { val: "C", text: "Saya membagi sendiri jadwal harian saya (misal: push/pull/legs atau upper/lower)." },
            { val: "D", text: "Saya merancang program spesifik yang mencakup target repetisi, beban, dan progresi berkala." },
            { val: "E", text: "Saya menggunakan sistem periodisasi (mikro/makro siklus) yang disesuaikan dengan puncak performa." }
        ]
    },
    {
        q: "4. Jika Anda merasa perkembangan otot atau kekuatan Anda terhenti (mengalami plateau), apa yang biasanya Anda lakukan?",
        options: [
            { val: "A", text: "Saya belum tahu apa itu plateau atau belum pernah mengalaminya." },
            { val: "B", text: "Saya sekadar mengganti beberapa gerakan atau mengambil libur beberapa hari." },
            { val: "C", text: "Saya mencoba menaikkan beban atau menambah jumlah set/repetisi." },
            { val: "D", text: "Saya menerapkan deload week atau memodifikasi intensitas dan volume latihan secara sistematis." },
            { val: "E", text: "Saya menganalisis metrik latihan, nutrisi, dan pemulihan secara komprehensif untuk memecah batasan fisiologis." }
        ]
    },
    {
        q: "5. Berapa kali dalam seminggu Anda berencana untuk berlatih menggunakan panduan dari Workout Pro?",
        options: [
            { val: "A", text: "1 - 2 kali seminggu untuk membiasakan diri." },
            { val: "B", text: "3 kali seminggu untuk menjaga kebugaran." },
            { val: "C", text: "4 kali seminggu dengan target spesifik (membakar lemak/membangun otot)." },
            { val: "D", text: "5 - 6 kali seminggu dengan intensitas tinggi." },
            { val: "E", text: "Hampir setiap hari, mungkin dengan dua sesi latihan per hari (double session)." }
        ]
    }
];

const levelMap = {
    "A": { name: "NOVICE (Pemula)", score: 1, desc: "Anda berada di tahap awal. Fokus utama kita adalah membangun fondasi kebugaran, mempelajari postur gerakan yang benar, dan membangun kebiasaan (habit) yang konsisten." },
    "B": { name: "INTERMEDIATE (Menengah)", score: 2, desc: "Anda sudah punya dasar yang baik! Saatnya kita menaikkan intensitas perlahan dan memastikan program latihan berjalan lebih terstruktur untuk hasil yang optimal." },
    "C": { name: "PROFICIENT (Cakap)", score: 3, desc: "Anda tahu apa yang Anda lakukan. Kami akan membantu Anda memecah batasan dengan program terpisah (split workout) dan target spesifik seperti hypertrophi atau kekuatan." },
    "D": { name: "EXPERT (Ahli)", score: 4, desc: "Luar biasa. Anda butuh kontrol penuh atas repetisi, beban progresif, dan mungkin siklus deload. Jadwal ini akan kita maksimalkan hingga batas terbaik Anda." },
    "E": { name: "MASTER (Atlet/Pro)", score: 5, desc: "Level Elit. Anda beroperasi di tingkat lanjutan yang membutuhkan analisis periodisasi kompleks. Anda mengatur porsi latihan dan nutrisi layaknya seorang profesional." }
};

let currentQuestion = 0;
let userAnswers = [];

document.addEventListener('DOMContentLoaded', () => {
    renderQuestion();
});

function renderQuestion() {
    const container = document.getElementById('question-container');
    const progressFill = document.getElementById('quiz-progress');
    const progressText = document.getElementById('progress-text');

    // Update Progress
    const progress = ((currentQuestion) / questions.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.innerText = `${currentQuestion + 1} / ${questions.length} Pertanyaan`;

    const q = questions[currentQuestion];
    
    // HTML Card
    const cardHTML = `
        <div class="q-card active">
            <h2 class="q-title">${q.q}</h2>
            <div class="options-list">
                ${q.options.map(opt => `
                    <button class="option-btn" onclick="selectOption('${opt.val}', this)">
                        <span class="option-letter">${opt.val}</span>
                        <span class="option-text">${opt.text}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Jika ganti pertanyaan, tambahkan efek animasi "exit" ke card sebelumnya
    const oldCard = container.querySelector('.q-card');
    if(oldCard) {
        oldCard.classList.remove('active');
        oldCard.classList.add('exit');
        setTimeout(() => {
            container.innerHTML = cardHTML;
        }, 300); // Tunggu animasi exit
    } else {
        container.innerHTML = cardHTML;
    }
}

function selectOption(val, btnElement) {
    // Tambahkan class selected ke button yang diklik
    btnElement.classList.add('selected');
    
    // Simpan Jawaban
    userAnswers[currentQuestion] = val;

    // Delay sedikit agar user lihat efek tombol ditekan
    setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            renderQuestion();
        } else {
            // Selesai -> Lanjut Kalkulasi
            document.getElementById('quiz-progress').style.width = `100%`;
            showResult();
        }
    }, 400);
}

function showResult() {
    document.getElementById('question-container').style.display = 'none';
    const resultScreen = document.getElementById('result-screen');
    resultScreen.classList.add('active');

    setTimeout(async () => {
        document.querySelector('.calculating').classList.add('hidden');
        document.querySelector('.result-final').classList.remove('hidden');
        
        const finalLevel = calculateScore();
        document.getElementById('user-level').innerText = finalLevel.name;
        document.getElementById('user-desc').innerText = finalLevel.desc;

        // Ambil User ID dan Token dari Sesi Login
        const userId = localStorage.getItem('workoutUserId');
        const token = localStorage.getItem('workoutToken');
        
        if (userId && token) {
            try {
                // Simpan Level Profiling ke Database Backend Node.js
                await fetch(`/api/user/${userId}/level`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ level: finalLevel.name })
                });
            } catch(e) {
                console.error("Gagal menyimpan profil ke server", e);
            }
        }

        triggerConfetti();
    }, 2000);
}

// Logika Kuisioner: Mayoritas Terbanyak (Mode)
function calculateScore() {
    const counts = { "A": 0, "B": 0, "C": 0, "D": 0, "E": 0 };
    userAnswers.forEach(ans => counts[ans]++);

    // Cari key dengan nilai terbanyak
    let maxCount = 0;
    let maxVal = "A";

    for (const [key, value] of Object.entries(counts)) {
        // Jika ada seri (tie), ambil yang levelnya lebih tinggi (menggunakan score)
        if (value > maxCount || (value === maxCount && levelMap[key].score > levelMap[maxVal].score)) {
            maxCount = value;
            maxVal = key;
        }
    }

    return levelMap[maxVal];
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}
