import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AccessibilityContextType {
  highVisibilityMode: boolean;
  toggleHighVisibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highVisibilityMode, setHighVisibilityMode] = useState(false);

  const toggleHighVisibility = () => {
    setHighVisibilityMode((prev) => !prev);
  };

  return (
    <AccessibilityContext.Provider value={{ highVisibilityMode, toggleHighVisibility }}>
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
