"use client";

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Import the step components
import AccountSetupStep from "./account-setup";
import UserManagerStep from "./user-manager";
import TrialActivationStep from "./trial-activation";
import AccountCreationStep from "./account-creation";
import { useTranslation } from "react-i18next";

// Import Docufen logo
import DocufenIcon from "@/assets/docufen_icon_v4.svg";
import { useUserStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import { activateTrialAccount, ActivationData, CompanyInfo, UserDetails } from "@/lib/apiUtils";
import React from "react";
import { User, UserTenantProps } from "@/lib/User";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";

export default function SetupPage() {
  const { user, userType, loading, setUser, legalName, initials } = useUserStore(useShallow((state) => ({ 
    user: state.user,
    loading: state.loading,
    setUser: state.setUser,
    legalName: state.legalName,
    initials: state.initials,
    userType: state.userType
  })));
  
  
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardStartTime] = useState(Date.now());
  const stepStartTimeRef = useRef(Date.now());
  const hasTrackedStartRef = useRef(false);
  
  console.log("SetupPage rendering:", JSON.stringify({ user, loading, currentStep: currentStep || 0 }));
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: "",
    companyAddress: "",
    companyCity: "",
    companyCountry: "",
    companyPostCode: "",
    companyState: "",
    businessRegistrationNumber: "",
    locale: ["en"],
    // adminContacts: [{
    //   email: user?.email || '',
    //   legalName: user?.tenants?.[user?.tenantName]?.legalName || '',
    // }]

  });
  const [userManagers, setUserManagers] = useState<Array<UserDetails>>([]);

  const setCompanyInfoCallback = (newCompanyInfo: CompanyInfo) => {
    setCompanyInfo(newCompanyInfo);
  };

  // Track step changes
  const handleStepChange = (newStep: number) => {
    const timeOnStep = Date.now() - stepStartTimeRef.current;
    
    // Track step completion for the previous step
    if (newStep > currentStep) {
      const previousStepName = ['account-setup', 'user-manager', 'trial-activation', 'account-creation'][currentStep];
      trackAmplitudeEvent(AMPLITUDE_EVENTS.SETUP_WIZARD_STEP_COMPLETED, {
        step_number: currentStep,
        step_name: previousStepName,
        time_on_step_ms: timeOnStep
      });
    }
    
    // Update step start time for the new step
    stepStartTimeRef.current = Date.now();
    setCurrentStep(newStep);
  };

  React.useEffect(() => {
    console.log("Navigation effect running:", { user, loading, navigate });
    
    // Track setup wizard started (only once)
    if (!hasTrackedStartRef.current && user && !loading) {
      hasTrackedStartRef.current = true;
      trackAmplitudeEvent(AMPLITUDE_EVENTS.SETUP_WIZARD_STARTED, {
        entry_point: 'direct_navigation'
      });
    }
    
    // Only redirect if navigate exists AND user is null when not loading
    if (!navigate) return;
    if (user === null && loading === false) {
      console.log("Redirecting to login");
      navigate("/login");
    } else if (user && !loading) {
      if (userType != null) {
        console.log("User type is set, navigating to dashboard");
        // Navigate to the dashboard if userType is set
        navigate("/home");
      }
    }
  }, [user, loading, navigate, userType]);

  // Function to navigate to dashboard and set authentication
  const handleActivateTrial = async () => {
    // Navigate to the setup-complete route, which will authenticate and redirect to dashboard
    const activationData: ActivationData = {
      companyInfo: companyInfo,
      userManagers: userManagers
    }
    
    // Track trial activation initiated
    trackAmplitudeEvent(AMPLITUDE_EVENTS.TRIAL_ACTIVATION_INITIATED, {});
    
    try {
      const res = await activateTrialAccount(activationData);
      if (res === 0) {
        console.log("Trial activated successfully");
        
        // Track trial activation success
        trackAmplitudeEvent(AMPLITUDE_EVENTS.TRIAL_ACTIVATION_SUCCEEDED, {
          trial_duration_days: 14
        });
        
        setCurrentStep(3);
      } else if (res === 999) {
        console.error("Account already activated");
        const newTenants: { [key: string]: UserTenantProps } = { ...user?.tenants }
        const homeTenantName = user?.homeTenantName || '';
        newTenants[homeTenantName] = {
          legalName,
          initials,
          userType: null,
          ersdSigned: 0,
        }
        if (user == null) return;
        const newUser: User = { ...user, tenantName: homeTenantName, tenants: newTenants }
        setUser(newUser)
        // If needed, you could show an error message here
        
        // Track activation failure - account already activated
        trackAmplitudeEvent(AMPLITUDE_EVENTS.TRIAL_ACTIVATION_FAILED, {
          error_message: 'Account already activated'
        });
      } else {
        console.error("Failed to activate trial");
        // If needed, you could show an error message here
        
        // Track activation failure
        trackAmplitudeEvent(AMPLITUDE_EVENTS.TRIAL_ACTIVATION_FAILED, {
          error_message: `Activation failed with code: ${res}`
        });
      }
    } catch (error) {
      console.error("Error activating trial:", error);
      // If needed, you could show an error message here
      
      // Track activation error
      trackAmplitudeEvent(AMPLITUDE_EVENTS.TRIAL_ACTIVATION_FAILED, {
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Add tracking for wizard completion
  const handleWizardComplete = () => {
    const totalDuration = Date.now() - wizardStartTime;
    
    trackAmplitudeEvent(AMPLITUDE_EVENTS.SETUP_WIZARD_COMPLETED, {
      total_duration_ms: totalDuration,
      company_locale: companyInfo.locale[0] || 'en',
      user_managers_count: userManagers.length
    });
    window.location.href = "/account";
  };

  const steps = [
    {
      id: "account-setup",
      component: (
        <AccountSetupStep 
          companyInfo={companyInfo}
          onUpdateCompanyInfo={setCompanyInfoCallback}
          onNext={() => handleStepChange(1)}
          onBack={() => {
            // Track abandonment if going back from first step
            trackAmplitudeEvent(AMPLITUDE_EVENTS.SETUP_WIZARD_ABANDONED, {
              last_step_completed: -1,
              abandon_reason: 'back_from_first_step'
            });
            window.history.back();
          }}
        />
      )
    },
    {
      id: "user-manager",
      component: (
        <UserManagerStep 
          userManagers={userManagers}
          onUpdateUserManagers={setUserManagers}
          onNext={() => handleStepChange(2)}
          onBack={() => handleStepChange(0)} />
      )
    },
    {
      id: "trial-activation",
      component: (
        <TrialActivationStep 
          onNext={() => handleStepChange(3)}
          onBack={() => handleStepChange(1)}
          onFinish={handleActivateTrial}
        />
      )
    },
    {
      id: "account-creation",
      component: (
        <AccountCreationStep 
          onFinish={handleWizardComplete}
          onBack={() => handleStepChange(3)}
        />
      )
    }
  ];
  const { t } = useTranslation();
  if (loading || userType) return null
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="flex flex-col items-center">
            <div className="flex size-10 items-center justify-center mb-2">
              <img
                src={DocufenIcon}
                alt={t('setupWizard.docufenLogo')}
                width={38}
                height={38}
                className="w-auto h-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">docufen</h1>
          </div>
        </div>
        {steps[currentStep].component}
        
        {currentStep < 3 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              {steps.slice(0, 3).map((step, index) => (
                <div 
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${currentStep === index ? 'bg-primary' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}