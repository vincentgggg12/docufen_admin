import { useState, useEffect, useRef } from "react"
import { SidebarLeft } from "../../components/left-sidebar/sidebar-left"
import { SidebarRight } from "./Right-sidebar/sidebar-right"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from "../../components/ui/sidebar"
import SFEditor from "@/components/editor/SFEditor"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useAppStore, useDocumentsStore, useDocumentStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { SidebarRightProvider } from "@/pages/DocumentCompletion/Right-sidebar/sidebar-right-context"
import { DocumentDescription } from "@/lib/apiUtils"
import { DocumentSkeleton } from "@/components/editor/DocumentSkeleton"
import { SidebarRightSkeleton } from "./Right-sidebar/sidebar-right-skeleton"

export default function DocExecutionPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { documents, setActiveDocumentId } = useDocumentsStore(useShallow((state) => ({
    documents: state.documents,
    activeDocumentId: state.activeDocumentId,
    setActiveDocumentId: state.setActiveDocumentId
  })))
  const { sidebarOpen, setSidebarOpen, setSelectionMode, clearSelectedCells, setPreviousCellIndex, setPreviousCellColour } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
    setSelectionMode: state.setSelectionMode,
    clearSelectedCells: state.clearSelectedCells,
    setPreviousCellIndex: state.setPreviousCellIndex,
    setPreviousCellColour: state.setPreviousCellColour,
   })))
  const { setDocumentId } = useDocumentStore()
  const navigate = useNavigate()
  const [editorKey, setEditorKey] = useState<string>(id || "init")
  const [isLoading, setIsLoading] = useState(true)
  const [isDocumentReady, setIsDocumentReady] = useState(false)
  const [isSidebarReady, setIsSidebarReady] = useState(false)
  const [currentDocId, setCurrentDocId] = useState<string | undefined>(id)
  const prevIdRef = useRef<string | undefined>(id)

  // Force sidebar closed for document pages
  // Force sidebar closed for document pages
  useEffect(() => {
    // Use sessionStorage to track internal navigation
    const isInternalNavigation = (() => {
      // Check if this navigation was marked as internal
      const navigationId = sessionStorage.getItem('navigationId');
      const currentNavId = location.state?.navigationId;
      // If we have matching navigation IDs, it's internal
      if (navigationId && currentNavId && navigationId === currentNavId) {
        return true;
      }
      // Otherwise, it's external navigation
      return false;  
    })();
    
    // console.log("Internal navigation:", isInternalNavigation);
    // console.log("Location state:", location.state);
    
    // Close sidebar unless it's confirmed internal navigation
    if (!isInternalNavigation) {
      setSidebarOpen(false);
    }
  }, [location.key, setSidebarOpen]);

  // Find document details for the sidebar
  const currentDocument = documents.find((doc: DocumentDescription) => doc.id === id)
  const documentTitle = currentDocument ? currentDocument.documentName : "Document"

  // Set the active document ID when the component mounts or the ID changes
  // Also handles BulkNA state cleanup when document changes
  useEffect(() => {
    // Skip if ID hasn't changed and we're not loading
    if (id === prevIdRef.current && currentDocId === id && !isLoading) {
      return;
    }

    if (!id) {
      // Redirect to documents page if no ID provided
      console.log("No document ID found, redirecting to documents page");
      navigate('/documents');
      return;
    }

    console.log(`DocExecutionPage - Document ID changed from ${prevIdRef.current} to ${id}`);

    // Clear BulkNA state when document ID actually changes
    // This must happen BEFORE document loading to ensure clean state
    if (id !== prevIdRef.current && prevIdRef.current !== undefined) {
      console.log(`DocExecutionPage - Clearing BulkNA state due to document change`);

      // Reset selection mode to edit (exit BulkNA mode)
      setSelectionMode('edit');

      // Clear all selected cells
      clearSelectedCells();

      // Reset previous cell tracking
      setPreviousCellIndex('');
      setPreviousCellColour('');
    }
    
    // Show loading state
    setIsLoading(true);
    setIsDocumentReady(false);
    setIsSidebarReady(false);
    
    // Update active document in context
    setActiveDocumentId(id);
    
    // Update document in store
    setDocumentId(id);
    
    // Only change editor key if document ID actually changes
    // This preserves editor state when viewing the same document
    if (id !== prevIdRef.current) {
      console.log(`Document ID changed, setting new editor key: ${id}`);
      setEditorKey(id);
    }
    
    // Update current document ID
    setCurrentDocId(id);
    
    // Save current ID in ref
    prevIdRef.current = id;
    
    // // Check if this document exists in our data
    // const documentExists = documents.some(doc => doc.id === id);
    
    // if (documents && !documentExists) {
    //   console.warn(`Document with ID ${id} not found in available documents`);
      
    //   // Track document not found error
    //   trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
    //     error_type: 'document_not_found',
    //     error_code: 'DOC_NOT_FOUND',
    //     error_message: `Document with ID ${id} not found`,
    //     error_source: 'DocExecutionPage',
    //     page_name: 'Document Editor',
    //     action_attempted: 'open_document'
    //   });
    // } else {
    //   // Track document opened
    //   console.warn(`Document with ID ${id} FOUND in available documents`);
    //   const doc = documents.find(doc => doc.id === id);
    //   if (doc) {
    //     trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_OPENED, {
    //       document_id: id,
    //       document_name: doc.documentName,
    //       document_stage: stageToDocumentStage(doc.stage),
    //       open_source: 'direct_navigation',
    //       is_favorite: false // TODO: check if document is favorited
    //     });
    //   }
    // }
    
    // Finish loading after a delay to allow state to update
    // Using a longer delay to ensure all state changes have propagated
    setTimeout(() => {
      setIsLoading(false);
    }, 200);
  }, [id, location.pathname, setActiveDocumentId, setDocumentId, navigate, documents, setSelectionMode, clearSelectedCells, setPreviousCellIndex, setPreviousCellColour]);
  
  // Set sidebar ready after document is ready with a small delay
  useEffect(() => {
    if (isDocumentReady && !isSidebarReady) {
      const timer = setTimeout(() => {
        setIsSidebarReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDocumentReady, isSidebarReady]);
  
  return (
  <SidebarProvider 
    open={sidebarOpen} 
    onOpenChange={setSidebarOpen}
    defaultOpen={false}
  >
      <SidebarRightProvider defaultVisible={true} defaultTab="fillout" defaultWidth={365}>
        <div className="flex h-svh w-full overflow-hidden" data-testid="docExecutionPage.container">
          <SidebarLeft />
          <SidebarInset className="flex-1 min-w-0 overflow-hidden p-0 relative" style={{ backgroundColor: '#F5F2EE' }} data-testid="docExecutionPage.mainContent">
            {/* Floating sidebar toggle for left sidebar */}
            <div className="absolute top-3 left-3 z-30">
              <SidebarTrigger className="bg-white shadow-sm rounded-md hover:bg-gray-50" data-testid="docExecutionPage.leftSidebarToggle" />
            </div>
            
            {/* Use key prop to force remount when document ID changes */}
            <div id="growingEditorContainer" className="h-full w-full flex-grow relative" style={{ backgroundColor: '#F5F2EE' }} data-testid="docExecutionPage.editorContainer">
              {/* Show skeleton until document is ready with fade out transition */}
              {(isLoading || !isDocumentReady) && (
                <div className={`absolute inset-0 z-10 transition-opacity duration-700 ease-in-out ${isDocumentReady ? 'opacity-0' : 'opacity-100'}`}>
                  <DocumentSkeleton data-testid="docExecutionPage.loadingSkeleton" />
                </div>
              )}
              {/* Render editor when initial loading is done, with fade in transition */}
              {!isLoading && (
                <div className={`h-full w-full transition-opacity duration-700 ease-in-out ${!isDocumentReady ? 'opacity-0' : 'opacity-100'}`}>
                  <SFEditor 
                    key={editorKey} 
                    documentId={currentDocId} 
                    onDocumentReady={() => setIsDocumentReady(true)}
                    data-testid="docExecutionPage.editor" 
                  />
                </div>
              )}
            </div>
          </SidebarInset>
          {/* Right sidebar container */}
          <div className="relative h-full flex" style={{ backgroundColor: "#F5F2EE" }}>
            {/* Show skeleton until sidebar is ready with fade out transition */}
            {(isLoading || !isSidebarReady) && (
              <div className={`absolute inset-0 z-10 transition-opacity duration-700 ease-in-out ${isSidebarReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <SidebarRightSkeleton data-testid="docExecutionPage.rightSidebarSkeleton" />
              </div>
            )}
            {/* Render sidebar immediately but keep it invisible until ready */}
            <div className={`flex h-full transition-opacity duration-700 ease-in-out ${isSidebarReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <SidebarRight 
                documentTitle={documentTitle}
                className=""
                data-testid="docExecutionPage.rightSidebar"
              />
            </div>
          </div>
        </div>
      </SidebarRightProvider>
    </SidebarProvider>
  )
}