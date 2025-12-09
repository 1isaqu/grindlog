import { db } from '../db';
import { calculateVolume, calculateAvgRPE } from '../core/calculations';

export const sessionEngine = {
    /**
     * Logs a workout session (or adds to existing one)
     * @param {Object} params
     * @param {string} params.exerciseId
     * @param {Array} params.sets - Array of {reps, weight, rpe}
     * @param {Date} [params.date] - Defaults to now
     */
    logWorkout: async ({ exerciseId, sets, date = new Date() }) => {
        const validSets = sets.filter(s => s.reps && s.weight).map(s => ({
            reps: parseFloat(s.reps),
            weight: parseFloat(s.weight),
            rpe: s.rpe ? parseFloat(s.rpe) : null,
            sets: 1
        }));

        if (validSets.length === 0) {
            throw new Error("No valid sets to log");
        }

        const dateIso = date.toISOString();
        const sessionId = crypto.randomUUID();

        // Calculate metrics for this batch
        const totalVolume = calculateVolume(validSets);
        const avgRPE = calculateAvgRPE(validSets);

        // Save Session (Micro-session for this exercise)
        // TODO: In future, we might want to aggregate into a daily session
        await db.sessions.add({
            id: sessionId,
            date: dateIso,
            volume: totalVolume,
            avgRPE: avgRPE,
            score: 0 // Calculated later or via analytics engine
        });

        // Save Entries
        const entries = validSets.map(s => ({
            sessionId: sessionId,
            exerciseId: exerciseId,
            date: dateIso,
            sets: 1,
            reps: s.reps,
            weight: s.weight,
            rpe: s.rpe,
            volume: s.reps * s.weight
        }));

        await db.workout_entries.bulkAdd(entries);

        return { sessionId, entries };
    }
};
