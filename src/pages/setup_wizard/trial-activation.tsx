"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import React from "react";

interface TrialActivationStepProps {
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
}

export default function TrialActivationStep({
  onBack,
  onFinish,
}: TrialActivationStepProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleFinish = () => {
    setIsLoading(true);
    // Call the onFinish function and handle errors if needed
    try {
      onFinish();
      // Note: We don't reset loading here because we expect to navigate away
      // If needed, you could add a timeout to reset the loading state after a certain period
    } catch (error) {
      console.error("Error activating trial:", error);
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">{t("setupWizard.trialActivated")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <p className="text-center">
          {t("setupWizard.trialActivatedDesc")}
        </p>
        
        <div className="bg-gray-100 w-full p-6 rounded-md flex flex-col items-center">
          <div className="text-6xl font-bold text-primary">14</div>
          <p className="text-sm text-gray-600">{t("home.daysRemaining")}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isLoading} data-testid="setupPage.backButton">
          {t("setupWizard.back")}
        </Button>
        <Button onClick={handleFinish} disabled={isLoading} data-testid="setupPage.finishButton">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("setupWizard.pleaseWait")}
            </>
          ) : (
            t("setupWizard.finish")
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 