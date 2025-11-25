import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Minus, Save, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function LogWorkout() {
  const [open, setOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sets, setSets] = useState([{ reps: '', weight: '' }]);
  
  const exercises = useLiveQuery(() => db.exercises.toArray());

  const handleAddSet = () => {
    setSets([...sets, { reps: '', weight: '' }]);
  };

  const handleRemoveSet = (index) => {
    const newSets = [...sets];
    newSets.splice(index, 1);
    setSets(newSets);
  };

  const handleSetChange = (index, field, value) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const handleSave = async () => {
    if (!selectedExercise) {
      toast.error("Please select an exercise");
      return;
    }
    
    // Filter out empty sets
    const validSets = sets.filter(s => s.reps && s.weight).map(s => ({
      reps: parseFloat(s.reps),
      weight: parseFloat(s.weight)
    }));

    if (validSets.length === 0) {
      toast.error("Please enter at least one valid set");
      return;
    }

    try {
      await db.logs.add({
        exercise_id: selectedExercise.id,
        timestamp: new Date().toISOString(),
        sets: validSets
      });
      toast.success("Workout logged!");
      // Reset form
      setSets([{ reps: '', weight: '' }]);
      setSelectedExercise(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save log");
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">Log Workout</h1>
      
      <div className="space-y-4">
        <label className="text-sm font-medium text-muted-foreground">Exercise</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-card border-input hover:bg-accent/10 hover:text-primary"
              data-testid="exercise-select-btn"
            >
              {selectedExercise
                ? selectedExercise.name
                : "Select exercise..."}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 bg-card border-border">
            <Command className="bg-card text-foreground">
              <CommandInput placeholder="Search exercise..." className="h-9" />
              <CommandList>
                <CommandEmpty>No exercise found.</CommandEmpty>
                <CommandGroup>
                  {exercises?.map((exercise) => (
                    <CommandItem
                      key={exercise.id}
                      value={exercise.name}
                      onSelect={() => {
                        setSelectedExercise(exercise);
                        setOpen(false);
                      }}
                      className="cursor-pointer hover:bg-accent/20"
                    >
                      {exercise.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedExercise && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{selectedExercise.name}</h3>
            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
              {selectedExercise.muscle}
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground text-center mb-1">
              <div className="col-span-1">Set</div>
              <div className="col-span-2">kg</div>
              <div className="col-span-2">Reps</div>
              <div className="col-span-1"></div>
            </div>
            
            {sets.map((set, index) => (
              <div key={index} className="grid grid-cols-6 gap-2 items-center">
                <div className="col-span-1 flex justify-center">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={set.weight}
                    onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                    className="text-center h-10 bg-card border-input focus:border-primary"
                    data-testid={`weight-input-${index}`}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={set.reps}
                    onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                    className="text-center h-10 bg-card border-input focus:border-primary"
                    data-testid={`reps-input-${index}`}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {sets.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveSet(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="secondary" 
              onClick={handleAddSet} 
              className="flex-1 bg-secondary hover:bg-secondary/80"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Set
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-primary text-black hover:bg-primary/90 font-bold"
              data-testid="save-workout-btn"
            >
              <Save className="mr-2 h-4 w-4" /> Save Log
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
