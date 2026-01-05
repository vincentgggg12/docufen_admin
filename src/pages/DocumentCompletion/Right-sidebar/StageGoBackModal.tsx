import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { Stage } from "@/components/editor/lib/lifecycle";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";
import { useDocumentStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import { MINIMUM_REASON_LENGTH } from "@/components/editor/lib/constants";

interface StageGoBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  currentStage: number;
  previousStage: number;
  isLoading?: boolean;
}

export function StageGoBackModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentStage,
  previousStage,
  isLoading = false
}: StageGoBackModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  
  const { documentId, documentName } = useDocumentStore(
    useShallow((state) => ({
      documentId: state.documentId,
      documentName: state.documentName
    }))
  );

  const handleConfirm = async () => {
    if (reason.trim().length < MINIMUM_REASON_LENGTH) {
      setError(t("errors.reasonRequired"));
      return;
    }
    
    try {
      // Track stage reversion initiated
      trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_STAGE_REVERTED, {
        document_id: documentId,
        document_name: documentName || 'Unknown',
        from_stage: currentStage,
        to_stage: previousStage,
        reason: reason,
        reason_length: reason.length
      });

      await onConfirm(reason);
      // Reset form after successful submission
      setReason("");
      setError("");
    } catch (err) {
      console.error("Error going back to previous stage:", err);
      setError(typeof err === 'string' ? err : t("errors.somethingWentWrong"));
      
      // Track stage reversion error
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
        error_type: 'stage_reversion_failed',
        error_code: 'STAGE_REVERT_ERROR',
        error_message: typeof err === 'string' ? err : 'Stage reversion failed',
        error_source: 'StageGoBackModal',
        page_name: 'Document Editor',
        action_attempted: 'revert_stage'
      });
    }
  };
  
  const handleClose = () => {
    // Track modal dismissed
    if (reason.trim().length > 3) {
      trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
        button_name: 'stage_revert_cancel_with_reason',
        button_location: 'stage_go_back_modal',
        page_name: 'Document Editor'
      });
    }
    
    // Reset form when dialog closes
    setReason("");
    setError("");
    onClose();
  };
  
  // Get stage names for display
  const getCurrentStageName = () => {
    switch (currentStage) {
      case Stage.PreApprove:
        return t('documents.preApproval');
      case Stage.Execute:
        return t('documents.execution');
      case Stage.PostApprove:
        return t('documents.postApproval');
      case Stage.Closed:
        return t('documents.completed');
      case Stage.Finalised:
        return t('documents.finalised');
      default:
        return t('documents.unknown');
    }
  };

  const getPreviousStageName = () => {
    switch (previousStage) {
      case Stage.PreApprove:
        return t('documents.preApproval');
      case Stage.Execute:
        return t('documents.execution');
      case Stage.PostApprove:
        return t('documents.postApproval');
      case Stage.Closed:
        return t('documents.completed');
      case Stage.Finalised:
        return t('documents.finalised');
      default:
        return t('documents.unknown');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} data-testid="stageGoBackModal.dialog">
      <DialogContent className="sm:max-w-[500px]" data-testid="stageGoBackModal.content">
        <DialogHeader data-testid="stageGoBackModal.header">
          <DialogTitle className="flex items-center gap-2" data-testid="stageGoBackModal.title">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t("stageGoBack.confirmStageReversal")}
          </DialogTitle>
          <DialogDescription data-testid="stageGoBackModal.description">
            {t("stageGoBack.confirmationMessage", {
              from: getCurrentStageName(),
              to: getPreviousStageName()
            })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4" data-testid="stageGoBackModal.body">
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md" data-testid="stageGoBackModal.stageTransition">
            <ChevronLeft className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              {getCurrentStageName()} → {getPreviousStageName()}
            </span>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="stage-back-reason" className="text-sm font-medium" data-testid="stageGoBackModal.reasonLabel">
              {t("stageGoBack.reasonLabel")} <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="stage-back-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) {
                  setError("");
                }
              }}
              placeholder={t("stageGoBack.reasonPlaceholder")}
              className={error ? "border-red-500" : ""}
              rows={4}
              autoFocus
              data-testid="stageGoBackModal.reasonTextarea"
            />
            {error && (
              <p className="text-sm text-red-500" data-testid="stageGoBackModal.errorMessage">{error}</p>
            )}
          </div>
          
          <div className="text-sm text-gray-500" data-testid="stageGoBackModal.auditNotice">
            <p>{t("stageGoBack.auditLogNotice")}</p>
          </div>
        </div>
        
        <DialogFooter className="gap-2" data-testid="stageGoBackModal.footer">
          <Button 
            variant="outline" 
            onClick={() => {
              trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                button_name: 'stage_revert_cancel',
                button_location: 'stage_go_back_modal_footer',
                page_name: 'Document Editor'
              });
              handleClose();
            }} 
            disabled={isLoading} 
            data-testid="stageGoBackModal.cancelButton"
          >
            {t("actions.cancel")}
          </Button>
          <Button 
            variant="default" 
            onClick={handleConfirm}
            disabled={reason.trim().length < MINIMUM_REASON_LENGTH || isLoading}
            data-testid="stageGoBackModal.confirmButton"
          >
            {isLoading ? (
              <>
                <ChevronLeft className="h-4 w-4 mr-2 animate-pulse" />
                {t("stageGoBack.processing")}
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t("stageGoBack.confirmGoBack")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
