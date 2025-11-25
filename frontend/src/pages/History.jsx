import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { Calendar } from "lucide-react";

export default function History() {
  // Join logs with exercises
  const logs = useLiveQuery(async () => {
    const allLogs = await db.logs.orderBy('timestamp').reverse().toArray();
    const allExercises = await db.exercises.toArray();
    const exerciseMap = new Map(allExercises.map(e => [e.id, e]));
    
    return allLogs.map(log => ({
      ...log,
      exercise: exerciseMap.get(log.exercise_id)
    }));
  });

  // Group by date
  const groupedLogs = logs?.reduce((acc, log) => {
    const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">History</h1>
      
      <div className="space-y-6">
        {groupedLogs && Object.entries(groupedLogs).map(([date, dayLogs]) => (
          <div key={date} className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{format(new Date(date), 'EEEE, MMMM d')}</span>
            </div>
            
            {dayLogs.map((log) => (
              <Card key={log.id} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground">
                      {log.exercise?.name || 'Unknown Exercise'}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.timestamp), 'HH:mm')}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {log.sets.map((set, idx) => (
                      <div key={idx} className="bg-secondary px-2 py-1 rounded text-xs text-secondary-foreground">
                        <span className="font-bold text-primary">{set.weight}</span>kg × {set.reps}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Total Volume: <span className="text-primary">
                      {log.sets.reduce((sum, s) => sum + (s.weight * s.reps), 0).toLocaleString()}
                    </span> kg
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
        
        {logs?.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No workouts logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
