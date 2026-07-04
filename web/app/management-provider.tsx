'use client';

import { useState, useEffect } from 'react';

// Module-level state - stable reference for SSR compatibility
let isMobileSidebarOpen = false;
const listeners: Array<() => void> = [];

export function openMobileSidebar(): void {
  isMobileSidebarOpen = true;
  listeners.forEach(fn => fn());
}

export function closeMobileSidebar(): void {
  isMobileSidebarOpen = false;
  listeners.forEach(fn => fn());
}

export function subscribeToMobileSidebar(cb: () => void): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function getIsMobileSidebarOpen(): boolean {
  return isMobileSidebarOpen;
}

// Hook for components to use the mobile sidebar state
export function useMobileSidebarState() {
  const [isOpen, setIsOpen] = useState(isMobileSidebarOpen);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(isMobileSidebarOpen);
    };
    document.addEventListener('mobile-sidebar:toggle', handleToggle as EventListener);
    
    return () => {
      document.removeEventListener('mobile-sidebar:toggle', handleToggle as EventListener);
    };
  }, []);

  const toggle = () => {
    isMobileSidebarOpen = !isMobileSidebarOpen;
    setIsOpen(isMobileSidebarOpen);
    document.dispatchEvent(new CustomEvent('mobile-sidebar:toggle'));
  };

  return { isOpen, toggle, openMobileSidebar, closeMobileSidebar };
}
