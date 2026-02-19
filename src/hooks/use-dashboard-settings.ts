"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "dashboardSettings";

type DashboardSettings = {
  sidebarOpen: boolean;
};

const DEFAULT_SETTINGS: DashboardSettings = {
  sidebarOpen: true,
};

function getSnapshot(): DashboardSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getServerSnapshot(): DashboardSettings {
  return DEFAULT_SETTINGS;
}

let listeners: (() => void)[] = [];
let cachedSettings = DEFAULT_SETTINGS;

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  cachedSettings = getSnapshot();
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  cachedSettings = getSnapshot();
  for (const listener of listeners) {
    listener();
  }
}

export function useDashboardSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    () => cachedSettings,
    getServerSnapshot
  );

  const updateSettings = useCallback((partial: Partial<DashboardSettings>) => {
    const current = getSnapshot();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...partial })
    );
    emitChange();
  }, []);

  return { settings, updateSettings };
}
