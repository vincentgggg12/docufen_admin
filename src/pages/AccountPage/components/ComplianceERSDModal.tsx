import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import React from "react";

// Get default ERSD text from translation
export const getDefaultERSDText = (t: any): string => {
  // Use the translated ersdDefaultText from the translations
  return t("account.compliance.ersdDefaultText");
};


interface ComplianceERSDModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ersdText: string;
  setErsdText: (text: string) => void;
  onSave: (newText: string) => void;
}

export function ComplianceERSDModal({
  open,
  onOpenChange,
  ersdText,
  setErsdText,
  onSave,
}: ComplianceERSDModalProps) {
  const { t } = useTranslation();
  const [tmpErsdText, setTmpErsdText] = React.useState<string>(ersdText);
  
  const handleSave = () => {
    console.log("New ersd: "+ tmpErsdText.slice(0,100))
    setErsdText(tmpErsdText)
    onSave(tmpErsdText);
    onOpenChange(false);
  };
  const cancelEdit = () => {
    setTmpErsdText(ersdText)
    onOpenChange(false)
  }

  React.useEffect(() => {
    setTmpErsdText(ersdText)
  }, [ersdText])

const safeUpdateErsdText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  // Remove the incorrect line and fix the function
  const newText = e.target.value;
  // Ensure the text does not exceed 10000 characters
  if (newText.length <= 10000) {
    setTmpErsdText(newText);
  }
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t("account.compliance.ersdModal.modalTitle")}</DialogTitle>
          <DialogDescription>
            {t("account.compliance.ersdModal.modalDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ersd-text">{t("account.compliance.ersdModal.disclosureTextLabel")}</Label>
            <Textarea
              id="ersd-text"
              value={tmpErsdText}
              onChange={safeUpdateErsdText}
              className="min-h-[200px]"
              placeholder={t("account.compliance.ersdModal.disclosureTextPlaceholder")}
              data-testid="accountPage.ersdModal.textarea"
            />
            <div className="text-xs text-muted-foreground text-right">
              {tmpErsdText.length} {t("account.compliance.ersdModal.characters")}
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            <Button variant="outline" onClick={() => cancelEdit()} className="mr-2" data-testid="accountPage.ersdModal.cancelButton">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} data-testid="accountPage.ersdModal.saveButton">{t("common.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
