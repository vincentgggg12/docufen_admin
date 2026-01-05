"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { useTranslation } from "react-i18next";
import { CompanyInfo } from "@/lib/apiUtils";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";
import { companyNameRegExp } from "@/lib/constants";

interface AccountSetupProps {
  companyInfo: CompanyInfo;
  onUpdateCompanyInfo: (companyInfo: CompanyInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function AccountSetupStep({
  companyInfo,
  onUpdateCompanyInfo,
  onNext,
  onBack,
}: AccountSetupProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useTranslation();
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const sanitisedValue = e.target.value.replace(companyNameRegExp, "");
    onUpdateCompanyInfo({
      ...companyInfo,
      [field]: sanitisedValue,
    });
  };

  const handleLanguageChange = (value: string) => {
    onUpdateCompanyInfo({
      ...companyInfo,
      locale: [value],
    });
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!companyInfo.companyName) {
      newErrors.companyName = t("validation.companyNameRequired");
    }

    if (!companyInfo.companyAddress) {
      newErrors.companyAddress = t("validation.companyAddressRequired");
    }

    if (!companyInfo.companyCity) {
      newErrors.companyCity = t("validation.companyCityRequired");
    }

    if (!companyInfo.companyState) {
      newErrors.companyState = t("validation.stateRequired");
    }

    if (!companyInfo.companyPostCode) {
      newErrors.companyPostCode = t("validation.postCodeRequired");
    }

    if (!companyInfo.companyCountry) {
      newErrors.companyCountry = t("validation.countryRequired");
    }

    if (!companyInfo.businessRegistrationNumber) {
      newErrors.businessRegistrationNumber = t("validation.businessRegRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    } else {
      // Track form validation failure
      const errorFields = Object.keys(errors);
      trackAmplitudeEvent(AMPLITUDE_EVENTS.FORM_VALIDATION_FAILED, {
        form_name: 'account_setup',
        error_fields: errorFields,
        error_count: errorFields.length,
        page_name: 'Setup Wizard'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">{t("home.accountSetup")}</CardTitle>
        <CardDescription className="text-center">
          {t("home.enterCompanyInfo")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">{t("home.companyName")}</Label>
          <Input
            id="companyName"
            data-testid="setupPage.companyNameField"
            placeholder={t("placeholders.companyName")}
            value={companyInfo.companyName}
            onChange={(e) => handleInputChange(e, "companyName")}
          />
          {errors.companyName && (
            <p className="text-sm text-red-500">{errors.companyName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyAddress">{t("home.companyAddress")} *</Label>
          <Input
            id="companyAddress"
            data-testid="setupPage.companyAddressField"
            placeholder={t("placeholders.companyAddress")}
            value={companyInfo.companyAddress}
            onChange={(e) => handleInputChange(e, "companyAddress")}
          />
          {errors.companyAddress && (
            <p className="text-sm text-red-500">{errors.companyAddress}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyCity">{t("home.companyCity")} *</Label>
          <Input
            id="companyCity"
            data-testid="setupPage.companyCityField"
            placeholder={t("placeholders.companyCity")}
            value={companyInfo.companyCity}
            onChange={(e) => handleInputChange(e, "companyCity")}
          />
          {errors.companyCity && (
            <p className="text-sm text-red-500">{errors.companyCity}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyState">{t("home.companyState")} *</Label>
          <Input
            id="companyState"
            data-testid="setupPage.companyStateField"
            placeholder={t("placeholders.companyState")}
            value={companyInfo.companyState}
            onChange={(e) => handleInputChange(e, "companyState")}
          />
          {errors.companyState && (
            <p className="text-sm text-red-500">{errors.companyState}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyPostCode">{t("home.companyPostCode")} *</Label>
          <Input
            id="companyPostCode"
            data-testid="setupPage.companyPostCodeField"
            placeholder={t("placeholders.companyPostCode")}
            value={companyInfo.companyPostCode}
            onChange={(e) => handleInputChange(e, "companyPostCode")}
          />
          {errors.companyPostCode && (
            <p className="text-sm text-red-500">{errors.companyPostCode}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyCountry">{t("home.companyCountry")} *</Label>
          <Input
            id="companyCountry"
            data-testid="setupPage.companyCountryField"
            placeholder={t("placeholders.companyCountry")}
            value={companyInfo.companyCountry}
            onChange={(e) => handleInputChange(e, "companyCountry")}
          />
          {errors.companyCountry && (
            <p className="text-sm text-red-500">{errors.companyCountry}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessRegistrationNumber">{t("home.businessRegistration")} *</Label>
          <Input
            id="businessRegistrationNumber"
            data-testid="setupPage.businessRegistrationField"
            placeholder={t("placeholders.businessRegistration")}
            value={companyInfo.businessRegistrationNumber}
            onChange={(e) => handleInputChange(e, "businessRegistrationNumber")}
          />
          {errors.businessRegistrationNumber && (
            <p className="text-sm text-red-500">{errors.businessRegistrationNumber}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("common.language")}</Label>
          <Select value={companyInfo.locale[0]} onValueChange={handleLanguageChange} data-testid="setupPage.languageSelect">
            <SelectTrigger data-testid="setupPage.languageSelectTrigger">
              <SelectValue placeholder={t("common.select")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("account.en")}</SelectItem>
              <SelectItem value="es">{t("account.es")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} data-testid="setupPage.backButton">
          {t("common.back")}
        </Button>
        <Button 
          onClick={handleNext} 
          data-testid="setupPage.nextButton"
          disabled={!companyInfo.companyName || 
                  !companyInfo.companyAddress || 
                  !companyInfo.companyCity || 
                  !companyInfo.companyState || 
                  !companyInfo.companyPostCode || 
                  !companyInfo.companyCountry || 
                  !companyInfo.businessRegistrationNumber ||
                  !companyInfo.locale[0]}
        >
          {t("common.next")}
        </Button>
      </CardFooter>
    </Card>
  );
}