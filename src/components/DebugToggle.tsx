import React from 'react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';

export const DebugToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const [isDebug, setIsDebug] = React.useState(
    i18n.language === 'sw' || localStorage.getItem('i18nextDebugMode') === 'true'
  );
  
  const toggleDebug = () => {
    const newState = !isDebug;
    setIsDebug(newState);
    
    if (newState) {
      // Enable debug mode
      localStorage.setItem('i18nextDebugMode', 'true');
      i18n.changeLanguage('sw');
      
      // Update URL to include lng=sw parameter
      const url = new URL(window.location.href);
      url.searchParams.set('lng', 'sw');
      window.history.replaceState({}, '', url.toString());
    } else {
      // Disable debug mode
      localStorage.removeItem('i18nextDebugMode');
      i18n.changeLanguage('en');
      
      // Remove lng parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('lng');
      window.history.replaceState({}, '', url.toString());
    }
  };
  
  // Always hide the debug button
  return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999]">
      <Button 
        onClick={toggleDebug} 
        variant={isDebug ? "destructive" : "default"}
        size="sm"
        className={isDebug ? "bg-red-500 text-white" : "bg-yellow-400 text-black hover:bg-yellow-500 hover:text-black"}
      >
        {isDebug ? 'Exit Debug Mode' : 'Debug i18n Keys'}
      </Button>
    </div>
  );
}; 