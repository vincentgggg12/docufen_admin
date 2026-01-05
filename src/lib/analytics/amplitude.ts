import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { 
  AMPLITUDE_EVENTS, 
  AmplitudeEventName, 
  EventProperties,
  validateEventProperties,
  getPageNameFromPath
} from './events';

// Environment detection - safe for browser
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
const isBeta = hostname === 'beta.docufen.com' || hostname === 'www.beta.docufen.com';
const isStaging = hostname === 'stage.docufen.com' || hostname === 'www.stage.docufen.com';
const isProduction = hostname === 'app.docufen.com' || hostname === 'www.app.docufen.com';

// For backwards compatibility with existing code
const isDevelopment = isLocal || isBeta;

// Amplitude configuration - using Vite environment variables
const AMPLITUDE_API_KEY_LOC = import.meta.env.VITE_AMPLITUDE_API_KEY_LOC;
const AMPLITUDE_API_KEY_DEV = import.meta.env.VITE_AMPLITUDE_API_KEY_DEV;
const AMPLITUDE_API_KEY_STG = import.meta.env.VITE_AMPLITUDE_API_KEY_STG;
const AMPLITUDE_API_KEY_PROD = import.meta.env.VITE_AMPLITUDE_API_KEY_PROD;

// Track if Amplitude has been initialized
let isInitialized = false;
let initializationError: Error | null = null;

// Event queue for events fired before initialization
const eventQueue: Array<{ eventName: string; properties: any }> = [];

// Select the appropriate API key based on environment
const getAmplitudeApiKey = () => {
  // Local development (localhost)
  if (isLocal && AMPLITUDE_API_KEY_LOC) {
    return AMPLITUDE_API_KEY_LOC;
  }
  
  // Beta environment
  if (isBeta && AMPLITUDE_API_KEY_DEV) {
    return AMPLITUDE_API_KEY_DEV;
  }
  
  // Staging environment
  if (isStaging && AMPLITUDE_API_KEY_STG) {
    return AMPLITUDE_API_KEY_STG;
  }
  
  // Production environment
  if (isProduction && AMPLITUDE_API_KEY_PROD) {
    return AMPLITUDE_API_KEY_PROD;
  }
  
  // Fallback to generic key or show warning
  const fallbackKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
  if (!fallbackKey) {
    console.warn('⚠️ No Amplitude API key found. Please set VITE_AMPLITUDE_API_KEY_LOC, VITE_AMPLITUDE_API_KEY_DEV, VITE_AMPLITUDE_API_KEY_STG, and VITE_AMPLITUDE_API_KEY_PROD in your environment files.');
    return 'missing-api-key';
  }
  return fallbackKey;
};

// Get current environment name for logging
export const getCurrentEnvironment = () => {
  if (isLocal) return 'LOCAL';
  if (isBeta) return 'BETA';
  if (isStaging) return 'STAGING';
  if (isProduction) return 'PRODUCTION';
  return 'UNKNOWN';
};

// Initialize Amplitude
export const initAmplitude = async () => {
  const apiKey = getAmplitudeApiKey();
  
  if (apiKey === 'missing-api-key') {
    initializationError = new Error('Missing Amplitude API key');
    console.warn('🚫 Amplitude not initialized due to missing API key');
    return;
  }

  try {
    // Determine sampling rate based on environment
    const getSampleRate = () => {
      if (isLocal) return 0.01; 
      if (isBeta) return 0.5; // 50% sampling for beta
      if (isStaging) return 0.01; 
      if (isProduction) return 1; // 100% sampling for production to control costs
      return 0.1; // Default to 10%
    };
    
    // Initialize session replay plugin with privacy settings
    const sessionReplayTracking = sessionReplayPlugin({
      sampleRate: getSampleRate(),
      privacyConfig: {
        // Block elements completely from replay
        blockSelector: '[data-amplitude-block]',
        // Mask level: 'light' | 'medium' | 'strict'
        defaultMaskLevel: 'medium',
        // Additional selectors to mask
        maskSelector: ['[data-amplitude-mask]', 'input[type="password"]', '.sensitive'],
        // Selectors to unmask (override masking)
        unmaskSelector: ['[data-amplitude-unmask]'],
      },
    });
    
    // Add the plugin before initialization
    amplitude.add(sessionReplayTracking);
    
    amplitude.init(apiKey, {
      // Configure for your environment
      serverZone: 'US', // or 'EU' for European data residency
      defaultTracking: {
        attribution: true,
        pageViews: false, // We'll track manually for more control
        sessions: true,
        formInteractions: true,
        fileDownloads: true,
      },
      // Add session timeout configuration
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      // Add more configuration as needed
      trackingOptions: {
        ipAddress: false, // Don't track IP for privacy
      },
    });

    isInitialized = true;

    // Log initialization for debugging
    const environment = getCurrentEnvironment();
    const sampleRate = getSampleRate();
    if (isDevelopment || isLocal) {
      console.log(`🔧 Amplitude initialized for ${environment} with key: ${apiKey.substring(0, 8)}...`);
      console.log(`🎥 Session Replay enabled with ${sampleRate * 100}% sampling rate`);
    } else {
      console.log('📊 Amplitude initialized for PRODUCTION');
      console.log(`🎥 Session Replay enabled with ${sampleRate * 100}% sampling rate`);
    }

    // Process queued events
    if (eventQueue.length > 0) {
      console.log(`📊 Processing ${eventQueue.length} queued events`);
      eventQueue.forEach(({ eventName, properties }) => {
        amplitude.track(eventName, properties);
      });
      eventQueue.length = 0; // Clear the queue
    }
  } catch (error) {
    initializationError = error as Error;
    console.error('❌ Failed to initialize Amplitude:', error);
  }
};

// Type-safe event tracking function
export function trackAmplitudeEvent<T extends AmplitudeEventName>(
  eventName: T,
  properties: EventProperties<T>
): void {
  // Validate event properties in development
  if (isDevelopment || isLocal) {
    validateEventProperties(eventName, properties);
  }

  // Add common properties
  const enhancedProperties = {
    ...properties,
    environment: getCurrentEnvironment(),
    app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
    timestamp: new Date().toISOString(),
    session_id: amplitude.getSessionId(),
  };

  // If not initialized, queue the event
  if (!isInitialized) {
    if (initializationError) {
      console.warn(`📊 Amplitude not initialized (${initializationError.message}), discarding event:`, eventName);
      return;
    }
    eventQueue.push({ eventName, properties: enhancedProperties });
    console.log(`📊 Queued event (Amplitude not yet initialized):`, eventName);
    return;
  }

  // Track the event
  amplitude.track(eventName, enhancedProperties);
  
  // Log events in development and local
  if (isDevelopment || isLocal) {
    console.log(`📊 Amplitude Event [${getCurrentEnvironment()}]:`, eventName, enhancedProperties);
  }
}

// Legacy event tracking function (for backward compatibility)
export const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
  console.warn(`⚠️ Using legacy trackEvent function. Please use trackAmplitudeEvent for type safety.`);
  trackAmplitudeEvent(eventName as AmplitudeEventName, eventProperties || {});
};

// User identification with enhanced properties
export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  if (!isInitialized) {
    console.warn('📊 Amplitude not initialized, cannot identify user');
    return;
  }

  amplitude.setUserId(userId);
  
  if (userProperties) {
    // Create identify event with user properties
    const identifyEvent = new amplitude.Identify();
    
    // Set user properties
    Object.entries(userProperties).forEach(([key, value]) => {
      identifyEvent.set(key, value);
    });
    
    // Add computed properties
    identifyEvent.set('environment', getCurrentEnvironment());
    identifyEvent.setOnce('first_seen_date', new Date().toISOString());
    
    amplitude.identify(identifyEvent);
  }

  if (isDevelopment || isLocal) {
    console.log(`👤 Amplitude User Identified [${getCurrentEnvironment()}]:`, userId, userProperties);
  }
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (!isInitialized) {
    console.warn('📊 Amplitude not initialized, cannot set user properties');
    return;
  }

  const identifyEvent = new amplitude.Identify();
  Object.entries(properties).forEach(([key, value]) => {
    identifyEvent.set(key, value);
  });
  amplitude.identify(identifyEvent);

  if (isDevelopment || isLocal) {
    console.log(`👤 Amplitude User Properties Set [${getCurrentEnvironment()}]:`, properties);
  }
};

// Increment user property
export const incrementUserProperty = (propertyName: string, incrementBy: number = 1) => {
  if (!isInitialized) {
    console.warn('📊 Amplitude not initialized, cannot increment user property');
    return;
  }

  const identifyEvent = new amplitude.Identify();
  identifyEvent.add(propertyName, incrementBy);
  amplitude.identify(identifyEvent);

  if (isDevelopment || isLocal) {
    console.log(`👤 Amplitude User Property Incremented [${getCurrentEnvironment()}]:`, propertyName, `+${incrementBy}`);
  }
};

// Reset user (for logout)
export const resetUser = () => {
  if (!isInitialized) {
    console.warn('📊 Amplitude not initialized, cannot reset user');
    return;
  }

  amplitude.reset();
  
  if (isDevelopment || isLocal) {
    console.log(`🔄 Amplitude User Reset [${getCurrentEnvironment()}]`);
  }
};

// Track revenue (for subscription events)
export const trackRevenue = (amount: number, productId: string, properties?: Record<string, any>) => {
  if (!isInitialized) {
    console.warn('📊 Amplitude not initialized, cannot track revenue');
    return;
  }

  const revenue = new amplitude.Revenue()
    .setProductId(productId)
    .setPrice(amount);

  if (properties) {
    Object.entries(properties).forEach(([key, value]) => {
      revenue.setEventProperties({ [key]: value });
    });
  }

  amplitude.revenue(revenue);

  if (isDevelopment || isLocal) {
    console.log(`💰 Amplitude Revenue Tracked [${getCurrentEnvironment()}]:`, amount, productId, properties);
  }
};

// Specific event helper functions with type safety
export const amplitudeEvents = {
  // Authentication events
  userLoginInitiated: () => {
    trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_LOGIN_INITIATED, {
      login_method: 'microsoft',
      page: 'login',
    });
  },

  userLoginSuccess: (userId: string, isNewUser: boolean, userRole?: string, loginDuration?: number) => {
    trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_LOGIN_SUCCESS, {
      login_method: 'microsoft',
      user_id: userId,
      is_new_user: isNewUser,
      login_duration_ms: loginDuration,
      user_role: userRole,
    });
  },

  userLoginFailed: (errorCode: string, errorMessage: string, retryAttempt: number = 1) => {
    trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_LOGIN_FAILED, {
      login_method: 'microsoft',
      error_code: errorCode,
      error_message: errorMessage,
      retry_attempt: retryAttempt,
    });
  },

  userLogout: (reason: 'manual' | 'session_expired' | 'forced' = 'manual') => {
    trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_LOGOUT, {
      logout_reason: reason,
    });
  },

  // Page navigation events
  pageViewed: (pagePath: string, additionalProperties?: Record<string, any>) => {
    const pageName = getPageNameFromPath(pagePath);
    trackAmplitudeEvent(AMPLITUDE_EVENTS.PAGE_VIEWED, {
      page_name: pageName,
      page_path: pagePath,
      referrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
      ...additionalProperties,
    });
  },

  // Document events
  documentCreated: (
    documentId: string, 
    documentName: string,
    documentType: string,
    documentCategory: string,
    creationMethod: 'upload' | 'template' | 'blank' | 'practice',
    fileSizeMb?: number
  ) => {
    trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_CREATED, {
      document_id: documentId,
      document_name: documentName,
      document_type: documentType,
      document_category: documentCategory,
      creation_method: creationMethod,
      file_size_mb: fileSizeMb,
    });
  },

  documentOpened: (
    documentId: string,
    documentName: string,
    documentStage: string,
    openSource: string,
    isFavorite: boolean = false
  ) => {
    trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_OPENED, {
      document_id: documentId,
      document_name: documentName,
      document_stage: documentStage as any,
      open_source: openSource,
      is_favorite: isFavorite,
    });
  },

  // Error tracking
  errorOccurred: (
    errorType: string,
    errorCode: string,
    errorMessage: string,
    errorSource: string,
    pageName: string,
    actionAttempted: string
  ) => {
    trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
      error_type: errorType,
      error_code: errorCode,
      error_message: errorMessage,
      error_source: errorSource,
      page_name: pageName,
      action_attempted: actionAttempted,
    });
  },

  // Search events
  searchPerformed: (
    searchQuery: string,
    searchType: 'documents' | 'users' | 'in_document',
    resultsCount: number,
    pageName: string
  ) => {
    trackAmplitudeEvent(AMPLITUDE_EVENTS.SEARCH_PERFORMED, {
      search_query: searchQuery,
      search_type: searchType,
      results_count: resultsCount,
      page_name: pageName,
    });
  },
};

// Export the amplitude instance for advanced usage
export { amplitude };

// Export types
export type { AmplitudeEventName, EventProperties } from './events';