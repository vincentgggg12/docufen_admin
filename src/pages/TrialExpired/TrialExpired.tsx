import React, { useState } from "react"
import { SidebarLeft } from "../../components/left-sidebar/sidebar-left"
import { Separator } from "../../components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "../../components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { AlertTriangle, CreditCard } from "lucide-react"
import DocufenIcon from "@/assets/docufen_icon_v4.svg"
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SERVERURL } from "@/lib/server";
import { useAppStore, useAccountStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events"

// Microsoft icon component with the official colors
const MicrosoftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 21 21"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

export default function TrialExpired() {
  const { t } = useTranslation();
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const { sidebarOpen, setSidebarOpen } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })))
  const { trialDaysRemaining } = useAccountStore(useShallow((state) => ({
    trialDaysRemaining: state.trialDaysRemaining
  })));

  React.useEffect(() => {
    document.title = t('TrialExpired.pageTitle');
    
    // Track trial expired access
    // Since trial is 14 days and we're on the expired page, days expired would be negative of remaining days
    const daysExpired = Math.abs(trialDaysRemaining);
    trackAmplitudeEvent(AMPLITUDE_EVENTS.TRIAL_EXPIRED_ACCESS, {
      days_expired: daysExpired,
      trial_duration_days: 14 // Standard trial duration
    });
  }, [t, trialDaysRemaining]);

  // Check for Stripe success/cancel on mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSessionId = urlParams.get('stripe_session');
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success && stripeSessionId) {
      // Handle successful return from Stripe
      const completeStripeSetup = async () => {
        try {
          const response = await fetch(`${SERVERURL}stripe-admin/checkout-success`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId: stripeSessionId })
          });

          if (response.ok) {
            // Track license activation success
            trackAmplitudeEvent(AMPLITUDE_EVENTS.LICENSE_ACTIVATION_REDIRECT, {
              redirect_type: 'success',
              activation_method: 'stripe'
            });
            
            toast.success(t('account.stripeActivationSuccess'));
            // Clean up URL
            window.history.replaceState({}, '', '/trial-expired');
            // Refresh to update license status
            window.location.reload();
          } else {
            throw new Error('Failed to complete setup');
          }
        } catch (error) {
          console.error('Error completing Stripe setup:', error);
          toast.error(t('account.stripeSetupError'));
        }
      };

      completeStripeSetup();
    } else if (canceled) {
      // Handle canceled checkout
      trackAmplitudeEvent(AMPLITUDE_EVENTS.LICENSE_ACTIVATION_REDIRECT, {
        redirect_type: 'cancel',
        activation_method: 'stripe'
      });
      
      toast.info(t('account.stripeActivationCanceled'));
      // Clean up URL
      window.history.replaceState({}, '', '/trial-expired');
    }
  }, [t]);

  const handleActivateLicense = () => {
    // Track Azure marketplace activation attempt
    trackAmplitudeEvent(AMPLITUDE_EVENTS.LICENSE_ACTIVATION_ATTEMPTED, {
      activation_method: 'azure_marketplace'
    });
    
    window.open("https://marketplace.microsoft.com/product/saas/integritycodesptyltd1682496467894.docufen_v2?tab=Overview?tab=overview", "_blank");
  };

  const handleContactSupport = () => {
    // Track support contact
    trackAmplitudeEvent(AMPLITUDE_EVENTS.SUPPORT_CONTACTED, {
      contact_method: 'email',
      issue_type: 'trial_expiration',
      page_name: 'Trial Expired',
      with_screenshot: false
    });
    
    window.location.href = "mailto:support@docufen.com?subject=Trial Expiration Support Request";
  };

  // Handle Stripe activation
  const handleStripeActivation = async () => {
    setIsLoadingStripe(true);
    
    // Track Stripe activation attempt
    trackAmplitudeEvent(AMPLITUDE_EVENTS.LICENSE_ACTIVATION_ATTEMPTED, {
      activation_method: 'stripe'
    });
    
    try {
      const response = await fetch(`${SERVERURL}stripe-admin/create-checkout-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Checkout session error:', response.status, errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : t('account.stripeActivationError');
      toast.error(errorMessage);
      setIsLoadingStripe(false);
    }
  };

  return (
    <SidebarProvider 
      open={sidebarOpen} 
      onOpenChange={setSidebarOpen}
      defaultOpen={true}
    >
      <SidebarLeft />
      <SidebarInset style={{ border: 'none' }}>
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-lg font-medium text-gray-700">
                    {t('TrialExpired.breadcrumb')}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-6 text-gray-600">
          <div className="flex flex-col items-center justify-center max-w-2xl mx-auto mt-8">
            {/* Docufen Logo and Name */}
            <div className="w-16 h-16 mb-4">
              <img src={DocufenIcon} alt="Docufen Logo" className="w-full h-full" />
            </div>
            <h1 className="text-2xl font-semibold mb-8">docufen</h1>
            
            {/* Main Card */}
            <Card className="bg-white border w-full">
              <CardContent className="p-12">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-3xl font-semibold mb-6 text-gray-800">
                    {t('TrialExpired.title')}
                  </h1>
                  
                  <p className="text-lg mb-10 text-gray-600">
                    {t('TrialExpired.description')}
                  </p>
                  
                  {/* Primary CTA Buttons - Stacked Vertically */}
                  <div className="flex flex-col gap-3 w-full max-w-md mb-4">
                    <Button
                      className="bg-[#0666B8] hover:bg-[#055599] py-6 px-8 text-base"
                      onClick={handleActivateLicense}
                      data-testid="trialExpiredPage.activateLicenseButton"
                    >
                      <MicrosoftIcon className="mr-2 h-5 w-5" />
                      {t('account.activateAzureLicense')}
                    </Button>
                    
                    <Button
                      className="bg-[#635BFF] hover:bg-[#5148E6] py-6 px-8 text-base"
                      onClick={handleStripeActivation}
                      disabled={isLoadingStripe}
                      data-testid="trialExpiredPage.activateStripeLicenseButton"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      {isLoadingStripe ? t("common.loading") : t("account.activateStripeLicense")}
                    </Button>
                  </div>
                  
                  {/* Support Link */}
                  <Button 
                    variant="link" 
                    className="text-blue-600" 
                    onClick={handleContactSupport}
                    data-testid="trialExpiredPage.contactSupportButton"
                  >
                    {t('TrialExpired.contactSupportButton')}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Warning Card */}
            <Card className="bg-white border w-full mt-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                    {t('TrialExpired.yourAccountDataAndFilesCreatedDuringTheTrialWillBeAutomaticallyDeletedWithin_60DaysAsThisWasATrialAccountAndNotYetValidatedWeAssumeNoDataNeedsToBeRetainedIfThisIsNotTheCasePleaseContactSupportImmediately')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
