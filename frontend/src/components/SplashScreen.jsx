import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Check if user has seen splash before (if "clears app data" requirement implies persistent flag)
    // However, the requirement says "Once splash disappears, it must never show again unless user clears app data."
    // This implies we should check localStorage.
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');

    if (hasSeenSplash) {
      setIsVisible(false);
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setOpacity(0); // Start fade out
      setTimeout(() => {
        setIsVisible(false);
        localStorage.setItem('hasSeenSplash', 'true');
        onComplete();
      }, 300); // Wait for fade out animation
    }, 1500); // 1.5s display time

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1B2A] transition-opacity duration-300 ease-out"
      style={{ opacity: opacity }}
    >
      <img src={logo} alt="GymLog Logo" className="w-48 h-auto" />
    </div>
  );
};

export default SplashScreen;
