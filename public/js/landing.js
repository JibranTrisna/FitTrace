document.addEventListener('DOMContentLoaded', () => {
    
    // Elemen Layar (Screens)
    const landingScreen = document.getElementById('landing-screen');
    const onboardingScreen = document.getElementById('onboarding-screen');
    const authScreen = document.getElementById('auth-screen');
    
    // Tombol
    const startBtn = document.getElementById('start-onboarding-btn');
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const btnBack = document.getElementById('back-to-onboarding');

    // Inisialisasi Swiper.js
    const swiper = new Swiper('.onboarding-swiper', {
        direction: 'horizontal',
        loop: false, // Berhenti di slide terakhir (supaya bisa klik tombol Login/Register)
        speed: 800,
        effect: 'coverflow', // Menggunakan efek 3D Coverflow yang lebih menarik
        coverflowEffect: {
            rotate: 40,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: false,
        },
        autoplay: {
            delay: 2500, // Geser otomatis setiap 2.5 detik
            disableOnInteraction: true, // Biarkan mati jika user menggeser manual
            stopOnLastSlide: true // Wajib berhenti di slide terakhir agar user punya waktu klik tombol
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true, // Bullets-nya menyesuaikan ukuran (modern)
        },
        enabled: false // Jangan aktifkan sebelum layarnya terbuka penuh
    });

    // 1. Transisi dari Landing ke Onboarding
    startBtn.addEventListener('click', () => {
        // Efek landing screen naik ke atas
        landingScreen.classList.add('slide-up');
        landingScreen.classList.remove('active');
        
        // Memunculkan Onboarding screen dari bawah
        onboardingScreen.classList.add('active');
        
        // Aktifkan interaksi swiper dan MULAI AUTOPLAY
        setTimeout(() => {
            swiper.enable();
            swiper.autoplay.start();
        }, 600); // Tunggu animasi css naik selesai
    });

    // 2. Transisi dari Onboarding ke Layar Login/Register (Langsung Pindah Halaman)
    btnLogin.addEventListener('click', () => {
        window.location.href = 'auth.html';
    });
    btnRegister.addEventListener('click', () => {
        window.location.href = 'auth.html?mode=register';
    });
});
