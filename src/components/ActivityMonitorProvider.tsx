import React, { createContext, useContext } from 'react';
import { useActivityMonitor } from '@/hooks/useActivityMonitor';
import { InactivityWarningModal } from './InactivityWarningModal';

// Create context for activity monitor
const ActivityMonitorContext = createContext<ReturnType<typeof useActivityMonitor> | null>(null);

export const useActivityMonitorContext = () => {
  const context = useContext(ActivityMonitorContext);
  if (!context) {
    throw new Error('useActivityMonitorContext must be used within ActivityMonitorProvider');
  }
  return context;
};

interface ActivityMonitorProviderProps {
  children: React.ReactNode;
}

export const ActivityMonitorProvider: React.FC<ActivityMonitorProviderProps> = ({ children }) => {
  const activityMonitor = useActivityMonitor();

  return (
    <ActivityMonitorContext.Provider value={activityMonitor}>
      {children}
      <InactivityWarningModal />
    </ActivityMonitorContext.Provider>
  );
};