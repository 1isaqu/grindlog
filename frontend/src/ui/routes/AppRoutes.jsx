import React from 'react';
import { Routes, Route } from "react-router-dom";
import LogWorkout from "../pages/LogWorkout";
import Exercises from "../pages/Exercises";
import History from "../pages/History";
import Settings from "../pages/Settings";
import DataPage from "../pages/DataPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LogWorkout />} />
            <Route path="/data" element={<DataPage />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
        </Routes>
    );
}
