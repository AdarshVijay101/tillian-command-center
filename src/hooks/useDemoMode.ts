import { useState, useEffect } from 'react';

const DEMO_MODE_KEY = 'tillian:demo_mode';

export const getIsDemoMode = () => {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
};

export const setDemoModeGlobal = (isDemo: boolean) => {
  localStorage.setItem(DEMO_MODE_KEY, String(isDemo));
  window.dispatchEvent(new Event('tillian:demo_mode_changed'));
};

export const useDemoMode = () => {
  const [isDemo, setIsDemo] = useState(getIsDemoMode());

  useEffect(() => {
    const handleChanged = () => setIsDemo(getIsDemoMode());
    window.addEventListener('tillian:demo_mode_changed', handleChanged);
    return () => window.removeEventListener('tillian:demo_mode_changed', handleChanged);
  }, []);

  return {
    isDemoMode: isDemo,
    toggleDemoMode: () => setDemoModeGlobal(!isDemo)
  };
};
