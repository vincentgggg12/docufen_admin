"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";

// Utility function to replace cn from @/lib/utils
const cn = (...classes: (string | boolean | undefined | null)[]) => {
  return classes.filter(Boolean).join(" ");
};

interface AccountCreationStepProps {
  onFinish: () => void;
  onBack: () => void;
}

export default function AccountCreationStep({
  onFinish,
  onBack,
}: AccountCreationStepProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState({
    tenantAccount: { done: false, inProgress: true },
    microsoftCosmosDB: { done: false, inProgress: false },
    azureBlobStorage: { done: false, inProgress: false },
  });
  const provisioningStartTimeRef = useRef(Date.now());
  const hasTrackedStartRef = useRef(false);

  useEffect(() => {
    // Track tenant provisioning started
    if (!hasTrackedStartRef.current) {
      hasTrackedStartRef.current = true;
      trackAmplitudeEvent(AMPLITUDE_EVENTS.TENANT_PROVISIONING_STARTED, {});
    }
    
    // Simulate creating tenant account
    const tenantTimer = setTimeout(() => {
      setProgress(prev => ({
        ...prev,
        tenantAccount: { done: true, inProgress: false },
        microsoftCosmosDB: { done: false, inProgress: true },
      }));
      
      // Simulate setting up Microsoft Cosmos DB
      const cosmosTimer = setTimeout(() => {
        setProgress(prev => ({
          ...prev,
          microsoftCosmosDB: { done: true, inProgress: false },
          azureBlobStorage: { done: false, inProgress: true },
        }));
        
        // Simulate creating Azure Blob Storage
        const blobTimer = setTimeout(() => {
          setProgress(prev => ({
            ...prev,
            azureBlobStorage: { done: true, inProgress: false },
          }));
          
          // Track tenant provisioning completed
          const provisioningDuration = Date.now() - provisioningStartTimeRef.current;
          trackAmplitudeEvent(AMPLITUDE_EVENTS.TENANT_PROVISIONING_COMPLETED, {
            provisioning_duration_ms: provisioningDuration
          });
          
          // Auto-redirect after all steps are complete (with a short delay)
          const redirectTimer = setTimeout(() => {
            onFinish();
          }, 1500);
          
          return () => clearTimeout(redirectTimer);
        }, 2000);
        
        return () => clearTimeout(blobTimer);
      }, 2000);
      
      return () => clearTimeout(cosmosTimer);
    }, 2000);
    
    return () => clearTimeout(tenantTimer);
  }, [onFinish]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">{t("setupWizard.settingUpAccount")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="w-full space-y-4">
          <StepItem 
            label={t("setupWizard.creatingTenantAccount")}
            isDone={progress.tenantAccount.done}
            isInProgress={progress.tenantAccount.inProgress}
          />
          
          <StepItem 
            label={t("setupWizard.settingUpDatabase")}
            isDone={progress.microsoftCosmosDB.done}
            isInProgress={progress.microsoftCosmosDB.inProgress}
          />
          
          <StepItem 
            label={t("setupWizard.creatingStorage")}
            isDone={progress.azureBlobStorage.done}
            isInProgress={progress.azureBlobStorage.inProgress}
          />
        </div>
        
        <p className="text-sm text-gray-600 text-center">
          {t("setupWizard.pleaseWait")}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={!progress.azureBlobStorage.done} data-testid="setupPage.backButton">
          {t("setupWizard.back")}
        </Button>
        <Button onClick={onFinish} disabled={!progress.azureBlobStorage.done} data-testid="setupPage.finalFinishButton">
          {t("setupWizard.finish")}
        </Button>
      </CardFooter>
    </Card>
  );
}

function StepItem({ label, isDone, isInProgress }: { label: string; isDone: boolean; isInProgress: boolean }) {
  return (
    <div className="flex items-center space-x-4">
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full mr-3 transition-colors border border-input bg-background",
        isDone ? "text-[rgb(22,22,22)]" : 
        isInProgress ? "text-[rgb(22,22,22)]" : 
        ""
      )}>
        {isDone ? (
          <Check className="h-4 w-4" />
        ) : isInProgress ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
      </div>
      <span className="flex-1">{label}</span>
    </div>
  );
} 