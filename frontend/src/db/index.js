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
    { name: 'Agachamento', muscle: 'Pernas', created_at: new Date().toISOString() },
    { name: 'Supino Reto', muscle: 'Peito', created_at: new Date().toISOString() },
    { name: 'Levantamento Terra', muscle: 'Costas', created_at: new Date().toISOString() },
    { name: 'Desenvolvimento', muscle: 'Ombros', created_at: new Date().toISOString() },
    { name: 'Barra Fixa', muscle: 'Costas', created_at: new Date().toISOString() },
    { name: 'Remada Curvada', muscle: 'Costas', created_at: new Date().toISOString() },
    { name: 'Afundo', muscle: 'Pernas', created_at: new Date().toISOString() },
    { name: 'Face Pull', muscle: 'Ombros', created_at: new Date().toISOString() },
    { name: 'Tríceps Corda', muscle: 'Braços', created_at: new Date().toISOString() },
    { name: 'Rosca Direta', muscle: 'Braços', created_at: new Date().toISOString() },
  ]);
});
