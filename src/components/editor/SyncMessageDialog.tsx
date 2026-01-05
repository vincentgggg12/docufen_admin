import { useTranslation } from "react-i18next";
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
import { RefreshCw, AlertTriangle } from "lucide-react";

interface SyncMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentName?: string;
}

export function SyncMessageDialog({
  isOpen,
  onClose,
}: SyncMessageDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onClose} data-testid="syncMessageDialog.dialog">
      <DialogContent 
        className="sm:max-w-md border-border shadow-lg"
        style={{ zIndex: 20000 }}
        data-testid="syncMessageDialog.content"
      >
        <DialogHeader className="space-y-2" data-testid="syncMessageDialog.header">
          <DialogTitle className="flex items-center gap-2 text-warning" data-testid="syncMessageDialog.title">
            <AlertTriangle className="h-5 w-5" />
            {t("SyncMessageDialog.documentUpdated")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground" data-testid="syncMessageDialog.description">
            {t("SyncMessageDialog.documentUpdatedDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3" data-testid="syncMessageDialog.alertContainer">
          <Alert variant="warning" className="border border-warning/30 bg-warning/10" data-testid="syncMessageDialog.alert">
            <div className="flex items-center">
              <RefreshCw className="h-4 w-4 text-warning" />
              <AlertTitle className="font-medium ml-2 text-foreground" data-testid="syncMessageDialog.alertTitle">{t("SyncMessageDialog.changesNotAppliedTitle")}</AlertTitle>
            </div>
            <AlertDescription className="text-sm mt-1 text-foreground" data-testid="syncMessageDialog.alertDescription">
            {t("SyncMessageDialog.changesNotAppliedDescription")}
            </AlertDescription>
          </Alert>
        </div>

        <p className="text-sm text-muted-foreground px-1" data-testid="syncMessageDialog.reviewText">
          {t("SyncMessageDialog.reviewAndRetry")}
        </p>

        <DialogFooter className="sm:justify-end mt-2" data-testid="syncMessageDialog.footer">
          <Button 
            onClick={onClose} 
            variant="default"
            className="px-5"
            data-testid="syncMessageDialog.gotItButton"
          >
            {t("SyncMessageDialog.gotItButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SyncMessageDialog;
