import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  UserRoundCog,
  UsersRound,
  UserRoundPlus,
  UserRoundPen,
  Book,
  Edit,
  Mail,
  Info,
} from "lucide-react";
import { IconSignature } from "@tabler/icons-react";
import { formatDateFromTimestamp } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";
import { UserInfoModal } from "./UserInfoModal";
import { callRevokeSignatureVerification, DocufenUser, callUpdateUserInfo, InvitationStatus, INVITED, ACTIVE, INACTIVE, VERIFIED_MS_USER_ID, VERIFIED_REGISTER_NOTATION, VERIFIED_IMAGE, NOT_VERIFIED, InvitationStatuses } from "@/lib/apiUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { hasCapability, UserType } from "@/lib/authorisation";
import DigitalSignatureVerification from "./DigitalSignatureVerification";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { useUsersStore, useUserStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";

// UsersTable component
export function UsersTable({
  users,
  setUsers,
  expandedRows,
  toggleRow
}: {
  users: DocufenUser[];
  setUsers: (users: DocufenUser[]) => void;
  expandedRows: Record<string, boolean>;
  toggleRow: (userId: string) => void;
}) {
  const { userId, tenantName, userType } = useUserStore(useShallow((state) => ({
    tenantName: state.tenantName,
    userType: state.userType,
    userId: state.user?.userId
  })));
  const { updateUser, setGlobalUsers, globalUsers } = useUsersStore(useShallow((state) => ({
    updateUser: state.updateUser,
    setGlobalUsers: state.setUsers,
    globalUsers: state.users,
  })));
  const { t } = useTranslation();
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUserForm, setEditingUserForm] = useState<DocufenUser | null>(null);
  const [updates, setUpdates] = useState<Partial<DocufenUser>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DocufenUser | null>(null);


  // Function to handle opening the signature verification drawer
  const handleOpenSignatureDrawer = async (aUser: DocufenUser) => {
    setSelectedUser(aUser);
    setDrawerOpen(true);
    
    // Refresh user data to ensure we have the latest verification information
    try {
      // const { getUserData } = await import('@/lib/apiUtils');
      const freshUsers = useUsersStore.getState().users
      const freshUser = freshUsers.find((u: DocufenUser) => u.oid === aUser.oid);
      // const updatedUser = await getUserData(aUser.oid);
      if (freshUser)
        setSelectedUser(freshUser);
      
    } catch (error) {
      console.error('Error refreshing user data when opening drawer:', error);
      // Continue with existing user data if refresh fails
    }
  };

  // Function to handle successful verification and update user data
  const handleVerificationComplete = async (aUser: DocufenUser, verificationType: string = 'image') => {
    // First update the local state with the verification status
    const updatedUsers = users.map((u: DocufenUser) => {
      if (u.oid === aUser.oid) {
        // Determine verification label based on the passed verificationType parameter
        const verificationLabel = verificationType === 'microsoft' 
          ? VERIFIED_MS_USER_ID 
          : verificationType === 'notation' 
            ? VERIFIED_REGISTER_NOTATION 
            : VERIFIED_IMAGE;
            
        return { 
          ...u, 
          digitalSignatureVerification: verificationLabel,
          digitalSignatureVerifiedAt: Date.now() // Use number timestamp instead of string
        } as DocufenUser;
      }
      return u;
    });
    
    setUsers(updatedUsers);
    
  };

  // Function to handle revoking verification
  const handleRevokeVerification = (userId: string) => {
    callRevokeSignatureVerification(userId).then((revokeResponse) => {
      if (revokeResponse !== 200) return console.error("Error revoking signature verification");
      const updatedUsers = users.map((u: DocufenUser) => {
        if (u.oid === userId ) {
            return { ...u, digitalSignatureVerification: NOT_VERIFIED, digitalSignatureNotation: "", digitalSignatureVerifiedAt: 0, digitalSignatureVerifiedBy: "" } as DocufenUser;
        } else {
          return u;
        }
      });
      setUsers(updatedUsers);
    }).catch((error) => {
      if (error instanceof Error) {
        console.error("Error revoking signature verification:", error.message);
      } else {
        console.error("Error revoking signature verification:", JSON.stringify(error));
      }
    });
  };

  // Function to handle opening the edit modal for a user
  const handleOpenEditUserModal = (aUser: DocufenUser) => {
    setEditingUserForm({...aUser}); // Create a copy for editing
    setEditUserModalOpen(true);
  };
  
  // Function to handle saving the edited user
  const handleSaveUserInfo = (editedUserForm: DocufenUser) => {
    if (!editedUserForm) return;
    
    // Update the user in the local state
    const updatedUsers = users.map((u: DocufenUser) => {
      if (!!u.oid && u.oid === editedUserForm.oid || !!u.id && u.id === editedUserForm.id) {
        console.log("updating user: " + u.email);
        return { 
          ...editedUserForm,
          canAccessAllDocuments: editedUserForm.canAccessAllDocuments || false,
          // These fields are not currently displayed in UI but preserved in data model
          qualityApprover: editedUserForm.qualityApprover || false,
          qualifiedPerson: editedUserForm.qualifiedPerson || false
        } as DocufenUser;
      }
      return u;
    });
    setUsers(updatedUsers);
    
    if (Object.keys(updates).length > 0) {
      updates.oid = editedUserForm.oid ? editedUserForm.oid : editedUserForm.id ? editedUserForm.id : undefined;
      updates.email = editedUserForm.email;
      console.log("updates to be sent to server: " + JSON.stringify(updates));
      callUpdateUserInfo(tenantName, updates).then((serverUser: DocufenUser | null) => {
        console.log("serverUser after update: " + JSON.stringify(serverUser));
        if (serverUser) {
          // Update the user in the local state with server response
          let found = false
          const updatedUsersWithServerResponse = globalUsers.map((u: DocufenUser) => {
            if ((!!u.oid && u.oid === serverUser.oid) || (!!u.id && u.id === serverUser.id)) {
              found = true
              return { ...serverUser, canAccessAllDocuments: serverUser.canAccessAllDocuments || false } as DocufenUser;
            }
            return u;
          });
          if (!found && serverUser.invitationStatus === InvitationStatuses.ACTIVE) {
            const newUsers = [...globalUsers, serverUser]
            setGlobalUsers(newUsers);
          } else {
            setGlobalUsers(updatedUsersWithServerResponse);
          }
        } else {
          if (updates.invitationStatus === InvitationStatuses.UNINVITED) {
            console.log("removing user: " + updates.email, users.length);
            const removedUserList = [...globalUsers.filter((u: DocufenUser) => {
              return u.email.toLowerCase() !== updates.email?.toLowerCase()
            })];
            console.log("new user list length: " + removedUserList.length);
            setGlobalUsers(removedUserList);
          } else {
            console.error(`Unexpected failure scenario: invitationStatus=${updates.invitationStatus}, email=${updates.email}`);
          }
        }

      })
    }
    
    // Close the modal
    setEditUserModalOpen(false);
    setEditingUserForm(null);
    setUpdates({});
  };

  // Function to determine user status for display
  const getUserStatus = (aUser: DocufenUser): InvitationStatus => {
    // Check for the invitationStatus field first (new logic)
    if (aUser.invitationStatus === INVITED) {
      return INVITED;
    }
    
    // Fall back to the previous logic
    if (aUser.invitationStatus === ACTIVE) {
      return ACTIVE;
    }
    
    return INACTIVE;
  };

  // Function to determine if a user is waiting for sign in
  const isWaitingForSignIn = (aUser: DocufenUser): boolean => {
    // Check for invitation status first
    if (aUser.invitationStatus === 'invited') {
      return true;
    }
    
    // Fall back to checking temporary ID
    return false;
  };

  const revokeSelectedUserSignature = (userId: string) => {
    updateUser({ oid: userId, digitalSignatureVerification: NOT_VERIFIED, digitalSignatureNotation: "", digitalSignatureVerifiedAt: 0, digitalSignatureVerifiedBy: "" });
  }

  const isUserEditable = (aUser: DocufenUser, userType: UserType | null): boolean => {
    if (userId == null) return false;
    if (!userType) return false;
    if (!hasCapability(userType, "MANAGE_USERS")) return false;
    // Check if the user is the same as the one being edited
    if (userType === UserType.USER_MANAGER) {
      if (aUser.oid === userId) {
        return false;
      }
      if (aUser.userType === UserType.SITE_ADMINISTRATOR || aUser.userType === UserType.TRIAL_ADMINISTRATOR || aUser.userType === UserType.USER_MANAGER) {
        return false;
      }
      return true
    }
    return true;
  };

  // Function to format verification date with timestamp
  const formatVerificationDateTime = (timestamp: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const dateStr = formatDateFromTimestamp(timestamp, t);
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    return `${dateStr} ${timeStr}`;
  };
  return (
    <div className="overflow-auto border rounded-md" style={{ maxHeight: 'calc(100vh - 250px)' }}>
      <Table className="w-full">
        <TableHeader>
          <TableRow className="bg-table-header">
            <TableHead className="w-10 bg-table-header border-b z-10"></TableHead>
            <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10">
              <div className="flex items-center">
                {t("users.tableHeaders.name")}
              </div>
            </TableHead>
            <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10">{t("users.tableHeaders.initials")}</TableHead>
            <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10">{t("users.tableHeaders.role")}</TableHead>
            <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10">{t("users.tableHeaders.ersdSigned")}</TableHead>
            <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10">{t('digital-signature')}</TableHead>
            <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10">{t('view-all-docs')}</TableHead>
            <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10">{t("users.tableHeaders.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((aUser: DocufenUser) => {
              const notEditable = !isUserEditable(aUser, userType);
              return (
              <React.Fragment key={aUser.email}>
                <TableRow 
                  className={`cursor-pointer h-12 hover:bg-[#FAF9F4] border-b ${expandedRows[aUser.email] ? 'bg-[#FAF9F4]' : ''}`}
                  onClick={() => toggleRow(aUser.email)}
                  data-testid="usersTable.userRow"
                >
                  <TableCell>
                    {expandedRows[aUser.email] ? (
                      <ChevronUp className="h-4 w-4" data-testid="usersTable.expandedRowIcon" />
                    ) : (
                      <ChevronDown className="h-4 w-4" data-testid="usersTable.collapsedRowIcon" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-normal text-gray-600 p-0">
                    <div className="flex items-center gap-2 h-12 px-4">
                      {aUser.legalName}
                      {aUser.isExternal && (
                        <Badge variant="outline" className="ml-2">
                          {t("users.external")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-normal text-gray-600">{aUser.initials}</TableCell>
                  <TableCell className="text-sm font-normal text-gray-600">
                    <div className="flex items-center space-x-1">
                      {hasCapability(aUser.userType, "MANAGE_SITE") ? (
                        <>
                          <UserRoundCog className="h-4 w-4 text-gray-600" />
                          <span>{aUser.userType === 'TRIAL_ADMINISTRATOR' ? t("users.roleTypes.trialAdmin") : t("users.roleTypes.administrator")}</span>
                        </>
                      ) : hasCapability(aUser.userType, "MANAGE_USERS") ? (
                        <>
                          <UsersRound className="h-4 w-4 text-gray-600" />
                          <span>{t("users.roleTypes.userManager")}</span>
                        </>
                      ) : hasCapability(aUser.userType, "CREATE_DOCUMENTS") ? (
                        <>
                          <UserRoundPlus className="h-4 w-4 text-gray-600" />
                          <span>{t("users.roleTypes.creator")}</span>
                        </>
                      ) : hasCapability(aUser.userType, "COMPLETE_DOCUMENTS") ? (
                        <>
                          <UserRoundPen className="h-4 w-4 text-gray-600" />
                          <span>{t("users.roleTypes.collaborator")}</span>
                        </>
                      ) : (
                        <>
                        <Book className="h-4 w-4 text-gray-600" />
                        <span>{t("users.roleTypes.reader")}</span>
                        </>
                    )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-normal text-gray-600">{aUser.ersdSigned ? formatDateFromTimestamp(aUser.ersdSigned, t) : t("users.notSigned")}</TableCell>
                  <TableCell className="text-sm font-normal text-gray-600">
                    <div className="flex items-center space-x-1">
                      {aUser.digitalSignatureVerification !== NOT_VERIFIED ? (
                        <>
                          <IconSignature size={14} color="#0E7C3F" />
                          <span>{t("users.verified")}</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                          <span>{t("users.notVerified")}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-normal text-gray-600">
                    <div className="flex items-center">
                      {aUser.canAccessAllDocuments ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-800">
                          {t('buttonTitle.yes')}
                        </Badge>
                      ) : (
                        <Badge className="bg-[#FAF9F4] text-gray-700 hover:bg-[#FAF9F4] hover:text-gray-800">
                          {t('buttonTitle.no')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-normal text-gray-600">
                    <Badge className={
                      getUserStatus(aUser) === ACTIVE ? "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-800" : 
                      getUserStatus(aUser) === INVITED ? "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-800" :
                      "bg-[#FAF9F4] text-gray-700 hover:bg-[#FAF9F4] hover:text-gray-800"
                    }>
                      <div className="flex items-center space-x-1">
                        {getUserStatus(aUser) === ACTIVE ? (
                          <>{t("users.status.active")}</>
                        ) : getUserStatus(aUser) === INVITED ? (
                          <>
                            <Mail className="h-3 w-3 mr-1" />
                            {t("users.status.invited")}
                          </>
                        ) : getUserStatus(aUser) === InvitationStatuses.UNINVITED ? (
                          <>
                          {t("users.status.deactivated")}
                          </>) : (
                          <>{t("users.status.inactive")}</>
                        )}
                      </div>
                    </Badge>
                  </TableCell>
                </TableRow>
                
                {/* Expanded row content - Only User Information card */}
                {expandedRows[aUser.email] && (
                  <TableRow className="bg-[#FAF9F4]">
                    <TableCell colSpan={8} className="py-4">
                      <div className="px-4">
                        {/* Only show User Information card */}
                        <div className="border rounded-md p-4 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-600">{t('users.userInfo')}</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0"
                              onClick={() => handleOpenEditUserModal(aUser)}
                              data-testid="usersTable.editUserButton"
                              disabled={notEditable}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span className="sr-only">{t('common.edit')}</span>
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-normal text-gray-600">{t("users.formName")}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200">{aUser.legalName}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-normal text-gray-600">{t("users.formInitials")}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200">{aUser.initials}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-normal text-gray-600">{t("users.userType")}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200">
                                {aUser.invitationStatus === INVITED ? t("users.waitingForSignIn") : aUser.isExternal ? t("users.external") : t("users.internal")}
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-normal text-gray-600">{t("users.formEmail")}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200">{aUser.email || t("users.notProvided")}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-normal text-gray-600">{t("users.formCompany")}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200">{aUser.companyName || t("users.notProvided")}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-normal text-gray-600">{t("users.formRole")}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200">
                                {hasCapability(aUser.userType, "MANAGE_SITE") 
                                  ? aUser.userType === 'TRIAL_ADMINISTRATOR' 
                                    ? t("users.roleTypes.trialAdmin")
                                    : t("users.roleTypes.administrator")
                                  : hasCapability(aUser.userType, "MANAGE_USERS") 
                                    ? t("users.roleTypes.userManager")
                                    : hasCapability(aUser.userType, "CREATE_DOCUMENTS") 
                                      ? t("users.roleTypes.creator")
                                      : hasCapability(aUser.userType, "COMPLETE_DOCUMENTS") 
                                        ? t("users.roleTypes.collaborator")
                                        : t("users.roleTypes.unkown")}
                              </p>
                            </div>
                          
                            <div className="space-y-2">
                              <Label className="text-sm font-normal text-gray-600">{t("users.formCreatedBy")}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200">{aUser.createdBy || t('admin-user')}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-normal text-gray-600">{t("users.formCreatedDate")}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200">{formatDateFromTimestamp(aUser.createdAt, t) || t('users.notAvailable')}</p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-normal text-gray-600">{t("users.formErsdSignedDate")}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200">
                                {formatDateFromTimestamp(aUser.ersdSigned, t) || t("users.notSigned")}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-normal text-gray-600">{t('microsoft-tenant-name')}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200">
                                {isWaitingForSignIn(aUser) ? 
                                  t("users.waitingForSignIn") : 
                                  (aUser.homeTenantName || t("users.notAvailable"))}
                              </p>
                            </div>

                            <div className="space-y-2 col-span-2">
                              <Label className="text-sm font-normal text-gray-600">{t("users.formMicrosoftUserId")}</Label>
                              <p className="text-sm py-2 px-3 bg-form-field rounded-md border border-gray-200 truncate">
                                {isWaitingForSignIn(aUser) ? 
                                  t("users.waitingForSignIn") : 
                                  (aUser.oid || t("users.notLinked"))}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('user-capabilities')}</Label>
                            <div className="grid grid-cols-1 gap-4">
                              <div className="col-span-1">
                                <div className="flex items-center justify-between p-3 bg-form-field rounded-md border border-gray-200 h-full">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">{t('view-all-documents')}</span>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-4 w-4 info-icon cursor-help" data-testid="usersTable.viewAllDocsTooltipTrigger" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[250px] text-xs">
                                          {t('enabling-this-option-will-allow-this-user-view-access-to-all-docs')}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div>
                                            <Switch
                                              id={`view-all-docs-${aUser.oid}`}
                                              checked={aUser.canAccessAllDocuments || false}
                                              disabled={true}
                                              className="cursor-not-allowed"
                                              data-testid="usersTable.viewAllDocsSwitch"
                                            />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[250px] text-xs">
                                          {t('edit-user-to-change-this-setting')}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                              </div>
                              
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end">
                            {/* Hide Verify Digital Signature button for SITE_ADMINISTRATOR users */}
                            {(hasCapability(userType ? userType : UserType.COLLABORATOR, "MANAGE_ESIGNATURES") && aUser.invitationStatus !== InvitationStatuses.INVITED) && (
                              <Button 
                                variant={aUser.digitalSignatureVerification !== NOT_VERIFIED ? "outline" : "default"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenSignatureDrawer(aUser);
                                }}
                                data-testid="usersTable.verifyDigitalSignatureButton"
                              >
                                {aUser.digitalSignatureVerification !== NOT_VERIFIED ? (
                                  <>
                                    <IconSignature className="mr-2 h-4 w-4 stroke-[1.5]" />
                                    {t('view-verified-digital-signature')}
                                  </>
                                ) : (
                                  <>
                                    <IconSignature className="mr-2 h-4 w-4" />
                                    {t('verify-digital-signature')}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )})
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-40 text-center">
                <p className="text-gray-600">{t('no-users-found')}</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* At the end of the component, add the UserInfoModal */}
      {editingUserForm && (
        <UserInfoModal
          open={editUserModalOpen}
          onOpenChange={setEditUserModalOpen}
          userForm={editingUserForm}
          onSave={handleSaveUserInfo}
          updates={updates}
          setUpdates={setUpdates}
          t={(key: string) => t(key)}
        />
      )}

      {/* Add the Digital Signature Verification Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="p-0 max-w-md w-[450px]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle>{t('digitalSignature.verification')}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-6">
            {selectedUser && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <IconSignature size={16} color="#0E7C3F" />
                  <span className="text-sm font-semibold text-gray-600">
                    {t("users.verificationStatus")}: {
                      selectedUser.digitalSignatureVerification === VERIFIED_MS_USER_ID 
                        ? t("users.verifiedMicrosoft")
                        : selectedUser.digitalSignatureVerification === VERIFIED_IMAGE
                          ? t("users.verifiedImage")
                          : selectedUser.digitalSignatureVerification === VERIFIED_REGISTER_NOTATION
                            ? t("users.verifiedNotation")
                            : t("users.notVerified")
                    }
                  </span>
                </div>

                {selectedUser.digitalSignatureVerification !== NOT_VERIFIED ? (
                  <div>
                    <div className="mt-2 mb-6 p-4 border rounded-md bg-gray-50">
                      {selectedUser.digitalSignatureVerification === VERIFIED_IMAGE && selectedUser.digitalSignatureUrl && (
                        <div className="flex flex-col items-center">
                          <p className="text-sm text-gray-600 mb-2">{t("users.signatureImage")}</p>
                          <div className="max-w-xs max-h-40 overflow-hidden border rounded-md bg-white mb-2">
                            <img 
                              src={selectedUser.digitalSignatureUrl} 
                              alt={t("users.signatureImage")}
                              className="object-contain w-full h-full"
                              style={{ maxHeight: "150px" }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <span className="font-medium mr-1">{t("users.verifiedBy")}:</span>
                            <span>{selectedUser.digitalSignatureVerifiedBy || '—'}</span>
                          </div>
                          {selectedUser.digitalSignatureVerifiedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-medium mr-1">{t("users.verifiedOn")}:</span>
                              <span>{formatVerificationDateTime(selectedUser.digitalSignatureVerifiedAt)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {selectedUser.digitalSignatureVerification === VERIFIED_REGISTER_NOTATION && selectedUser.digitalSignatureNotation && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">{t("users.signatureNotation")}</p>
                          <div className="p-3 bg-white border rounded-md mb-2">
                            <p className="text-sm">{selectedUser.digitalSignatureNotation}</p>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <span className="font-medium mr-1">{t("users.verifiedBy")}:</span>
                            <span>{selectedUser.digitalSignatureVerifiedBy || '—'}</span>
                          </div>
                          {selectedUser.digitalSignatureVerifiedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-medium mr-1">{t("users.verifiedOn")}:</span>
                              <span>{formatVerificationDateTime(selectedUser.digitalSignatureVerifiedAt)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {selectedUser.digitalSignatureVerification === VERIFIED_MS_USER_ID && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">{t("users.microsoftUserId")}</p>
                          <div className="flex items-center space-x-2 p-3 bg-white border rounded-md mb-2">
                            <img src="/microsoft-logo.svg" alt="Microsoft" className="w-5 h-5 mr-2" />
                            <p className="text-sm">{selectedUser.oid}</p>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <span className="font-medium mr-1">{t("users.verifiedBy")}:</span>
                            <span>{selectedUser.digitalSignatureVerifiedBy || '—'}</span>
                          </div>
                          {selectedUser.digitalSignatureVerifiedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-medium mr-1">{t("users.verifiedOn")}:</span>
                              <span>{formatVerificationDateTime(selectedUser.digitalSignatureVerifiedAt)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <Button 
                        variant="outline" 
                        className="text-sm font-normal text-red-700 border-red-300 hover:bg-red-50 hover:text-red-800"
                        onClick={() => {
                          handleRevokeVerification(selectedUser.oid);
                          revokeSelectedUserSignature(selectedUser.oid);
                          setDrawerOpen(false);
                        }}
                        data-testid="usersTable.revokeVerificationButton"
                      >
                        {t("users.revokeVerification")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DigitalSignatureVerification 
                    user={selectedUser}
                    setSelectedUser={setSelectedUser}
                    onVerificationComplete={(verificationType) => {
                      if (selectedUser) {
                        handleVerificationComplete(selectedUser, verificationType);
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>
          <DrawerFooter className="border-t pt-4">
            <DrawerClose asChild>
              <Button variant="outline" data-testid="usersTable.signatureDrawerCloseButton">{t('common.close')}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}