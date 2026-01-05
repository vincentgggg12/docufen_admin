import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useActivityMonitor } from '@/hooks/useActivityMonitor';
import { cn } from '@/lib/utils';
import { userPing } from '@/lib/apiUtils';
import { useUserStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';

export const InactivityWarningModal: React.FC = () => {
  const { logout } = useUserStore(useShallow((state) => ({
    logout: state.logout,
  })));
  
  const { t } = useTranslation();
  const { 
    showWarning, 
    setShowWarning, 
    formatRemainingTime, 
    reset,
    activate,
    remainingTime 
  } = useActivityMonitor();
  const handleStayLoggedIn = () => {
    activate(); // This forces the timer to recognize user activity
    reset();    // This resets the timer countdown
    setShowWarning(false);
    userPing().catch(() => {
      logout()
    })
  };

  const handleLogout = () => {
    setShowWarning(false);
    // The idle timer will handle the logout
  };

  // Calculate progress percentage (2 minutes = 120 seconds = 100%)
  const progressPercentage = Math.max(0, Math.min(100, (remainingTime / (1000 * 60 * 2)) * 100));

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md" data-testid="inactivityWarningModal.dialog">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle className="text-lg" data-testid="inactivityWarningModal.title">
              {t('inactivity.warningTitle')}
            </DialogTitle>
          </div>
          <DialogDescription className="mt-3 text-sm text-muted-foreground" data-testid="inactivityWarningModal.description">
            {t('inactivity.warningDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          {/* Time remaining display */}
          <div className="flex items-center justify-center gap-2 text-lg font-medium">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span 
              className={cn(
                "transition-colors",
                remainingTime < 30000 && "text-red-600"
              )}
              data-testid="inactivityWarningModal.remainingTime"
            >
              {formatRemainingTime()}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-linear",
                remainingTime > 60000 ? "bg-primary" :
                remainingTime > 30000 ? "bg-amber-600" : "bg-red-600"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="text-sm text-left text-muted-foreground">
            {t('inactivity.warningMessage')}
          </p>
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="inactivityWarningModal.logoutButton"
          >
            {t('inactivity.logOutNow')}
          </Button>
          <Button
            onClick={handleStayLoggedIn}
            data-testid="inactivityWarningModal.stayLoggedInButton"
          >
            {t('inactivity.stayLoggedIn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};