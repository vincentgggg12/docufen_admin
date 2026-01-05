"use client"

import * as React from "react"
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
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import {
  Search,
  ClipboardPen,
  FileCheck,
} from "lucide-react"
import { IconSignature } from "@tabler/icons-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import CreateNewDocumentDialog from "./CreateNewDocumentDialog"
// import { useDocuments, Document as DocumentType } from "../../lib/documentContext"
import { useNavigate } from "react-router-dom"
import pdfIconSvg from "@/assets/pdf_icon.svg"
import { useTranslation } from "react-i18next"
import { useAppStore, useDocumentsStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { ActiveTab, DocumentDescription, Participant, ParticipantGroup, updateDocument } from "@/lib/apiUtils"
import DocumentsTable from "./DocumentsTable"
import { useUserStore } from "@/lib/stateManagement"
import { toast } from "sonner"
import { refreshAllDocumentsLists } from "@/hooks/AccountData"
import DocumentCategorySelector from "@/pages/Documents/DocumentCategorySelector"
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude"
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events"
import { stageToDocumentStage } from "@/components/editor/lib/utils"
import { fileNameRegExp } from "@/lib/constants"
import { UserTenantProps } from "@/lib/User"
import { SERVERURL } from "@/lib/server"

// PDF Icon component that uses the imported SVG
const FinalPDFIcon = () => (
  <img src={pdfIconSvg} alt="PDF" className="h-5 w-5" />
);

// Custom status icons with their respective colors
const PreApprovalIcon = () => <IconSignature size={14} color="#FFA100" />
const ExecutionIcon = () => <ClipboardPen className="h-3.5 w-3.5 text-[#6366F1]" />
const PostApprovalIcon = () => <IconSignature size={14} color="#9C27B0" />


// Add this export for other components to use
export const removeDeletedDocumentFromList = (documentId: string) => {
  const { documents, setDocuments, recentDocuments, setRecentDocuments } = useDocumentsStore.getState();
  
  // Filter out the deleted document from the main list
  const updatedDocuments = documents.filter(doc => doc.id !== documentId);
  
  // Update the documents list
  setDocuments(updatedDocuments);
  
  // Also filter out the document from recents
  const updatedRecents = recentDocuments.filter(item => item.id !== documentId);
  
  // Update the recents list
  setRecentDocuments(updatedRecents);
  
  console.log(`Removed document ${documentId} from client-side lists`);
};

export default function DocumentsPage() {
  // State for create document dialog
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const { t } = useTranslation()


  // State for document information edit dialog
  const [isDocInfoDialogOpen, setIsDocInfoDialogOpen] = React.useState(false)
  const [editingDocumentId, setEditingDocumentId] = React.useState<string>("")
  const [editDocName, setEditDocName] = React.useState<string>("")
  const [editDocNumber, setEditDocNumber] = React.useState<string>("")
  const [madeChanges, setMadeChanges] = React.useState(false)

  // State for document category in the edit dialog
  const [editDocCategory, setEditDocCategory] = React.useState<string>("")
  // const [customDocumentCategory, setCustomDocumentCategory] = React.useState<string>("")
  const { tenantName, canAccessAllDocuments, showEveryonesDocuments, setShowEveryonesDocuments } = useUserStore(useShallow((state) => ({ 
    tenantName: state.tenantName,
    canAccessAllDocuments: state.canAccessAllDocuments,
    showEveryonesDocuments: state.showEveryonesDocuments,
    setShowEveryonesDocuments: state.setShowEveryonesDocuments,
  })));
  
  // Use document context to manage documents
  const { setDocuments, documents, setActiveDocumentId, totalPages,
    currentPage, rowsPerPage, setCurrentPage, setRowsPerPage, activeTab, setActiveTab } = useDocumentsStore(useShallow((state) => ({
    setDocuments: state.setDocuments,
    documents: state.documents,
    activeDocumentId: state.activeDocumentId,
    setActiveDocumentId: state.setActiveDocumentId,
    currentPage: state.currentPage,
    setCurrentPage: state.setCurrentPage,
    setRowsPerPage: state.setRowsPerPage,
    rowsPerPage: state.rowsPerPage,
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab,
    totalPages: state.totalPages,
  })))
  const { sidebarOpen, setSidebarOpen } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })))
  const [ documentNameError, setDocumentNameError ] = React.useState<string>("")
  // Reset page when tab changes
  const handleTabChange = (value: string) => {
    // Track tab switch
    trackAmplitudeEvent(AMPLITUDE_EVENTS.TAB_SWITCHED, {
      from_tab: activeTab,
      to_tab: value,
      tab_group: 'document_stage_filter',
      page_name: 'Documents'
    });
    
    setActiveTab(value as ActiveTab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  // Add search state
  const [searchTerm, setSearchTerm] = React.useState<string>("")

  // Filter documents based on search term
  const filteredDocuments = React.useMemo(() => {
    if (!searchTerm.trim()) return documents;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return documents.filter(doc => {
      if (doc.documentName == null || doc.externalReference == null) return false
      return doc.documentName.toLowerCase().includes(lowerSearchTerm) || 
        doc.externalReference.toLowerCase().includes(lowerSearchTerm) || 
        (doc.participantGroups && 
          doc.participantGroups.some((group: ParticipantGroup) => 
          group.title === "Owners" && 
          group.participants.some((u: Participant) => u.name.toLowerCase().includes(lowerSearchTerm)))) ||
        (doc.documentCategory && doc.documentCategory.toLowerCase().includes(lowerSearchTerm)) || 
        (!doc.documentCategory && "not specified".includes(lowerSearchTerm))
    });
  }, [documents, searchTerm]);

  // Reset page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
    
    // Track search performed (debounced)
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        trackAmplitudeEvent(AMPLITUDE_EVENTS.SEARCH_PERFORMED, {
          search_query: searchTerm,
          search_type: 'documents',
          results_count: filteredDocuments.length,
          page_name: 'Documents'
        });
      }, 1000); // 1 second debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, setCurrentPage]);

  const navigate = useNavigate()

  // State to track expanded rows
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});

  // Toggle row expansion
  const toggleRow = (docId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  // Effect to refresh documents when returning from void operation
  React.useEffect(() => {
      console.log('Refreshing documents list due to refresh parameter');
      
      // Refresh all documents lists directly
      refreshAllDocumentsLists(tenantName).then(() => {
        console.log('Successfully refreshed documents lists from URL parameter');
      }).catch((error: unknown) => {
        console.error('Error refreshing documents lists from URL parameter:', error);
      });
  }, [tenantName, activeTab, showEveryonesDocuments]);

  // Handle document link click to prevent full page reload
  const handleDocumentClick = (e: React.MouseEvent, doc: DocumentDescription) => {
    e.preventDefault()

    console.log(`DocumentsPage - Navigating to document: ${doc.id}`)

    // Track document opened
    trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_OPENED, {
      document_id: doc.id,
      document_name: doc.documentName,
      document_stage: stageToDocumentStage(doc.stage),
      open_source: 'documents_table',
      is_favorite: false // TODO: check if document is favorited
    });

    // Set active document ID first, before navigation
    setActiveDocumentId(doc.id)

    // Small delay to ensure the active document ID is set before navigating
    setTimeout(() => {
      const navigationId = Date.now().toString();
      sessionStorage.setItem('navigationId', navigationId);
      navigate(`/document/${doc.id}`, { 
        state: { 
          fromInternal: true, 
          navigationId: navigationId 
        } 
      });
    }, 20)
  }

  const handleDocumentTypeChange = (value: string) => {
    console.log("Document type changed to: " + value)
    setEditDocCategory(value)
    setMadeChanges(true)
  }

  // Handle opening the document edit dialog
  const handleOpenDocInfoDialog = (doc: DocumentDescription) => {
    setEditingDocumentId(doc.id)
    setEditDocName(doc.documentName)
    setEditDocNumber(doc.externalReference)
    setMadeChanges(false)
    if (!doc.documentCategory) {
      setEditDocCategory("")
    } else {
      setEditDocCategory(doc.documentCategory)
    }
    setIsDocInfoDialogOpen(true)
  }

  const toggleShowAllDocuments = () => {
    fetch(`${SERVERURL}users/user/toggle-show-all-docs/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      credentials: 'include'
    }).then((response: Response) => {
      if (!response.ok) {
        throw new Error(`Failed to toggle show all documents: ${response.statusText}`);
      }
      response.json().then((data: UserTenantProps) => {
        setShowEveryonesDocuments(data.showEveryonesDocuments || false);
      })
    }).catch((error: unknown) => {
      let msg = ""
      if (error instanceof Error) {
        msg = error.message
      } else {
        msg = `Unknown error: ${error}`
      }
      console.error("Error toggling show all documents:", msg);
    })
  }

  // Handle saving document information
  const handleSaveDocInfo = () => {
    // Find the document in our state
    const oldDocument = documents.find((doc: DocumentDescription) => doc.id === editingDocumentId);
    
    const updatedDocuments: DocumentDescription[] = documents.map((doc: DocumentDescription) => {
      if (doc.id === editingDocumentId) {
        // Create an updated document with the new values
        const updatedDoc = {
          ...doc,
          documentName: editDocName,
          externalReference: editDocNumber,
        };

        // Add the document category using type assertion
        updatedDoc.documentCategory = editDocCategory;

        return updatedDoc as DocumentDescription;
      }
      return doc
    })
    
    // Track document updated
    if (oldDocument) {
      const updatedFields: string[] = [];
      if (oldDocument.documentName !== editDocName) updatedFields.push('name');
      if (oldDocument.externalReference !== editDocNumber) updatedFields.push('reference_number');
      if (oldDocument.documentCategory !== editDocCategory) updatedFields.push('category');
      
      if (updatedFields.length > 0) {
        trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_EDITED, {
          document_id: editingDocumentId,
          document_name: editDocName,
          updated_fields: updatedFields.join(','),
          edit_source: 'document_info_dialog',
          page_name: 'Documents'
        });
      }
    }
    
    // Optimistically update the documents
    setDocuments(updatedDocuments)

    // Save to server and handle errors
    updateDocument(editingDocumentId, {
      documentName: editDocName,
      externalReference: editDocNumber,
      documentCategory: editDocCategory
    })
    .then((result) => {
      if (result !== 0) {
        // Revert optimistic update on failure
        if (oldDocument) {
          setDocuments(documents)
        }
        toast.error(t('documents.updateFailed', 'Failed to save document changes. Please try again.'))
        console.error(`Error updating document ${editingDocumentId}: server returned ${result}`);
      }
    })
    .catch((error: unknown) => {
      // Revert optimistic update on error
      if (oldDocument) {
        setDocuments(documents)
      }
      toast.error(t('documents.updateFailed', 'Failed to save document changes. Please try again.'))
      if (error instanceof Error) {
        console.error("Error updating document:", error.message);
      } else {
        console.error(`Error updating document ${editingDocumentId}:`, error);
      }
    })
    // Close the dialog
    setIsDocInfoDialogOpen(false)
  }

  const tabEmptyMessages = {
    "all": "documents.noDocuments",
    "pre-approval": "documents.noPreApprovalDocuments",
    "execution": "documents.noExecutionDocuments",
    "post-approval": "documents.noPostApprovalDocuments",
    "completed": "documents.noCompletedDocuments",
    "final-pdf": "documents.noFinalPdfDocuments"
  };

  // State for the documents filter toggle
  // const [showEveryonesDocuments, setShowEveryonesDocuments] = React.useState(false)

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
            <SidebarTrigger data-testid="documentsPage.sidebarTrigger" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-lg font-medium text-gray-700">
                    {t("documents.title")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Documents Table with Tabs */}
            <div className="mt-6 px-6 flex-1 flex flex-col">
              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full flex flex-col h-full"
              >
                {/* Document filter toggle - only show for users with canAccessAllDocuments property */}
                {canAccessAllDocuments && (
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Switch
                      id="documents-toggle"
                      checked={showEveryonesDocuments}
                      onCheckedChange={(checked) => {
                        // Track filter change
                        toggleShowAllDocuments()
                        trackAmplitudeEvent(AMPLITUDE_EVENTS.FILTER_APPLIED, {
                          filter_type: 'document_ownership',
                          filter_value: checked ? 'everyone' : 'mine',
                          page_name: 'Documents'
                        });
                        
                      }}
                      data-testid="documentsPage.documentsFilterSwitch"
                    />
                    <Label htmlFor="documents-toggle" className="text-sm font-medium">
                      {showEveryonesDocuments ? t("documents.showEveryoneDocuments") : t("documents.showMyDocuments")}
                    </Label>
                  </div>
                )}

                {/* Second row with tabs and search */}
                <div className="flex items-center justify-between mb-2">
                  {/* Desktop view tabs */}
                  <div className="flex items-center gap-4">
                    <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 hidden md:flex overflow-x-auto">
                      <TabsTrigger value="all" data-testid="documentsPage.allTab">{t("documents.tabs.all")}</TabsTrigger>
                      <TabsTrigger value="pre-approval" className="flex items-center gap-1" data-testid="documentsPage.preApprovalTab">
                        <PreApprovalIcon />
                        <span>{t("documents.tabs.preApproval")}</span>
                      </TabsTrigger>
                      <TabsTrigger value="execution" className="flex items-center gap-1" data-testid="documentsPage.executionTab">
                        <ExecutionIcon />
                        <span>{t("documents.tabs.execution")}</span>
                      </TabsTrigger>
                      <TabsTrigger value="post-approval" className="flex items-center gap-1" data-testid="documentsPage.postApprovalTab">
                        <PostApprovalIcon />
                        <span>{t("documents.tabs.postApproval")}</span>
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="flex items-center gap-1" data-testid="documentsPage.completedTab">
                        <FileCheck className="h-3.5 w-3.5 text-[#0E7C3F]" />
                        <span>{t("documents.tabs.closed")}</span>
                      </TabsTrigger>
                      <TabsTrigger value="final-pdf" className="flex items-center gap-1 px-4" data-testid="documentsPage.finalPdfTab">
                        <FinalPDFIcon />
                        <span>{t("documents.tabs.finalPdf")}</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder={t("documents.search")}
                        className="w-full bg-background pl-8"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          // Track search performed (debounced in effect)
                        }}
                        data-testid="documentsPage.searchInput"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Generate all tab contents */}
                {Object.keys(tabEmptyMessages).map(tabValue => (
                  <TabsContent key={tabValue} value={tabValue} className="mt-0 flex-1 overflow-hidden">
                    <DocumentsTable
                      documents={filteredDocuments}
                      expandedRows={expandedRows}
                      toggleRow={toggleRow}
                      handleDocumentClick={handleDocumentClick}
                      handleOpenDocInfoDialog={handleOpenDocInfoDialog}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      rowsPerPage={rowsPerPage}
                      setCurrentPage={setCurrentPage}
                      setRowsPerPage={setRowsPerPage}
                      emptyMessage={searchTerm && filteredDocuments.length === 0 
                        ? t("documents.noSearchResults") 
                        : t(tabEmptyMessages[tabValue as keyof typeof tabEmptyMessages])}
                    />
                  </TabsContent>
                ))}
                {/* CreateNewDocumentDialog component */}
                <CreateNewDocumentDialog
                  createDialogOpen={createDialogOpen}
                  setCreateDialogOpen={setCreateDialogOpen}
                />
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Add the participants edit dialog at the end */}

      {/* Document Information Edit Dialog */}
      <Dialog open={isDocInfoDialogOpen} onOpenChange={setIsDocInfoDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("documents.editDocumentInformation")}</DialogTitle>
            <DialogDescription>
              {t("documents.updateDocumentInfo")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="docName">{t("documents.name")}</Label>
              <Input
                id="docName"
                value={editDocName}
                onChange={(e) => {
                  const  sanitizedValue = e.target.value.replace(fileNameRegExp, "");
                  setEditDocName(sanitizedValue);
                  setMadeChanges(true)
                  if (sanitizedValue.length < 1) {
                    setDocumentNameError(t("validation.documentNameRequired"));
                  } else {
                    setDocumentNameError("");
                  }
                }}
                className="w-full"
                data-testid="documentsPage.editDocumentNameInput"
              />
              {documentNameError && <div className="text-xs text-red-500">{documentNameError}</div>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="docNumber">{t("documents.externalReference")}</Label>
              <Input
                id="docNumber"
                value={editDocNumber}
                onChange={(e) => {
                  const  sanitizedValue = e.target.value.replace(fileNameRegExp, "");
                  setEditDocNumber(sanitizedValue);
                  setMadeChanges(true)
                }}
                className="w-full"
                data-testid="documentsPage.editExternalReferenceInput"
              />
            </div>
            <DocumentCategorySelector 
              value={editDocCategory}  
              onValueChange={handleDocumentTypeChange} 
              data-testid="documentsPage.editDocumentCategorySelect"
            />

            <div className="space-y-2">
              <Label htmlFor="docId">{t("documents.docufenDocumentId")}</Label>
              <Input
                id="docId"
                value={documents.find(doc => doc.id === editingDocumentId)?.id || ""}
                disabled
                className="w-full bg-muted"
                data-testid="documentsPage.editDocumentIdInput"
              />
              <p className="text-xs text-muted-foreground">{t("documents.systemIdReadOnly")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocInfoDialogOpen(false)} data-testid="documentsPage.cancelEditButton">
              {t("common.cancel")}
            </Button>
            <Button disabled={!madeChanges||!!documentNameError} onClick={handleSaveDocInfo} data-testid="documentsPage.saveChangesButton">
              {t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
} 