import React from 'react';
import { NavLink } from "react-router-dom";
import { Dumbbell, History as HistoryIcon, Settings as SettingsIcon, PlusCircle, BarChart2 } from "lucide-react";

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 z-[40]">
            <div className="flex justify-around items-center h-full max-w-md mx-auto">
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
                    }
                    data-testid="nav-log"
                >
                    <PlusCircle className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Treino</span>
                </NavLink>

                <NavLink
                    to="/data"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
                    }
                    data-testid="nav-data"
                >
                    <BarChart2 className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Dados</span>
                </NavLink>

                <NavLink
                    to="/history"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
                    }
                    data-testid="nav-history"
                >
                    <HistoryIcon className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Histórico</span>
                </NavLink>

                <NavLink
                    to="/exercises"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
                    }
                    data-testid="nav-exercises"
                >
                    <Dumbbell className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Exercícios</span>
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
                    }
                    data-testid="nav-settings"
                >
                    <SettingsIcon className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Config</span>
                </NavLink>
            </div>
        </nav>
    );
}
