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
import { Clock, Users } from "lucide-react";

interface DocumentInUseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentInUseDialog({
  isOpen,
  onClose,
}: DocumentInUseDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onClose} data-testid="documentInUseDialog.dialog">
      <DialogContent 
        className="sm:max-w-md border-border shadow-lg"
        style={{ zIndex: 20000 }}
        data-testid="documentInUseDialog.content"
      >
        <DialogHeader className="space-y-2" data-testid="documentInUseDialog.header">
          <DialogTitle className="flex items-center gap-2 text-warning" data-testid="documentInUseDialog.title">
            <Users className="h-5 w-5" />
            {t("DocumentInUseDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground" data-testid="documentInUseDialog.description">
            {t("DocumentInUseDialog.message")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3" data-testid="documentInUseDialog.alertContainer">
          <Alert variant="warning" className="border border-warning/30 bg-warning/10" data-testid="documentInUseDialog.alert">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-warning" />
              <AlertTitle className="font-medium ml-2 text-foreground" data-testid="documentInUseDialog.alertTitle">{t("DocumentInUseDialog.documentLockedTitle")}</AlertTitle>
            </div>
            <AlertDescription className="text-sm mt-1 text-foreground" data-testid="documentInUseDialog.alertDescription">
              {t("DocumentInUseDialog.documentLockedDescription")}
            </AlertDescription>
          </Alert>
        </div>

        <p className="text-sm text-muted-foreground px-1" data-testid="documentInUseDialog.pleaseWaitText">
          {t("DocumentInUseDialog.pleaseWait")}
        </p>

        <DialogFooter className="sm:justify-end mt-2" data-testid="documentInUseDialog.footer">
          <Button 
            onClick={onClose} 
            variant="default"
            className="px-5"
            data-testid="documentInUseDialog.okButton"
          >
            {t("DocumentInUseDialog.okButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DocumentInUseDialog;