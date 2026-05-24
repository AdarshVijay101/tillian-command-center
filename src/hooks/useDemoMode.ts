import { useState, useEffect } from 'react';

const DEMO_MODE_KEY = 'Local AI:demo_mode';

export const getIsDemoMode = () => {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
};

export const setDemoModeGlobal = (isDemo: boolean) => {
  localStorage.setItem(DEMO_MODE_KEY, String(isDemo));
  window.dispatchEvent(new Event('Local AI:demo_mode_changed'));
};

export const useDemoMode = () => {
  const [isDemo, setIsDemo] = useState(getIsDemoMode());

  useEffect(() => {
    const handleChanged = () => setIsDemo(getIsDemoMode());
    window.addEventListener('Local AI:demo_mode_changed', handleChanged);
    return () => window.removeEventListener('Local AI:demo_mode_changed', handleChanged);
  }, []);

  return {
    isDemoMode: isDemo,
    toggleDemoMode: () => setDemoModeGlobal(!isDemo)
  };
};

