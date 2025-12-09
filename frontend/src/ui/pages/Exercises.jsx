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
      toast.error("Name is required");
      return;
    }
    try {
      await db.exercises.add({
        name: newExerciseName,
        muscle: newExerciseMuscle || "Other",
        created_at: new Date().toISOString()
      });
      toast.success("Exercise added");
      setNewExerciseName("");
      setNewExerciseMuscle("");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to add exercise");
    }
  };

  const handleDelete = async (id) => {
    try {
      await db.exercises.delete(id);
      toast.success("Exercise deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Exercises</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-black hover:bg-primary/90" data-testid="add-exercise-btn">
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Create Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="e.g. Bulgarian Split Squat"
                  className="bg-background"
                  data-testid="exercise-name-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Muscle Group</label>
                <Select onValueChange={setNewExerciseMuscle} value={newExerciseMuscle}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select muscle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Legs">Legs</SelectItem>
                    <SelectItem value="Chest">Chest</SelectItem>
                    <SelectItem value="Back">Back</SelectItem>
                    <SelectItem value="Shoulders">Shoulders</SelectItem>
                    <SelectItem value="Arms">Arms</SelectItem>
                    <SelectItem value="Core">Core</SelectItem>
                    <SelectItem value="Cardio">Cardio</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddExercise} className="w-full bg-primary text-black" data-testid="save-exercise-btn">
                Create Exercise
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
            No exercises found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
