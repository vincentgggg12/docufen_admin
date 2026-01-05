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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { ShieldCheck, Building, Edit, Info, CreditCard, TextCursorInput } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CompanyInfo, LicenseStatuses, updateAccountData } from "@/lib/apiUtils"
import { useAccountStore, useAppStore, useUserStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
// import { AdminContactModal } from "./components/AdminContactModal";
// import { ComplianceContactModal } from "./components/ComplianceContactModal";
import { CompanyInfoModal } from "./components/CompanyInfoModal";
import { Label } from "../../components/ui/label"
// Import SVG assets
import azureBlobIcon from "../../assets/azure_blob_icon.svg"
import cosmosDbIcon from "../../assets/cosmos_db_icon.svg"
// New imports for Switch and Tooltip
import { Switch } from "../../components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { ComplianceERSDModal, getDefaultERSDText } from "./components/ComplianceERSDModal";
import { toast } from "sonner";
import { APIURL, SERVERURL } from "@/lib/server"
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude"
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events"
import { useSearchParams } from "react-router-dom"

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

// Microsoft Cosmos DB icon component
const CosmosDBIcon = () => (
  <img
    src={cosmosDbIcon}
    alt="Cosmos DB Icon"
    width="44"
    height="44"
    className="text-primary"
  />
);

// Azure Blob Storage icon component
const BlobStorageIcon = () => (
  <img
    src={azureBlobIcon}
    alt="Azure Blob Storage Icon"
    width="32"
    height="32"
    className="text-primary"
  />
);

// const noDeletes = { adminContacts: [], complianceContacts: [] }

export default function AccountPage() {
  // State for company information
  const { tenantName } = useUserStore(useShallow((state) => ({
    tenantName: state.tenantName,
  })));
  const { trialDaysRemaining, companyInfo, setCompanyInfo, licenseStatus, setLicenseStatus,
    enforceDigitalSignatures, setEnforceDigitalSignatures, insertAtCursorMode, 
    setInsertAtCursorMode 
  } = useAccountStore(useShallow((state) => ({
    trialDaysRemaining: state.trialDaysRemaining,
    companyInfo: state.companyInfo,
    setCompanyInfo: state.setCompanyInfo,
    licenseStatus: state.licenseStatus,
    setLicenseStatus: state.setLicenseStatus,
    enforceDigitalSignatures: state.enforceDigitalSignatures,
    setEnforceDigitalSignatures: state.setEnforceDigitalSignatures,
    insertAtCursorMode: state.insertAtCursorMode,
    setInsertAtCursorMode: state.setInsertAtCursorMode
  })));
  const [activation, setActivation] = React.useState(false)
  const { ersdText, setErsdText } = useAccountStore(useShallow((state) => ({
    ersdText: state.ersdText,
    setErsdText: state.setErsdText
  })));
  const { sidebarOpen, setSidebarOpen, working, setWorking } = useAppStore(useShallow((state) => ({
    working: state.working,
    setWorking: state.setWorking,
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })));
  // const contactsToDelete = useRef<ContactUsers>(noDeletes)
  // const [editFormData, setEditFormData] = useState<CompanyInfo>({ ...formData })
  const { t, i18n, ready: tready } = useTranslation();


  // New state for compliance toggles and ERSD modal
  const [ersdModalOpen, setErsdModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    if (activation) setLicenseStatus(LicenseStatuses.ACTIVE);
  }, [activation, setLicenseStatus, licenseStatus])
  
  React.useEffect(() => {
    // Get the parameter value
    const stripeSession = searchParams.get('stripe');
    
    if (stripeSession) {
      // Handle the success case
      console.log('Checkout session ID:', stripeSession);
      
      // Optionally clean the URL after processing
      const updatedSearchParams = new URLSearchParams(searchParams);
      updatedSearchParams.delete('stripe');
      setActivation(true);
      setSearchParams(updatedSearchParams, { replace: true });
      fetch(`${SERVERURL}admin/tenants/${tenantName}/activate-tenant/`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      }).then((response) => {
        if (!response.ok) {
          console.warn ("Upgrade failed: " + response.status.toString())
        }
      })
    }
  }, [searchParams, setSearchParams]);

  React.useEffect(() => {
    console.log("i18next instance: " + i18n + " " + tready.toString()); // Add this line
    if (tready) { // Only set the document title when i18next is ready
      document.title = t('account.title');
      console.log("Language: " + i18n.language)
      console.log("Document title: " + document.title)
    }
  }, [t, i18n, tready]); // Add 'ready' to the dependency array

  React.useEffect(() => {
    // Update the ersdText when the language changes
    if (ersdText === "") {
      setErsdText(getDefaultERSDText(t));
    }
  }, [ersdText, t, i18n.language]);

  // State for modal visibility
  const [companyInfoModalOpen, setCompanyInfoModalOpen] = useState(false);

  // Temporary state for form inputs
  const [companyInfoForm, setCompanyInfoForm] = useState<CompanyInfo>({ ...companyInfo });
  
  // State for Stripe activation
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);

  // React.useEffect(() => {
  //   console.warn("Setting companyInfoForm from companyInfo Externally " + companyInfo.logo == null);
  //   setCompanyInfoForm({ ...companyInfo });
  // }, [companyInfo])

  // Handlers for company info modal
  const handleOpenCompanyInfoModal = () => {
    setCompanyInfoForm({ ...companyInfo });
    setCompanyInfoModalOpen(true);
  };

  const getUpdates = (original: CompanyInfo, updated: CompanyInfo): Partial<CompanyInfo> => {
    const updates: Partial<CompanyInfo> = {}
    if (original.companyName !== updated.companyName) updates.companyName = updated.companyName
    if (original.companyAddress !== updated.companyAddress) updates.companyAddress = updated.companyAddress
    if (original.companyCity !== updated.companyCity) updates.companyCity = updated.companyCity
    if (original.companyState !== updated.companyState) updates.companyState = updated.companyState
    if (original.companyPostCode !== updated.companyPostCode) updates.companyPostCode = updated.companyPostCode
    if (original.companyCountry !== updated.companyCountry) updates.companyCountry = updated.companyCountry
    if (original.businessRegistrationNumber !== updated.businessRegistrationNumber) updates.businessRegistrationNumber = updated.businessRegistrationNumber
    if (original.locale[0] !== updated.locale[0]) updates.locale = updated.locale
    if (original.logo !== updated.logo) updates.logo = updated.logo
    if (original.enforceDigitalSignatures !== updated.enforceDigitalSignatures) updates.enforceDigitalSignatures = updated.enforceDigitalSignatures 
    console.log("Updates: found so fare: " + JSON.stringify(updates))
    return updates
  }

  const handleSaveCompanyInfoDetails = (newForm: CompanyInfo) => {
    // Pass the current companyInfoForm to ensure we have the latest state including the logo
    console.log("Recieved form: " + JSON.stringify(newForm))
    handleSaveCompanyInfo(newForm);
  }

  const updateDigitalSignatureToggle = async (checked: boolean) => {
    setEnforceDigitalSignatures(checked);
    console.log("Digital Signature Toggle: " + checked)
    
    // Track setting changed
    trackAmplitudeEvent(AMPLITUDE_EVENTS.SETTING_CHANGED, {
      setting_name: 'enforce_digital_signatures',
      old_value: !checked,
      new_value: checked,
      setting_category: 'compliance'
    });
    
    await updateAccountData(tenantName, { enforceDigitalSignatures: checked })
  }

  const updateTableCellInsertionToggle = async (checked: boolean) => {
    setInsertAtCursorMode(checked);
    console.log("Table Cell Insertion Toggle: " + checked)
    
    // Track setting changed
    trackAmplitudeEvent(AMPLITUDE_EVENTS.SETTING_CHANGED, {
      setting_name: 'table_cell_insertion_enabled',
      old_value: !checked,
      new_value: checked,
      setting_category: 'editor_behavior'
    });
    
    await updateAccountData(tenantName, { insertAtCursorMode: checked })
  }


  const handleSaveCompanyInfo: (formOverride?: CompanyInfo) => Promise<boolean> = async (formOverride?: CompanyInfo) => {
    setWorking(true)
    console.log("Saving company info")
    console.log("Company Info: " + JSON.stringify(companyInfo))
    const formToUse = formOverride || companyInfoForm;
    console.log("Company Info Form: " + JSON.stringify(formToUse))
    const updates = getUpdates(companyInfo, formToUse)
    console.log("Updates: " + JSON.stringify(updates))
    
    // Track company info update
    const updatedFields = Object.keys(updates);
    if (updatedFields.length > 0) {
      trackAmplitudeEvent(AMPLITUDE_EVENTS.COMPANY_INFO_UPDATED, {
        updated_fields: updatedFields,
        has_logo_update: updatedFields.includes('logo'),
        has_locale_update: updatedFields.includes('locale')
      });
    }
    
    let response: number = await updateAccountData(tenantName, updates)
    if (response !== 200 && response !== 201) {
      console.warn("Failed to update company information: " + response.toString())
      
      // Track error
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
        error_type: 'company_info_update_failed',
        error_code: response.toString(),
        error_message: `Update failed with status ${response}`,
        error_source: 'AccountPage',
        page_name: 'Account Settings',
        action_attempted: 'update_company_info'
      });
      
      return false
    }
    setCompanyInfoModalOpen(false);
    setCompanyInfo({ ...formToUse });
    setWorking(false)

    return true
  }

  // Handle Stripe activation
  const handleStripeActivation = async () => {
    setIsLoadingStripe(true);
    
    // Track Stripe activation initiated
    trackAmplitudeEvent(AMPLITUDE_EVENTS.BILLING_ACTION_INITIATED, {
      action_type: 'stripe_checkout_started',
      page_name: 'Account Settings'
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
      
      // Track error
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
        error_type: 'stripe_checkout_failed',
        error_code: 'STRIPE_SESSION_ERROR',
        error_message: errorMessage,
        error_source: 'AccountPage',
        page_name: 'Account Settings',
        action_attempted: 'create_stripe_checkout'
      });
      
      toast.error(errorMessage);
      setIsLoadingStripe(false);
    }
  };

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
            // Track successful Stripe activation
            trackAmplitudeEvent(AMPLITUDE_EVENTS.BILLING_ACTION_COMPLETED, {
              action_type: 'stripe_subscription_activated',
              success: true,
              page_name: 'Account Settings'
            });
            
            toast.success(t('account.stripeActivationSuccess'));
            // Clean up URL
            window.history.replaceState({}, '', '/account');
            // Refresh account data to update license status
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
      toast.info(t('account.stripeActivationCanceled'));
      // Clean up URL
      window.history.replaceState({}, '', '/account');
    }
  }, []);


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
                    {t("account.accountSettings")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 text-gray-600">
          {/* Trial Period Card */}
          {licenseStatus === LicenseStatuses.TRIAL && (
            <Card className="bg-white border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="text-lg font-bold">{trialDaysRemaining}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{t("account.trialPeriod")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("account.daysRemainingMessage", { nDays: trialDaysRemaining })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="bg-[#0666B8] hover:bg-[#055599]"
                      onClick={() => {
                        // Track Azure activation initiated
                        trackAmplitudeEvent(AMPLITUDE_EVENTS.BILLING_ACTION_INITIATED, {
                          action_type: 'azure_marketplace_clicked',
                          page_name: 'Account Settings'
                        });
                        
                        window.open("https://marketplace.microsoft.com/product/saas/integritycodesptyltd1682496467894.docufen_v2?tab=Overview?tab=overview", "_blank")
                      }}
                      data-testid="accountPage.activateAzureLicenseButton"
                    >
                      <MicrosoftIcon className="mr-2 h-4 w-4" />
                      {t("account.activateAzureLicense")}
                    </Button>
                    <Button
                      className="bg-[#635BFF] hover:bg-[#5148E6]"
                      onClick={handleStripeActivation}
                      disabled={isLoadingStripe}
                      data-testid="accountPage.activateStripeLicenseButton"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {isLoadingStripe ? t("common.loading") : t("account.activateStripeLicense")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NEW Compliance Card - MOVED HERE */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                {t("account.compliance.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("account.compliance.description")}
              </p>
              <div className="flex flex-row gap-4 pt-2">
                {/* Setting 1: Electronic Record and Signature Disclosure */}
                <div className="flex flex-1 items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="ersd-settings" className="text-sm">
                      {t("account.compliance.ersd")}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 info-icon cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{t("account.compliance.ersdTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground"
                      onClick={() => {
                        trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                          button_name: 'edit_ersd',
                          button_location: 'compliance_card',
                          page_name: 'Account Settings'
                        });
                        setErsdModalOpen(true)
                      }}
                      data-testid="accountPage.editErsdButton"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{t('account.compliance.editErsd')}</span>
                    </Button>
                  </div>
                </div>

                {/* Setting 2: Digital Signatures - adjusted width to fit */}
                <div className="flex flex-1 items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="digital-signatures" className="text-sm">
                      {t("account.compliance.enforceDigitalSignatures")}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 info-icon cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{t("account.compliance.enforceDigitalSignaturesTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <Switch
                      id="digital-signatures"
                      checked={enforceDigitalSignatures}
                      onCheckedChange={updateDigitalSignatureToggle}
                      aria-label={t("account.compliance.enforceDigitalSignaturesAriaLabel")}
                      data-testid="accountPage.digitalSignaturesSwitch"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table-Cell Insertion Behaviour Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TextCursorInput className="h-5 w-5" />
                {t("account.tableCellInsertion.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("account.tableCellInsertion.description")}
              </p>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-1">
                  <Label htmlFor="table-cell-insertion" className="text-sm cursor-pointer">
                    {t("account.tableCellInsertion.toggle")}
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 info-icon cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-3 text-sm">
                          <div className="whitespace-pre-line">{t("account.tableCellInsertion.tooltip.enabled")}</div>
                          <div className="whitespace-pre-line">{t("account.tableCellInsertion.tooltip.disabled")}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="table-cell-insertion"
                  checked={insertAtCursorMode}
                  onCheckedChange={updateTableCellInsertionToggle}
                  aria-label={t("account.tableCellInsertion.ariaLabel")}
                  data-testid="accountPage.tableCellInsertionSwitch"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Company Information Card */}
            <Card className="flex flex-col md:row-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {t("account.companyInformation")}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => {
                    trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                      button_name: 'edit_company_info',
                      button_location: 'company_info_card',
                      page_name: 'Account Settings'
                    });
                    handleOpenCompanyInfoModal()
                  }}
                  data-testid="accountPage.editCompanyInfoButton"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">{t("common.edit")} {t("account.companyInformation")}</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <p className="text-sm text-muted-foreground">
                  {t("account.updateCompanyInfoDescription")}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-normal text-gray-600">{t("account.companyName")}</Label>
                    <p className="text-sm py-2 px-3 bg-[#FAF9F5] rounded-md border border-gray-200">{companyInfo.companyName}</p>
                  </div>

                  <div className="space-y-2 col-span-4 md:col-span-2">
                    <Label className="text-sm font-normal text-gray-600">{t("account.businessRegistrationNumber")}</Label>
                    <p className="text-sm py-2 px-3 bg-[#FAF9F5] rounded-md border border-gray-200">{companyInfo.businessRegistrationNumber}</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-normal text-gray-600">{t("account.companyAddress")}</Label>
                    <p className="text-sm py-3 px-3 bg-[#FAF9F5] rounded-md border border-gray-200 whitespace-pre-wrap min-h-[60px]">{companyInfo.companyAddress}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-gray-600">{t("account.companyCity")}</Label>
                    <p className="text-sm py-2 px-3 bg-[#FAF9F5] rounded-md border border-gray-200">{companyInfo.companyCity}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-gray-600">{t("account.companyState")}</Label>
                    <p className="text-sm py-2 px-3 bg-[#FAF9F5] rounded-md border border-gray-200">{companyInfo.companyState}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-gray-600">{t("account.companyPostCode")}</Label>
                    <p className="text-sm py-2 px-3 bg-[#FAF9F5] rounded-md border border-gray-200">{companyInfo.companyPostCode}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-gray-600">{t("account.companyCountry")}</Label>
                    <p className="text-sm py-2 px-3 bg-[#FAF9F5] rounded-md border border-gray-200">{companyInfo.companyCountry}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-gray-600">{t("account.language")}</Label>
                    <p className="text-sm py-2 px-3 bg-[#FAF9F5] rounded-md border border-gray-200">{t(`account.${companyInfo.locale[0]}`)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-gray-600">{t("account.companyLogo")}</Label>
                    {companyInfo.logo ? (
                      <div className="p-2 bg-[#FAF9F5] rounded-md border border-gray-200 flex items-center justify-center">
                        <img
                          src={companyInfo.logo}
                          alt={`${companyInfo.companyName} logo`}
                          data-testid="accountPage.companyLogo"
                          className="max-h-20 max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <p className="text-sm py-2 px-3 bg-[#FAF9F5] rounded-md border border-gray-200 text-gray-400 italic">
                        {t("account.noLogoUploaded")}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="mt-auto">
                {/* Removed the Update button */}
              </CardFooter>
            </Card>

            {/* Wrapper for the cards in the right column - REVERTED */}
            {/* Microsoft Cosmos DB Card - REVERTED */}
            <Card >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CosmosDBIcon />
                  {t("data.cosmosDb.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("data.cosmosDb.databaseId")}</p>
                  <div className="rounded-md bg-muted px-4 py-3">
                    <code className="text-sm">{tenantName ? `${tenantName}-MS-Cosmos-db` : "Loading..."}</code>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("data.cosmosDb.description")}
                </p>
              </CardContent>
            </Card>

            {/* Azure Blob Storage Card - REVERTED */}
            <Card >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BlobStorageIcon />
                  {t("data.blobStorage.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("data.blobStorage.storageContainer")}</p>
                  <div className="rounded-md bg-muted px-4 py-3">
                    <code className="text-sm">{tenantName ? `${tenantName}-MS-Azure-blob` : "Loading..."}</code>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("data.blobStorage.description")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Company Information Modal */}
      <CompanyInfoModal
        open={companyInfoModalOpen}
        onOpenChange={setCompanyInfoModalOpen}
        companyInfoForm={companyInfoForm}
        setCompanyInfoForm={setCompanyInfoForm}
        onSave={handleSaveCompanyInfoDetails}
        working={working}
        t={t}
      />

      {/* ERSD Modal */}
      <ComplianceERSDModal
        open={ersdModalOpen}
        onOpenChange={setErsdModalOpen}
        ersdText={ersdText}
        setErsdText={setErsdText}
        onSave={async (newText: string) => {
          setWorking(true);
          try {
            console.log("Saving: " + newText.slice(0,100))
            const response = await fetch(`${APIURL}saveersd/`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ersdText: newText }),
                credentials: "include"
              }
            );

            if (!response.ok) {
              console.error('Server response status:', response.status);
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || 'Failed to save ERSD text');
            }
            
            // Track ERSD update
            trackAmplitudeEvent(AMPLITUDE_EVENTS.SETTING_CHANGED, {
              setting_name: 'ersd_text',
              old_value: '',
              new_value: ersdText || '',
              setting_category: 'compliance'
            });
            
            // Show success message and close modal
            setErsdModalOpen(false);
            toast.success(t("account.ersdSaveSuccess"));
          } catch (error) {
            console.error("Error saving ERSD text:", error);
            toast.error(t("account.ersdSaveError"));
          } finally {
            setWorking(false);
          }
        }}
      />
    </SidebarProvider>
  )
}