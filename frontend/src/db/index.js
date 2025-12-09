import Dexie from 'dexie';

export const db = new Dexie('GymLogDB');

db.version(1).stores({
  exercises: '++id, name, muscle, created_at',
  logs: '++id, exercise_id, timestamp' // sets are stored as object in the log
});

db.version(2).stores({
  exercises: '++id, name, muscle, created_at', // Keep existing
  sessions: '++id, date, score, volume, avgRPE', // New session summary
  workout_entries: '++id, sessionId, exerciseId, date' // Individual sets/logs linked to session
});

db.on('populate', () => {
  db.exercises.bulkAdd([
    { name: 'Squat', muscle: 'Legs', created_at: new Date().toISOString() },
    { name: 'Bench Press', muscle: 'Chest', created_at: new Date().toISOString() },
    { name: 'Deadlift', muscle: 'Back', created_at: new Date().toISOString() },
    { name: 'Overhead Press', muscle: 'Shoulders', created_at: new Date().toISOString() },
    { name: 'Pull Up', muscle: 'Back', created_at: new Date().toISOString() },
    { name: 'Dumbbell Row', muscle: 'Back', created_at: new Date().toISOString() },
    { name: 'Lunges', muscle: 'Legs', created_at: new Date().toISOString() },
    { name: 'Face Pull', muscle: 'Shoulders', created_at: new Date().toISOString() },
    { name: 'Tricep Extension', muscle: 'Arms', created_at: new Date().toISOString() },
    { name: 'Bicep Curl', muscle: 'Arms', created_at: new Date().toISOString() },
  ]);
});
