'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sidebar-open';
const DESKTOP_BREAKPOINT = '(min-width: 1024px)';

export function useSidebarState() {
  const [isOpen, setIsOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);
    const stored = localStorage.getItem(STORAGE_KEY);
    const desktop = mediaQuery.matches;

    setIsDesktop(desktop);

    if (!desktop) {
      setIsOpen(stored === 'true');
    }

    const handleMediaChange = (e: MediaQueryListEvent) => {
      const nowDesktop = e.matches;
      setIsDesktop(nowDesktop);
      if (nowDesktop) {
        setIsOpen(true);
      } else {
        const current = localStorage.getItem(STORAGE_KEY);
        setIsOpen(current === 'true');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'false');
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (isDesktop || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDesktop, close]);

  return { isOpen, isDesktop, open, close, toggle };
}
