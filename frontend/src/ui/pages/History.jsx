import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function History() {
  const sessions = useLiveQuery(async () => {
    const allSessions = await db.sessions.orderBy('date').reverse().toArray();
    const allEntries = await db.workout_entries.toArray();
    const allExercises = await db.exercises.toArray();

    const exerciseMap = new Map(allExercises.map(e => [e.id, e]));
    const entriesMap = new Map();

    allEntries.forEach(entry => {
      if (!entriesMap.has(entry.sessionId)) entriesMap.set(entry.sessionId, []);
      entriesMap.get(entry.sessionId).push(entry);
    });

    return allSessions.map(session => ({
      ...session,
      entries: entriesMap.get(session.id) || [],
      exercise: entriesMap.get(session.id)?.[0] ? exerciseMap.get(entriesMap.get(session.id)[0].exerciseId) : null
    }));
  });

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Deseja realmente excluir este treino? Isso afetará os dados de análise.")) return;

    try {
      await db.transaction('rw', db.sessions, db.workout_entries, async () => {
        await db.sessions.delete(sessionId);
        await db.workout_entries.where('sessionId').equals(sessionId).delete();
      });
      toast.success("Treino removido");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover treino");
    }
  };

  const groupedSessions = sessions?.reduce((acc, session) => {
    const date = format(new Date(session.date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">Histórico</h1>

      <div className="space-y-6">
        {groupedSessions && Object.entries(groupedSessions).map(([date, daySessions]) => (
          <div key={date} className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
            </div>

            {daySessions.map((session) => (
              <Card key={session.id} className="bg-card border-border/50 group">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {session.exercise?.name || 'Exercício Desconhecido'}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(session.date), 'HH:mm')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSession(session.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {session.entries.map((entry, idx) => (
                      <div key={idx} className="bg-secondary px-2 py-1 rounded text-xs text-secondary-foreground">
                        <span className="font-bold text-primary">{entry.weight}</span>kg × {entry.reps}
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                    <span>
                      Volume Total: <span className="text-primary font-bold">
                        {session.volume.toLocaleString()}
                      </span> kg
                    </span>
                    {session.avgRPE > 0 && (
                      <span>RPE: <span className="text-primary font-bold">{session.avgRPE}</span></span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

        {sessions?.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum treino registrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
