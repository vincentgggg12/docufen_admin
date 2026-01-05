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
import { AlertTriangle } from "lucide-react";
import { MINIMUM_REASON_LENGTH } from "@/components/editor/lib/constants";

interface VoidDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  documentStage: number;
  isLoading?: boolean;
}

export function VoidDocumentDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  documentStage,
  isLoading = false
}: VoidDocumentDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  
  const handleConfirm = async () => {
    if (reason.trim().length < MINIMUM_REASON_LENGTH) {
      setError(t("errors.reasonRequired"));
      return;
    }
    
    try {
      await onConfirm(reason);
      // Reset form after successful submission
      setReason("");
      setError("");
    } catch (err) {
      console.error("Error voiding document:", err);
      setError(typeof err === 'string' ? err : t("errors.voidFailed"));
    }
  };
  
  const handleClose = () => {
    // Reset form when dialog closes
    setReason("");
    setError("");
    onClose();
  };
  
  const stageName = t(`document.${documentStage}`) || (t('current'));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} data-testid="voidDocumentDialog.dialog">
      <DialogContent className="sm:max-w-[425px]" data-testid="voidDocumentDialog.content">
        <DialogHeader data-testid="voidDocumentDialog.header">
          <DialogTitle className="flex items-center gap-2" data-testid="voidDocumentDialog.title">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t("actions.voidDocument")}
          </DialogTitle>
          <DialogDescription data-testid="voidDocumentDialog.description">
            {t("confirmations.voidDocumentWarning")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4" data-testid="voidDocumentDialog.body">
          <div className="space-y-2">
            <label htmlFor="void-reason" className="text-sm font-medium" data-testid="voidDocumentDialog.reasonLabel">
              {t("fields.reasonForVoiding")}
            </label>
            <Textarea
              id="void-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) {
                  setError("");
                }
              }}
              placeholder={t("placeholders.enterVoidReason")}
              className={error ? "border-red-500" : ""}
              data-testid="voidDocumentDialog.reasonTextarea"
            />
            {error && (
              <p className="text-sm text-red-500" data-testid="voidDocumentDialog.errorMessage">{error}</p>
            )}
          </div>
          
          <div className="text-sm text-gray-500" data-testid="voidDocumentDialog.previewMessage">
            {t("info.voidMessagePreview", { from: stageName })}
          </div>
        </div>
        
        <DialogFooter data-testid="voidDocumentDialog.footer">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} data-testid="voidDocumentDialog.cancelButton">
            {t("actions.cancel")}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={reason.trim().length < MINIMUM_REASON_LENGTH || isLoading}
            data-testid="voidDocumentDialog.confirmButton"
          >
            {isLoading ? t("states.processing...") : t("actions.voidDocument")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 