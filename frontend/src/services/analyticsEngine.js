import { db } from '../db';
import { startOfWeek, subWeeks, isSameWeek, parseISO, format } from 'date-fns';
import { calculateEffectiveVolume, calculateAvgRPE } from '../core/calculations';
import { getVolumeStatus, TRAINING_RULES } from '../core/rules';

export const analyticsEngine = {
    getWeeklyVolumePerMuscle: async (weeks = 4) => {
        const entries = await db.workout_entries.toArray();
        const exercises = await db.exercises.toArray();
        const exerciseMap = new Map(exercises.map(e => [e.id, e]));

        const now = new Date();
        const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });

        const currentWeekVol = {};
        const historyVol = {};

        entries.forEach(entry => {
            const date = parseISO(entry.date);
            const exercise = exerciseMap.get(entry.exerciseId);
            if (!exercise || !exercise.muscle) return;

            const muscle = exercise.muscle;
            const volume = entry.volume;

            if (isSameWeek(date, now, { weekStartsOn: 1 })) {
                currentWeekVol[muscle] = (currentWeekVol[muscle] || 0) + volume;
            } else {
                const fourWeeksAgo = subWeeks(now, 4);
                if (date >= fourWeeksAgo && date < startOfCurrentWeek) {
                    historyVol[muscle] = (historyVol[muscle] || 0) + volume;
                }
            }
        });

        const baselineVol = {};
        Object.keys(historyVol).forEach(muscle => {
            baselineVol[muscle] = historyVol[muscle] / 4;
        });

        const allMuscles = new Set([...Object.keys(currentWeekVol), ...Object.keys(baselineVol)]);
        return Array.from(allMuscles).map(muscle => ({
            muscle,
            current: currentWeekVol[muscle] || 0,
            baseline: baselineVol[muscle] || 0,
            status: getVolumeStatus(currentWeekVol[muscle] || 0, baselineVol[muscle] || 0)
        }));
    },

    getExerciseProgressionData: async (exerciseId) => {
        if (!exerciseId) return [];

        const entries = await db.workout_entries
            .where('exerciseId')
            .equals(exerciseId)
            .sortBy('date');

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
    },

    getScatterData: async () => {
        const sessions = await db.sessions.toArray();
        return sessions.map(s => ({
            x: s.volume,
            y: s.avgRPE,
            z: 1,
            date: s.date,
            id: s.id
        }));
    },

    getTopSessions: async () => {
        const sessions = await db.sessions.toArray();
        const sessionsWithScore = await Promise.all(sessions.map(async (s) => {
            const entries = await db.workout_entries.where('sessionId').equals(s.id).toArray();
            const effectiveVol = calculateEffectiveVolume(entries);
            const score = effectiveVol * (1 + (s.avgRPE || 0) / 10);
            return { ...s, score, effectiveVolume: effectiveVol };
        }));

        return sessionsWithScore.sort((a, b) => b.score - a.score).slice(0, 10);
    },

    getTrainingSuggestions: async () => {
        const suggestions = [];
        const volumeData = await analyticsEngine.getWeeklyVolumePerMuscle();

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

        const sessions = await db.sessions.orderBy('date').reverse().limit(3).toArray();
        if (sessions.length === 3) {
            const avgRecentRPE = sessions.reduce((acc, s) => acc + (s.avgRPE || 0), 0) / 3;
            if (avgRecentRPE >= TRAINING_RULES.INTENSITY.HIGH_RPE_THRESHOLD) {
                suggestions.push({
                    type: 'alert',
                    message: "Últimos treinos muito intensos (RPE 9+). Considere um deload."
                });
            }
        }

        return suggestions;
    }
};
