import { db } from '../db';
import { startOfWeek, subWeeks, isSameWeek, parseISO, format } from 'date-fns';

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
    return setsWithRPE.reduce((acc, s) => acc + s.rpe, 0) / setsWithRPE.length;
};

// --- Data Providers for Charts ---

export const getWeeklyVolumePerMuscle = async (weeks = 4) => {
    const entries = await db.workout_entries.toArray();
    const exercises = await db.exercises.toArray();
    const exerciseMap = new Map(exercises.map(e => [e.id, e]));

    const now = new Date();
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 }); // Monday start

    // Group by week and muscle
    const weeklyData = {}; // { weekKey: { muscle: volume } }

    entries.forEach(entry => {
        const date = parseISO(entry.date);
        const exercise = exerciseMap.get(entry.exerciseId);
        if (!exercise) return;

        // Determine week key (e.g., "2023-W40")
        // For simplicity, let's just bucket by "weeks ago"
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // This is rough. Better to use date-fns differenceInCalendarWeeks

        // Let's filter for the requested range first
        // Actually, the chart needs "Current Week" vs "Baseline (Avg of last 4 weeks)"
        // So we need data for last 5 weeks total.
    });

    // Simplified approach for the specific Chart 1 requirement:
    // "Compare current week volume vs 4-week moving average"

    const currentWeekVol = {};
    const historyVol = {}; // { muscle: [vol_week_1, vol_week_2, ...] }

    entries.forEach(entry => {
        const date = parseISO(entry.date);
        const exercise = exerciseMap.get(entry.exerciseId);
        if (!exercise || !exercise.muscle) return;

        const muscle = exercise.muscle;
        const volume = entry.volume;

        if (isSameWeek(date, now, { weekStartsOn: 1 })) {
            currentWeekVol[muscle] = (currentWeekVol[muscle] || 0) + volume;
        } else {
            // Check if within last 4 weeks
            const fourWeeksAgo = subWeeks(now, 4);
            if (date >= fourWeeksAgo && date < startOfCurrentWeek) {
                historyVol[muscle] = (historyVol[muscle] || 0) + volume;
            }
        }
    });

    // Calculate baseline (average of last 4 weeks)
    // Note: historyVol currently sums up 4 weeks. Average = Sum / 4.
    const baselineVol = {};
    Object.keys(historyVol).forEach(muscle => {
        baselineVol[muscle] = historyVol[muscle] / 4;
    });

    // Format for Recharts
    // We need a list of muscles with "current" and "baseline"
    const allMuscles = new Set([...Object.keys(currentWeekVol), ...Object.keys(baselineVol)]);
    const data = Array.from(allMuscles).map(muscle => ({
        muscle,
        current: currentWeekVol[muscle] || 0,
        baseline: baselineVol[muscle] || 0,
        status: getVolumeStatus(currentWeekVol[muscle] || 0, baselineVol[muscle] || 0)
    }));

    return data;
};

const getVolumeStatus = (current, baseline) => {
    if (baseline === 0) return 'neutral';
    if (current > baseline * 1.3) return 'overreaching';
    if (current < baseline * 0.7) return 'low_consistency';
    return 'optimal';
};

export const getExerciseProgressionData = async (exerciseId) => {
    if (!exerciseId) return [];

    const entries = await db.workout_entries
        .where('exerciseId')
        .equals(exerciseId)
        .sortBy('date');

    // Group by session (date) because we might have multiple sets per session
    const sessionMap = new Map();

    entries.forEach(entry => {
        const dateStr = format(parseISO(entry.date), 'yyyy-MM-dd');
        if (!sessionMap.has(dateStr)) {
            sessionMap.set(dateStr, {
                date: dateStr,
                volume: 0,
                maxLoad: 0,
                maxReps: 0
            });
        }
        const session = sessionMap.get(dateStr);
        session.volume += entry.volume;
        if (entry.weight > session.maxLoad) session.maxLoad = entry.weight;
        if (entry.reps > session.maxReps) session.maxReps = entry.reps;
    });

    return Array.from(sessionMap.values());
};

export const getScatterData = async () => {
    const sessions = await db.sessions.toArray();
    // Map to { x: volume, y: avgRPE, date, id }
    return sessions.map(s => ({
        x: s.volume,
        y: s.avgRPE,
        z: 1, // Size
        date: s.date,
        id: s.id
    }));
};

export const getTopSessions = async () => {
    const sessions = await db.sessions.toArray();
    // Score = effectiveVolume * (1 + avgRPE/10)
    // We need effectiveVolume. Currently sessions table has 'volume'.
    // We need to re-calculate effective volume from entries if not stored.
    // Let's fetch entries for each session? Expensive.
    // Or just use 'volume' as proxy if effectiveVolume isn't stored.
    // The requirement says "Score = effectiveVolume * ...".
    // I should probably store effectiveVolume in the session table too.
    // For now, I'll calculate it on the fly or approximate.

    // Let's do a quick lookup for entries to calculate effective volume
    // This might be slow if many sessions.
    // Optimization: Store 'effectiveVolume' in sessions table in future.
    // For now, let's just use total volume as fallback or fetch entries.

    const sessionsWithScore = await Promise.all(sessions.map(async (s) => {
        const entries = await db.workout_entries.where('sessionId').equals(s.id).toArray();
        const effectiveVol = calculateEffectiveVolume(entries);
        const score = effectiveVol * (1 + (s.avgRPE || 0) / 10);
        return { ...s, score, effectiveVolume: effectiveVol };
    }));

    return sessionsWithScore.sort((a, b) => b.score - a.score).slice(0, 10);
};

// --- Rule Engine ---

export const getTrainingSuggestions = async () => {
    const suggestions = [];

    // 1. Check consistency (Muscle Volume)
    const volumeData = await getWeeklyVolumePerMuscle();
    volumeData.forEach(d => {
        if (d.status === 'low_consistency') {
            suggestions.push({
                type: 'warning',
                message: `Sua consistência para ${d.muscle} caiu. Tente aumentar o volume.`
            });
        } else if (d.status === 'overreaching') {
            suggestions.push({
                type: 'alert',
                message: `Volume alto para ${d.muscle}. Cuidado com overreaching.`
            });
        }
    });

    // 2. Check Intensity (Freio automático)
    // Get last 3 sessions
    const sessions = await db.sessions.orderBy('date').reverse().limit(3).toArray();
    if (sessions.length === 3) {
        const avgRecentRPE = sessions.reduce((acc, s) => acc + (s.avgRPE || 0), 0) / 3;
        if (avgRecentRPE >= 9) {
            suggestions.push({
                type: 'alert',
                message: "Últimos treinos muito intensos (RPE 9+). Considere um deload."
            });
        }
    }

    return suggestions;
};
