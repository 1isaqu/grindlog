import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LogWorkout from "./pages/LogWorkout";
import Exercises from "./pages/Exercises";
import History from "./pages/History";
import Settings from "./pages/Settings";
import { Dumbbell, History as HistoryIcon, Settings as SettingsIcon, PlusCircle } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-black">
      <BrowserRouter>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<LogWorkout />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 z-50 pb-safe">
          <div className="flex justify-around items-center h-full max-w-md mx-auto">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
              }
              data-testid="nav-log"
            >
              <PlusCircle className="h-6 w-6" />
              <span className="text-[10px] font-medium">Log</span>
            </NavLink>
            
            <NavLink 
              to="/history" 
              className={({ isActive }) => 
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
              }
              data-testid="nav-history"
            >
              <HistoryIcon className="h-6 w-6" />
              <span className="text-[10px] font-medium">History</span>
            </NavLink>
            
            <NavLink 
              to="/exercises" 
              className={({ isActive }) => 
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
              }
              data-testid="nav-exercises"
            >
              <Dumbbell className="h-6 w-6" />
              <span className="text-[10px] font-medium">Exercises</span>
            </NavLink>
            
            <NavLink 
              to="/settings" 
              className={({ isActive }) => 
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
              }
              data-testid="nav-settings"
            >
              <SettingsIcon className="h-6 w-6" />
              <span className="text-[10px] font-medium">Settings</span>
            </NavLink>
          </div>
        </nav>
        
        <Toaster position="top-center" theme="dark" />
      </BrowserRouter>
    </div>
  );
}

export default App;
