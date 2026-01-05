import { useIdleTimer } from 'react-idle-timer';
import { useUserStore, useModalStore } from '@/lib/stateManagement';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { userPing } from '@/lib/apiUtils';

const SESSION_TIMEOUT = 1000 * 60 * 14; // 14 minutes
const WARNING_BEFORE_IDLE = 1000 * 60 * 2; // 2 minutes warning
const SERVER_PING_INTERVAL = 1000 * 60 * 1.6; // Reset server session every 5 minutes

export const useActivityMonitor = () => {
  const { user, logout, userType } = useUserStore();
  const { setDocumentStatus } = useModalStore();
  const { t } = useTranslation();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(SESSION_TIMEOUT);
  const lastServerPing = React.useRef(Date.now());

  // Add a throttled server reset function
  const resetServerSession = useCallback(() => {
    const now = Date.now();
    if (now - lastServerPing.current >= SERVER_PING_INTERVAL) {
      console.log('Resetting server session');
      // Make your API call here
      if (!userType) {
        console.log("Would have logged you out, but user is not logged in");
        return
      }
      userPing().then((res) => {
        if (!res.statusOK) logout()
      })
      .catch(() => {
        logout()
      });
      lastServerPing.current = now;
    }
  }, [userType]);
  const handleOnIdle = useCallback(() => {
    setShowWarning(false);
    setDocumentStatus(null);
    logout();
  }, [logout, setDocumentStatus]);

  const handleOnAction = useCallback(() => {
    if (!showWarning) {
      reset()
      const tr = getRemainingTime()
      setRemainingTime(tr);
    }
    // Call the throttled server reset when user is active
    resetServerSession();
  }, [showWarning, resetServerSession, setDocumentStatus]);

  const handleOnPrompt = useCallback(() => {
    console.log('Warning user about upcoming logout');
    setShowWarning(true);
  }, [setShowWarning]);

  const {
    getRemainingTime,
    getElapsedTime,
    getLastIdleTime,
    isPrompted,
    isIdle,
    isLeader,
    reset,
    pause,
    resume,
    activate,
    start,
    getActiveTime,
    getTotalActiveTime,
  } = useIdleTimer({
    timeout: SESSION_TIMEOUT,
    promptBeforeIdle: WARNING_BEFORE_IDLE,
    onIdle: handleOnIdle,
    onAction: handleOnAction,
    onPrompt: handleOnPrompt,
    debounce: 1000, // Only use debounce, not throttle
    crossTab: true,
    syncTimers: 200,
    leaderElection: true,
    startOnMount: false, // We'll start manually when user logs in
    startManually: true,
    stopOnIdle: false,
    eventsThrottle: 200,
    events: [
      'mousemove',
      'keydown',
      'wheel',
      'DOMMouseScroll',
      'mousewheel',
      'mousedown',
      'touchstart',
      'touchmove',
      'MSPointerDown',
      'MSPointerMove',
      'visibilitychange',
      'focus'
    ],
  });

  // Update remaining time every second when prompted
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPrompted() && showWarning) {
      interval = setInterval(() => {
        const time = getRemainingTime();
        setRemainingTime(time);
        
        // If time is up, clear the interval
        if (time <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPrompted, getRemainingTime, showWarning]);

  // Start the timer when user logs in
  useEffect(() => {
    if (user) {
      start();
    } else {
      pause();
    }
  }, [user, start, pause]);

  // Format remaining time for display
  const formatRemainingTime = useCallback(() => {
    const seconds = Math.floor(remainingTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `0:${remainingSeconds.toString().padStart(2, '0')}`;
  }, [remainingTime, t]);

  return {
    // State
    showWarning,
    remainingTime,
    isPrompted: isPrompted(),
    isIdle: isIdle(),
    isLeader: isLeader(),
    
    // Actions
    reset, // Reset the timer (equivalent to your resetTimer)
    pause,
    resume,
    activate,
    
    // Getters
    getRemainingTime,
    getElapsedTime,
    getLastIdleTime,
    getActiveTime,
    getTotalActiveTime,
    formatRemainingTime,
    
    // UI helpers
    setShowWarning,
  };
};