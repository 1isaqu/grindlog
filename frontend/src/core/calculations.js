
// --- Core Calculations ---

export const calculateVolume = (sets) => {
    return sets.reduce((acc, set) => acc + (set.reps * set.weight), 0);
};

export const calculateEffectiveVolume = (sets) => {
    return sets.reduce((acc, set) => {
        // Effective if RPE >= 7 OR RIR <= 3
        // Note: RIR is not yet in the DB schema explicitly as a separate column in workout_entries, 
        // but we might have added it to the object. 
        // For now, we use RPE.
        const isEffective = (set.rpe && set.rpe >= 7);
        return isEffective ? acc + (set.reps * set.weight) : acc;
    }, 0);
};

export const calculateAvgRPE = (sets) => {
    const setsWithRPE = sets.filter(s => s.rpe);
    if (setsWithRPE.length === 0) return 0;
    return setsWithRPE.reduce((acc, s) => acc + parseFloat(s.rpe), 0) / setsWithRPE.length;
};
