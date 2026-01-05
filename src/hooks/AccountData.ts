import { AccountResponse, CompanyInfo, DocufenUser, DocumentsListResult, fetchAccountData, fetchDocumentsList, getUsersData, UsersDataJson } from "@/lib/apiUtils";
import { useAccountStore, useDocumentsStore, useUsersStore, useUserStore } from "@/lib/stateManagement";
import React from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";

// Export a function to refresh recent documents
export const refreshRecentDocuments = async (tenantName: string) => {
  const { updateRecentDocuments } = useDocumentsStore.getState();
  try {
    // Request 10 recent documents
    const result = await fetchDocumentsList(tenantName, "all", 1, 10, true);
    
    if (result && result.documents) {
      // Ensure we don't get more than 10 documents for recents
      const limitedDocuments = result.documents.slice(0, 10);
      console.log(`Refreshing sidebar with ${limitedDocuments.length} documents`);
      updateRecentDocuments(limitedDocuments);
    }
  } catch (error) {
    console.error("Error refreshing recent documents:", error);
  }
};

// Export a unified function to refresh all document lists
export const refreshAllDocumentsLists = async (tenantName: string) => {
  const { 
    setDocuments, 
    updateRecentDocuments, 
    setTotalPages,
    activeTab,
    currentPage,
    rowsPerPage
  } = useDocumentsStore.getState();
  
  console.log("Refreshing all document lists...");
  
  try {
    // First, refresh the main documents list
    const mainListResult = await fetchDocumentsList(tenantName, activeTab, currentPage, rowsPerPage, true);
    if (mainListResult && mainListResult.documents) {
      console.log(`Refreshed main documents list with ${mainListResult.documents.length} documents`);
      setDocuments(mainListResult.documents);
      setTotalPages(Math.ceil(mainListResult.numberOfDocuments / rowsPerPage));
    }
    
    // Then, refresh the recent documents in sidebar
    const recentsResult = await fetchDocumentsList(tenantName, "all", 1, 10, true);
    if (recentsResult && recentsResult.documents) {
      const limitedDocuments = recentsResult.documents.slice(0, 10);
      console.log(`Refreshed sidebar with ${limitedDocuments.length} documents`);
      updateRecentDocuments(limitedDocuments);
    }
    
    return true;
  } catch (error) {
    console.error("Error refreshing document lists:", error);
    return false;
  }
};

export default function useAccountData() {
  const { i18n } = useTranslation()
  const [ready, setReady] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const { setUsers, setIsUsersLoading } = useUsersStore(useShallow((state) => ({
    setUsers: state.setUsers,
    setIsUsersLoading: state.setIsUsersLoading,
  })))
  const { t } = useTranslation()
  // const { getTemplates } = useTemplateStore(useShallow((state) => ({
  //   getTemplates: state.getTemplates,
  // })))
  const { user, tenantName, userType } = useUserStore(useShallow((state) => ({ 
    user: state.user, tenantName: state.tenantName,
    userType: state.userType,
  })))
  const { companyInfo, setCompanyInfo } 
    = useAccountStore(useShallow((state) => ({
      companyInfo: state.companyInfo,
      setCompanyInfo: state.setCompanyInfo,
    })))
  const { setDocuments, updateRecentDocuments, setTotalPages,
    currentPage, rowsPerPage, activeTab } = useDocumentsStore(useShallow((state) => ({
    setDocuments: state.setDocuments,
    updateRecentDocuments: state.updateRecentDocuments,
    documents: state.documents,
    activeDocumentId: state.activeDocumentId,
    setActiveDocumentId: state.setActiveDocumentId,
    currentPage: state.currentPage,
    setCurrentPage: state.setCurrentPage,
    setRowsPerPage: state.setRowsPerPage,
    rowsPerPage: state.rowsPerPage,
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab,
    setTotalPages: state.setTotalPages
  })))


  const callGetUsersData = async () => {
    try {
      if (user == null || tenantName == null) return
      setIsUsersLoading(true);
      getUsersData().then((data: UsersDataJson) => {
        const processedUsers: DocufenUser[] = data.users.map(user => ({
          ...user,
          digitalSignatureVerification: user.digitalSignatureVerification as DocufenUser['digitalSignatureVerification']
        }));
        
        // Get current users to check for temporary users we need to merge
        const currentUsers = useUsersStore.getState().users;
        
        // Find temporary users (those with oid starting with 'temp-')
        const tempUsers = currentUsers.filter(user => user.oid.toString().startsWith('temp-'));
        
        // Check for each temp user if we now have a real user with the same email
        let mergedUsers = [...processedUsers];
        
        if (tempUsers.length > 0) {
          // For each temporary user, check if we need to remove it
          const emails = processedUsers.map(u => u.email?.toLowerCase());
          
          // Filter out temp users that now have corresponding real users
          const tempUsersToKeep = tempUsers.filter(tempUser => 
            !emails.includes(tempUser.email?.toLowerCase())
          );
          
          // Add the temp users that don't have corresponding real users yet
          mergedUsers = [...processedUsers, ...tempUsersToKeep];
        }
        setUsers(mergedUsers);
        setIsUsersLoading(false);
      }).catch((err: unknown) => {
        if (err instanceof Error) {
          console.error("Error loading user data:", err.message);
          setError("Failed to load user data. Please try refreshing the page.");
        } else {
          console.error("An unknown error occurred while loading user data:", JSON.stringify(err));
          setError("An unknown error occurred while loading user data: " + JSON.stringify(err));
        }
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error fetching users data: " + error.message)
        setError(error.message)
      } else {
        console.error("An unknown error occurred while fetching users data: " + JSON.stringify(error))
        setError(t('error.anUnknownErrorOccurredWhileFetchingUsersData') + JSON.stringify(error))
      }
    }
  }
  const callFetchAccountData = async (tenantName: string) => {
    try {
      const data: AccountResponse = await fetchAccountData(tenantName)
      if (data.code !== 200 || data.data == null) {
        console.log("Error fetching account data: ")
        return
      }
      const companyInfo: CompanyInfo = data.data
      console.log("Company info: " + JSON.stringify(companyInfo))
      if (companyInfo == null || companyInfo.locale == null || companyInfo.locale.length === 0) {
        console.warn("Error fetching account data: " + JSON.stringify(data))
        return
      }
      setCompanyInfo(companyInfo)
      // console.log("Set admin Contacts and company Info: " + JSON.stringify(companyInfo))
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error fetching account data: " + error.message)
        setError(error.message)
      } else {
        console.error(t('error.anUnknownErrorOccurredWhileFetchingAccountData') + JSON.stringify(error))
        setError(t('error.anUnknownErrorOccurredWhileFetchingAccountData') + JSON.stringify(error))
      }
    }
  }


  React.useEffect(() => {
    if (user == null) return
    const lng = companyInfo?.locale ? companyInfo.locale[0] : ""
    if (lng == null || lng.length === 0) return
    
    // Check if debug mode is enabled - don't change language if it is
    if (localStorage.getItem('i18nextDebugMode') === 'true') {
      console.log("Not changing language because debug mode is enabled");
      return;
    }
    
    i18n.changeLanguage(lng).then(() => {
      console.log("Language changed to: " + lng)
    }).catch((error: unknown) => {
      if (error instanceof Error) {
        console.error("Error changing language: " + error.message)
      }
    })
  }, [companyInfo])

  React.useEffect(() => {
    if (user == null || userType == null || tenantName == null) return
    Promise.allSettled([
      callFetchAccountData(tenantName),
      callGetUsersData(),
      // getTemplates(tenantName)
      // callGetSystemLogs(),
    ]).finally(() => {
      setReady(true)
    })
  }, [user, tenantName, userType])

  React.useEffect(() => {
    if (user == null) return
    
    // Check if there's a refresh parameter in the URL
    const urlSearchParams = new URLSearchParams(window.location.search);
    const refreshParam = urlSearchParams.get('refresh');
    const shouldBustCache = refreshParam !== null;
    
    console.log(`Fetching documents for page ${currentPage}, rows: ${rowsPerPage}, tab: ${activeTab}`);
    
    fetchDocumentsList(tenantName, activeTab, currentPage, rowsPerPage, shouldBustCache).then((documentsResult: DocumentsListResult) => {
      console.log("Documents loaded from API:", documentsResult.documents.length)
      
      // Add a check to ensure we're not getting more documents than requested
      if (documentsResult.documents.length > rowsPerPage) {
        console.warn(`Warning: API returned ${documentsResult.documents.length} documents when ${rowsPerPage} were requested. Limiting the results.`);
        documentsResult.documents = documentsResult.documents.slice(0, rowsPerPage);
      }
      
      const loadedDocuments = documentsResult.documents
      // Update documents in the context
      setDocuments(loadedDocuments);
      setTotalPages(Math.ceil(documentsResult.numberOfDocuments / rowsPerPage))

      console.log("Documents loaded:", loadedDocuments.length)
      // Update recent documents in the sidebar
      updateRecentDocuments(loadedDocuments);
    }).catch((err: unknown) => {
      if (err instanceof Error) {
        console.error("Error loading documents:", err.message);
      }
    })
  }, [activeTab, currentPage, rowsPerPage, setDocuments, setTotalPages, tenantName, updateRecentDocuments]);
  
  return { ready, error }
}