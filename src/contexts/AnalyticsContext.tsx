import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  trackAmplitudeEvent, 
  identifyUser, 
  setUserProperties, 
  resetUser,
  incrementUserProperty,
  amplitudeEvents,
} from '@/lib/analytics/amplitude';
import { useUserStore, useAccountStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';
import { AmplitudeEventName, EventProperties, AMPLITUDE_EVENTS } from '@/lib/analytics/events';

interface AnalyticsContextValue {
  trackEvent: typeof trackAmplitudeEvent;
  identifyUser: typeof identifyUser;
  setUserProperties: typeof setUserProperties;
  resetUser: typeof resetUser;
  incrementUserProperty: typeof incrementUserProperty;
  amplitudeEvents: typeof amplitudeEvents;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const location = useLocation();
  const previousPath = useRef<string>('');
  const sessionStartTime = useRef<number>(Date.now());
  
  // Get user data from store
  const { user, userType } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      userType: state.userType,
    }))
  );
  
  // Get license data from account store
  const { licenseStatus, trialDaysRemaining, companyInfo } = useAccountStore(
    useShallow((state) => ({
      licenseStatus: state.licenseStatus,
      trialDaysRemaining: state.trialDaysRemaining,
      companyInfo: state.companyInfo,
    }))
  );
  
  // // Initialize Amplitude on mount
  // useEffect(() => {
  //   const init = async () => {
  //     await initAmplitude();
  //     setIsInitialized(true);
  //   };
  //   init();
  // }, []);
  
  // Track page views
  useEffect(() => {
    // Wait for initialization
    // Don't track if it's the same path (e.g., hash changes)
    if (location.pathname === previousPath.current) {
      return;
    }
    
    // Track page view with additional context
    amplitudeEvents.pageViewed(location.pathname, {
      previous_page: previousPath.current || undefined,
      query_params: Object.fromEntries(new URLSearchParams(location.search)),
      user_role: userType,
    });
    
    // Update previous path
    previousPath.current = location.pathname;
  }, [location.pathname, location.search, userType]);
  
  // Identify user when they log in
  useEffect(() => {
    // Wait for initialization
    if (user?.userId) {
      // Calculate trial end date if applicable
      const trialEndDate = licenseStatus === 'trial' && companyInfo?.expires 
        ? new Date(companyInfo.expires).toISOString()
        : undefined;
      
      // Identify user with their properties
      identifyUser(user.userId, {
        email_domain: user.email ? user.email.split('@')[1] : undefined, // Only domain for privacy
        user_role: userType,
        organization_id: user.tenantName,
        organization_name: user.tenants?.[user.tenantName]?.companyName,
        license_status: licenseStatus, // 'trial' | 'active' | 'expired' | 'deactivated'
        trial_end_date: trialEndDate,
        trial_days_remaining: licenseStatus === 'trial' ? trialDaysRemaining : undefined,
        is_active: true, // UserTenantProps doesn't have activated property
        is_external: user.tenantName !== user.homeTenantName,
        created_at: new Date().toISOString(), // User doesn't have created property
        last_login: new Date().toISOString(),
      });
      
      // Increment login count
      incrementUserProperty('login_count', 1);
      
      // Track successful login
      const loginDuration = Date.now() - sessionStartTime.current;
      amplitudeEvents.userLoginSuccess(
        user.userId,
        false, // We don't have is_new_user info here
        userType || undefined,
        loginDuration
      );
    }
  }, [user?.userId, userType, licenseStatus, trialDaysRemaining, companyInfo?.expires]);
  
  // Update user properties when license status changes
  useEffect(() => {
    if (user?.userId && licenseStatus) {
      // Calculate trial end date if applicable
      const trialEndDate = licenseStatus === 'trial' && companyInfo?.expires 
        ? new Date(companyInfo.expires).toISOString()
        : undefined;
      
      setUserProperties({
        license_status: licenseStatus,
        trial_end_date: trialEndDate,
        trial_days_remaining: licenseStatus === 'trial' ? trialDaysRemaining : undefined,
        is_external: user.tenantName !== user.homeTenantName,
        license_updated_at: new Date().toISOString(),
      });
    }
  }, [licenseStatus, trialDaysRemaining, companyInfo?.expires, user?.userId]);
  
  // Reset user on logout
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts (user logs out)
      if (user?.userId) {
        const sessionDuration = Date.now() - sessionStartTime.current;
        trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_LOGOUT, {
          logout_reason: 'manual',
          session_duration_ms: sessionDuration,
        });
        resetUser();
      }
    };
  }, [user?.userId]);
  
  // Track errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      amplitudeEvents.errorOccurred(
        'javascript_error',
        'UNCAUGHT_ERROR',
        event.message,
        event.filename || 'unknown',
        location.pathname,
        'runtime',
      );
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      amplitudeEvents.errorOccurred(
        'promise_rejection',
        'UNHANDLED_REJECTION',
        event.reason?.toString() || 'Unknown promise rejection',
        'promise',
        location.pathname,
        'runtime',
      );
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [location.pathname]);
  
  // Context value with all analytics functions
  const value: AnalyticsContextValue = {
    trackEvent: trackAmplitudeEvent,
    identifyUser,
    setUserProperties,
    resetUser,
    incrementUserProperty,
    amplitudeEvents,
  };
  
  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook to use analytics
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
};

// Convenience hook for tracking events with less boilerplate
export const useTrackEvent = () => {
  const { trackEvent } = useAnalytics();
  
  return <T extends AmplitudeEventName>(
    eventName: T,
    properties: EventProperties<T>
  ) => {
    trackEvent(eventName, properties);
  };
};

// Hook for tracking clicks with data attributes
export const useTrackClick = () => {
  const trackEvent = useTrackEvent();
  
  return (event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    const trackingData = element.dataset.analyticsEvent;
    
    if (trackingData) {
      try {
        const { event: eventName, ...properties } = JSON.parse(trackingData);
        trackEvent(eventName, properties);
      } catch (error) {
        console.error('Failed to parse analytics data:', error);
      }
    }
  };
};

// Hook for tracking performance metrics
export const usePerformanceTracking = (metricName: string) => {
  const startTime = useRef<number>(Date.now());
  const trackEvent = useTrackEvent();
  
  const trackPerformance = (additionalProperties?: Record<string, any>) => {
    const duration = Date.now() - startTime.current;
    
    // Only track if operation took more than 100ms
    if (duration > 100) {
      trackEvent(AMPLITUDE_EVENTS.SLOW_OPERATION, {
        operation_name: metricName,
        duration_ms: duration,
        ...additionalProperties,
      } as any);
    }
  };
  
  return { trackPerformance, startTime: startTime.current };
};