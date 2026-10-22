/**
 * Platform detection utilities for Arune Editorial Studio.
 * Detects whether running inside Electron desktop wrapper or web/PWA browser,
 * and determines the underlying operating system.
 */

export const isDesktopApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as {
    aruneDesktop?: { isDesktop?: boolean };
    electron?: unknown;
    process?: { type?: string };
  };
  if (w.aruneDesktop?.isDesktop) return true;
  if (w.electron || w.process?.type === 'renderer') return true;
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('is-electron-mac')) {
    return true;
  }
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('electron')) return true;
  }
  return false;
};

export const isMacOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { aruneDesktop?: { platform?: string } };
  if (w.aruneDesktop?.platform === 'darwin') return true;
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('is-electron-mac')) {
    return true;
  }
  if (typeof navigator !== 'undefined') {
    return /macintosh|mac os x/i.test(navigator.userAgent);
  }
  return false;
};

export const isElectronMac = (): boolean => {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('is-electron-mac')) {
    return true;
  }
  return isDesktopApp() && isMacOS();
};
