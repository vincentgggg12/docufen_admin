import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

// console.log("BASE_URL", import.meta.env.BASE_URL)

// Function to check if debug mode (Swahili) should be enabled
const isDebugModeEnabled = () => {
  if (typeof window === 'undefined') return false;
  
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('lng') && urlParams.get('lng') === 'sw') {
    // Store in localStorage to persist across navigation
    localStorage.setItem('i18nextDebugMode', 'true');
    return true;
  }
  
  // Then check localStorage
  return localStorage.getItem('i18nextDebugMode') === 'true';
};

// Determine the language to use
const getLanguage = () => {
  return isDebugModeEnabled() ? 'sw' : undefined;
};

// Listen for navigation events to keep lng=sw in URL when enabled
if (typeof window !== 'undefined') {
  // Handle page navigation to maintain lng=sw parameter
  const handleNavigation = () => {
    if (localStorage.getItem('i18nextDebugMode') === 'true') {
      // Only add parameter if it's not already present
      const url = new URL(window.location.href);
      if (!url.searchParams.has('lng') || url.searchParams.get('lng') !== 'sw') {
        url.searchParams.set('lng', 'sw');
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  // Set up listeners for navigation events
  window.addEventListener('popstate', handleNavigation);
  
  // Initialize for the current page
  if (localStorage.getItem('i18nextDebugMode') === 'true') {
    handleNavigation();
  }
}

// Create language detector that prioritizes debug mode
const languageDetector = new LanguageDetector();
languageDetector.init({
  order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
  lookupQuerystring: 'lng'
});

// Override detect method to prioritize debug mode
const originalDetect = languageDetector.detect.bind(languageDetector);
languageDetector.detect = () => {
  if (isDebugModeEnabled()) {
    return 'sw';
  }
  return originalDetect();
};

i18n
  // Use custom language detector
  .use(languageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  .use(Backend)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    fallbackLng: 'en',
    lng: getLanguage(), // Use sw if debug enabled, otherwise let language detector work
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      caches: [] // Disable caching to ensure debug mode is always honored
    },
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json`
    }
  })

export default i18n
