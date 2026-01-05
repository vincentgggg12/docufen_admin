import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

// Define the context type
interface SidebarRightContextProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  toggleVisibility: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setTabAndVisibility: (tab: string) => void;
  sidebarWidth: number;
  previousTab: string | null;
}

// Create the context with default values
const SidebarRightContext = createContext<SidebarRightContextProps>({
  isVisible: true,
  setIsVisible: () => {},
  toggleVisibility: () => {},
  activeTab: 'edit',
  setActiveTab: () => {},
  setTabAndVisibility: () => {},
  sidebarWidth: 365,
  previousTab: null,
});

// Provider component
export function SidebarRightProvider({ 
  children,
  defaultVisible = true,
  defaultTab = 'edit',
  defaultWidth = 365
}: { 
  children: ReactNode;
  defaultVisible?: boolean;
  defaultTab?: string;
  defaultWidth?: number;
}) {
  // State for sidebar visibility
  const [isVisible, setIsVisible] = useState<boolean>(defaultVisible);
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  // State for previous tab (to return to after modal closes)
  const [previousTab, setPreviousTab] = useState<string | null>(null);
  // State for sidebar width
  const [sidebarWidth] = useState<number>(defaultWidth);
  
  // Force sidebar to be visible on mount
  useEffect(() => {
    setIsVisible(true);
    // Don't override the defaultTab that was passed to the provider
  }, []);
  
  // Toggle function
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);
  
  // Function to set both active tab and visibility in one call
  const setTabAndVisibility = useCallback((tab: string) => {
    // Store the previous tab
    if (activeTab !== tab) {
      setPreviousTab(activeTab);
    }
    
    // If already on this tab, toggle visibility
    if (activeTab === tab && isVisible) {
      setIsVisible(false);
    } else {
      // Otherwise, set tab and show sidebar
      setActiveTab(tab);
      setIsVisible(true);
    }
  }, [activeTab, isVisible]);
  
  // Listen for the audit log modal opened event to revert to previous tab
  useEffect(() => {
    const handleAuditLogModalOpened = () => {
      // If we're on the audit log tab, revert to the previous tab
      if (activeTab === 'history' && previousTab) {
        setActiveTab(previousTab);
      }
    };
    
    window.addEventListener('auditLogModalOpened', handleAuditLogModalOpened);
    
    return () => {
      window.removeEventListener('auditLogModalOpened', handleAuditLogModalOpened);
    };
  }, [activeTab, previousTab]);
  
  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    isVisible,
    setIsVisible,
    toggleVisibility,
    activeTab,
    setActiveTab,
    setTabAndVisibility,
    sidebarWidth,
    previousTab,
  }), [isVisible, toggleVisibility, activeTab, setTabAndVisibility, sidebarWidth, previousTab]);
  
  return (
    <SidebarRightContext.Provider value={contextValue}>
      {children}
    </SidebarRightContext.Provider>
  );
}

// Hook for consuming the context
export function useSidebarRight() {
  const context = useContext(SidebarRightContext);
  
  if (context === undefined) {
    throw new Error('useSidebarRight must be used within a SidebarRightProvider');
  }
  
  return context;
} 