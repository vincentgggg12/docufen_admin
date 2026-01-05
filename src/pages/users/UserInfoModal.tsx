import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocufenUser, InvitationStatus, InvitationStatuses, LicenseStatuses } from "@/lib/apiUtils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { hasCapability, UserType } from "@/lib/authorisation";
import { useAccountStore, useUserStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import { companyNameRegExp } from "@/lib/constants";

interface UserInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userForm: DocufenUser | null;
  onSave: (editedForm: DocufenUser) => void;
  t: (key: string) => string;
  updates: Partial<DocufenUser>;
  setUpdates: React.Dispatch<React.SetStateAction<Partial<DocufenUser>>>;
}

export function UserInfoModal({ 
  open, onOpenChange, userForm, onSave, t, updates, setUpdates
}: UserInfoModalProps) {
  if (!userForm) return null;
  const [ noChange, setNoChange ] = React.useState(true);
  const [ originalUserForm, setOriginalUserForm ] = React.useState(userForm);
  const [editingForm, setEditingForm] = React.useState<DocufenUser | null>(null);
  const { manager, userType } = useUserStore(useShallow((state) => ({
    userType: state.userType,
    manager: state.user
  })));
  const { licenseStatus } = useAccountStore(useShallow((state) => ({
    licenseStatus: state.licenseStatus,
  })));
  React.useEffect(() => {
    setOriginalUserForm({ ...userForm });
    setEditingForm({ ...userForm });
  }, [userForm]);

  React.useEffect(() => {
    setNoChange(Object.keys(updates).length === 0)
  }, [updates]);

  const getUpdates = (newForm: DocufenUser | null): Partial<DocufenUser> => {
    if (!newForm) return {};
    const updates: Partial<DocufenUser> = {}
    // console.log("Original Form: " + JSON.stringify(originalUserForm));
    // console.log("Edited form: " + JSON.stringify(newForm));
    if (originalUserForm.legalName !== newForm.legalName) updates.legalName = newForm.legalName
    if (originalUserForm.initials !== newForm.initials) updates.initials = newForm.initials
    if (originalUserForm.email !== newForm.email) updates.email = newForm.email
    if (originalUserForm.userType !== newForm.userType) updates.userType = newForm.userType
    if (originalUserForm.companyName !== newForm.companyName) updates.companyName = newForm.companyName
    if (originalUserForm.invitationStatus !== newForm.invitationStatus) updates.invitationStatus = newForm.invitationStatus
    if (originalUserForm.logo !== newForm.logo) updates.logo = newForm.logo
    if (originalUserForm.ersdSigned !== newForm.ersdSigned) updates.ersdSigned = newForm.ersdSigned
    if (originalUserForm.digitalSignatureVerification !== newForm.digitalSignatureVerification) updates.digitalSignatureVerification = newForm.digitalSignatureVerification
    if (originalUserForm.canAccessAllDocuments !== newForm.canAccessAllDocuments) updates.canAccessAllDocuments = newForm.canAccessAllDocuments
    if (originalUserForm.qualityApprover !== newForm.qualityApprover) updates.qualityApprover = newForm.qualityApprover
    if (originalUserForm.qualifiedPerson !== newForm.qualifiedPerson) updates.qualifiedPerson = newForm.qualifiedPerson
    console.log("Updates to be sent: " + JSON.stringify(updates));
    return updates;
  }
  const handleActivatedChange = (value: boolean) => {
    if (editingForm == null) return;
    // console.log("User is invited if the oid is undefined: ", editingForm.oid);
    // console.log("The invitationSttus is: ", originalUserForm.invitationStatus, editingForm.invitationStatus, value);
    // console.log("Compared to: ", InvitationStatuses.INVITED, InvitationStatuses.UNINVITED);
    let invitationStatus: InvitationStatus = (value ? 'active' : 'inactive') as InvitationStatus
    // console.log("Comparing the invited strings: ", value, InvitationStatuses.INVITED == editingForm.invitationStatus, InvitationStatuses.INVITED === editingForm.invitationStatus);
    if (editingForm.invitationStatus == InvitationStatuses.INVITED && !value) {
      invitationStatus = InvitationStatuses.UNINVITED
    } else if (editingForm.invitationStatus == InvitationStatuses.UNINVITED && value) {
      invitationStatus = InvitationStatuses.INVITED
    } else {}
    // console.log("Invitation status changed to:", invitationStatus);
    const newForm = { ...editingForm, invitationStatus } as DocufenUser;
    setEditingForm(newForm);
    setUpdates(getUpdates(newForm));
  };

  const handleInputChange = (key: keyof DocufenUser, value: any) => {
    if (userType == null || manager == null) return;
    if (editingForm == null) return;
    if (key === "initials") {
      value = value.toUpperCase().replace(/\d/g, "");
      if (value.length > 3) {
        value = value.substring(0, 3);
      }
    };
    if (key === "userType") {
      if (hasCapability(userType, "MANAGE_SITE") && editingForm.oid && editingForm.oid === manager.userId) {
        // Site Administrators can only remain Site Administrators (cannot upgrade to Trial Admin or downgrade to other roles)
        if (userType === UserType.SITE_ADMINISTRATOR && value !== UserType.SITE_ADMINISTRATOR) {
          console.log("Site Administrators cannot change their own role")
          return
        }
        // Trial Administrators can only switch between Trial Admin and Site Admin
        if (userType === UserType.TRIAL_ADMINISTRATOR && ![UserType.SITE_ADMINISTRATOR, UserType.TRIAL_ADMINISTRATOR].includes(value as UserType)) {
          console.log("Trial Administrators cannot make themselves a non-admin user")
          return
        }
      }
    }
    const newValue: DocufenUser | null = editingForm ? { ...editingForm, [key]: value } : null;
    setEditingForm(newValue);
    setUpdates(getUpdates(newValue));
  };

  const isWaitingForSignIn = (user: DocufenUser): boolean => {
    if (user.invitationStatus === 'invited') {
      return true;
    }
    if (user.oid == null) return false
    return user.oid?.toString().startsWith('temp-') || false;
  };
  if (userType == null) return 
  if (editingForm == null) return null;

  const doOnSave = () => {
    onSave(editingForm);
  }

  const safeUpdateField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    switch (id) {
      case "name":
        const safeVal = value.replace(companyNameRegExp, ''); // Remove special characters
        handleInputChange("legalName", safeVal)
        break;
      case "initials":
        const safeInitials = value.replace(companyNameRegExp, ''); // Remove special characters
        handleInputChange("initials", safeInitials)
        break;
      case "company":
        const safeCompanyName = value.replace(companyNameRegExp, ''); // Remove special characters
        handleInputChange("companyName", safeCompanyName);
        break;
      default:
        console.warn(`Unhandled field update for id: ${id}`);
    }
  }

  const disabled = [true, true, true, true, true]
  if (hasCapability(userType, "MANAGE_SITE")) {
    // console.warn("UserID: ", manager?.userId, "UserForm ID: ", editingForm.oid);
    if (editingForm.oid === manager?.userId) {
      // If current user is editing themselves
      if (userType === UserType.SITE_ADMINISTRATOR) {
        // Site Administrators can only remain Site Administrator
        disabled[0] = true;  // Trial Administrator - DISABLED
        disabled[1] = false; // Site Administrator - ENABLED
      } else if (userType === UserType.TRIAL_ADMINISTRATOR) {
        // Trial Administrators can switch between Trial Admin and Site Admin
        disabled[0] = false; // Trial Administrator
        disabled[1] = false; // Site Administrator
      }
    } else {
      // Editing other users - admins can set any role
      disabled[0] = false; // Trial Administrator
      disabled[1] = false; // Site Administrator
      disabled[2] = false; // User Manager
      disabled[3] = false; // Creator
      disabled[4] = false; // Collaborator
    }
  } else if (hasCapability(userType, "MANAGE_USERS")) {
    if (hasCapability(editingForm.userType, "MANAGE_SITE")) {
      disabled[0] = false; // Trial Administrator
      disabled[1] = false; // Site Administrator
    } else {
      disabled[3] = false; // Creator
      disabled[4] = false; // Collaborator
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        aria-describedby="user-info-description"
        className="sm:max-w-[500px]"
      >
        <div id="user-info-description" className="sr-only">
          {t('this-dialog-allows-editing-user-information')}
        </div>
        <DialogHeader>
          <DialogTitle>{t("user.editUserInformation")}</DialogTitle>
          <DialogDescription>
            {t("user.editUserInfoDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {t("user.name")}
            </Label>
            <Input
              id="name"
              value={editingForm.legalName}
              onChange={safeUpdateField}
              className="col-span-3"
              data-testid="userInfoModal.nameInput"
              disabled={editingForm.invitationStatus === InvitationStatuses.INVITED}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="initials" className="text-right">
              {t("user.initials")}
            </Label>
            <Input
              id="initials"
              value={editingForm.initials}
              onChange={safeUpdateField}
              className="col-span-3"
              data-testid="userInfoModal.initialsInput"
              disabled={editingForm.invitationStatus === InvitationStatuses.INVITED}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              {t("user.role")}
            </Label>
            <Select 
              value={editingForm.userType}
              onValueChange={(value) => {
                console.log("Role value:", value);
                handleInputChange("userType", value);
              }}
              data-testid="userInfoModal.roleSelect"
              disabled={editingForm.invitationStatus === InvitationStatuses.INVITED}
            >
              <SelectTrigger className="col-span-3" data-testid="userInfoModal.roleSelectTrigger">
                <SelectValue placeholder={t("user.selectRole")} />
              </SelectTrigger>
              <SelectContent>
                {(licenseStatus === LicenseStatuses.TRIAL || editingForm.userType === UserType.TRIAL_ADMINISTRATOR) && (
                  <SelectItem disabled={disabled[0]} value={UserType.TRIAL_ADMINISTRATOR}>{t("user.trialadministrator")}</SelectItem>
                )}
                <SelectItem disabled={disabled[1]} value={UserType.SITE_ADMINISTRATOR}>{t("user.administrator")}</SelectItem>
                <SelectItem disabled={disabled[2]} value={UserType.USER_MANAGER.valueOf().toString()}>{t("user.userManager")}</SelectItem>
                <SelectItem disabled={disabled[3]} value={UserType.CREATOR}>{t("user.creator")}</SelectItem>
                <SelectItem disabled={disabled[4]} value={UserType.COLLABORATOR}>{t("user.collaborator")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ersd" className="text-right">
              {t("user.ersd")}
            </Label>
            <div className="col-span-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleInputChange("ersdSigned", null)}
                className="text-sm"
                data-testid="userInfoModal.resetErsdButton"
                disabled={editingForm.invitationStatus === InvitationStatuses.INVITED}
              >
                {t("user.resetERSD")}
              </Button>
            </div>
          </div>
          {editingForm.isExternal && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                {t("user.company")}
              </Label>
              <Input
                id="company"
                value={editingForm.companyName || ""}
                onChange={safeUpdateField}
                className="col-span-3"
                data-testid="userInfoModal.companyInput"
                disabled={editingForm.invitationStatus === InvitationStatuses.INVITED}
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="activated" className="text-right">
              {t("user.activated")}
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="activated"
                checked={editingForm.invitationStatus === InvitationStatuses.ACTIVE || editingForm.invitationStatus === InvitationStatuses.INVITED}
                onCheckedChange={(checked) => handleActivatedChange(checked)}
                data-testid="userInfoModal.activatedSwitch"
              />
              <Label htmlFor="activated">
                {editingForm.invitationStatus === 'invited' 
                  ? t("user.invited") 
                  : editingForm.invitationStatus === 'active' 
                    ? t("user.active") 
                    : editingForm.oid == null ? t("user.inactive")
                    : editingForm.oid.startsWith("temp") ? t("user.uninvited") 
                    : t("user.inactive")
                }
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="microsoftTenant" className="text-left">
              {t('microsoft-tenant-name')}
            </Label>
            <div className="col-span-3">
              <Input
                id="microsoftTenant"
                value={isWaitingForSignIn(editingForm) ? 
                  t("users.waitingForSignIn") : 
                  (editingForm.homeTenantName || t("user.notAvailable"))}
                className="bg-gray-100"
                disabled
                data-testid="userInfoModal.microsoftTenantInput"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="canAccessAllDocuments" className="text-left">
              {t('view-all-documents')}
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="canAccessAllDocuments"
                checked={editingForm.canAccessAllDocuments || false}
                onCheckedChange={(checked) => handleInputChange("canAccessAllDocuments", checked)}
                data-testid="userInfoModal.canAccessAllDocsSwitch"
                disabled={editingForm.invitationStatus === InvitationStatuses.INVITED}
              />
              <Label htmlFor="canAccessAllDocuments" className="flex items-center gap-1.5">
                {editingForm.canAccessAllDocuments ? t('enabled') : t('disabled')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 info-icon cursor-help" data-testid="userInfoModal.canAccessAllDocsTooltipTrigger" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">
                    {t('enabling-this-option-grants-the-user-permission-to-view-all-documents')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="userInfoModal.cancelButton">
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={noChange} onClick={doOnSave} data-testid="userInfoModal.saveChangesButton">
            {t("common.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}