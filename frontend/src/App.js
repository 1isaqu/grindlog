import React, { useState } from 'react';
import { BrowserRouter } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "./ui/components/ui/sonner";
import SplashScreen from "./ui/components/SplashScreen";
import AppRoutes from "./ui/routes/AppRoutes";
import BottomNav from "./ui/navigation/BottomNav";

function App() {
  const [splashComplete, setSplashComplete] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-white">
      <SplashScreen onComplete={() => setSplashComplete(true)} />

      <BrowserRouter>
        <div className="min-h-screen">
          <AppRoutes />
        </div>

        {/* Bottom Navigation */}
        <BottomNav />

        <Toaster position="top-center" theme="light" />

        {/* Vercel Speed Insights */}
        <SpeedInsights />
      </BrowserRouter>
    </div>
  );
}

export default App;
