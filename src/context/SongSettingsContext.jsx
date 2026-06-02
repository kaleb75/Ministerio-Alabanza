import React, { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'ministry_song_settings';

export const DEFAULT_SETTINGS = {
  repeatProtectionDays: 30,
  blockRepeatDays: 14,
  forgottenThresholdDays: 90,
  coldThresholdDays: 45,
  recommendationSensitivity: 'medium',
};

const SongSettingsContext = createContext(null);

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

function persistSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

export function SongSettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      persistSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const defaults = { ...DEFAULT_SETTINGS };
    persistSettings(defaults);
    setSettings(defaults);
  }, []);

  const value = {
    settings,
    updateSettings,
    resetSettings,
    DEFAULT_SETTINGS,
  };

  return (
    <SongSettingsContext.Provider value={value}>
      {children}
    </SongSettingsContext.Provider>
  );
}

export function useSongSettings() {
  const ctx = useContext(SongSettingsContext);
  if (!ctx) {
    throw new Error('useSongSettings must be used within a SongSettingsProvider');
  }
  return ctx;
}
