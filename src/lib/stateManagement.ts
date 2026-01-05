import { create } from 'zustand'
import { User, UserTenantProps } from './User'
import { ActionType, ControlledCopyItem, IAuditLogItem, ParentDocument, Verifications } from '../components/editor/lib/AuditLogItem'
import { DocumentEditor } from '@syncfusion/ej2-react-documenteditor'
import { SERVERURL } from '@/lib/server'
import { ActiveTab, ChatMessage, checkLoggedIn, CompanyInfo, DocufenUser,
  DocumentDescription, GroupTitles, IDigitalSignatureVerification, LicenseStatus, LicenseStatuses, logoutUser,
  Participant, ParticipantGroup, updateParticipantGroups, VerificationTypes } from '@/lib/apiUtils'
import { DateTime } from 'luxon'
import { formatDatetimeString } from '@/lib/dateUtils'
import { Stage } from '@/components/editor/lib/lifecycle'
import { TFunction } from "i18next"
import { IconSignature } from '@tabler/icons-react'
import React from 'react'
import { ClipboardPen, Eye, User as UserIcon } from 'lucide-react'
// import { Template, TemplatesResponse } from './types/documents'
// import { fetchTemplates } from './formApiUtils'
import { UserType } from './authorisation'
import { checkDocumentNotStale, triggerReloadDocument } from '@/components/editor/lib/editUtils'


// export interface TemplateStore {
//   deviationTemplate: Template | null
//   setDeviationTemplate: (template: Template | null) => void
//   nonConformanceTemplate: Template | nulls
//   setNonConformanceTemplate: (template: Template | null) => void
//   getTemplates: (tenantName: string) => Promise<void>
// }
export interface StoreAttachment {
  id: string;
  name: string;
  number: number;
  url: string;
  fileType: "pdf" | "image" | "video" | "document";
  fileHash?: string;
  attachedBy: string;
  attachedOn: string;
  verifications?: Array<string>; //changed to match server data Array<{user: string, date: string}> is claudes verifications format date is never used
}

export interface DocumentStore {
  documentId: string
  pdfUrl: string
  reloadTrigger: number
  reloadSelection: string[]
  reloadingDoc: boolean
  setReloadingDoc: (reloadingDoc: boolean) => void
  setReloadSelection: (offsets: string[]) => void
  triggerReload: () => void
  setPdfUrl: (pdfUrl: string) => void
  setDocumentId: (documentId: string) => void
  attachmentNumber: number
  setAttachmentNumber: (attachmentNumber: number) => void
  attachments: StoreAttachment[]
  addAttachment: (attachment: Omit<StoreAttachment, 'id'>) => void
  updateAttachment: (number: number, updates: Partial<StoreAttachment>) => void
  getAttachmentByNumber: (number: number) => StoreAttachment | undefined
  updateVerifications: () => void
  clearAttachments: () => void
  verifications: Verifications
  setVerifications: (verifications: Verifications) => void
  markerCounter: number
  setMarkerCounter: (markerCounter: number) => void
  postApprovalSignature: boolean
  setPostApprovalSignature: (postApprovalSignature: boolean) => void
  documentType: string
  setDocumentType: (documentType: string) => void
  timezone: string
  setTimezone: (timezone: string) => void
  body: string
  setBody: (body: string) => void
  documentStage: Stage
  setDocumentStage: (documentStage: number) => void
  editedBy: string
  setEditedBy: (editedBy: string) => void
  editedAt: string
  setEditedAt: (editedAt: string) => void
  editTime: number;
  setEditTime: (editTime: number) => void;
  documentName: string
  setDocumentName: (documentName: string) => void
  tenantName: string
  setTenantName: (tenantName: string) => void
  documentLanguage: string
  setDocumentLanguage: (documentLanguage: string) => void
  documentLanguages: string[]
  setDocumentLanguages: (documentLanguages: string[]) => void
  commentsList: string[]
  setCommentsList: (commentsList: string[]) => void
  addComment: (comment: string) => void
  deleteComment: (idx: number) => void
  emptyCellCount: number
  setEmptyCellCount: (emptyCellCount: number) => void
  locale: string
  setLocale: (locale: string) => void
  updateDocumentState: (state: IAuditLogItem, t: TFunction) => void
  activeChildren: ControlledCopyItem[]
  nChildren: number
  setNChildren: (nChildren: number) => void
  parentDocument: ParentDocument
  documentDescription: DocumentDescription | null
  setDocumentDescription: (documentDescription: DocumentDescription | null) => void
  participantGroups: ParticipantGroup[]
  setParticipantGroups: (participantGroups: ParticipantGroup[]) => void
  saveParticipantGroups: (participantGroups: ParticipantGroup[], editedGroupIndex: number) => Promise<void>
  resetParticipantGroups: () => void
  documentHasContent: boolean
  setDocumentHasContent: (documentHasContent: boolean) => void
}

export interface UserStore {
  user: User | null
  ersdSigned: number
  setErsdSigned: (ersdSigned: number) => void
  digitalSignatureVerification: IDigitalSignatureVerification
  setDigitalSignatureVerification: (digitalSignatureVerification: IDigitalSignatureVerification) => void
  participant: Participant | null
  setUser: (userData: User | null) => void
  initials: string
  avatar: string
  legalName: string
  // locale: string
  tenants: { [key: string]: UserTenantProps }
  // setLocale: (locale: string) => void
  userType: UserType | null
  setUserType: (userType: UserType | null) => void
  tenantName: string
  setTenantName: (tenantName: string) => void
  homeTenantName: string
  // setTenantDisplayName: (tenantDisplayName: string) => void
  logout: () => Promise<void>
  login: (tenantName:  string, newUrl?: string) => void
  setUserCompanyLogo: (logo: string | null) => void
  canAccessAllDocuments: boolean
  setCanViewAllDocuments: (canAccessAllDocuments: boolean) => void
  showEveryonesDocuments: boolean
  setShowEveryonesDocuments: (showEveryonesDocuments: boolean) => void
  connectorsEnabled: boolean
  setConnectorsEnabled: (connectorsEnabled: boolean) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  maintenanceMode: boolean
  setMaintenanceMode: (maintenanceMode: boolean) => void
  fetchUser: () => Promise<boolean>
  isAttemptingLogin: boolean,
  setIsAttemptingLogin: (value: boolean) => void
}

export interface AppStore {
  editor: DocumentEditor | null
  setEditor: (editor: DocumentEditor) => void
  // container: DocumentEditorContainerComponent | null
  // setContainer: (editor: DocumentEditorContainerComponent) => void
  sidebarOpen: boolean
  setSidebarOpen: (sidebarOpen: boolean) => void
  working: boolean
  setWorking: (working: boolean) => void
  workingTitle: string
  setWorkingTitle: (workingTitle: string) => void
  insertAtCursor: boolean
  setInsertAtCursor: (insertAtCursor: boolean) => void
  workingMessage: string
  setWorkingMessage: (workingMessage: string) => void
  showList: boolean
  setShowList: (showList: boolean) => void
  version: string
  selectionMode: "edit" | "select" | 'search' // Determines what happens when a cell is clicked
  setSelectionMode: (selectionMode: "edit" | "select" | 'search') => void
  selectMode: "select" | "deselect" // Determines whether we are selecting or deselecting (within the select selectionMode)
  setSelectMode: (selectMode: "select" | "deselect") => void
  insertIntoCellDialogShowing: boolean
  showInsertIntoCellDialog: () => void
  hideInsertIntoCellDialog: () => void
  // toggleInsertIntoCellDialog: () => void
  // showInsertIntoCellDialog: boolean
  clickLocation: { top: number; left: number }
  setClickLocation: (clickLocation: { top: number; left: number }) => void
  savedClickLocation: { top: number; left: number }
  setSavedClickLocation: (savedlickLocation: { top: number; left: number }) => void,
  selectedCells: { [key: string]: string }
  setSelectedCells: (selectedCells: {[key: string]: string}) => void
  selectedCellsCount: number
  addSelectedCell: (cellIndex: string, color: string) => void;
  removeSelectedCell: (cellIndex: string) => void;
  clearSelectedCells: () => void;
  previousCellIndex: string
  setPreviousCellIndex: (previousCellIndex: string) => void
  previousCellColour: string
  setPreviousCellColour: (previousCellColour: string) => void
  selectionMade: number
  setSelectionIsMade: () => void
  setSelectionIsNotMade: () => void
  // setSelectionMade: (selectionMade: number) => void
  // Comment management
  // toggleComments: (() => void) | null
  // setToggleComments: (toggleComments: () => void) => void
  // runTask: () => void
  // setRunTask: (task: () => void) => void
}

const makeUserStoreFromTenant = (tenantName: string, tenants: { [key: string]: UserTenantProps }) => {
  if (tenants != null && tenants[tenantName] != null) {
    const tenantProps = tenants[tenantName]
    const userType = tenantProps.userType
    const canAccessAllDocuments = tenantProps.canAccessAllDocuments
    const showEveryonesDocuments = tenantProps.showEveryonesDocuments != null ? tenantProps.showEveryonesDocuments : false
    const connectorsEnabled = tenantProps.connectorsEnabled != null ? tenantProps.connectorsEnabled : false
    const initials = tenantProps.initials != null ? tenantProps.initials : ""
    const legalName = tenantProps.legalName != null ? tenantProps.legalName : ""
    const ersdSigned = tenantProps.ersdSigned != null ? tenantProps.ersdSigned : 0
    const tenantDisplayName = tenantProps.tenantDisplayName != null ? tenantProps.tenantDisplayName : ""
    const companyName = tenantProps.companyName != null ? tenantProps.companyName : ""
    const logo = tenantProps.logo != null ? tenantProps.logo : ""
    const digitalSignatureVerification = tenantProps.digitalSignatureVerification != null ? tenantProps.digitalSignatureVerification : VerificationTypes.NOT_VERIFIED

    return { initials, legalName, userType, ersdSigned, tenantName, tenants, tenantDisplayName,
      companyName, logo, canAccessAllDocuments, showEveryonesDocuments, connectorsEnabled, digitalSignatureVerification }
  } else {
    console.warn("No tenant found for user in makeUserStoreFromTenant: " + JSON.stringify(tenants))
    return { initials: "", legalName: "", userType: null, ersdSigned: 0, tenantName }
  }
}
const makeUserStoreFromUser = (user: User | null) => {
  // console.log("Fetched user: " + JSON.stringify(user))
  if (user == null || user.tenantName == null) {
    return { user, initials: "", legalName: "", userType: null, ersdSigned: 0 }
  }
  const tenantName = user.tenantName ? user.tenantName : user.homeTenantName ? user.homeTenantName : "unknown"
  const tenants = { ...user.tenants }
  const avatar = user.avatar != null ? user.avatar : ""
  const tenantProps = tenants[tenantName] ? tenants[tenantName] : {} as UserTenantProps
  const legalName = tenantProps.legalName != null ? tenantProps.legalName : ""
  const initials = tenantProps.initials != null ? tenantProps.initials : ""
  const participant = {
    id: user.userId,
    email: user.email,
    name: `${legalName} (${initials})`
  }
  return { user, participant, avatar, ...makeUserStoreFromTenant(tenantName, tenants), homeTenantName: user.homeTenantName || "" }
}

// export const useTemplateStore = create<TemplateStore>((set) => ({
//   deviationTemplate: null,
//   setDeviationTemplate: (template: Template | null) => set({ deviationTemplate: template }),
//   nonConformanceTemplate: null,
//   setNonConformanceTemplate: (template: Template | null) => set({ nonConformanceTemplate: template }),
//   getTemplates: async (tenantName: string) => {
//     fetchTemplates(tenantName).then((templates: TemplatesResponse) => {
//       if (templates.success) {
//         let deviationTemplate: Template | null = null
//         let nonConformanceTemplate: Template | null = null
//         const templateList = templates.templates
//         templateList.forEach((template: Template) => {
//           console.log("Fetched template:", template.documentType)
//           if (template.documentType === "deviation") {
//             deviationTemplate = template
//           } else if (template.documentType === "nonconformance") {
//             nonConformanceTemplate = template
//           }
//         })
//         set({ deviationTemplate, nonConformanceTemplate })
//       } else {
//         console.error("Error fetching templates:", templates.error)
//       }
//     }).catch((err: unknown) => {
//       if (err instanceof Error) {
//         console.error("Error fetching templates:", err.message)
//       } else {
//         console.error("Error fetching templates:", err)
//       }
//     })
//   }
// }))

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  setErsdSigned: (ersdSigned: number) => set({ ersdSigned }),
  participant: null,
  initials: "",
  legalName: "",
  digitalSignatureVerification: VerificationTypes.NOT_VERIFIED,
  setDigitalSignatureVerification: (digitalSignatureVerification: IDigitalSignatureVerification) => set({ digitalSignatureVerification }),
  userType: null,
  avatar: "",
  ersdSigned: 0,
  // locale: "en-US",
  tenantName: "",
  homeTenantName: "",
  tenants: {},
  canAccessAllDocuments: false,
  setCanViewAllDocuments: (canAccessAllDocuments: boolean) => set({ canAccessAllDocuments }),
  showEveryonesDocuments: false,
  setShowEveryonesDocuments: (showEveryonesDocuments: boolean) => set({ showEveryonesDocuments }),
  connectorsEnabled: false,
  setConnectorsEnabled: (connectorsEnabled: boolean) => set({ connectorsEnabled }),
  setUserType: (userType: UserType | null) => set({ userType }),
  // setTenantDisplayName: (tenantDisplayName: string) => set({ tenantDisplayName }),
  setTenantName: (tenantName: string) => {
    let tenants: { [key: string]: UserTenantProps } = {}
    const user = get().user
    if (user == null) {
      set({ user: null })
      return
    }
    tenants = user.tenants
    if (tenants[tenantName] == null) {
      console.warn("Deleting No tenant found")
      window.location.reload()
    } else {
      const tenantData = makeUserStoreFromTenant(tenantName, tenants)
      const avatar = user.avatar != null ? user.avatar : ""
      
      // Log logo information before setting state
      
      set({ avatar, ...tenantData })
    }
  },
  setUserCompanyLogo: (logo: string | null) => {
    const user = get().user
    if (user == null) {
      console.warn("No user found to set company logo")
      return
    }
    const tenantName = user.tenantName
    const tenants = user.tenants
    if (tenants[tenantName] == null) {
      return
    }
    const tenantProps: UserTenantProps = tenants[tenantName]
    tenantProps.logo = logo
    set({ user: { ...user, tenants } })
  },
  // setLocale: (locale: string) => set({ locale }),
  setUser: (userData: User | null) => {
    set(() => {
      const userStoreData = makeUserStoreFromUser(userData)
      return userStoreData
    })
  },
  sus: "docufen",
  loading: false,
  setLoading: (loading: boolean) => set({ loading }),
  maintenanceMode: false,
  setMaintenanceMode: (maintenanceMode: boolean) => set({ maintenanceMode }),
  fetchUser: async function(): Promise<boolean> {
    try {
      if (get().loading) return false
      set({ loading: true })
      const companyInfo = useAccountStore.getState().companyInfo
      const locale = Array.isArray(companyInfo.locale) ? companyInfo.locale[0] : companyInfo.locale || 'en'
      const { data, ok, maintenanceMode } = await checkLoggedIn(locale)
      if (ok) {
        const userStoreData = makeUserStoreFromUser(data)
        set({ ...userStoreData, loading: false, maintenanceMode: maintenanceMode || false })
        return true
      } else {
        set({ user: null, loading: false, maintenanceMode: maintenanceMode || false })
        return false
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("error fetching user: " + error.message);
      } else {
        console.error("error fetching user: " + JSON.stringify(error));
      }
      set({ user: null, loading: false })
      return true
    }
  },
  login: function(tenantName: string, newURL?: string) {
    // set({ loading: true })
    const host = window.location.protocol + "//" + window.location.host
    const currentPath = window.location.pathname
    const currentQuery = window.location.search
    
    // Check if debug mode is enabled to preserve it in the URL
    const preserveDebugMode = localStorage.getItem('i18nextDebugMode') === 'true'
    const debugParam = preserveDebugMode ? (currentQuery.includes('?') ? '&lng=sw' : '?lng=sw') : ''
    
    let currentUrl = host + currentPath + currentQuery
    if (currentPath !== '/login') {
      currentUrl = host + currentPath + currentQuery
    } else {
      currentUrl = host + "/home" + debugParam
    }
    // console.log("currentUrl: " + newURL)
    if (newURL) {
      // Add lng=sw parameter to newURL if needed
      const hasQueryParam = newURL.includes('?')
      const debugForNewUrl = preserveDebugMode ? (hasQueryParam ? '&lng=sw' : '?lng=sw') : ''
      currentUrl = host + newURL + debugForNewUrl
    }
    // console.log("Redirecting to login????")
    // console.log("currentUrl: " + currentUrl)

    const loginURL = `${SERVERURL}login/${tenantName}?url=${encodeURIComponent(currentUrl)}`
    window.location.href = loginURL;
  },
  logout: async () => {
    await logoutUser()
    set({ user: null })
  },
  isAttemptingLogin: false,
  setIsAttemptingLogin: (value: boolean) => set({ isAttemptingLogin: value }),
}))



export interface FavoriteItem {
  id: string;
  documentName: string;
  url: string;
  stage: Stage;
  forceLogout?: boolean
  emoji?: string;
  icon?: React.ComponentType<{ className?: string }>;
}
export interface DocumentDescriptionWithUrl extends DocumentDescription {
  url: string;
}
export interface UsersStore {
  users: DocufenUser[]
  // deletedUsers: DocufenUser[]
  // setDeletedUsers: (deletedUsers: DocufenUser[]) => void
  setUsers: (userList: DocufenUser[]) => void
  updateUser: (partialUser: Partial<DocufenUser> & { oid: string }) => void
  isUsersLoading: boolean
  setIsUsersLoading: (isUsersLoading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}
export const useUsersStore = create<UsersStore>((set) => ({
  users: [],
  // deletedUsers: [],
  // setDeletedUsers: (deletedUsers: DocufenUser[]) => set({ deletedUsers }),
  setUsers: (userList: DocufenUser[]) => set({ users: userList }),
  isUsersLoading: true,
  setIsUsersLoading: (isUsersLoading: boolean) => set({ isUsersLoading }),
  error: null,
  setError: (error: string | null) => set({ error }),
  updateUser: (userProps: Partial<DocufenUser> & { oid: string }) => set((state) => {
    const thisUserIndex = state.users.findIndex((u: DocufenUser) => u.oid === userProps.oid)
    const thisUser = state.users[thisUserIndex]
    const updatedUser = { ...thisUser, ...userProps }
    const refreshedUsers = state.users.map((u: DocufenUser) => {
      if (u.oid === updatedUser.oid) {
        return updatedUser;
      }
      return u;
    });
    return { users: refreshedUsers}
  }) 
}))
export interface DocumentsStore {
  documents: DocumentDescription[];
  activeDocument: DocumentDescription | null;
  setDocuments: (documents: DocumentDescription[]) => void;
  recentDocuments: FavoriteItem[];
  totalPages: number;
  setTotalPages: (totalPages: number) => void;
  activeTab: ActiveTab;
  setActiveTab: (activeTab: ActiveTab) => void;
  setRecentDocuments: (recentDocuments: FavoriteItem[]) => void;
  updateRecentDocuments: (documents: DocumentDescription[]) => void;
  addNewDocument: (newDocument: DocumentDescription) => void;
  activeDocumentId: string | null;
  setActiveDocumentId: (id: string | null) => void;
  currentPage: number;
  setCurrentPage: (currentPage: number | ((p: number) => number)) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
}
export const useDocumentsStore = create<DocumentsStore>((set, get) => ({
  documents: [],
  setDocuments: (documents: DocumentDescription[]) => set({ documents }),
  totalPages: 0,
  setTotalPages: (totalPages: number) => set({ totalPages }),
  activeTab: "all",
  setActiveTab: (activeTab: ActiveTab) => set({ activeTab }), 
  currentPage: 1,
  setCurrentPage: (currentPage: number | ((num: number) => number)) => {
    if (typeof currentPage === "function") {
      currentPage = currentPage(get().currentPage)
    }
    set({ currentPage })
  },
  rowsPerPage: 10,
  setRowsPerPage: (rowsPerPage: number) => set({ rowsPerPage }),
  recentDocuments: [],
  setRecentDocuments: (recentDocuments: FavoriteItem[]) => set({ recentDocuments }),
  updateRecentDocuments: (documents: DocumentDescription[]) => {
    const keyList: string[] = []
    const recentList: (FavoriteItem | null)[] = documents.map((doc) => {
      if (doc == null || doc.id == null) return null
      if (keyList.includes(doc.id)) return null
      keyList.push(doc.id)
      return {
        id: doc.id,
        documentName: doc.documentName,
        url: `/document/${doc.id}`,
        stage: doc.stage,
      } as FavoriteItem
    })
    
    // Filter out nulls and ensure we don't have more than 10 recent documents
    const filteredRecents = recentList
      .filter((doc: FavoriteItem | null) => doc != null)
      .slice(0, 10) as FavoriteItem[];
    
    set({ recentDocuments: filteredRecents })
  },
  addNewDocument: (newDocument: DocumentDescription) => set((state) => {
    const newDocuments = [newDocument, ...state.documents]
    get().updateRecentDocuments(newDocuments)
    return { documents: newDocuments }
  }),
  activeDocumentId: null,
  activeDocument: null,
  setActiveDocumentId: (id: string | null) => {
    const activeDocument = get().documents.find((doc) => doc.id === id)
    if (activeDocument) {
      set({ activeDocumentId: id, activeDocument })
    } else {
      set({ activeDocumentId: id, activeDocument: null })
    }
  }
}))

export const useAppStore = create<AppStore>((set) => ({
  editor: null,
  setEditor: (editor: DocumentEditor) => set({ editor }),
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen: boolean) => set({ sidebarOpen }),
  working: false,
  setWorking: (working: boolean) => set({ working }),
  workingTitle: "",
  insertAtCursor: false,
  setInsertAtCursor: (insertAtCursor: boolean) => set({ insertAtCursor }),
  setWorkingTitle: (workingTitle: string) => set({ workingTitle }),
  workingMessage: "",
  setWorkingMessage: (workingMessage: string) => set({ workingMessage }),
  showList: false,
  setShowList: (showList: boolean) => set({ showList }),
  selectionMode: "edit",
  setSelectionMode: (selectionMode: "edit" | "select" | 'search') => set({ selectionMode }),
  selectMode: "select",
  setSelectMode: (selectMode: "select" | "deselect") => set({ selectMode }),
  version: "v1.0.6",
  insertIntoCellDialogShowing: false,
  // toggleInsertIntoCellDialog: () => set((state: { insertIntoCellDialogShowing: boolean }) => ({ insertIntoCellDialogShowing: !state.insertIntoCellDialogShowing })),
  showInsertIntoCellDialog: () => set({ insertIntoCellDialogShowing: true }),
  hideInsertIntoCellDialog: () => set({ insertIntoCellDialogShowing: false }),
  clickLocation: { top: 300, left: 600 },
  setClickLocation: (clickLocation: { top: number; left: number }) => set({ clickLocation }),
  savedClickLocation: { top: 0, left: 0 },
  setSavedClickLocation: (savedClickLocation: { top: number; left: number }) => set({ savedClickLocation }),
  previousCellIndex: "",
  setPreviousCellIndex: (previousCellIndex: string) => {
    set({ previousCellIndex })
  },
  previousCellColour: "",
  setPreviousCellColour: (previousCellColour: string) => set({ previousCellColour }),
  selectionMade: 0,
  setSelectionIsMade: () => set((state: { selectionMade: number }) => ({ selectionMade: state.selectionMade + 1 })),
  setSelectionIsNotMade: () => set({ selectionMade: 0 }),
  selectedCells: {},
  selectedCellsCount: 0,
  setSelectedCells: (selectedCells: { [key: string]: string }) => set({
    selectedCells, 
    selectedCellsCount: Object.keys(selectedCells).length
  }),
  addSelectedCell: (cellIndex, color) => set((state) => {
    const newCells = { ...state.selectedCells, [cellIndex]: color };
    return { 
      selectedCells: newCells, 
      selectedCellsCount: state.selectedCellsCount + 1 
    };
  }),
  removeSelectedCell: (cellIndex) => set((state) => {
    const newCells = { ...state.selectedCells };
    delete newCells[cellIndex];
    return { 
      selectedCells: newCells, 
      selectedCellsCount: state.selectedCellsCount - 1 
    };
  }),
  clearSelectedCells: () => set({ selectedCells: {}, selectedCellsCount: 0 }),


  // toggleComments: null,
}))

const createNewState = (auditItem: IAuditLogItem, t: TFunction) => {
  if (auditItem.markerCounter == null) auditItem.markerCounter = -1
  if (auditItem.attachmentNumber == null) auditItem.attachmentNumber = -1
  if (auditItem.timezone == null) auditItem.timezone = ""
  if (auditItem.locale == null) auditItem.locale = ""
  if (auditItem.verifications == null) auditItem.verifications = {}
  if (auditItem.activeChildren == null) auditItem.activeChildren = []
  if (auditItem.actionType == null) auditItem.actionType = ActionType.Undefined
  // const weHavePostapprovals = auditItem.nPostApprovals ? auditItem.nPostApprovals > 0 : false
  // setPostApprovalSignature(weHavePostapprovals)
  const emptyCellCount = auditItem.emptyCellCount != null ? auditItem.emptyCellCount : -1
  const editedBy = `${auditItem.legalName} (${auditItem.initials})`
  const dt = DateTime.fromMillis(auditItem.time, { zone: auditItem.timezone })
  const editedAt: string = formatDatetimeString(dt, t)
  const currentStage: number = auditItem.stage ? auditItem.stage : Stage.PreApprove
  const editTime = auditItem.time ? auditItem.time : 0
  const markerCounter = auditItem.markerCounter
  const attachmentNumber = auditItem.attachmentNumber
  const timezone = auditItem.timezone
  const locale = auditItem.locale
  const verifications = auditItem.verifications
  const activeChildren = auditItem.activeChildren
  const actionType = auditItem.actionType
  return {
    editedBy, editedAt, documentStage: currentStage, markerCounter, emptyCellCount, editTime,
    attachmentNumber, timezone, locale, verifications, activeChildren, actionType
  }
}

// Create a function to generate a fresh copy of default groups with proper icons
function createDefaultGroups(): ParticipantGroup[] {
  return [{
    title: GroupTitles.PRE_APPROVAL,
    participants: [],
    icon: React.createElement(IconSignature, { size: 16, className: "text-amber-500" }),
    signingOrder: true
  }, {
    title: GroupTitles.EXECUTION,
    icon: React.createElement(ClipboardPen, { className: "h-4 w-4 text-indigo-500" }),
    participants: [],
    signingOrder: false
  }, {
    title: GroupTitles.POST_APPROVAL,
    participants: [],
    icon: React.createElement(IconSignature, { size: 16, className: "text-purple-600" }),
    signingOrder: true
  },{
    title: GroupTitles.OWNERS,
    participants: [],
    signingOrder: false,
    icon: React.createElement(UserIcon, { className: "h-4 w-4 text-gray-500" })
  },{
    title: GroupTitles.VIEWERS,
    participants: [],
    signingOrder: false,
    icon: React.createElement(Eye, { className: "h-4 w-4 text-gray-500" })
  }];
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documentId: "",
  setDocumentId: (documentId: string) => set({ 
    documentId,
  }),
  reloadTrigger: 0,
  reloadingDoc: false,
  setReloadingDoc: (reloadingDoc: boolean) => set({ reloadingDoc }),
  triggerReload: () => set((state: { reloadTrigger: number }) => ({ reloadTrigger: state.reloadTrigger + 1 })),
  reloadSelection: [],
  setReloadSelection: (offsets: string[]) => set({ reloadSelection: offsets }),
  clearAttachments: () => set({ attachments: [] }), 
  attachmentNumber: 0,
  setAttachmentNumber: (attachmentNumber: number) => set({ attachmentNumber }),
  attachments: [],
  pdfUrl: "",
  setPdfUrl: (pdfUrl: string) => set({ pdfUrl }),
  addAttachment: (attachment: Omit<StoreAttachment, 'id'>) => {
    const newId = `att-${Date.now()}-${attachment.number}`;
    set((state) => {
      // Check if an attachment with this number already exists
      const existingIndex = state.attachments.findIndex(att => att.number === attachment.number);
      if (existingIndex >= 0) {
        // Update existing attachment
        const tmpAttachments = [...state.attachments];
        tmpAttachments[existingIndex] = {
          ...tmpAttachments[existingIndex],
          ...attachment,
          id: tmpAttachments[existingIndex].id
        };
        return { attachments: tmpAttachments.sort((a,b) => a.number - b.number) };
      } else {
        // Add new attachment
        return { 
          attachments: [...state.attachments, { ...attachment, id: newId }]
        };
      }
    });
  },
  updateAttachment: (number: number, updates: Partial<StoreAttachment>) => {
    set((state) => {
      const attachmentIndex = state.attachments.findIndex(att => att.number === number);
      if (attachmentIndex === -1) return state;
      
      const newAttachments = [...state.attachments];
      newAttachments[attachmentIndex] = {
        ...newAttachments[attachmentIndex],
        ...updates
      };
      return { attachments: newAttachments };
    });
  },
  updateVerifications: () => {
    const { updateAttachment: updateAttach, verifications } = get()
    console.log("Updating verifications for attachments: " + JSON.stringify(verifications))
    for (const keyValue of Object.entries(verifications)) {
        updateAttach(parseInt(keyValue[0]), { verifications: keyValue[1] })
    }
  },
  getAttachmentByNumber: (number: number) => {
    return get().attachments.find(att => att.number === number);
  },
  verifications: {},
  setVerifications: (verifications: Verifications) => set({ verifications }),
  emptyCellCount: 0,
  setEmptyCellCount: (emptyCellCount: number) => set({ emptyCellCount }),
  markerCounter: 0,
  setMarkerCounter: (markerCounter: number) => set({ markerCounter }),
  postApprovalSignature: false,
  setPostApprovalSignature: (postApprovalSignature: boolean) => set({ postApprovalSignature }),
  tenantName: "",
  setTenantName: (tenantName: string) => set({ tenantName }),
  documentType: "",
  setDocumentType: (documentType: string) => set({ documentType }),
  body: "",
  setBody: (body: string) => set({ body }),
  documentStage: Stage.Draft,
  setDocumentStage: (documentStage: number) => set({ documentStage }),
  editedBy: "",
  setEditedBy: (editedBy: string) => set({ editedBy }),
  editedAt: "",
  setEditedAt: (editedAt: string) => set({ editedAt }),
  editTime: 0,
  setEditTime: (editTime: number) => set({ editTime }),
  timezone: "",
  setTimezone: (timezone: string) => set({ timezone }),
  locale: "",
  setLocale: (locale: string) => set({ locale }),
  documentName: "",
  setDocumentName: (documentName: string) => set({ documentName }),
  activeChildren: [],
  nChildren: 0,
  setNChildren: (nChildren: number) => set({ nChildren }),
  parentDocument: { documentId: "", url: "" },
  documentLanguage: "",
  setDocumentLanguage: (documentLanguage: string) => set({ documentLanguage }),
  documentLanguages: [],
  setDocumentLanguages: (documentLanguages: string[]) => set({ documentLanguages }),
  commentsList: [],
  setCommentsList: (commentsList: string[]) => set({ commentsList }),
  addComment: (comment: string) => set((state: { commentsList: string[] }) => ({ commentsList: [...state.commentsList, comment] })),
  deleteComment: (idx: number) => set((state: { commentsList: string[] }) => ({ commentsList: state.commentsList.filter((_, i) => i !== idx) })),
  updateDocumentState: (auditItem: IAuditLogItem, t: TFunction) => {
    const newState = createNewState(auditItem, t)
    set( { ...newState })
  },
  participantGroups: createDefaultGroups(),
  documentDescription: null,
  setDocumentDescription: (documentDescription: DocumentDescription | null) => {
    if (documentDescription == null) return
    const participantGroups = documentDescription.participantGroups.map((group: ParticipantGroup) => {
      if (group.title === GroupTitles.PRE_APPROVAL) {
        group.icon = React.createElement(IconSignature, { size: 16, className: "text-amber-500" })
      } else if (group.title === GroupTitles.EXECUTION) {
        group.icon = React.createElement(ClipboardPen, { className: "h-4 w-4 text-indigo-500" })
      } else if (group.title === GroupTitles.POST_APPROVAL) {
        group.icon = React.createElement(IconSignature, { size: 16, className: "text-purple-600" })
      } else if (group.title === GroupTitles.OWNERS) {
        group.icon = React.createElement(UserIcon, { className: "h-4 w-4 text-gray-500" })
      } else if (group.title === GroupTitles.VIEWERS) {
        group.icon = React.createElement(Eye, { className: "h-4 w-4 text-gray-500" })
      }
      return group
    })
    const documentId = get().documentId
    let existingGroups: ParticipantGroup[] = []
    if (documentId !== documentDescription.id) {
      existingGroups = createDefaultGroups()
    } else {
      ({ participantGroups: existingGroups } = get())
    }
    const updatedGroups = existingGroups.map((group: ParticipantGroup) => {
      const newGroup = participantGroups.find((g: ParticipantGroup) => g.title === group.title)
      if (newGroup) {
        return { ...group, ...newGroup }
      } else {
        // If the group doesn't exist in the new data, keep the existing one
        return { ...group }
      }
    })
    documentDescription.participantGroups = updatedGroups
    const documentName = documentDescription ? documentDescription.documentName : ""
    const commentsList = documentDescription.comments ? documentDescription.comments : []
    const hasContent = documentDescription.hasContent ? documentDescription.hasContent : false
    const parentDocument = documentDescription.parentDocument ? documentDescription.parentDocument : { documentId: "", url: "" }
    const nChildren = documentDescription.nChildren ? documentDescription.nChildren : 0
    useChatStore.setState({ messages: commentsList })
    set({ documentDescription, documentName, participantGroups: updatedGroups, parentDocument, nChildren,
      pdfUrl: documentDescription.pdfUrl ? documentDescription.pdfUrl : "", documentHasContent: hasContent })
  },
  setParticipantGroups: (participantGroups: ParticipantGroup[]) => {
    set({ participantGroups })
  },
  saveParticipantGroups: async (participantGroups: ParticipantGroup[], editedGroupIndex): Promise<void> => {
    const appStore = useAppStore.getState()
    appStore.setWorking(true)
    const documentId: string = get().documentId
    const staleState = await checkDocumentNotStale(true)
    if (!staleState || !staleState.ok) {
      if (appStore.editor == null) return
      const modalStore = useModalStore.getState()
      triggerReloadDocument(appStore.editor, modalStore)
      appStore.setWorking(true);
      return
    }
    const editedGroupTitle = participantGroups[editedGroupIndex].title

    await updateParticipantGroups(documentId, participantGroups, editedGroupTitle, staleState.timestamp)
    appStore.setWorking(false);
    set({ participantGroups, editTime: staleState.timestamp })
  },
  documentHasContent: false,
  setDocumentHasContent: (documentHasContent: boolean) => set({ documentHasContent }),
  resetParticipantGroups: () => set({ participantGroups: createDefaultGroups() }),
}))

export interface ModalStore {
  documentStatus: "locked" | "updated" | "updating" | null
  setDocumentStatus: (status: "locked" | "updated" | "updating" | null) => void
  isUploading: boolean,
  uploadProgress: number,
  setUploadProgress: (uploadProgress: number) => void,
  setIsUploading: (isUploading: boolean) => void,
  multipleTableCellsSelected: boolean,
  setMultipleTableCellsSelected: (a: boolean) => void,
  multipleParagraphsSelected: boolean,
  setMultipleParagraphsSelected: (a: boolean) => void,
  unableToCorrectAttachment: boolean,
  setUnableToCorrectAttachment: (a: boolean) => void,
  unsupportedAttachmentType: boolean,
  setUnsupportedAttachmentType: (a: boolean) => void,
  isNotInTableWarningDialog: boolean,
  setIsNotInTableWarningDialog: (isNotInTableWarningDialog: boolean) => void,
  showNoCheckboxFound: boolean
  setShowNoCheckboxFound: (showNoCheckboxFound: boolean) => void
  noPermisionsPopup: boolean
  showNoPermissionsPopup: () => void
  toggleNoPermissionsPopup: () => void
  missingProperty: string
  setMissingProperty: (missingProperty: string) => void
  userNotConfigured: boolean
  toggleUserNotConfigured: () => void
  emailMisconfigured: boolean
  toggleEmailMisconfigured: () => void
  externalUserNotInDocufenGroup: boolean
  toggleExternalUserNotInDocufenGroup: () => void
  signingTwice: boolean
  setSigningTwice: (signingTwice: boolean) => void
  toggleSigningTwice: () => void
  wrongUserWarning: boolean
  setWrongUserWarning: (wrongUserWarning: boolean) => void
  toggleWrongUserWarning: () => void
  tableNotSelected: boolean
  toggleTableNotSelected: () => void
  cellNotEmpty: boolean
  toggleCellNotEmpty: () => void
  setCellEmpty: () => void
  notMemberOfDocufenUsers: boolean
  toggleNotMemberOfDocufenUsers: () => void
  workflowModalOpen: boolean
  toggleWorkflowModal: () => void
  networkError: boolean
  setNetworkError: (networkError: boolean) => void
  operationFailedError: string | null
  setOperationFailedError: (error: string | null) => void
  // For backward compatibility
  documentInUse: boolean
  setDocumentInUse: (documentInUse: boolean) => void
  documentNotUpToDate: boolean
  setDocumentNotUpToDate: (documentNotUpToDate: boolean) => void
}

export const useModalStore = create<ModalStore>((set) => ({
  documentStatus: null,
  setDocumentStatus: (status) => set({ documentStatus: status }),
  isUploading: false,
  uploadProgress: 0,
  setUploadProgress: (uploadProgress: number) => set({ uploadProgress }),
  setIsUploading: (isUploading: boolean) => set({ isUploading }),
  multipleTableCellsSelected: false,
  setMultipleTableCellsSelected: (multipleTableCellsSelected: boolean) => set({ multipleTableCellsSelected }),
  multipleParagraphsSelected: false,
  setMultipleParagraphsSelected: (multipleParagraphsSelected: boolean) => set({ multipleParagraphsSelected }),
  unableToCorrectAttachment: false,
  setUnableToCorrectAttachment: (unableToCorrectAttachment: boolean) => set({ unableToCorrectAttachment }),
  unsupportedAttachmentType: false,
  setUnsupportedAttachmentType: (unsupportedAttachmentType: boolean) => set({ unsupportedAttachmentType }),
  isNotInTableWarningDialog: false,
  setIsNotInTableWarningDialog: (isNotInTableWarningDialog: boolean) => set({ isNotInTableWarningDialog }),
  showNoCheckboxFound: false,
  setShowNoCheckboxFound: (showNoCheckboxFound: boolean) => set({ showNoCheckboxFound }),
  noPermisionsPopup: false,
  showNoPermissionsPopup: () => set({ noPermisionsPopup: true }),
  toggleNoPermissionsPopup: () => set((state: { noPermisionsPopup: boolean }) => ({ noPermisionsPopup: !state.noPermisionsPopup })),
  missingProperty: "",
  setMissingProperty: (missingProperty: string) => set({ missingProperty }),
  userNotConfigured: false,
  toggleUserNotConfigured: () => set((state: { userNotConfigured: boolean }) => ({ userNotConfigured: !state.userNotConfigured })),
  emailMisconfigured: false,
  toggleEmailMisconfigured: () => set((state: { emailMisconfigured: boolean }) => ({ emailMisconfigured: !state.emailMisconfigured })),
  externalUserNotInDocufenGroup: false,
  toggleExternalUserNotInDocufenGroup: () => set((state: { externalUserNotInDocufenGroup: boolean }) => ({ externalUserNotInDocufenGroup: !state.externalUserNotInDocufenGroup })),
  signingTwice: false,
  setSigningTwice: (signingTwice: boolean) => set({ signingTwice }),
  toggleSigningTwice: () => set((state: { signingTwice: boolean }) => ({ signingTwice: !state.signingTwice })),
  wrongUserWarning: false,
  setWrongUserWarning: (wrongUserWarning: boolean) => set({ wrongUserWarning }),
  toggleWrongUserWarning: () => set((state: { wrongUserWarning: boolean }) => ({ wrongUserWarning: !state.wrongUserWarning })),
  tableNotSelected: false,
  toggleTableNotSelected: () => set((state: { tableNotSelected: boolean }) => ({ tableNotSelected: !state.tableNotSelected })),
  cellNotEmpty: false,
  toggleCellNotEmpty: () => set((state: { cellNotEmpty: boolean }) => ({ cellNotEmpty: !state.cellNotEmpty })),
  setCellEmpty: () => set(({ cellNotEmpty: false })),
  notMemberOfDocufenUsers: false,
  toggleNotMemberOfDocufenUsers: () => set((state: { notMemberOfDocufenUsers: boolean }) => ({ notMemberOfDocufenUsers: !state.notMemberOfDocufenUsers })),
  workflowModalOpen: false,
  toggleWorkflowModal: () => set((state: { workflowModalOpen: boolean }) => ({ workflowModalOpen: !state.workflowModalOpen })),
  networkError: false,
  setNetworkError: (networkError: boolean) => set({ networkError }),
  operationFailedError: null,
  setOperationFailedError: (error: string | null) => {
    useAppStore.getState().hideInsertIntoCellDialog()
    set({ operationFailedError: error })
  },
  // For backward compatibility - map to the new documentStatus
  documentInUse: false,
  setDocumentInUse: (documentInUse: boolean) => {
    set({ 
      documentStatus: documentInUse ? "locked" : null,
      documentInUse // Also set the legacy property for compatibility
    });
  },
  documentNotUpToDate: false,
  setDocumentNotUpToDate: (documentNotUpToDate: boolean) => {
    set({ 
      documentStatus: documentNotUpToDate ? "updated" : null,
      documentNotUpToDate // Also set the legacy property for compatibility
    });
  }
}))



// Define chat store
export interface ChatStore {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  addMention: (timestamp: number, mention: string) => void;
  removeMessage: (timestamp: number) => void;
  // Special method to add a comment as a message
  // addCommentAsMessage: (author: string, text: string, position?: { containerIndex?: number; index?: number; commentId?: string }) => void;
}

// Create the chat store
export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  setMessages: (messages: ChatMessage[]) => set({ messages }),
  addMention: (timestamp: number, mention: string) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.timestamp === timestamp
          ? { ...message, mentions: [...message.mentions, mention] }
          : message
      )
    }));
  },
  addMessage: (message: ChatMessage) =>
    set((state) => ({ 
      messages: [...state.messages, { ...message, id: Date.now() }] 
    })),
  removeMessage: (timestamp: number) => {
    set((state) => ({
      messages: state.messages.filter((message) => message.timestamp !== timestamp)
    }));
  }
}));


export interface AccountStore {
  companyInfo: CompanyInfo
  setCompanyInfo: (companyInfo: CompanyInfo) => void
  licenseStatus: LicenseStatus
  setLicenseStatus: (licenseStatus: LicenseStatus) => void
  trialDaysRemaining: number
  setTrialDaysRemaining: (trialDaysRemaining: number) => void
  ersdText: string
  setErsdText: (ersdText: string) => void
  enforceDigitalSignatures: boolean
  setEnforceDigitalSignatures: (enforceDigitalSignatures: boolean) => void
  insertAtCursorMode: boolean
  setInsertAtCursorMode: (enabled: boolean) => void
}

export const useAccountStore = create<AccountStore>((set) => ({
  ersdText: "",
  setErsdText: (ersdText: string) => set({ ersdText }),
  enforceDigitalSignatures: false,
  setEnforceDigitalSignatures: (enforceDigitalSignatures: boolean) => set({ enforceDigitalSignatures }),
  insertAtCursorMode: false,
  setInsertAtCursorMode: (insertAtCursorMode: boolean) => set({ insertAtCursorMode }),
  companyInfo: {
    companyName: "",
    companyAddress: "",
    companyCity: "",
    companyCountry: "",
    companyPostCode: "",
    companyState: "",
    businessRegistrationNumber: "",
    locale: ["en"],
    adminContacts: [],
  },
  setCompanyInfo: (companyInfo: CompanyInfo) => {
    if (companyInfo == null) set ({ companyInfo: undefined })
    if (companyInfo.status == null) companyInfo.status = "deactivated"
    let licenseStatus = companyInfo.status
    let trialDaysRemaining = 0
    let enforceDigitalSignatures = companyInfo.enforceDigitalSignatures ? companyInfo.enforceDigitalSignatures : false
    let insertAtCursorMode = companyInfo.insertAtCursorMode ? companyInfo.insertAtCursorMode : false
    const ersdText = companyInfo.ersdText ? companyInfo.ersdText : ""
    if (licenseStatus === LicenseStatuses.TRIAL) {
      const now = new Date().getTime()
      const expiresTimestamp: number = companyInfo.expires ? companyInfo.expires : now-1
      const timeDiff = expiresTimestamp - now
      if (timeDiff <= 0) {
        licenseStatus = "expired"
      }
      trialDaysRemaining = Math.round((timeDiff) / (1000 * 60 * 60 * 24))
    }
    set({ companyInfo, licenseStatus, trialDaysRemaining, ersdText, enforceDigitalSignatures, insertAtCursorMode })
  },
  licenseStatus: LicenseStatuses.TRIAL,
  setLicenseStatus: (licenseStatus: LicenseStatus) => set({ licenseStatus }),
  trialDaysRemaining: 0,
  setTrialDaysRemaining: (trialDaysRemaining: number) => set({ trialDaysRemaining }),
}))

export interface SidebarStore {
  activeMenuItem: string | null;
  setActiveMenuItem: (menuItem: string | null) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  activeMenuItem: null,
  setActiveMenuItem: (menuItem: string | null) => {
    set({ activeMenuItem: menuItem });
  },
}))

// First check if the file exists
if (typeof window !== 'undefined') {
  // Check if debug mode is enabled in localStorage and ensure URL has lng=sw parameter
  if (localStorage.getItem('i18nextDebugMode') === 'true') {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('lng') || url.searchParams.get('lng') !== 'sw') {
      url.searchParams.set('lng', 'sw');
      window.history.replaceState({}, '', url.toString());
    }
  }
}
