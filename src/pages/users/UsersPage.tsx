"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import {
  ChevronUp,
  PlusCircle,
  Search,
  History,
  HelpCircle
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Import dashboard components
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Import user components
import { UserAuditTrailModal } from "./UserAuditTrailModal"
import { UsersTable } from "./UsersTable"
import { createUser, DocufenUser, InvitationStatuses, LicenseStatuses } from "@/lib/apiUtils"
import { useAccountStore, useAppStore, useUsersStore, useUserStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { DialogDescription } from "@radix-ui/react-dialog"
import { hasCapability, UserType } from "@/lib/authorisation"
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude"
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events"
import { companyNameRegExp, initialsRegExp } from "@/lib/constants"

// Constants for string literals required by DocufenUser type
// These cannot use t() directly due to type constraints
const SIGNATURE_STATUS_NOT_VERIFIED = "Not Verified";
const INVITATION_STATUS_INVITED = "invited";

// Add New User Modal
function AddNewUserModal({ isOpen, setDialogIsOpen }: { isOpen: boolean; setDialogIsOpen: (f: boolean) => void }) {
  const { tenantName, managerType } = useUserStore(useShallow((state) => ({
    tenantName: state.tenantName,
    user: state.user,
    managerType: state.userType,
  })))
  const { setWorking, setWorkingTitle } = useAppStore(useShallow((state) => ({
    setWorking: state.setWorking,
    setWorkingTitle: state.setWorkingTitle,
  })))
  const { users, setUsers } = useUsersStore(useShallow((state) => ({
    users: state.users,
    setUsers: state.setUsers,
  })))
  const { licenseStatus } = useAccountStore(useShallow((state) => ({
    licenseStatus: state.licenseStatus,
  })))
  const { t } = useTranslation();

  // Add state variables to track form values
  const [legalName, setLegalName] = useState('');
  const [emailError, setEmailError] = useState<string>("");
  const [initials, setInitials] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState(UserType.COLLABORATOR);
  const [companyName, setCompanyName] = useState('');
  const [canAccessAllDocuments, setCanAccessAllDocuments] = useState(false);
  const [qualityApprover, setQualityApprover] = useState(false);
  const [qualifiedPerson, setQualifiedPerson] = useState(false);
  const [emailList, setEmailList] = useState<string[]>([]);
  const [userNameError, setUserNameError] = useState<string>("");
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setLegalName('');
      setInitials('');
      setEmail('');
      setUserType(UserType.COLLABORATOR);
      setCompanyName('');
      setCanAccessAllDocuments(false);
      setQualityApprover(false);
      setQualifiedPerson(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const existingEmails = users.map(user => user.email.toLowerCase());
    setEmailList(existingEmails);
  }, [users]);

  // Handle cancel - should close the modal
  const handleCancel = () => {
    setDialogIsOpen(false);
  };

  // Email validation function
  const isValidEmail = (email: string): string => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return "false"
    if (emailList.includes(email.toLowerCase())) return "duplicate";
    else return "true";
  };

  const createNewUser = () => {
    // Validate email before creating user
    if (isValidEmail(email) === "false") {
      setEmailError(t("validation.invalidEmail"));
      return;
    } else if (isValidEmail(email) === "duplicate") {
      setEmailError(t("validation.emailAlreadyExists"));
      return
    } else if (legalName.trim() === "") {
      setUserNameError(t("validation.legalNameRequired"));
      return;
    }
    
    console.log("Creating new user...");
    setDialogIsOpen(false);
    const newUser = {
      email,
      legalName,
      initials,
      userType,
      // tenantDisplayName,
      companyName,
      canAccessAllDocuments,
      qualityApprover,
      qualifiedPerson
    };
    console.log("Creating new user:", JSON.stringify(newUser));
    
    // Track user invitation initiated
    trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_INVITED, {
      invitee_email_domain: email.split('@')[1] || '',
      invitee_role: userType,
      invitee_type: companyName ? 'external' : 'internal',
      invitation_method: 'add_user_modal',
      has_view_all_access: canAccessAllDocuments,
      page_name: 'Users'
    });
    
    setWorking(true)
    setWorkingTitle(t("users.creatingUser"))
    createUser(tenantName, newUser).then((response) => {
      console.log("New user created:", response);
      // Create a temporary user to add to the users list
      if (response !== 0) {
       console.warn("Failed to create new user:", response); 
       
       // Track invitation error
       trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
         error_type: 'user_invitation_failed',
         error_code: response.toString(),
         error_message: `Failed to create user with response code ${response}`,
         error_source: 'AddNewUserModal',
         page_name: 'Users',
         action_attempted: 'invite_user'
       });
       
       setWorking(false)
       return;
      }
      const tempUser: DocufenUser = {
        oid: "", // Temporary ID until the user logs in
        legalName: newUser.legalName,
        initials: newUser.initials,
        userType: newUser.userType,
        email: newUser.email.toLowerCase(),
        companyName: newUser.companyName,
        ersdSigned: 0,
        digitalSignatureVerification: SIGNATURE_STATUS_NOT_VERIFIED,
        invitationStatus: INVITATION_STATUS_INVITED,
        isExternal: false,
        createdAt: Date.now(),
        canAccessAllDocuments: newUser.canAccessAllDocuments,
        qualityApprover: newUser.qualityApprover,
        qualifiedPerson: newUser.qualifiedPerson
      };
      
      // Add the new user to the users list
      setUsers([...users, tempUser]);
      
    }).catch((err) => {
      console.error("Failed to create new user:", err);
      
      // Track invitation error
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
        error_type: 'user_invitation_failed',
        error_code: 'CREATE_USER_ERROR',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        error_source: 'AddNewUserModal',
        page_name: 'Users',
        action_attempted: 'invite_user'
      });
      
      setDialogIsOpen(false);
    }).finally(() => {
      setWorking(false)
    })
  };
  const safeUpdateField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    switch (id) {
      case "legalName":
        setLegalName(value.replace(companyNameRegExp, '')); // Remove special characters
        break;
      case "initials":
        const tmpval = value.replace(initialsRegExp, "").toUpperCase().slice(0,3)
        setInitials(tmpval); // Remove special characters
        break;
      case "email":
        // Only sanitize whitespace and control characters for email
        const sanitizedEmail = value.replace(/[\s\x00-\x1f\x7f]/g, '').toLowerCase();
        setEmail(sanitizedEmail);
        break;
      case "companyName":
        setCompanyName(value.replace(companyNameRegExp, '')); // Remove special characters
        break;
      default:
        console.warn(`Unhandled field update for id: ${id}`);
    }
  }
  const updateUserType = (value: string) => {
    const  newUserType = value as unknown as UserType;
    setUserType(newUserType);
  }
  if (managerType == null) return null
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setDialogIsOpen(false);
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("users.addNewUser")}</DialogTitle>
          <DialogDescription>
            {t("users.addNewUserDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legalName">{t("users.name")} *</Label>
              <Input
                id="legalName"
                data-testid="usersPage.addUserLegalNameInput"
                placeholder={t('UsersPage.fullName')}
                value={legalName}
                onChange={(e) => {
                  const value = e.target.value;
                  const sanitizedValue = value.replace(companyNameRegExp, ''); // Remove special characters
                  setLegalName(sanitizedValue); // Remove special characters
                  
                  // Auto-generate initials when legalName changes
                  if (sanitizedValue) {
                    const nameParts = sanitizedValue.trim().split(" ");
                    let generatedInitials = "";
                    
                    if (nameParts.length >= 2) {
                      // Take first letter of first name and first letter of last name
                      generatedInitials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                    } else if (nameParts.length === 1 && nameParts[0]) {
                      // If only one name, take first letter
                      generatedInitials = nameParts[0][0].toUpperCase();
                    }
                    
                    // Limit to 3 characters
                    generatedInitials = generatedInitials.substring(0, 3);
                    setInitials(generatedInitials);
                  }
                }}
              />
              <div className="text-sm text-red-500">{userNameError}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="initials">{t("users.initials")} *</Label>
              <Input
                id="initials"
                data-testid="usersPage.addUserInitialsInput"
                placeholder={t('UsersPage.initials')}
                value={initials}
                onChange={safeUpdateField}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">{t("users.role")} *</Label>
              <Select
                value={userType.toString()}
                onValueChange={updateUserType}
                data-testid="usersPage.addUserRoleSelect"
              >
                <SelectTrigger data-testid="usersPage.addUserRoleSelectTrigger">
                  <SelectValue placeholder={t("users.role")} />
                </SelectTrigger>
                <SelectContent>
                  { licenseStatus === LicenseStatuses.TRIAL && (
                    <SelectItem disabled={!hasCapability(managerType, "MANAGE_SITE")} value={UserType.TRIAL_ADMINISTRATOR.toString()}>{t("users.roleTypes.trialAdmin")}</SelectItem>
                  )}
                  <SelectItem disabled={!hasCapability(managerType, "MANAGE_SITE")} value={UserType.SITE_ADMINISTRATOR.toString()}>{t("users.roleTypes.administrator")}</SelectItem>
                  <SelectItem disabled={!hasCapability(managerType, "MANAGE_SITE")} value={UserType.USER_MANAGER.toString()}>{t("users.roleTypes.userManager")}</SelectItem>
                  <SelectItem value={UserType.CREATOR.toString()}>{t("users.roleTypes.creator")}</SelectItem>
                  <SelectItem value={UserType.COLLABORATOR.toString()}>{t("users.roleTypes.collaborator")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("users.email")} *</Label>
              <Input
                id="email"
                type="email"
                data-testid="usersPage.addUserEmailInput"
                placeholder={t('UsersPage.emailAddress')}
                value={email}
                onChange={safeUpdateField}
              />
              {emailError && <p className="text-sm text-red-500">{emailError}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">{t("users.formCompany")}</Label>
            <Input
              id="companyName"
              data-testid="usersPage.addUserCompanyNameInput"
              placeholder={t('UsersPage.companyName')}
              value={companyName}
              onChange={safeUpdateField}
            />
          </div>

          {/* New toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="canAccessAllDocuments">
                  {t('UsersPage.viewAllDocuments')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 info-icon cursor-help" data-testid="usersPage.addUserViewAllDocsTooltipTrigger" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">
                    {t('UsersPage.enablingThisOptionGrantsTheUserPermissionToViewAllDocumentsInThisAccountWhenDisabledTheUserWillOnlyHaveAccessToDocumentsSpecificallySharedWithThem')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                id="canAccessAllDocuments"
                data-testid="usersPage.addUserViewAllDocsSwitch"
                checked={canAccessAllDocuments}
                onCheckedChange={setCanAccessAllDocuments}
              />
            </div>

          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={handleCancel} data-testid="usersPage.addUserCancelButton">{t("common.cancel")}</Button>
          <Button className="bg-primary" onClick={createNewUser} data-testid="usersPage.addUserInviteButton">{t("users.invite")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const { t } = useTranslation();

  // State for modals
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const { sidebarOpen, setSidebarOpen } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })))

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // State for users data
  const { users, isUsersLoading: isLoading, error } = useUsersStore(useShallow((state) => ({
    users: state.users,
    isUsersLoading: state.isUsersLoading,
    error: state.error,
  })))

  // State to track expanded rows
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    // Initially all rows are collapsed by default
  });

  // Toggle row expansion
  const toggleRow = (userId: string) => {
    const isExpanding = !expandedRows[userId];
    
    // Track user details viewed
    if (isExpanding) {
      const user = users.find(u => u.oid === userId);
      if (user) {
        trackAmplitudeEvent(AMPLITUDE_EVENTS.USER_DETAILS_VIEWED, {
          viewed_user_role: user.userType,
          viewed_user_type: user.isExternal ? 'external' : 'internal',
          view_source: 'expand_row',
          page_name: 'Users'
        });
      }
    }
    
    setExpandedRows((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // State for pagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset page when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  // Filter users based on active tab and search
  const getFilteredUsers = () => {
    let filtered = useUsersStore.getState().users;

    // First filter by tab
    switch (activeTab) {
      case "internal":
        filtered = filtered.filter((user: DocufenUser) => !user.isExternal && user.invitationStatus !== InvitationStatuses.INACTIVE);
        break;
      case "external":
        filtered = filtered.filter((user: DocufenUser) => user.isExternal && user.invitationStatus !== InvitationStatuses.INACTIVE);
        break;
      case "signature-pending":
        filtered = filtered.filter((user: DocufenUser) => user.digitalSignatureVerification === SIGNATURE_STATUS_NOT_VERIFIED && user.invitationStatus !== InvitationStatuses.INACTIVE);
        break;
      case "deactivated":
        // filtered = [...deletedUsers] as unknown as DocufenUser[];  
        filtered = filtered.filter((user: DocufenUser) => user.invitationStatus === InvitationStatuses.INACTIVE);
        break;
      default:
        filtered = filtered.filter((user: DocufenUser) => user.invitationStatus !== InvitationStatuses.INACTIVE);
    }
    
    // Then filter by search term if it exists
    if (debouncedSearchTerm.trim() !== "") {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((user: DocufenUser) =>
        (user.legalName && user.legalName.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.initials && user.initials.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  };

  const [filteredUsers, setFilteredUsers] = useState<DocufenUser[]>([]);
  const [currentFilteredUsers, setCurrentFilteredUsers] = useState<DocufenUser[]>([]);
  const [filteredTotalPages, setFilteredTotalPages] = useState<number>(0);

  // Use useEffect to update filteredUsers when necessary
  useEffect(() => {
    const newFiltered = getFilteredUsers();
    setFilteredUsers(newFiltered);
    // Reset to first page when search term or tab changes
    setCurrentPage(1);
  }, [activeTab, users, debouncedSearchTerm]);

  useEffect(() => {
    // Calculate pagination values from state
    setFilteredTotalPages(Math.ceil(filteredUsers.length / rowsPerPage));
    const fsi = (currentPage - 1) * rowsPerPage;
    const fei = Math.min(fsi + rowsPerPage, filteredUsers.length);
    const newList = filteredUsers.slice(fsi, fei);
    setCurrentFilteredUsers(newList)
  
  }, [filteredUsers, currentPage, rowsPerPage]);

  // Update the setUsers function to use state setter
  const updateUsers = (updatedUsers: DocufenUser[]) => {
    const userIds = updatedUsers.map(user => user.oid ? user.oid : user.id);
    
    setFilteredUsers(prevUsers => 
      prevUsers.map(user => {
        const userId = user.oid ? user.oid : user.id;
        if (userIds.includes(userId)) {
          return updatedUsers.find(u => (!!u.oid &&u.oid === user.oid) || (!!u.id && u.id === user.id)) || user;
        }
        return user;
      })
    );
  }

  return (
    <SidebarProvider 
      open={sidebarOpen} 
      onOpenChange={setSidebarOpen}
      defaultOpen={true}
    >
      <SidebarLeft />
      <SidebarInset style={{ border: 'none' }} className="flex flex-col h-screen">
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background z-20">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger data-testid="usersPage.sidebarTrigger" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-lg font-medium text-gray-700">
                    {t("users.title")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* User Table with Tabs */}
          <div className="mt-6 px-6 flex-1 flex flex-col">
            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={(value) => {
                // Track tab switch
                trackAmplitudeEvent(AMPLITUDE_EVENTS.TAB_SWITCHED, {
                  from_tab: activeTab,
                  to_tab: value,
                  tab_group: 'users_filter',
                  page_name: 'Users'
                });
                handleTabChange(value);
              }}
              className="w-full flex flex-col h-full"
            >
              {/* Action buttons row on top, aligned to right */}
              <div className="flex justify-end mb-4 gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2" 
                  onClick={() => {
                    trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                      button_name: 'user_audit_trail',
                      button_location: 'users_page_header',
                      page_name: 'Users'
                    });
                    setIsAuditTrailOpen(true)
                  }} 
                  data-testid="usersPage.auditTrailButton"
                >
                  <History className="h-4 w-4" />
                  {t("users.auditTrail")}
                </Button>
                <Button 
                  className="flex items-center gap-2" 
                  onClick={() => {
                    trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                      button_name: 'add_new_user',
                      button_location: 'users_page_header',
                      page_name: 'Users'
                    });
                    setIsAddUserOpen(true)
                  }} 
                  data-testid="usersPage.addNewUserButton"
                >
                  <PlusCircle className="h-4 w-4" />
                  {t("users.addNewUser")}
                </Button>
              </div>

              {/* Second row with tabs and search */}
              <div className="flex items-center justify-between mb-2">
                {/* Mobile view dropdown */}
                <div className="md:hidden">
                  <Label htmlFor="tab-selector" className="sr-only">
                    {t("users.filterBy")}
                  </Label>
                  <Select value={activeTab} onValueChange={handleTabChange} data-testid="usersPage.mobileTabSelect">
                    <SelectTrigger
                      className="flex w-full max-w-[300px]"
                      id="tab-selector"
                      data-testid="usersPage.mobileTabSelectTrigger"
                    >
                      <SelectValue placeholder={t("users.filterBy")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("users.tabs.allUsers")}</SelectItem>
                      <SelectItem value="internal">{t("users.tabs.internal")} ({users.filter((u: DocufenUser) => !u.isExternal && u.invitationStatus !== InvitationStatuses.INACTIVE).length})</SelectItem>
                      <SelectItem value="external">{t("users.tabs.external")} ({users.filter((u: DocufenUser) => u.isExternal && u.invitationStatus !== InvitationStatuses.INACTIVE).length})</SelectItem>
                      <SelectItem value="signature-pending">{t("users.tabs.signaturePending")} ({users.filter((u: DocufenUser) => u.digitalSignatureVerification === SIGNATURE_STATUS_NOT_VERIFIED && u.invitationStatus !== InvitationStatuses.INACTIVE).length})</SelectItem>
                      <SelectItem value="deactivated">{t("users.tabs.deactivated")} {users.filter((u: DocufenUser) => u.invitationStatus === InvitationStatuses.INACTIVE).length}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Desktop view tabs */}
                <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 hidden md:flex overflow-x-auto" data-testid="usersPage.desktopTabsList">
                  <TabsTrigger value="all" data-testid="usersPage.allUsersTab">{t("users.tabs.allUsers")}</TabsTrigger>
                  <TabsTrigger value="internal" data-testid="usersPage.internalUsersTab">
                    {t("users.tabs.internal")} <Badge variant="secondary">{users.filter((u: DocufenUser) => !u.isExternal && u.invitationStatus !== InvitationStatuses.INACTIVE).length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="external" data-testid="usersPage.externalUsersTab">
                    {t("users.tabs.external")} <Badge variant="secondary">{users.filter((u: DocufenUser) => u.isExternal && u.invitationStatus !== InvitationStatuses.INACTIVE).length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="signature-pending" data-testid="usersPage.signaturePendingTab">
                    {t("users.tabs.signaturePending")} <Badge variant="secondary">{users.filter((u: DocufenUser) => u.digitalSignatureVerification === SIGNATURE_STATUS_NOT_VERIFIED && u.invitationStatus !== InvitationStatuses.INACTIVE).length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="deactivated" data-testid="usersPage.deactivatedUsersTab">
                    {t("users.tabs.deactivated")} <Badge variant="secondary">{users.filter((u: DocufenUser) =>  u.invitationStatus === InvitationStatuses.INACTIVE).length}</Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Search field aligned to the right */}
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("users.searchPlaceholder")}
                    className="w-full bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="usersPage.searchInput"
                  />
                </div>
              </div>

              <TabsContent value="all" className="mt-0 flex-1 overflow-hidden">
                <div className="overflow-hidden h-full flex flex-col">
                    <UsersTable
                      users={currentFilteredUsers}
                      setUsers={updateUsers}
                      expandedRows={expandedRows}
                      toggleRow={toggleRow}
                    />
                </div>
              </TabsContent>

              <TabsContent value="internal" className="mt-0 flex-1 overflow-hidden">
                <div className="overflow-hidden h-full flex flex-col">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-gray-600">{t("users.loadingUsers")}</p>
                    </div>
                  ) : error ? (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-red-500">{error}</p>
                    </div>
                  ) : (
                    <UsersTable
                      users={currentFilteredUsers}
                      setUsers={updateUsers}
                      expandedRows={expandedRows}
                      toggleRow={toggleRow}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="external" className="mt-0 flex-1 overflow-hidden">
                <div className="overflow-hidden h-full flex flex-col">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-gray-600">{t("users.loadingUsers")}</p>
                    </div>
                  ) : error ? (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-red-500">{error}</p>
                    </div>
                  ) : (
                    <UsersTable
                      users={currentFilteredUsers}
                      setUsers={updateUsers}
                      expandedRows={expandedRows}
                      toggleRow={toggleRow}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="signature-pending" className="mt-0 flex-1 overflow-hidden">
                <div className="overflow-hidden h-full flex flex-col">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-gray-600">{t("users.loadingUsers")}</p>
                    </div>
                  ) : error ? (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-red-500">{error}</p>
                    </div>
                  ) : (
                    <UsersTable
                      users={currentFilteredUsers}
                      setUsers={updateUsers}
                      expandedRows={expandedRows}
                      toggleRow={toggleRow}
                    />
                  )}
                </div>
              </TabsContent>
              <TabsContent value="deactivated" className="mt-0 flex-1 overflow-hidden">
                <div className="overflow-hidden h-full flex flex-col">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-gray-600">{t("users.loadingUsers")}</p>
                    </div>
                  ) : error ? (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-red-500">{error}</p>
                    </div>
                  ) : (
                    <UsersTable
                      users={currentFilteredUsers}
                      setUsers={updateUsers}
                      expandedRows={expandedRows}
                      toggleRow={toggleRow}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Pagination */}
            <div className="flex items-center justify-between px-0 my-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-gray-600">{t("users.pagination.rowsPerPage")}</span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value: string) => setRowsPerPage(Number(value))}
                  data-testid="usersPage.rowsPerPageSelect"
                >
                  <SelectTrigger className="w-16 text-sm font-normal text-gray-600" data-testid="usersPage.rowsPerPageSelectTrigger">
                    <SelectValue placeholder={rowsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-sm font-normal text-gray-600">
                  {filteredUsers.length > 0 ? t("common.pageXofY", { current: currentPage, total: filteredTotalPages }) : "0 results"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === 1 || filteredUsers.length === 0}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  data-testid="usersPage.previousPageButton"
                >
                  <ChevronUp className="h-4 w-4 -rotate-90" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === filteredTotalPages || filteredUsers.length === 0}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  data-testid="usersPage.nextPageButton"
                >
                  <ChevronUp className="h-4 w-4 rotate-90" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Modals */}
      <UserAuditTrailModal
        isOpen={isAuditTrailOpen}
        onClose={() => setIsAuditTrailOpen(false)}
      />

      <AddNewUserModal
        isOpen={isAddUserOpen}
        setDialogIsOpen={setIsAddUserOpen}
      />
    </SidebarProvider>
  );
}