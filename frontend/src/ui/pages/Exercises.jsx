import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, Dumbbell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function Exercises() {
  const exercises = useLiveQuery(() => db.exercises.toArray());
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseMuscle, setNewExerciseMuscle] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddExercise = async () => {
    if (!newExerciseName) {
      toast.error("O nome é obrigatório");
      return;
    }
    try {
      await db.exercises.add({
        name: newExerciseName,
        muscle: newExerciseMuscle || "Other",
        created_at: new Date().toISOString()
      });
      toast.success("Exercício adicionado");
      setNewExerciseName("");
      setNewExerciseMuscle("");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Falha ao adicionar exercício");
    }
  };

  const handleDelete = async (id) => {
    try {
      await db.exercises.delete(id);
      toast.success("Exercício excluído");
    } catch (error) {
      toast.error("Falha ao excluir");
    }
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Exercícios</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="add-exercise-btn">
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Criar Exercício</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="ex: Agachamento Búlgaro"
                  className="bg-background"
                  data-testid="exercise-name-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Grupo Muscular</label>
                <Select onValueChange={setNewExerciseMuscle} value={newExerciseMuscle}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecionar músculo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Legs">Pernas</SelectItem>
                    <SelectItem value="Chest">Peito</SelectItem>
                    <SelectItem value="Back">Costas</SelectItem>
                    <SelectItem value="Shoulders">Ombros</SelectItem>
                    <SelectItem value="Arms">Braços</SelectItem>
                    <SelectItem value="Core">Core</SelectItem>
                    <SelectItem value="Cardio">Cardio</SelectItem>
                    <SelectItem value="Other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddExercise} className="w-full bg-primary text-primary-foreground" data-testid="save-exercise-btn">
                Criar Exercício
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {exercises?.map((ex) => (
          <Card key={ex.id} className="bg-card border-border/50">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center text-primary">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">{ex.name}</h3>
                  <p className="text-xs text-muted-foreground">{ex.muscle}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(ex.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {exercises?.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum exercício encontrado. Crie um para começar.
          </div>
        )}
      </div>
    </div>
  );
}
