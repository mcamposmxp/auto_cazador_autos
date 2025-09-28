import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilityState {
  highContrast: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
  screenReader: boolean;
}

interface AccessibilityContextType {
  state: AccessibilityState;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccessibilityState>({
    highContrast: false,
    reducedMotion: false,
    focusVisible: true,
    screenReader: false
  });

  useEffect(() => {
    // Detect user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const hasScreenReader = 'speechSynthesis' in window;

    setState(prev => ({
      ...prev,
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
      screenReader: hasScreenReader
    }));

    // Apply initial CSS classes
    document.documentElement.classList.toggle('high-contrast', prefersHighContrast);
    document.documentElement.classList.toggle('reduced-motion', prefersReducedMotion);

    // Listen for focus-visible
    const handleFocusVisible = () => {
      document.documentElement.classList.add('focus-visible');
    };

    const handleFocusHidden = () => {
      document.documentElement.classList.remove('focus-visible');
    };

    document.addEventListener('keydown', handleFocusVisible);
    document.addEventListener('mousedown', handleFocusHidden);

    return () => {
      document.removeEventListener('keydown', handleFocusVisible);
      document.removeEventListener('mousedown', handleFocusHidden);
    };
  }, []);

  const toggleHighContrast = () => {
    setState(prev => {
      const newHighContrast = !prev.highContrast;
      document.documentElement.classList.toggle('high-contrast', newHighContrast);
      localStorage.setItem('accessibility-high-contrast', newHighContrast.toString());
      return { ...prev, highContrast: newHighContrast };
    });
  };

  const toggleReducedMotion = () => {
    setState(prev => {
      const newReducedMotion = !prev.reducedMotion;
      document.documentElement.classList.toggle('reduced-motion', newReducedMotion);
      localStorage.setItem('accessibility-reduced-motion', newReducedMotion.toString());
      return { ...prev, reducedMotion: newReducedMotion };
    });
  };

  const announceToScreenReader = (message: string) => {
    if (!state.screenReader) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const contextValue: AccessibilityContextType = {
    state,
    toggleHighContrast,
    toggleReducedMotion,
    announceToScreenReader
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Screen reader only text component
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// Skip navigation component
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
    >
      Saltar al contenido principal
    </a>
  );
}