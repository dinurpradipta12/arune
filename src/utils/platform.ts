/**
 * Platform detection utilities for Arune Editorial Studio.
 * Detects whether running inside Electron desktop wrapper or web/PWA browser,
 * and determines the underlying operating system.
 */

export const isDesktopApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { aruneDesktop?: { isDesktop?: boolean } };
  if (w.aruneDesktop?.isDesktop) return true;
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
  if (typeof navigator !== 'undefined') {
    return /macintosh|mac os x/i.test(navigator.userAgent);
  }
  return false;
};

export const isElectronMac = (): boolean => {
  return isDesktopApp() && isMacOS();
};
