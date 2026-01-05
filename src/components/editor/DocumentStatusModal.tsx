// src/components/DocumentStatusModal.tsx
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
  import { Lock, RefreshCw, Loader2, InfoIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDocumentStore } from "@/lib/stateManagement";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";
import { useShallow } from "zustand/shallow";
  
  type Status = "locked" | "updated" | "updating"
  ;
  
  interface DocumentStatusModalProps {
    isOpen: boolean;
    status: Status;
    onRefresh: () => Promise<void>;
    onClose: () => void;
  }
  
  export function DocumentStatusModal({
    isOpen,
    status,
    onRefresh,
    onClose,
  }: DocumentStatusModalProps) {
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [stillLocked, setStillLocked] = React.useState(false);
    const previousStatusRef = React.useRef<Status | null>(null);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);
    const { t } = useTranslation();
    const { documentId, documentName } = useDocumentStore(
      useShallow((state) => ({
        documentId: state.documentId,
        documentName: state.documentName
      }))
    );
    
    // Reset stillLocked when modal opens with a new status
    React.useEffect(() => {
      if (isOpen) {
        if (status !== "locked") {
          setStillLocked(false);
        }
        
        // Track modal opened
        trackAmplitudeEvent(AMPLITUDE_EVENTS.MODAL_OPENED, {
          modal_name: 'document_status',
          trigger_source: 'document_stale_check',
          page_name: 'Document Editor'
        });
      }
    }, [isOpen, status, documentId]);
    
    // Track status changes to detect if document is still locked after refresh
    React.useEffect(() => {
      if (isRefreshing) {
        // Store the current status when refresh starts
        previousStatusRef.current = status;
      } else if (previousStatusRef.current === "locked" && status === "locked") {
        // If we just finished refreshing and status is still locked
        setStillLocked(true);
        previousStatusRef.current = null;
      }
    }, [isRefreshing, status]);

    React.useEffect(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // if (status === "updating") {
      //   const modalStore = useModalStore.getState();
      //   timerRef.current = setTimeout(() => {
      //     console.error("simlating slow update")
      //     modalStore.setDocumentStatus("updated")
      //     useAppStore.getState().setWorking(false);
      //   }, 1000); // Simulate a 5-second update delay
      // }
    }, [status]);

    const iconMap = {
      locked: <Lock className="h-5 w-5 text-warning" />,
      updated: <RefreshCw className="h-5 w-5 text-accent" />,
      updating: <Loader2 className="h-5 w-5 animate-spin text-accent" />,
    };
  
    const messageMap = {
      locked: t('documentStatusModal.lockedText'),
      updated: t('documentStatusModal.updatedText'),
      updating: t('documentStatusModal.updatingText'),
    };
    
    // Handle refresh with loading state
    const handleRefresh = async () => {
      setIsRefreshing(true);
      
      // Track refresh attempt
      trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_REFRESHED, {
        document_id: documentId,
        document_name: documentName || 'Unknown',
        refresh_source: 'document_status_modal',
        document_status: status,
        is_locked: status === 'locked'
      });
      
      try {
        await onRefresh();
      } catch (error) {
        console.error("Error refreshing document:", error);
        
        // Track refresh error
        trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
          error_type: 'document_refresh_failed',
          error_code: 'REFRESH_ERROR',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_source: 'DocumentStatusModal',
          page_name: 'Document Editor',
          action_attempted: 'refresh_document'
        });
      } finally {
        setIsRefreshing(false);
      }
    };
  
    const primaryAction =
      status === "locked"
        ? { 
            label: isRefreshing ? t('documentStatusModal.refreshing') : t('documentStatusModal.refresh'), 
            action: handleRefresh,
            disabled: isRefreshing
          }
        : status === "updating" ? {
          label: "OK",
          action: () => {},
          disabled: true
        } : { 
            label: "OK", 
            action: () => {
              // Track modal dismissed
              trackAmplitudeEvent(AMPLITUDE_EVENTS.MODAL_CLOSED, {
                modal_name: 'document_status',
                close_method: 'button',
                time_open_ms: 0
              });
              onClose();
            },
            disabled: false 
          };
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose} data-testid="documentStatusModal.dialog">
        <DialogContent className="sm:max-w-md border-border shadow-lg" style={{ zIndex: 20000 }} data-testid="documentStatusModal.content">
          <DialogHeader className="space-y-2" data-testid="documentStatusModal.header">
            <DialogTitle className="flex items-center gap-2" data-testid="documentStatusModal.title">
              {iconMap[status]}
              {t('documentStatusModal.documentStatus')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground min-h-[60px]" data-testid="documentStatusModal.description">
              {messageMap[status]}
            </DialogDescription>
          </DialogHeader>
  
          {status === "locked" && (
            <div className="py-3" data-testid="documentStatusModal.lockedSection">
              <Alert variant="warning" className="border border-warning/30 bg-warning/10" data-testid="documentStatusModal.lockedAlert">
                <AlertTitle className="font-medium flex items-center gap-2" data-testid="documentStatusModal.lockedAlertTitle">
                  <Lock className="h-4 w-4 text-warning" />
                  {t('documentStatusModal.documentLocked')}
                </AlertTitle>
                <AlertDescription className="text-sm mt-1 text-foreground" data-testid="documentStatusModal.lockedAlertDescription">
                  {t('documentStatusModal.anotherUserIsCurrentlyMakingChanges')}
                </AlertDescription>
              </Alert>
              
              {stillLocked && (
                <div className="mt-3 text-sm flex items-center gap-2 text-warning-500" data-testid="documentStatusModal.stillLockedMessage">
                  <InfoIcon className="h-4 w-4 text-warning" />
                  <span>{t('documentStatusModal.documentIsStillLockedTheOtherUser')}</span>
                </div>
              )}
            </div>
          )}
  
          <DialogFooter className="sm:justify-end mt-2" data-testid="documentStatusModal.footer">
            <Button 
              onClick={primaryAction.action}
              variant="default" 
              className="px-5" 
              disabled={primaryAction.disabled}
              data-testid="documentStatusModal.primaryButton"
            >
              {isRefreshing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {primaryAction.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  export default DocumentStatusModal;