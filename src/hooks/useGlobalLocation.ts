import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'chamby_global_location';

export interface GlobalLocation {
  address: string;
  latitude: number;
  longitude: number;
  shortAddress: string;
}

function loadFromStorage(): GlobalLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GlobalLocation;
  } catch {
    return null;
  }
}

function saveToStorage(loc: GlobalLocation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
}

// Simple event-based sync across components
const listeners = new Set<() => void>();
function notifyAll() {
  listeners.forEach(fn => fn());
}

export function useGlobalLocation() {
  const [location, setLocation] = useState<GlobalLocation | null>(loadFromStorage);

  useEffect(() => {
    const sync = () => setLocation(loadFromStorage());
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, []);

  const setGlobalLocation = useCallback((loc: GlobalLocation) => {
    saveToStorage(loc);
    setLocation(loc);
    notifyAll();
  }, []);

  const clearGlobalLocation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLocation(null);
    notifyAll();
  }, []);

  return { location, setGlobalLocation, clearGlobalLocation };
}
