import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { CompanyInfo } from "@/lib/apiUtils";
import { Upload, X, Info } from "lucide-react";
import { useUserStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import { companyNameRegExp } from "@/lib/constants";

interface CompanyInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyInfoForm: CompanyInfo;
  setCompanyInfoForm: React.Dispatch<React.SetStateAction<CompanyInfo>>;
  onSave: (companyInfo: CompanyInfo) => void;
  working: boolean
  t: (key: string) => string;
}

export function CompanyInfoModal({
  open,
  onOpenChange,
  companyInfoForm,
  setCompanyInfoForm,
  onSave,
  working,
  t,
}: CompanyInfoModalProps) {
  const [previewLogo, setPreviewLogo] = useState<string | null>(companyInfoForm.logo || null);
  const [errors, setErrors] = React.useState<Partial<CompanyInfo>>({});
  const [invalid, setInvalid] = React.useState(false);
  const { setUserCompanyLogo } = useUserStore(useShallow((state) => ({
    setUserCompanyLogo: state.setUserCompanyLogo,
  })));

  React.useEffect(() => {
    setPreviewLogo(companyInfoForm.logo || null);
  }, [companyInfoForm.logo])

  const handleLogoUpload = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert(t("account.logoSizeLimit"));
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
      alert(t("account.logoTypeLimit"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setPreviewLogo(base64String);
      setCompanyInfoForm(prevForm => {
        const newForm = { ...prevForm, logo: base64String };
        return newForm;
      });
      setUserCompanyLogo(base64String)
    };
    reader.readAsDataURL(file);
  }, [t, setCompanyInfoForm, setUserCompanyLogo, setPreviewLogo]);

  const removeLogo = () => {
    // setPreviewLogo(null);
    setCompanyInfoForm(prevForm => ({ ...prevForm, logo: null }));
    setUserCompanyLogo(null)
  };
  React.useEffect(() => {
    const tmpErrors = { ...errors }
    if (companyInfoForm.companyName.length === 0) {
      tmpErrors.companyName = t("validation.companyNameRequired");
    } else {
      delete tmpErrors.companyName;
    }
    if (companyInfoForm.companyAddress.length === 0) {
      tmpErrors.companyAddress = t("validation.companyAddressRequired");
    } else {
      delete tmpErrors.companyAddress;
    }
    if (companyInfoForm.companyCity.length === 0) {
      tmpErrors.companyCity = t("validation.companyCityRequired");
    } else {
      delete tmpErrors.companyCity;
    }
    if (companyInfoForm.companyState.length === 0) {
      tmpErrors.companyState = t("validation.companyStateRequired");
    } else {
      delete tmpErrors.companyState;
    }
    if (companyInfoForm.companyPostCode.length === 0) {
      tmpErrors.companyPostCode = t("validation.postCodeRequired");
    } else {
      delete tmpErrors.companyPostCode
    }
    if (companyInfoForm.companyCountry.length === 0) {
      tmpErrors.companyCountry = t("validation.countryRequired");
    } else {
      delete tmpErrors.companyCountry;
    }
    if (companyInfoForm.businessRegistrationNumber.length === 0) {
      tmpErrors.businessRegistrationNumber = t("validation.businessRegRequired");
    } else {
      delete tmpErrors.businessRegistrationNumber;
    }
    setErrors(tmpErrors);
    setInvalid(Object.keys(tmpErrors).length > 0);
  }, [companyInfoForm, t]);

  const callOnSave = React.useCallback(() => {
    const updatedForm = {
      ...companyInfoForm,
      logo: previewLogo || null
    };
    console.log("Sending form data: " + JSON.stringify(updatedForm));
    onSave(updatedForm);
    onOpenChange(false);
  }, [companyInfoForm, onSave, onOpenChange, previewLogo]);

  const safeUpdateCompanyInfo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const sanitisedValue = value.replace(companyNameRegExp, "");
    setCompanyInfoForm((prevForm) => ({
      ...prevForm,
      [id]: sanitisedValue,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t("account.updateCompanyDetails")}</DialogTitle>
          <DialogDescription>
            {t("account.updateCompanyInfoDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="companyName">{t("account.companyName")}</Label>
            <Input
              id="companyName"
              data-testid="accountPage.companyNameInput"
              value={companyInfoForm.companyName}
              onChange={safeUpdateCompanyInfo}
            />
            {errors.companyName && (
              <p className="text-sm text-red-500">{errors.companyName}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="companyAddress">{t("account.companyAddress")}</Label>
            <textarea
              id="companyAddress"
              data-testid="accountPage.companyAddressTextarea"
              className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={companyInfoForm.companyAddress}
              onChange={(e) => setCompanyInfoForm({ ...companyInfoForm, companyAddress: e.target.value })}
              rows={3}
              placeholder={t("account.companyAddressPlaceholder")}
            />
            {errors.companyAddress && (
              <p className="text-sm text-red-500">{errors.companyAddress}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="companyCity">{t("account.companyCity")}</Label>
              <Input
                id="companyCity"
                data-testid="accountPage.companyCityInput"
                value={companyInfoForm.companyCity}
                onChange={(e) => setCompanyInfoForm({ ...companyInfoForm, companyCity: e.target.value })}
              />
              {errors.companyCity && (
                <p className="text-sm text-red-500">{errors.companyCity}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="companyState">{t("account.companyState")}</Label>
              <Input
                id="companyState"
                data-testid="accountPage.companyStateInput"
                value={companyInfoForm.companyState}
                onChange={(e) => setCompanyInfoForm({ ...companyInfoForm, companyState: e.target.value })}
              />
              {errors.companyState && (
                <p className="text-sm text-red-500">{errors.companyState}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="companyPostCode">{t("account.companyPostCode")}</Label>
              <Input
                id="companyPostCode"
                data-testid="accountPage.companyPostCodeInput"
                value={companyInfoForm.companyPostCode}
                onChange={(e) => setCompanyInfoForm({ ...companyInfoForm, companyPostCode: e.target.value })}
              />
              {errors.companyPostCode && (
                <p className="text-sm text-red-500">{errors.companyPostCode}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="companyCountry">{t("account.companyCountry")}</Label>
              <Input
                id="companyCountry"
                data-testid="accountPage.companyCountryInput"
                value={companyInfoForm.companyCountry}
                onChange={(e) => setCompanyInfoForm({ ...companyInfoForm, companyCountry: e.target.value })}
              />
              {errors.companyCountry && (
                <p className="text-sm text-red-500">{errors.companyCountry}</p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="businessRegistrationNumber">{t("account.businessRegistrationNumber")}</Label>
            <Input
              id="businessRegistrationNumber"
              data-testid="accountPage.businessRegistrationInput"
              value={companyInfoForm.businessRegistrationNumber}
              onChange={(e) => setCompanyInfoForm({ ...companyInfoForm, businessRegistrationNumber: e.target.value })}
            />
            {errors.businessRegistrationNumber && (
              <p className="text-sm text-red-500">{errors.businessRegistrationNumber}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="language">{t("account.language")}</Label>
              <Select
                value={companyInfoForm.locale[0]}
                onValueChange={(value) => setCompanyInfoForm({ ...companyInfoForm, locale: [value] })}
                data-testid="accountPage.languageSelect"
              >
                <SelectTrigger id="language" data-testid="accountPage.languageSelectTrigger">
                  <SelectValue placeholder={t("account.selectLanguagePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("account.en")}</SelectItem>
                  <SelectItem value="es">{t("account.es")}</SelectItem>
                  <SelectItem value="zh">{t("account.zh")}</SelectItem>
                  <SelectItem value="pl">{t("account.pl")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="companyLogo" className="flex items-center gap-1">
                {t("account.companyLogo")}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 info-icon cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("account.logoHint")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="flex flex-col gap-2">
                {previewLogo ? (
                  <div className="relative max-w-32 max-h-32 border border-input rounded-md overflow-hidden flex items-center justify-center p-2">
                    <img 
                      src={previewLogo} 
                      alt={t('account.companyLogo')} 
                      data-testid="accountPage.logoPreview"
                      className="max-w-full max-h-28 w-auto h-auto object-scale-down"
                    />
                    <button 
                      type="button"
                      onClick={removeLogo}
                      data-testid="accountPage.removeLogoButton"
                      className="absolute top-1 right-1 bg-background rounded-full p-1 shadow-sm hover:bg-muted"
                      aria-label={t('account.removeLogo')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <label 
                      htmlFor="logo-upload" 
                      data-testid="accountPage.uploadLogoLabel"
                      className="flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t("account.uploadLogo")}
                    </label>
                    <input
                      id="logo-upload"
                      data-testid="accountPage.logoUploadInput"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} data-testid="accountPage.cancelButton">
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={callOnSave} disabled={working||invalid} data-testid="accountPage.saveChangesButton"> 
            {t("common.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}