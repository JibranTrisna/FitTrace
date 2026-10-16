require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fittrace_jwt_secret_key_super_secure';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'training_plan_db';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- CYBER SECURITY MEASURES ---
// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Matikan CSP bawaan helmet sementara jika bentrok dengan CDN JS/CSS (Tailwind, Google Fonts)
  crossOriginEmbedderPolicy: false
}));


// Prevent Http Param Pollution
app.use(hpp());

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 menit
    max: 500, // Limit 500 request per IP per 10 menit
    message: { error: 'Terlalu banyak aktivitas (DDoS/Spam protection active). Silakan tunggu sebentar.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', globalLimiter);

// Strict Rate Limiting for Auth
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 jam
    max: 15, // Limit 15 kali percobaan login/register
    message: { error: 'Terlalu banyak percobaan akses (Brute-Force protection). Coba lagi dalam 1 jam.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);


// --- SMART TEMPLATES ---
const TEMPLATE_NOVICE = [
    { day: 'Senin', type: 'Full Body A', color: 'push', exercises: [{ id: 1, name: 'Bodyweight Squat 3x10', done: false }, { id: 2, name: 'Push Up (Lutut) 3xMax', done: false }, { id: 3, name: 'Plank 3x30s', done: false }] },
    { day: 'Selasa', type: 'Rest Day', color: 'rest', exercises: [] },
    { day: 'Rabu', type: 'Full Body B', color: 'pull', exercises: [{ id: 4, name: 'Dumbbell Row 3x10', done: false }, { id: 5, name: 'Glute Bridge 3x15', done: false }, { id: 6, name: 'Crunch 3x15', done: false }] },
    { day: 'Kamis', type: 'Rest Day', color: 'rest', exercises: [] },
    { day: 'Jumat', type: 'Full Body C', color: 'legs', exercises: [{ id: 7, name: 'Walking Lunges 3x10', done: false }, { id: 8, name: 'Incline Push Up 3x10', done: false }, { id: 9, name: 'Superman Hold 3x30s', done: false }] },
    { day: 'Sabtu', type: 'Cardio / Rest', color: 'rest', exercises: [{ id: 10, name: 'Jalan Kaki 30 Menit', done: false }] },
    { day: 'Minggu', type: 'Rest Day', color: 'rest', exercises: [] }
];

const TEMPLATE_INTERMEDIATE = [
    { day: 'Senin', type: 'Push Day', color: 'push', exercises: [{ id: 1, name: 'Bench Press 4x8-10', done: false }, { id: 2, name: 'Overhead Press 3x10', done: false }, { id: 3, name: 'Tricep Pushdown 3x12', done: false }]},
    { day: 'Selasa', type: 'Pull Day', color: 'pull', exercises: [{ id: 4, name: 'Deadlift 3x5', done: false }, { id: 5, name: 'Pull Ups 3xMax', done: false }, { id: 6, name: 'Bicep Curls 3x12', done: false }]},
    { day: 'Rabu', type: 'Leg Day', color: 'legs', exercises: [{ id: 7, name: 'Squats 4x8', done: false }, { id: 8, name: 'Leg Press 3x10', done: false }, { id: 9, name: 'Calf Raises 4x15', done: false }]},
    { day: 'Kamis', type: 'Rest Day', color: 'rest', exercises: [] },
    { day: 'Jumat', type: 'Upper Body', color: 'push', exercises: [{ id: 10, name: 'Incline DB Press 3x10', done: false }, { id: 11, name: 'Lat Pulldown 3x10', done: false }]},
    { day: 'Sabtu', type: 'Lower Body', color: 'legs', exercises: [{ id: 12, name: 'Romanian Deadlift 3x10', done: false }, { id: 13, name: 'Bulgarian Split Squat 3x10', done: false }]},
    { day: 'Minggu', type: 'Rest Day', color: 'rest', exercises: [] }
];

const TEMPLATE_EXPERT = [
    { day: 'Senin', type: 'Push (Heavy)', color: 'push', exercises: [{ id: 1, name: 'Barbell Bench Press 5x5', done: false }, { id: 2, name: 'Military Press 4x8', done: false }, { id: 3, name: 'Skullcrusher 4x10', done: false }]},
    { day: 'Selasa', type: 'Pull (Heavy)', color: 'pull', exercises: [{ id: 4, name: 'Deadlift 5x5', done: false }, { id: 5, name: 'Weighted Pull Up 4x8', done: false }, { id: 6, name: 'Barbell Curl 4x10', done: false }]},
    { day: 'Rabu', type: 'Legs (Heavy)', color: 'legs', exercises: [{ id: 7, name: 'Squat 5x5', done: false }, { id: 8, name: 'Hack Squat 4x8', done: false }, { id: 9, name: 'Standing Calf Raise 5x15', done: false }]},
    { day: 'Kamis', type: 'Push (Hypertrophy)', color: 'push', exercises: [{ id: 10, name: 'Incline DB Press 4x10', done: false }, { id: 11, name: 'Cable Crossover 4x12', done: false }, { id: 12, name: 'Lateral Raise 4x15', done: false }]},
    { day: 'Jumat', type: 'Pull (Hypertrophy)', color: 'pull', exercises: [{ id: 13, name: 'Seated Cable Row 4x10', done: false }, { id: 14, name: 'Lat Pulldown 4x12', done: false }, { id: 15, name: 'Hammer Curl 4x12', done: false }]},
    { day: 'Sabtu', type: 'Legs (Hypertrophy)', color: 'legs', exercises: [{ id: 16, name: 'Leg Press 4x12', done: false }, { id: 17, name: 'Leg Extension 4x15', done: false }, { id: 18, name: 'Seated Leg Curl 4x15', done: false }]},
    { day: 'Minggu', type: 'Active Recovery', color: 'rest', exercises: [{ id: 19, name: 'Stretching 20 Menit', done: false }] }
];


let pool;
async function initDB() {
    try {
        const connection = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        await connection.end();

        pool = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_NAME, waitForConnections: true, connectionLimit: 10, queueLimit: 0 });

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                fitness_level VARCHAR(50) DEFAULT NULL,
                workout_data JSON
            );
        `;
        await pool.query(createTableQuery);

        // Tambah Kolom Gamifikasi (Abaikan error jika kolom sudah ada)
        try { await pool.query('ALTER TABLE users ADD COLUMN exp INT DEFAULT 0'); } catch (e) {}
        try { await pool.query('ALTER TABLE users ADD COLUMN user_level INT DEFAULT 1'); } catch (e) {}
        
        // Tabel Analitik Progress
        const createProgressTable = `
            CREATE TABLE IF NOT EXISTS progress_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                log_date DATE NOT NULL,
                body_weight DECIMAL(5,2),
                bench_press DECIMAL(5,2),
                squat DECIMAL(5,2),
                deadlift DECIMAL(5,2),
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await pool.query(createProgressTable);

        console.log('✅ MySQL Database & Table siap digunakan (Gamified + Analytics).');
    } catch (error) { console.error('❌ Gagal inisialisasi MySQL:', error.message); }
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Akses ditolak.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token kadaluarsa.' });
        req.user = user;
        next();
    });
};

const authorizeUser = (req, res, next) => {
    if (req.user.userId != req.params.userId && req.user.userId != req.params.id) {
        return res.status(403).json({ error: 'Akses terlarang.' });
    }
    next();
};

const knowledgeBase = [ /* Sama seperti sebelumnya, disingkat untuk keterbacaan */
    { keywords: ['dada'], response: 'Buat otot dada, pastikan postur tulang belikat lu terkunci.' },
    { keywords: ['halo', 'hai'], response: 'Halo bro! Gw Pro Coach, asisten lokal lu.' }
];

app.post('/api/chat', (req, res) => {
    setTimeout(() => {
        const msg = (req.body.message || "").toLowerCase();
        let reply = "Pertanyaan bagus! Tetap konsisten latihan dan jaga pola makan! 💪";
        for (let item of knowledgeBase) { if (item.keywords.some(kw => msg.includes(kw))) { reply = item.response; break; } }
        res.json({ reply });
    }, 1000);
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if(!username || !password) return res.status(400).json({ error: 'Data wajib diisi!' });

        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) return res.status(400).json({ error: 'Username sudah terpakai!' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const workoutDataJSON = JSON.stringify(TEMPLATE_INTERMEDIATE);
        
        const [result] = await pool.query(
            'INSERT INTO users (username, password, workout_data, exp, user_level) VALUES (?, ?, ?, 0, 1)',
            [username, hashedPassword, workoutDataJSON]
        );

        const token = jwt.sign({ userId: result.insertId, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Registrasi berhasil!', userId: result.insertId, token });
    } catch (error) { res.status(500).json({ error: 'Terjadi kesalahan pada database.' }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if(rows.length === 0) return res.status(401).json({ error: 'Login gagal!' });

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if(!validPassword) return res.status(401).json({ error: 'Login gagal!' });

        const needsQuiz = !user.fitness_level;
        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ message: 'Login berhasil!', userId: user.id, username: user.username, needsQuiz, token });
    } catch (error) { res.status(500).json({ error: 'Server error.' }); }
});

// --- SMART PROFILING API ---
app.post('/api/user/:id/level', authenticateToken, authorizeUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { level } = req.body; // e.g. "NOVICE (Pemula)"
        
        let chosenTemplate = TEMPLATE_INTERMEDIATE;
        if (level.includes('NOVICE')) chosenTemplate = TEMPLATE_NOVICE;
        else if (level.includes('EXPERT') || level.includes('MASTER')) chosenTemplate = TEMPLATE_EXPERT;

        const templateStr = JSON.stringify(chosenTemplate);
        
        const [result] = await pool.query('UPDATE users SET fitness_level = ?, workout_data = ? WHERE id = ?', [level, templateStr, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json({ message: 'Level dan Jadwal Otomatis tersimpan!' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// --- WORKOUT & GAMIFICATION API ---
app.get('/api/workouts/:userId', authenticateToken, authorizeUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query('SELECT username, fitness_level, workout_data, exp, user_level FROM users WHERE id = ?', [userId]);
        if(rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        
        const user = rows[0];
        const parsedWorkouts = typeof user.workout_data === 'string' ? JSON.parse(user.workout_data) : user.workout_data;
        res.json({ workouts: parsedWorkouts, level: user.fitness_level, username: user.username, exp: user.exp, user_level: user.user_level });
    } catch (error) { res.status(500).json({ error: 'Gagal membaca database.' }); }
});

app.post('/api/workouts/:userId', authenticateToken, authorizeUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const { workouts, exp, user_level } = req.body; // Terima stats tambahan
        
        const newWorkouts = JSON.stringify(workouts);
        
        let query = 'UPDATE users SET workout_data = ? WHERE id = ?';
        let params = [newWorkouts, userId];

        if (exp !== undefined && user_level !== undefined) {
            query = 'UPDATE users SET workout_data = ?, exp = ?, user_level = ? WHERE id = ?';
            params = [newWorkouts, exp, user_level, userId];
        }

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json({ message: 'Progress dan EXP berhasil disimpan!' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Gagal menyimpan ke database.' }); }
});

app.post('/api/workouts/:userId/reset', authenticateToken, authorizeUser, async (req, res) => {
    try {
        const { userId } = req.params;
        // Ambil level fitness klien untuk reset sesuai profilnya
        const [rows] = await pool.query('SELECT fitness_level FROM users WHERE id = ?', [userId]);
        const fLevel = rows[0]?.fitness_level || "";

        let chosenTemplate = TEMPLATE_INTERMEDIATE;
        if (fLevel.includes('NOVICE')) chosenTemplate = TEMPLATE_NOVICE;
        else if (fLevel.includes('EXPERT') || fLevel.includes('MASTER')) chosenTemplate = TEMPLATE_EXPERT;

        const defaultStr = JSON.stringify(chosenTemplate);
        
        const [result] = await pool.query('UPDATE users SET workout_data = ? WHERE id = ?', [defaultStr, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json({ message: 'Berhasil dikembalikan ke jadwal profil lu!', data: chosenTemplate });
    } catch (error) { res.status(500).json({ error: 'Gagal mereset database.' }); }
});

// --- ANALYTICS / PROGRESS API ---
app.get('/api/progress/:userId', authenticateToken, authorizeUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query('SELECT log_date, body_weight, bench_press, squat, deadlift FROM progress_logs WHERE user_id = ? ORDER BY log_date ASC', [userId]);
        res.json({ logs: rows });
    } catch (error) { res.status(500).json({ error: 'Gagal membaca data progress.' }); }
});

app.post('/api/progress/:userId', authenticateToken, authorizeUser, async (req, res) => {
    try {
        console.log("-> Menerima data progress:", req.body);
        const { userId } = req.params;
        const { log_date, body_weight, bench_press, squat, deadlift } = req.body;
        
        // Cek apakah tanggal ini sudah ada lognya, jika ya, update, jika belum insert
        const [existing] = await pool.query('SELECT id FROM progress_logs WHERE user_id = ? AND log_date = ?', [userId, log_date]);
        
        if (existing.length > 0) {
            await pool.query('UPDATE progress_logs SET body_weight=COALESCE(?, body_weight), bench_press=COALESCE(?, bench_press), squat=COALESCE(?, squat), deadlift=COALESCE(?, deadlift) WHERE id=?', 
                [body_weight, bench_press, squat, deadlift, existing[0].id]);
        } else {
            await pool.query('INSERT INTO progress_logs (user_id, log_date, body_weight, bench_press, squat, deadlift) VALUES (?, ?, ?, ?, ?, ?)', 
                [userId, log_date, body_weight, bench_press, squat, deadlift]);
        }
        res.json({ message: 'Progress berhasil disimpan!' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Gagal menyimpan progress.' }); }
});

initDB().then(() => {
    app.listen(PORT, () => { console.log(`✅ Backend Server Node.js (Gamified & Analytics) berjalan di http://localhost:${PORT}`); });
});
