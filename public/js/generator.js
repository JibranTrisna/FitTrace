// public/js/generator.js

/**
 * Menganalisis BMI dan mengembalikan rekomendasi serta jadwal yang akan disuntikkan.
 */
function generateScheduleFromBMI(bmi, exercisesDB) {
    let category = '';
    let title = '';
    let desc = '';
    let newSchedule = {};
    
    // Helper to get random exercises from a specific category
    function getRandomExercises(catName, count) {
        const pool = exercisesDB.filter(ex => ex.category === catName || ex.muscle === catName);
        if (pool.length === 0) return [];
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    // Helper to mix categories
    function getMixedExercises(categories, totalCount) {
        let pool = [];
        categories.forEach(cat => {
            pool = pool.concat(exercisesDB.filter(ex => ex.category === cat || ex.muscle === cat));
        });
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, totalCount);
    }

    if (bmi < 18.5) {
        category = 'Underweight';
        title = 'Hypertrophy / Mass Gain Protocol';
        desc = 'Fokus pada angkatan berat (Compound Lifts) dengan repetisi moderate untuk membangun massa otot secara optimal. 4 Hari latihan, 3 hari istirahat.';
        
        // 4 Days Split
        newSchedule[1] = { name: "Push (Chest & Triceps)", exercises: getRandomExercises('Dada', 3).concat(getRandomExercises('Triceps', 2)).map(ex => ex.id) };
        newSchedule[2] = { name: "Pull (Back & Biceps)", exercises: getRandomExercises('Punggung', 3).concat(getRandomExercises('Biceps', 2)).map(ex => ex.id) };
        newSchedule[3] = { name: "Rest Day", exercises: [] };
        newSchedule[4] = { name: "Legs (Quad & Hamstring)", exercises: getRandomExercises('Kaki', 4).concat(getRandomExercises('Perut', 1)).map(ex => ex.id) };
        newSchedule[5] = { name: "Upper Body Power", exercises: getMixedExercises(['Dada', 'Punggung', 'Bahu'], 5).map(ex => ex.id) };
        newSchedule[6] = { name: "Rest & Recovery", exercises: [] };
        newSchedule[0] = { name: "Rest & Recovery", exercises: [] };
        
    } else if (bmi >= 18.5 && bmi <= 24.9) {
        category = 'Normal';
        title = 'Strength & Recomposition Protocol';
        desc = 'Fokus mempertahankan lean mass sambil meningkatkan kekuatan (Strength). 5 Hari latihan untuk adaptasi otot maksimal.';
        
        // 5 Days Split
        newSchedule[1] = { name: "Upper Body Strength", exercises: getMixedExercises(['Dada', 'Punggung'], 5).map(ex => ex.id) };
        newSchedule[2] = { name: "Lower Body Strength", exercises: getRandomExercises('Kaki', 5).map(ex => ex.id) };
        newSchedule[3] = { name: "Active Rest / Cardio", exercises: getRandomExercises('Cardio', 2).map(ex => ex.id) };
        newSchedule[4] = { name: "Push Hypertrophy", exercises: getRandomExercises('Dada', 3).concat(getRandomExercises('Triceps', 2)).map(ex => ex.id) };
        newSchedule[5] = { name: "Pull Hypertrophy", exercises: getRandomExercises('Punggung', 3).concat(getRandomExercises('Biceps', 2)).map(ex => ex.id) };
        newSchedule[6] = { name: "Legs & Core", exercises: getRandomExercises('Kaki', 3).concat(getRandomExercises('Perut', 2)).map(ex => ex.id) };
        newSchedule[0] = { name: "Rest Day", exercises: [] };
        
    } else {
        category = 'Overweight';
        title = 'Fat Loss & Conditioning Protocol';
        desc = 'Fokus pada pembakaran kalori ekstrem dan ketahanan (Endurance) lewat intensitas tinggi dan gerakan dinamis. 3x Full Body, 2x Cardio.';
        
        // Fat loss (High movement, cardio, core)
        newSchedule[1] = { name: "Full Body Circuit", exercises: getMixedExercises(['Kaki', 'Dada', 'Punggung', 'Cardio'], 5).map(ex => ex.id) };
        newSchedule[2] = { name: "Cardio & Core", exercises: getRandomExercises('Cardio', 3).concat(getRandomExercises('Perut', 2)).map(ex => ex.id) };
        newSchedule[3] = { name: "Rest Day", exercises: [] };
        newSchedule[4] = { name: "Full Body Conditioning", exercises: getMixedExercises(['home', 'Kaki', 'Bahu'], 5).map(ex => ex.id) };
        newSchedule[5] = { name: "HIIT & Abs", exercises: getRandomExercises('Cardio', 3).concat(getRandomExercises('Perut', 3)).map(ex => ex.id) };
        newSchedule[6] = { name: "Rest Day", exercises: [] };
        newSchedule[0] = { name: "Full Body Power", exercises: getMixedExercises(['gym', 'Cardio'], 4).map(ex => ex.id) };
    }

    return {
        category,
        title,
        desc,
        newSchedule
    };
}

window.generateScheduleFromBMI = generateScheduleFromBMI;



/**
 * Advanced Schedule Generator based on Full Profile
 */
function generateAdvancedSchedule(profile, exercisesDB) {
    const heightM = profile.height / 100;
    const bmi = profile.weight / (heightM * heightM);
    let bmiCategory = '';
    
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi >= 18.5 && bmi <= 24.9) bmiCategory = 'Normal';
    else bmiCategory = 'Overweight';

    let schedule = {};
    
    // Filter by equipment
    let equipmentFilter = ['gym', 'home'];
    if (profile.equipment === 'Bodyweight') {
        equipmentFilter = ['home'];
    }

    function getRandomExercises(catName, count) {
        const pool = exercisesDB.filter(ex => 
            (ex.category === catName || ex.muscle === catName) && 
            equipmentFilter.includes(ex.category)
        );
        if (pool.length === 0) return [];
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(ex => ex.id);
    }
    
    function getMixedExercises(categories, totalCount) {
        let pool = [];
        categories.forEach(cat => {
            pool = pool.concat(exercisesDB.filter(ex => 
                (ex.category === cat || ex.muscle === cat) &&
                equipmentFilter.includes(ex.category)
            ));
        });
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, totalCount).map(ex => ex.id);
    }

    // Determine volume based on experience
    let vol = 4;
    if (profile.experience === 'Pemula') vol = 3;
    if (profile.experience === 'Pro') vol = 6;

    // Build base schedule based on busy level
    if (profile.busy === 'Sangat Sibuk') {
        // 3 days a week
        schedule[1] = { name: "Full Body A", exercises: getMixedExercises(['Dada', 'Punggung', 'Kaki', 'Bahu'], vol) };
        schedule[2] = { name: "Rest Day", exercises: [] };
        schedule[3] = { name: "Full Body B", exercises: getMixedExercises(['Dada', 'Punggung', 'Kaki', 'Triceps'], vol) };
        schedule[4] = { name: "Rest Day", exercises: [] };
        schedule[5] = { name: "Full Body C", exercises: getMixedExercises(['Dada', 'Punggung', 'Kaki', 'Biceps'], vol) };
        schedule[6] = { name: "Rest Day", exercises: [] };
        schedule[0] = { name: "Rest Day", exercises: [] };
    } else if (profile.busy === 'Normal') {
        // 4 days a week
        schedule[1] = { name: "Upper Body", exercises: getMixedExercises(['Dada', 'Punggung', 'Bahu'], vol) };
        schedule[2] = { name: "Lower Body", exercises: getRandomExercises('Kaki', vol).concat(getRandomExercises('Perut', 1)) };
        schedule[3] = { name: "Rest Day", exercises: [] };
        schedule[4] = { name: "Push (Chest, Shoulders, Triceps)", exercises: getMixedExercises(['Dada', 'Bahu', 'Triceps'], vol) };
        schedule[5] = { name: "Pull (Back & Biceps)", exercises: getMixedExercises(['Punggung', 'Biceps'], vol) };
        schedule[6] = { name: "Rest Day", exercises: [] };
        schedule[0] = { name: "Rest Day", exercises: [] };
    } else {
        // 5 days a week
        schedule[1] = { name: "Chest & Calves", exercises: getRandomExercises('Dada', vol) };
        schedule[2] = { name: "Back & Abs", exercises: getRandomExercises('Punggung', vol).concat(getRandomExercises('Perut', 2)) };
        schedule[3] = { name: "Legs", exercises: getRandomExercises('Kaki', vol + 1) };
        schedule[4] = { name: "Shoulders & Traps", exercises: getRandomExercises('Bahu', vol) };
        schedule[5] = { name: "Arms (Bi & Tri)", exercises: getMixedExercises(['Biceps', 'Triceps'], vol) };
        schedule[6] = { name: "Active Recovery", exercises: [] };
        schedule[0] = { name: "Rest Day", exercises: [] };
    }

    // Inject Cardio
    if (profile.cardio === 'Ya') {
        let cardioDaysToFill = profile.cardioFreq || 1;
        let emptyDays = [0, 6, 3, 2, 4, 5, 1]; // Priority for cardio
        for (let i = 0; i < emptyDays.length; i++) {
            if (cardioDaysToFill <= 0) break;
            const day = emptyDays[i];
            if (schedule[day] && schedule[day].exercises.length === 0) {
                schedule[day].name = 'Cardio: ' + (profile.cardioType || 'General');
                schedule[day].exercises = getRandomExercises('Cardio', 2);
                cardioDaysToFill--;
            }
        }
    }

    return {
        bmi,
        bmiCategory,
        schedule
    };
}

window.generateAdvancedSchedule = generateAdvancedSchedule;


