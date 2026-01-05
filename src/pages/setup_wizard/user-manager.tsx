"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { UserDetails } from "@/lib/apiUtils";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { UserType } from "@/lib/authorisation";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";


interface UserManagerStepProps {
  userManagers: UserDetails[];
  onUpdateUserManagers: (userManagers: UserDetails[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function UserManagerStep({
  userManagers,
  onUpdateUserManagers,
  onNext,
  onBack,
}: UserManagerStepProps) {
  const { t } = useTranslation();
  const { user } = useUserStore(useShallow((state) => ({
    user: state.user
  })));
  
  // Assume these are the user's details, adjust as needed based on your User type
  const [adminDetails, setAdminDetails] = useState({
    legalName: user?.tenants?.[user?.tenantName || ""]?.legalName || "",
    initials: user?.tenants?.[user?.tenantName || ""]?.initials || "",
  });
  
  const [currentUser, setCurrentUser] = useState<UserDetails>({
    legalName: "",
    initials: "",
    email: "",
    userType: UserType.USER_MANAGER,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAdminChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const value = e.target.value;
    
    if (field === "legalName" && value) {
      const nameParts = value.trim().split(" ");
      let initials = "";
      
      if (nameParts.length >= 2) {
        // Take first letter of first name and first letter of last name
        initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0]) {
        // If only one name, take first letter
        initials = nameParts[0][0].toUpperCase();
      }
      
      // Limit to 3 characters
      initials = initials.substring(0, 3);
      
      setAdminDetails({
        ...adminDetails,
        legalName: value,
        initials: initials,
      });
    } else {
      setAdminDetails({
        ...adminDetails,
        [field]: value,
      });
    }
    
    // We'll skip actually updating the user in the store since it's beyond the scope
    // of this component and would depend on your app's state management setup
  };
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const value = e.target.value;
    
    // Auto-generate initials when legalName changes
    if (field === "legalName" && value) {
      const nameParts = value.trim().split(" ");
      let initials = "";
      
      if (nameParts.length >= 2) {
        // Take first letter of first name and first letter of last name
        initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0]) {
        // If only one name, take first letter
        initials = nameParts[0][0].toUpperCase();
      }
      
      // Limit to 3 characters
      initials = initials.substring(0, 3);
      
      setCurrentUser({
        ...currentUser,
        legalName: value,
        initials: initials,
      });
    } else {
      setCurrentUser({
        ...currentUser,
        [field]: value,
      });
      
      // Immediate validation for email field
      if (field === "email" && value.toLowerCase() === user?.email.toLowerCase()) {
        setErrors({
          ...errors,
          email: t('userManager.sameEmailDetectedThisApplicationReq')
        });
      } else if (field === "email") {
        // Clear error if email is changed and no longer matches admin email
        const newErrors = { ...errors };
        delete newErrors.email;
        setErrors(newErrors);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!currentUser.legalName) {
      newErrors.legalName = t("validation.required");
    }
    
    if (!currentUser.initials) {
      newErrors.initials = t("validation.required");
    } else if (currentUser.initials.length > 3) {
      newErrors.initials = t("home.initialsTooltip").split(".")[0];
    }
    
    if (!currentUser.email) {
      newErrors.email = t("validation.required");
    } else if (!/^\S+@\S+\.\S+$/.test(currentUser.email)) {
      newErrors.email = t("validation.invalidEmail");
    } else if (currentUser.email === user?.email) {
      newErrors.email = t('userManager.sameEmailDetectedThisApplicationReq');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isAdminFormValid = () => {
    return (
      adminDetails.legalName.trim() !== "" &&
      adminDetails.initials.trim() !== "")
  }

  const isUserManagerFormValid = () => {
    return (
      currentUser.legalName.trim() !== "" &&
      currentUser.initials.trim() !== "" &&
      currentUser.email.trim() !== "" &&
      /^\S+@\S+\.\S+$/.test(currentUser.email) &&
      (user?.email.toLowerCase() !== currentUser.email.toLowerCase())
    );
  };

  const handleAddUserManager = () => {
    if (validateForm()) {
      // Track user manager added
      trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_MANAGER_ADDED, {
        manager_email: currentUser.email.split('@')[1] || '', // domain only
        manager_name: currentUser.legalName
      });
      
      onUpdateUserManagers([...userManagers, currentUser]);
      setCurrentUser({
        legalName: "",
        initials: "",
        email: "",
        userType: UserType.USER_MANAGER,
      });
    }
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    const adminOk = isAdminFormValid()
    if (!adminOk) {
      if (!adminDetails.legalName) {
        newErrors.adminLegalName = t("validation.fieldRequired", { field: t("home.fullLegalName") });
      }
      if (!adminDetails.initials) {
        newErrors.adminInitials = t("validation.fieldRequired", { field: t("home.initials") });
      }
      setErrors(newErrors);
    }
    if (userManagers.length > 0 && adminOk) {
      onNext();
    } else {
      if (userManagers.length === 0) {
        setErrors({
          general: t("home.addAtLeastOneUserManager"),
        });
      }
      
      // Track form validation failure
      const errorFields = Object.keys(newErrors);
      if (userManagers.length === 0) {
        errorFields.push('user_managers_required');
      }
      
      if (errorFields.length > 0) {
        trackAmplitudeEvent(AMPLITUDE_EVENTS.FORM_VALIDATION_FAILED, {
          form_name: 'user_manager',
          error_fields: errorFields,
          error_count: errorFields.length,
          page_name: 'Setup Wizard'
        });
      }
    }
  };

  const isSameEmail = currentUser.email && currentUser.email === user?.email;
  
  // The explanatory text that will go into the tooltip
  const explanatoryText = t('userManager.dearAdministratorWhileYouOverseeThe');

  return (
    <div className="space-y-6">
      {/* Tenant Administrator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {t('userManager.tenantAdministratorYou')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminLegalName">{t("home.fullLegalName")} *</Label>
            <Input
              id="adminLegalName"
              data-testid="setupPage.adminLegalNameField"
              placeholder={t("home.fullLegalName")}
              value={adminDetails.legalName}
              onChange={(e) => handleAdminChange(e, "legalName")}
            />
            {errors.adminLegalName && (
              <p className="text-sm text-red-500">{errors.adminLegalName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adminInitials">{t("home.initials")} *</Label>
            <Input
              id="adminInitials"
              data-testid="setupPage.adminInitialsField"
              placeholder={t("home.initials")}
              value={adminDetails.initials}
              onChange={(e) => handleAdminChange(e, "initials")}
              maxLength={3}
            />
            {errors.adminInitials && (
              <p className="text-sm text-red-500">{errors.adminInitials}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adminEmail">{t("home.email")} *</Label>
            <Input
              id="adminEmail"
              data-testid="setupPage.adminEmailField"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-gray-100"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* User Manager Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            {t('userManager.addUserManagerDifferentPerson')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help" data-testid="setupPage.helpTooltipTrigger">
                    <HelpCircle size={18} className="text-gray-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{explanatoryText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">          
          <div className="space-y-2">
            <Label htmlFor="legalName">{t("home.fullLegalName")} *</Label>
            <Input
              id="legalName"
              data-testid="setupPage.userManagerLegalNameField"
              placeholder={t("home.fullLegalName")}
              value={currentUser.legalName}
              onChange={(e) => handleInputChange(e, "legalName")}
            />
            {errors.legalName && (
              <p className="text-sm text-red-500">{errors.legalName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="initials">{t("home.initials")} *</Label>
            <Input
              id="initials"
              data-testid="setupPage.userManagerInitialsField"
              placeholder={t("home.initials")}
              value={currentUser.initials}
              onChange={(e) => handleInputChange(e, "initials")}
              maxLength={3}
            />
            {errors.initials && (
              <p className="text-sm text-red-500">{errors.initials}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">{t("home.email")} *</Label>
            <Input
              id="email"
              data-testid="setupPage.userManagerEmailField"
              type="email"
              placeholder={t("home.email")}
              value={currentUser.email}
              onChange={(e) => handleInputChange(e, "email")}
              className={isSameEmail ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
            {isSameEmail && !errors.email && (
              <p className="text-sm text-red-500">
                {t('userManager.sameEmailDetectedThisApplicationReq')}
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleAddUserManager} 
            data-testid="setupPage.addUserManagerButton"
            className="w-full"
            disabled={!isUserManagerFormValid()}
          >
            {t("home.addUserManager")}
          </Button>
          
          {userManagers.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="font-medium">{t("home.addedUserManagers")}:</h3>
              <div className="space-y-2">
                {userManagers.map((manager, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{manager.legalName} ({manager.initials})</p>
                    <p className="text-sm text-gray-600">{manager.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {errors.general && (
            <p className="text-sm text-red-500 text-center">{errors.general}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack} data-testid="setupPage.backButton">
            {t('setupWizard.back')}
          </Button>
          <Button onClick={handleNext} disabled={userManagers.length === 0} data-testid="setupPage.nextButton">
            {t("setupWizard.next")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 