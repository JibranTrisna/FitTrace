# ⚡ FitTrace - Kinetic Precision Workout & Training Planner

FitTrace adalah aplikasi web pelacak dan perencana latihan kebugaran (fitness & workout planner) modern dengan antarmuka futuristik, gamifikasi, sesi latihan aktif interaktif, dan pengamanan siber berlapis.

---

## 🌟 Fitur Utama

- 🏋️ **Dynamic Workout Builder & Protocol Schedule**: 
  - Manajemen jadwal mingguan (Senin - Minggu) dengan CRUD latihan lengkap.
  - Pengaturan target Sets & Reps interaktif.
  - Fitur **Smart Auto-Naming** yang otomatis menamai program harian (contoh: *Push Day*, *Pull Day*, *Legs & Core*, *Upper Body*, dsb.) berdasarkan kombinasi otot yang dipilih.
  - *Smooth horizontal swipe/drag* pada tampilan mobile.

- ⏱️ **Active Workout Session (session.html)**:
  - Halaman khusus untuk mendampingi sesi latihan secara *real-time*.
  - Panduan video teknik form gerakan definisi tinggi.
  - Detail ringkas fungsi utama, manfaat spesifik, serta tips latihan.
  - **Circular SVG Rest Timer** interaktif dengan shortcut durasi (+30s, +60s, +90s), progress ring mulus, dan audio alert ketika istirahat selesai.
  - Tombol penyelesaian sesi latihan dengan reward perolehan EXP.

- 🎬 **Smart Video Observer (High Performance)**:
  - Menggunakan **Intersection Observer API** seperti feed media sosial modern.
  - Video demonstrasi gerakan hanya berputar (*autoplay*) saat berada dalam viewport layar dan otomatis *pause* saat di-*scroll* keluar, menghemat penggunaan RAM, CPU, dan daya baterai.

- 🎮 **Gamifikasi & Dynamic Profile**:
  - Sistem perolehan EXP dan tingkatan level atlet (*Novice*, *Intermediate*, *Advanced*, *Elite*).
  - Status kebugaran *real-time* (*Prime Condition*, *Optimal*, *Active*, *Needs Recovery*) yang dihitung secara dinamis dari histori latihan 7 hari terakhir.
  - Avatar generator dinamis berbasis inisial nama pengguna.

- 📈 **Progress & Analytics Tracker**:
  - Pelacakan metrik berat badan dan *Big 3 Lifts* (Bench Press, Squat, Deadlift).
  - Visualisasi grafik progres kebugaran.

- 🤖 **Kinetic AI Coach**:
  - Asisten cerdas terintegrasi untuk konsultasi seputar latihan dan tips kebugaran.

- 🛡️ **Cybersecurity Hardened**:
  - **Rate Limiting**: Perlindungan brute-force pada endpoint otentikasi (/api/auth/login & /api/auth/register) serta perlindungan spam/DDoS global.
  - **HTTP Parameter Pollution (HPP)** protection.
  - **Security HTTP Headers** menggunakan Helmet.
  - **SQL Injection Prevention**: 100% prepared statements / parameterized queries.
  - **Bcrypt & JWT**: Hashing password dengan salt rounds tinggi dan tokenisasi JSON Web Token (JWT).

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Tailwind CSS, Material Symbols Icons, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MySQL (didukung via WampServer, XAMPP, atau MySQL standalone)
- **Security & Utilities**: crypt, jsonwebtoken, helmet, express-rate-limit, hpp, dotenv, cors

---

## 📁 Struktur Direktori

`	ext
TrainingPlan/
├── public/                 # File aset statis & antarmuka frontend
│   ├── css/                # Stylesheet kustom
│   ├── images/             # Video MP4 gerakan & logo aplikasi
│   ├── js/                 # Logika JavaScript klien (dashboard, session, workouts, dll.)
│   ├── auth.html           # Halaman login/register alternatif
│   ├── chat.html           # Antarmuka Kinetic AI Coach
│   ├── dashboard.html      # Dashboard utama & Weekly Protocol
│   ├── index.html          # Halaman depan (Landing page)
│   ├── login.html          # Halaman autentikasi login
│   ├── onboarding.html     # Setup profil awal pengguna baru
│   ├── profile.html        # Profil & status atlet
│   ├── progress.html       # Grafik progres & analitik latihan
│   ├── quiz.html           # Kuis penentu level kebugaran
│   ├── register.html       # Pendaftaran akun baru
│   ├── session.html        # Mode sesi latihan aktif & timer
│   └── workouts.html       # Pustaka & katalog gerakan latihan
├── .env.example            # Template konfigurasi environment variables
├── .gitignore              # Konfigurasi file yang diabaikan oleh Git
├── package.json            # Manifest dependensi & skrip Node.js
├── README.md               # Dokumentasi proyek
└── server.js               # Entry point backend Express & konfigurasi database
`

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Prasyarat
Pastikan sistem Anda telah terpasang:
- [Node.js](https://nodejs.org/) (versi 18 ke atas disarankan)
- Server MySQL aktif (misalnya melalui **WampServer**, **XAMPP**, atau MySQL Server standalone)

### 2. Clone Repositori
`ash
git clone https://github.com/USERNAME/REPO-NAME.git
cd REPO-NAME
`

### 3. Install Dependensi
`ash
npm install
`

### 4. Konfigurasi Environment Variables
Salin file .env.example menjadi .env:
`ash
cp .env.example .env
`
Sesuaikan konfigurasi koneksi database MySQL pada .env bila diperlukan:
`env
PORT=3000
JWT_SECRET=your_jwt_secret_key_here

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=training_plan_db
`
*(Catatan: Script server.js akan secara otomatis membuat database 	raining_plan_db beserta tabel-tabelnya jika belum ada).*

### 5. Jalankan Aplikasi
Untuk menjalankan server secara normal:
`ash
npm start
`
Atau menggunakan nodemon saat pengembangan:
`ash
npm run dev
`

Buka browser dan akses:
`
http://localhost:3000
`

---

## 📄 Lisensi
Proyek ini dilisensikan di bawah [ISC License](LICENSE).
"# FitTrace" 
