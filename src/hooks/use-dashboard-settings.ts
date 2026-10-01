"use client";

import { useCallback, useSyncExternalStore } from "react";

const COOKIE_NAME = "dashboardSettings";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type DashboardSettings = {
  sidebarOpen: boolean;
};

const DEFAULT_SETTINGS: DashboardSettings = {
  sidebarOpen: true,
};

function parseCookie(): DashboardSettings {
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`));
    if (!match) return DEFAULT_SETTINGS;
    const raw = decodeURIComponent(match.split("=")[1]);
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
  cachedSettings = parseCookie();
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  cachedSettings = parseCookie();
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
    const current = parseCookie();
    const next = { ...current, ...partial };
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=${COOKIE_MAX_AGE}`;
    emitChange();
  }, []);

  return { settings, updateSettings };
}
