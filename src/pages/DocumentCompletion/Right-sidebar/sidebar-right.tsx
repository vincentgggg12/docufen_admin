import * as React from "react"
import { 
  ChevronRight, MessageSquare, Paperclip, History, ChevronLeft,
  ClipboardPen, GitBranch, PenSquare, Trash2, Loader2, FileCheck, RotateCcw,
  BanIcon, FileStack, RefreshCcw
} from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { IconSignature } from "@tabler/icons-react"
import { refreshAllDocumentsLists } from "@/hooks/AccountData";

// Import PDF icon component to use the same icon as the documents table
import pdfIconSvg from "@/assets/pdf_icon.svg"
const FinalPDFIcon = () => (
  <img src={pdfIconSvg} alt="PDF" className="h-4 w-4" />
);

import {
  SidebarContent,
  SidebarFooter,
} from "../../../components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, encodeUrlFilename } from "@/lib/utils"
import { useSidebarRight } from "./sidebar-right-context"
import { Stage } from "../../../components/editor/lib/lifecycle"
import { useAppStore, useDocumentStore, useModalStore, useUserStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { areAllParticipantsSigned } from "@/lib/workflowUtils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useNavigate } from "react-router-dom";
import { shredDocument, GroupTitles, voidDocument } from "@/lib/apiUtils";
import { toast } from "sonner";
import { VoidDocumentDialog } from "./void-document-dialog";
import { StageGoBackModal } from "./StageGoBackModal";

// Import tab components
import FillOutTab from "./sidebar-right_tab2_fillout"
import ChatTab from "./sidebar-right_tab3_chat"
import AttachmentsTab from "./sidebar-right_tab4_attachments"
// import ExceptionsTab from "./sidebar-right_tab6_exceptions"
import { ControlledCopiesTab } from "./sidebar-right_tab7_controlled_copies"
import { goToStage } from "../../../components/editor/lib/addinUtils"
import { useTranslation } from "react-i18next"
import { createPdfFiles, ParticipantGroup } from "@/lib/apiUtils"
import { usePdfJobStatus } from "@/hooks/usePdfJobStatus"
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude"
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events"
import { stageToDocumentStage } from "@/components/editor/lib/utils"
// Import document type icon
import DocumentTypeIcon from "../../Documents/DocumentTypeIcon"
import { checkDocumentNotStale, DocumentStaleStatus, triggerReloadDocument } from "../../../components/editor/lib/editUtils";
// Import our workflow utilities



export function SidebarRight({
  documentTitle,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  documentTitle?: string
}) {
  // Use the sidebar right context
  const { i18n, t } = useTranslation()
  const { isVisible, activeTab, setTabAndVisibility, toggleVisibility, setIsVisible, sidebarWidth } = useSidebarRight();
  
  // Get URL search parameters to determine initial active tab
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  // State for workflow dialog and groups
  // const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  
  // State for signing warning modal
  const [showSigningWarning, setShowSigningWarning] = React.useState(false);
  
  // State for delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false);
  
  // State for void document dialog
  const [showVoidDialog, setShowVoidDialog] = React.useState(false);
  
  // State for stage go back confirmation modal
  const [showStageGoBackModal, setShowStageGoBackModal] = React.useState(false);
  
  // Loading state for delete/void operations
  const [isOperationLoading, setIsOperationLoading] = React.useState(false);

  // Navigation hook for redirects
  const navigate = useNavigate();

  // Map URL tab parameters to tab values
const tabMapping: Record<string, string> = {
  fillout: "fillout",
  chat: "chat",
  attachments: "attachment",
  history: "history",
  exceptions: "exceptions",
  controlledCopies: "controlledCopies"
};

// Tab definitions with icons, titles and components
const tabs = [
  { 
    id: "fillout", 
    icon: <PenSquare className="h-4 w-4" />, 
    title: t('sbr.fillOut'),
    component: FillOutTab
  },
  { 
    id: "chat", 
    icon: <MessageSquare className="h-4 w-4" />, 
    title: t('mPopup.tab.notes'),
    component: ChatTab
  },
  { 
    id: "attachment", 
    icon: <Paperclip className="h-4 w-4" />, 
    title: t('mPopup.tab.attachments'),
    component: AttachmentsTab
  },
  // { 
  //   id: "exceptions", 
  //   icon: <AlertTriangle className="h-4 w-4" />, 
  //   title: t('sbr.exceptions'),
  //   component: ExceptionsTab
  // },
  { 
    id: "controlledCopies", 
    icon: <FileStack className="h-4 w-4" />, 
    title: t('cc.controlledCopies')
    // No component property - we'll render this manually in the JSX
  },
  { 
    id: "history", 
    icon: <History className="h-4 w-4" />, 
    title: t('users.auditLog')
    // No component property - handled via modal/event
  }
];

  // Get participant groups from our workflow utils
  const documentStore = useDocumentStore(useShallow((state) => ({
    participantGroups: state.participantGroups,
    setParticipantGroups: state.setParticipantGroups,
    saveParticipantGroups: state.saveParticipantGroups,
    pdfUrl: state.pdfUrl,
    setEditTime: state.setEditTime,
    documentId: state.documentId,
    documentStage: state.documentStage, 
    setDocumentStage: state.setDocumentStage,
    setPdfUrl: state.setPdfUrl,
    triggerReload: state.triggerReload,
    setReloadSelection: state.setReloadSelection,
    documentHasContent: state.documentHasContent,
    activeChildren: state.activeChildren,
    documentDescription: state.documentDescription,
    editTime: state.editTime,
    locale: state.locale
  })))
  const { participantGroups, setParticipantGroups, 
    pdfUrl, setPdfUrl, documentStage, setDocumentStage, documentId, documentHasContent, activeChildren,
    documentDescription, setEditTime, locale
  } = documentStore
  // Get current user information
  const { participant } = useUserStore(useShallow((state) => ({
    participant: state.participant,
    tenantName: state.tenantName
  })))
  
  // Check if current user is an owner of the document
  const isDocumentOwner = React.useMemo(() => {
    // Find the Owners group
    const ownersGroup = participantGroups?.find(group => group.title === GroupTitles.OWNERS);
    
    // If no owners group exists or no current participant, return false
    if (!ownersGroup || !participant) return false;
    
    // Check if current user's ID or email is in the owners list
    return ownersGroup.participants.some(owner => 
      (owner.id && participant.id && owner.id === participant.id) ||
      (owner.email && participant.email && owner.email === participant.email)
    );
  }, [participantGroups, participant]);
  
  // Set the default edit mode based on whether the user is the document owner 
  const [isEditMode, setIsEditMode] = React.useState(false);
  
  // Effect to set initial edit mode based on document owner status only once
  React.useEffect(() => {
    // Only set edit mode when document owner status changes or document stage changes
    // Don't reset when tab changes
    if (isDocumentOwner && documentStage !== Stage.Voided) {
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  }, [isDocumentOwner, documentStage]);
  
  // Add loading states for navigation buttons
  const [isBackLoading, setIsBackLoading] = React.useState(false);
  const [isNextLoading, setIsNextLoading] = React.useState(false);

  // Shared handler for PDF creation success (used by both immediate completion and polling)
  const handlePdfCreationSuccess = React.useCallback((pdfUrl: string, time: number) => {
    console.log("PDF creation completed:", pdfUrl);
    setPdfUrl(pdfUrl);
    setDocumentStage(Stage.Finalised);
    setEditTime(time);

    // Refresh all document lists
    const { tenantName } = useUserStore.getState();
    refreshAllDocumentsLists(tenantName).catch(err => {
      console.error("Error refreshing document lists:", err);
    });

    // Show success toast
    toast.success(t("documentFinalized"));

    // Reset loading state and clear overlay
    setIsNextLoading(false);
    const { setWorking, setWorkingTitle } = useAppStore.getState();
    setWorking(false);
    setWorkingTitle("");
  }, [setPdfUrl, setDocumentStage, setEditTime, t]);

  // PDF job status polling hook for handling long-running PDF creation
  const { startPolling: startPdfPolling } = usePdfJobStatus({
    onComplete: handlePdfCreationSuccess,
    onFailure: (error) => {
      console.error("PDF creation failed via polling:", error);

      // Track PDF generation error
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
        error_type: 'pdf_generation_failed',
        error_code: 'PDF_ERROR',
        error_message: error || 'Unknown error',
        error_source: 'SidebarRight',
        page_name: 'Document Editor',
        action_attempted: 'finalize_document'
      });

      toast.error(t("errors.somethingWentWrong"));

      // Reset loading state and clear overlay on error
      setIsNextLoading(false);
      const { setWorking, setWorkingTitle } = useAppStore.getState();
      setWorking(false);
      setWorkingTitle("");
    }
  });

  // Effect to ensure the sidebar is visible on mount
  React.useEffect(() => {
    // Force the sidebar to be visible when the component mounts
    setIsVisible(true);
    // No need to force the tab as it's already set by the provider's defaultTab
    console.log("SidebarRight mounted - forcing sidebar to be visible");
  }, [setIsVisible]);
  
  // Effect to set initial active tab based on URL parameter
  React.useEffect(() => {
    if (tabParam && tabMapping[tabParam]) {
      setTabAndVisibility(tabMapping[tabParam]);
    }
  }, [tabParam, setTabAndVisibility]);

  // Find the active tab component
  const activeComponent = React.useMemo(() => {
    // For the ControlledCopiesTab, we need to handle it separately to pass props
    if (activeTab === "controlledCopies") {
      return null; // Will render manually in JSX
    }
    
    const tab = tabs.find(t => t.id === activeTab);
    return tab && tab.component ? tab.component : null;
  }, [activeTab]);
  
  const modalStore = useModalStore(useShallow((state) => ({ 
    setDocumentInUse: state.setDocumentInUse,
    setDocumentNotUpToDate: state.setDocumentNotUpToDate,
    setDocumentStatus: state.setDocumentStatus
  })))
  
  // Handle stage navigation
  const { editor, hideInsertIntoCellDialog } = useAppStore(useShallow((state) => ({ 
    hideInsertIntoCellDialog: state.hideInsertIntoCellDialog,
    editor: state.editor })))
  const { setUser } = useUserStore(useShallow((state) => ({ setUser: state.setUser })))
  const { setDocumentInUse } = modalStore
  const [reason, setReason] = React.useState('')
  const [nextStage, setNextStage] = React.useState<number | null>(null)
  const [previousStage, setPreviousStage] = React.useState<number | null>(null)
  const [oldGroups, setOldGroups] = React.useState<ParticipantGroup[]>([])
  // For execution variant
  const stages = [Stage.PreApprove, Stage.Execute, Stage.PostApprove, Stage.Closed, Stage.Finalised]

  React.useEffect(() => {
    console.log("Current document stage in NavUser:", documentStage);
    const currentIndex = stages.indexOf(documentStage)
    
    if (currentIndex === -1) {
      return;
    }
    
    if (currentIndex < stages.length - 1) {
      setNextStage(stages[currentIndex + 1])
    } else {
      setNextStage(null)
    }
    
    if (currentIndex === 0) {
      setPreviousStage(null)
    } else if (currentIndex === stages.length - 1) {
      setPreviousStage(stages[currentIndex - 2])
    } else {
      setPreviousStage(stages[currentIndex - 1])
    }
  }, [documentStage])

  const handleGoBack = async () => {
    if (!editor) {
      console.error("Editor is not available");
      return;
    }
    
    if (previousStage === null) {
      console.error("No previous stage available");
      return;
    }
    
    // Show the stage go back modal for confirmation and reason collection
    setShowStageGoBackModal(true);
    hideInsertIntoCellDialog();
  };

  // New function to handle the actual stage go back with reason
  const handleStageGoBackConfirm = async (reason: string) => {
    if (!editor) {
      console.error("Editor is not available");
      return;
    }
    
    if (previousStage === null) {
      console.error("No previous stage available");
      return;
    }
    
    console.log("Going to previous stage:", previousStage, "with reason:", reason);
    
    // Set loading state
    setIsBackLoading(true);
    const { tenantName } = useUserStore.getState();
    
    // Set document overlay to prevent user interactions
    const { setWorking, setWorkingTitle } = useAppStore.getState();
    setWorking(true);
    setWorkingTitle(t("stageManagement"));
    
    try {
      const staleState: DocumentStaleStatus = await checkDocumentNotStale(true)
      if (!staleState.ok) {
        await triggerReloadDocument(editor, modalStore)
        return
      }
      
      await goToStage(
        documentId, 
        previousStage, 
        i18n.language, 
        reason, // Use the reason from the modal
        staleState.timestamp,
        setDocumentInUse, 
        setUser, 
        setDocumentStage
      );
      documentStore.setEditTime(staleState.timestamp)
      // Update editor read-only state based on stage
      editor.isReadOnly = true
      
      console.log("Successfully moved to previous stage:", previousStage);
      
      // Refresh all document lists
      await refreshAllDocumentsLists(tenantName);
      
      // Show success toast
      toast.success(t("documentStageChanged", { stage: t(`document.${previousStage}`) }));
      
      // Close the modal
      setShowStageGoBackModal(false);
    } catch (error) {
      console.error("Error going to previous stage:", error);
      toast.error(t("errors.somethingWentWrong"));
      // Don't close the modal on error so user can try again
      throw error; // Re-throw for the modal to handle
    } finally {
      // Reset loading state and clear overlay
      setIsBackLoading(false);
      setWorking(false);
      setWorkingTitle("");
    }
  };

  const handleGoNext = async () => {
    if (!editor) {
      console.error("Editor is not available");
      return;
    }
    console.log("Next stage")
    
    // Track stage advance attempt
    trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_STAGE_ADVANCED, {
      document_id: documentId,
      document_name: documentTitle || 'Unknown',
      from_stage: stageToDocumentStage(documentStage),
      to_stage: stageToDocumentStage(nextStage),
      trigger_source: 'right_sidebar_navigation'
    });
    
    // Set document overlay to prevent user interactions
    const { setWorking, setWorkingTitle } = useAppStore.getState();
    setWorking(true);
    setWorkingTitle(t("stageManagement"));
    
    if (nextStage === Stage.Finalised.valueOf()) {
      // Set loading state for PDF generation
      console.log("Creating PDF files...");
      setIsNextLoading(true);
      
      // Track PDF generation started
      trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_FINALIZED, {
        document_id: documentId,
        document_name: documentTitle || 'Unknown',
        finalization_source: 'stage_navigation',
        from_stage: stageToDocumentStage(documentStage)
      });
      
      try {
        const response = await createPdfFiles(documentId, i18n.language);
        console.log("createPdfFiles response:", response);

        if (response.status === 'completed' && response.pdfUrl) {
          // Immediate completion - PDF is ready
          handlePdfCreationSuccess(response.pdfUrl, response.time || Date.now());
        } else if (response.status === 'processing') {
          // PDF creation taking longer - start polling
          console.log("PDF creation in progress, starting polling...");
          startPdfPolling(documentId);
          // Keep loading state active - will be cleared by onComplete/onFailure callbacks
        } else {
          // Failed
          console.error("PDF creation failed:", response.error);
          throw new Error(response.error || 'PDF creation failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(errorMessage)

        // Track PDF generation error
        trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
          error_type: 'pdf_generation_failed',
          error_code: 'PDF_ERROR',
          error_message: errorMessage,
          error_source: 'SidebarRight',
          page_name: 'Document Editor',
          action_attempted: 'finalize_document'
        });

        toast.error(t("errors.somethingWentWrong"));
        // Reset loading state and clear overlay on error
        setIsNextLoading(false);
        setWorking(false);
        setWorkingTitle("");
      }
      return;
    }
    
    // If we're in PreApprove stage trying to move to Execute, check if all participants have signed
    if (documentStage === Stage.PreApprove && nextStage === Stage.Execute) {
      const allSigned = areAllParticipantsSigned(Stage.PreApprove, participantGroups);
      if (!allSigned && participantGroups[0]?.participants?.length > 0) {
        // Show the modal instead of using alert
        setShowSigningWarning(true);
        hideInsertIntoCellDialog()
        // Clear overlay since we're not proceeding
        setWorking(false);
        setWorkingTitle("");
        return;
      }
    }
    
    // If we're in PostApprove stage trying to move to Closed, check if all participants have signed
    if (documentStage === Stage.PostApprove && nextStage === Stage.Closed) {
      const allSigned = areAllParticipantsSigned(Stage.PostApprove, participantGroups);
      if (!allSigned && participantGroups[2]?.participants?.length > 0) {
        // Show the modal instead of using alert
        setShowSigningWarning(true);
        hideInsertIntoCellDialog()
        // Clear overlay since we're not proceeding
        setWorking(false);
        setWorkingTitle("");
        return;
      }
    }
    
    console.log("Going to next stage:", nextStage);
    
    // Set loading state
    setIsNextLoading(true);
    const { tenantName } = useUserStore.getState();
    
    try {
      if (nextStage === null) {
        console.error("No next stage available");
        // Clear overlay since we're not proceeding
        setWorking(false);
        setWorkingTitle("");
        return;
      }
      const nPages = editor.pageCount
      console.log("Number of pages:", nPages);
      const staleState: DocumentStaleStatus = await checkDocumentNotStale(true)
      if (!staleState.ok) {
        await triggerReloadDocument(editor, modalStore)
        // Clear overlay since the reload will handle its own overlay
        setWorking(false);
        setWorkingTitle("");
        return
      }
      await goToStage(
        documentId,
        nextStage,
        i18n.language, 
        reason,
        staleState.timestamp,
        setDocumentInUse, 
        setUser, 
        setDocumentStage,
        nPages
      );
      documentStore.setEditTime(staleState.timestamp)
      documentStore.setEditTime(staleState.timestamp)

      // Update editor read-only state based on stage
      editor.isReadOnly = true
      
      console.log("Successfully moved to next stage:", nextStage);
      
      // Refresh all document lists
      await refreshAllDocumentsLists(tenantName);
      
      // Show success toast
      toast.success(t("documentStageChanged", { stage: t(`document.${nextStage}`) }));
    } catch (error) {
      console.error("Error going to next stage:", error);
      toast.error(t("errors.somethingWentWrong"));
    } finally {
      // Reset loading state and clear overlay
      setIsNextLoading(false);
      setWorking(false);
      setWorkingTitle("");
    }
    
    setReason('');
  };

  // Add a state for controlling the add modal in the ControlledCopies tab
  const [showControlledCopyModal, setShowControlledCopyModal] = React.useState(false);
  
  // Add state for re-open confirmation dialog
  const [showReopenConfirmation, setShowReopenConfirmation] = React.useState(false);
  
  // Handler for viewing the final PDF in a new tab
  const handleViewPDF = () => {
    if (pdfUrl && pdfUrl.length > 0) {
      window.open(encodeUrlFilename(pdfUrl), '_blank');
    }
  };
  
  // Updated re-open handler that shows confirmation dialog first
  const handleReOpenRequest = () => {
    setShowReopenConfirmation(true);
  };
  
  // Handler for re-opening the document from PDF mode after confirmation
  const handleReOpenDocument = () => {
    setShowReopenConfirmation(false)
    handleGoBack()
  };
  
  const toggleEditmode = () => {
    // Get the hideInsertIntoCellDialog function from the app store
    const { hideInsertIntoCellDialog } = useAppStore.getState();
    
    if (isEditMode) {
      // When exiting edit mode, save the current groups to make them persistent
      console.error("Saving participant groups due to editmode toggle");
      // saveParticipantGroups(participantGroups, editedGroups);
    } else {
      // When entering edit mode, save the current state to restore if needed
      setOldGroups(participantGroups);
      
      // Close MasterPopup when entering edit mode
      hideInsertIntoCellDialog();
    }
    
    // Set the new edit mode state
    const newEditModeState = !isEditMode;
    setIsEditMode(newEditModeState);
    
    // Dispatch a custom event to notify other components about the edit mode change
    const event = new CustomEvent('workflow-edit-mode-change', { 
      detail: newEditModeState 
    });
    window.dispatchEvent(event);
  }
  
  // Reset edit mode when documentId changes to ensure we start with normal mode when loading a new document
  React.useEffect(() => {
    // Only reset if not the document owner
    if (!isDocumentOwner && isEditMode) {
      // Turn off edit mode when changing documents
      setIsEditMode(false);
    }
  }, [documentId, isDocumentOwner]);
  
  // Listen for workflow edit mode change events from other components
  React.useEffect(() => {
    const handleEditModeChange = (event: CustomEvent<boolean>) => {
      // Update the local edit mode state if it doesn't match the event detail
      if (isEditMode !== event.detail) {
        setIsEditMode(event.detail);
        
        // If turning off edit mode, restore the original participant groups
        if (!event.detail && isEditMode) {
          setParticipantGroups(oldGroups);
        }
      }
    };
    
    // Add event listener for the custom event
    window.addEventListener('workflow-edit-mode-change', handleEditModeChange as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('workflow-edit-mode-change', handleEditModeChange as EventListener);
    };
  }, [isEditMode, oldGroups, setParticipantGroups]);
  
  // Effect to dispatch event if the edit mode changes via other means (like FillOutTab)
  React.useEffect(() => {
    // Dispatch a custom event to notify other components about the edit mode
    const event = new CustomEvent('workflow-edit-mode-change', { 
      detail: isEditMode 
    });
    window.dispatchEvent(event);
  }, [isEditMode]);

  // Function to handle saving participant groups
  // const handleSaveParticipants = (updatedGroups: ParticipantGroup[], groupIndex: number) => {
  //   saveParticipantGroups(updatedGroups, groupIndex);
  // };

  // Function to determine if the document should use "Void" instead of "Delete"
  // This checks if any participants have signed OR if any content has been added to the document
  // For Pre-Approval stage, also triggers billing when first signature is added
  const shouldShowVoidInsteadOfDelete = React.useMemo(() => {
    // Check if any participant in any group has signed
    const anyParticipantSigned = participantGroups.some(group => 
      group.participants && group.participants.some(participant => participant.signed)
    );
    
    // Special handling for Pre-Approval stage: check if any Pre-Approval participants have signed
    // This aligns with the billing logic that triggers Pre-Approval billing on first signature
    if (documentStage === Stage.PreApprove && participantGroups[0]?.participants?.length > 0) {
      const preApprovalSigned = participantGroups[0].participants.some(participant => participant.signed);
      // If any Pre-Approval participant has signed, this should show "Void" and would have triggered billing
      if (preApprovalSigned) {
        return true;
      }
    }
    
    // Log the current state for debugging
    // console.log("Document state check:", {
    //   documentHasContent,
    //   anyParticipantSigned,
    //   buttonText: (anyParticipantSigned || documentHasContent) ? "Void" : "Delete"
    // });
    
    // Return true if either content has been added or any participant has signed
    return anyParticipantSigned || documentHasContent;
  }, [participantGroups, documentHasContent]);

  // Handle document delete or void
  const handleDeleteOrVoid = () => {
    if (shouldShowVoidInsteadOfDelete) {
      // Track void initiated
      trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_VOIDED, {
        document_id: documentId,
        document_name: documentTitle || 'Unknown',
        void_source: 'navigation_button',
        from_stage: documentStage,
        has_content: documentHasContent,
        has_signatures: participantGroups.some(g => g.participants?.some(p => p.signed))
      });
      
      // Show void dialog for documents with content
      setShowVoidDialog(true);
    } else {
      // Track delete initiated
      trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_DELETED, {
        document_id: documentId,
        document_name: documentTitle || 'Unknown',
        delete_source: 'navigation_button',
        from_stage: documentStage
      });
      
      // Show delete confirmation for empty documents
      setShowDeleteConfirmation(true);
    }
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    setIsOperationLoading(true);
    
    try {
      console.log(`Deleting document: ${documentId}`);
      
      const result = await shredDocument(documentId);
      if (result.error) {
        console.error("Unable to delete document:", result.error);
        throw new Error(result.error);
      }
      // Show success message
      toast.success(t("notifications.documentDeleted"));
      
      // Reset loading state and close dialog before navigation to prevent hooks error
      setIsOperationLoading(false);
      setShowDeleteConfirmation(false);
      
      // Force a refresh of the documents list by manipulating URL parameters
      const refreshParam = new URLSearchParams();
      refreshParam.append('refresh', Date.now().toString());
      
      // Navigate back to documents list with refresh parameter
      // Use setTimeout to ensure all state updates complete before navigation
      setTimeout(() => {
        navigate(`/documents?${refreshParam.toString()}`);
      }, 0);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(t("errors.somethingWentWrong"));
      // Reset states on error
      setIsOperationLoading(false);
      setShowDeleteConfirmation(false);
    }
  };
  
  // Handle void confirmation
  const handleVoidConfirm = async (reason: string) => {
    setIsOperationLoading(true);
    const { tenantName } = useUserStore.getState();
    
    try {
      // Get current stage name for the "from" parameter
      const stageKey = Object.keys(Stage).find(
        key => Stage[key as keyof typeof Stage] === documentStage
      ) || '';
      
      // Call void document API
      const result = await voidDocument(
        documentId,
        stageKey,
        reason,
        i18n.language
      );
      
      if (result.success) {
        // Show success message
        toast.success(t("documentVoided"));
        
        // Close the dialog
        setShowVoidDialog(false);
        
        // Reset loading state before navigation to prevent hooks error
        setIsOperationLoading(false);
        
        // Refresh all document lists
        await refreshAllDocumentsLists(tenantName);
        
        // Navigate back to documents list to show the updated voided document
        // Use setTimeout to ensure all state updates complete before navigation
        setTimeout(() => {
          navigate(`/documents`);
        }, 0);
      } else {
        throw new Error(result.error || t('sbr.unknownError'));
      }
    } catch (error) {
      console.error("Error voiding document:", error);
      toast.error(typeof error === 'string' ? error : t("errors.voidFailed"));
      // Reset loading state on error
      setIsOperationLoading(false);
      throw error; // Re-throw for the dialog to handle
    }
  };

  // Add a loading state for the refresh button
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  // Add a function to handle document refresh
  const handleRefreshDocument = async () => {
    if (!editor || !documentId) return;
    
    // Track refresh attempt
    trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_REFRESHED, {
      document_id: documentId,
      document_name: documentTitle || 'Unknown',
      refresh_source: 'right_sidebar_button',
      document_status: 'unknown'
    });
    
    setIsRefreshing(true);
    const staleState: DocumentStaleStatus = await checkDocumentNotStale(false)
    if (staleState.ok) {
      setIsRefreshing(false);
      return
    }
    try {
      await triggerReloadDocument(editor, modalStore);
    } catch (error) {
      console.error("Error refreshing document:", error);
      toast.error(t("errors.somethingWentWrong"));
      
      // Track refresh error
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
        error_type: 'document_refresh_failed',
        error_code: 'REFRESH_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_source: 'SidebarRight',
        page_name: 'Document Editor',
        action_attempted: 'refresh_document'
      });
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000); // Add a small delay to show the loading state
    }
  };
  return (
    <div className={cn("flex h-full", className)} {...props} style={{ backgroundColor: "#F5F2EE" }} data-testid="docExecutionPage.rsb.container">
      {/* Main sidebar content */}
      <div
        className={cn(
          "h-full overflow-hidden bg-background transition-all duration-300",
          isVisible ? "" : "w-0"
        )}
        style={{ 
          width: isVisible ? `${sidebarWidth}px` : '0px',
          opacity: isVisible ? 1 : 0,
          backgroundColor: "#F5F2EE"
        }}
        data-testid="docExecutionPage.rsb.mainContent"
      >
        {isVisible && (
          <div className="flex flex-col h-full">
            {/* Sidebar header with tab title */}
            <div className="px-4" style={{ paddingTop: "1.3rem", paddingBottom: "0.25rem" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: "1.1rem" }}>
                {/* Document type icon and title */}
                <div className="flex items-center gap-2 flex-grow mr-2" data-testid="docExecutionPage.rsb.documentInfo">
                  {documentDescription ? (
                    <DocumentTypeIcon document={documentDescription} className="h-5 w-5 text-gray-600" />
                  ) : (
                    <FileStack className="h-5 w-5 text-gray-600" />
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm font-normal truncate text-gray-700" style={{ maxWidth: "305px" }} data-testid="docExecutionPage.rsb.documentTitle">
                          {documentTitle || t('sbr.document')}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {documentTitle || t('sbr.document')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Tab-specific buttons */}
                {activeTab === "fillout" && documentStage !== Stage.Voided && isDocumentOwner && !isEditMode && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (isEditMode) {
                        // When in edit mode, clicking should save changes and exit edit mode
                        // console.error("Calling SaveParticipantGroups in activeTab")
                        console.error("Calling saveParticipantGroups ... saving old groups")
                        setParticipantGroups(oldGroups);
                        setIsEditMode(false);
                      } else {
                        // When not in edit mode, clicking should enter edit mode
                        toggleEditmode();
                      }
                    }}
                    className="flex items-center gap-1"
                    data-testid="docExecutionPage.rsb.editWorkflowButton"
                  >
                    {isEditMode ? (
                      <>{t('actions.close')}</>
                    ) : (
                      <>
                        <GitBranch className="h-3.5 w-3.5" />
                        <span>{t('edit-workflow')}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <SidebarContent className="flex flex-col flex-1">
              <div className={cn("h-full px-4 py-2", activeTab === "chat" && "h-[calc(100vh-9rem)]")} data-testid="docExecutionPage.rsb.tabContent">
                {activeTab === "fillout" && (
                  <div data-fillout-tab="true" data-sidebar-right="true" className="h-full" data-testid="docExecutionPage.rsb.filloutTab">
                    <FillOutTab
                      oldGroups={oldGroups}
                    />
                  </div>
                )}
                {activeTab === "controlledCopies" && (
                  <div className="h-full" data-testid="docExecutionPage.rsb.controlledCopiesTab">
                    <ControlledCopiesTab 
                      documentId={documentId}
                      activeChildren={activeChildren}
                      isAddModalOpen={showControlledCopyModal}
                      setIsAddModalOpen={setShowControlledCopyModal}
                    />
                  </div>  
                )}
                {activeTab !== "fillout" && activeTab !== "controlledCopies" && activeComponent && 
                  React.createElement(activeComponent, {})
                }
              </div>
            </SidebarContent>
            
            {/* Sidebar footer with document stage navigation */}
            <SidebarFooter className="p-0 py-4" style={{ backgroundColor: "#F5F2EE" }} data-testid="docExecutionPage.rsb.footer">
              <div className="flex items-center justify-between w-full px-4 gap-2">
                {documentStage === Stage.Voided ? (
                  /* Show a message when document is voided */
                  <div className="flex items-center justify-center w-full gap-2 text-red-500 py-2" data-testid="docExecutionPage.rsb.voidedMessage">
                    <BanIcon className="h-4 w-4" />
                    <span className="text-sm">{t('document-voided')}</span>
                  </div>
                ) : documentStage === Stage.Finalised && pdfUrl.length > 0 ? (
                  /* "Re-Open Document" and "View Final PDF" buttons when in PDF mode */
                  <div className="flex w-full gap-2" data-testid="docExecutionPage.rsb.closedStageButtons">
                    <Button
                      variant="outline"
                      size="default"
                      className="flex-1 py-2 px-3 flex items-center justify-center gap-2"
                      onClick={handleReOpenRequest}
                      disabled={!isDocumentOwner}
                      data-testid="docExecutionPage.rsb.reopenButton"
                    >
                      <RotateCcw className="h-4 w-4 text-amber-500" />
                      {t('sbr.Re-Open')}
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      className="flex-1 py-2 px-3 flex items-center justify-center gap-2"
                      onClick={handleViewPDF}
                      data-testid="docExecutionPage.rsb.viewPdfButton"
                    >
                      <FinalPDFIcon />
                      {t('sbr.viewPdf')}
                    </Button>
                  </div>
                ) : (
                  /* Regular navigation buttons - always show for document owners regardless of edit mode */
                  <>
                  {isDocumentOwner && (
                    <div className="flex w-full gap-2" data-testid={activeTab === "fillout" ? "docExecutionPage.rsb.navigationButtons" : "docExecutionPage.rsb.navigationButtonsNonFillout"}>
                      {/* Left button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex items-center gap-2 h-9 text-xs flex-1 justify-start pl-2`}
                        onClick={documentStage === Stage.PreApprove ? handleDeleteOrVoid : handleGoBack}
                        disabled={isBackLoading || isNextLoading || isOperationLoading}
                        data-testid={activeTab === "fillout" ? "docExecutionPage.rsb.backButton" : "docExecutionPage.rsb.backButtonNonFillout"}
                      >
                        {isBackLoading || isOperationLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <ChevronLeft className="h-4 w-4" />
                        )}
                        {documentStage === Stage.PreApprove && (
                          <>
                            {!isBackLoading && !isOperationLoading && (shouldShowVoidInsteadOfDelete ? <BanIcon className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />)}
                            <span>{shouldShowVoidInsteadOfDelete ? t('sbr.void') : t('actions.delete')}</span>
                          </>
                        )}
                        {documentStage === Stage.Execute && (
                          <>
                            {!isBackLoading && <IconSignature size={14} className="text-amber-500" />}
                            <span>Pre-Approval</span>
                          </>
                        )}
                        {documentStage === Stage.PostApprove && (
                          <>
                            {!isBackLoading && <ClipboardPen className="h-4 w-4 text-indigo-500" />}
                            <span>{t('documents.execution')}</span>
                          </>
                        )}
                        {documentStage === Stage.Closed && (
                          <>
                            {!isBackLoading && <RotateCcw className="h-4 w-4 text-amber-500" />}
                            <span>{t("sbr.Re-Open")}</span>
                          </>
                        )}
                        {documentStage === Stage.Finalised && (
                          <>
                            {!isBackLoading && <RotateCcw className="h-4 w-4 text-amber-500" />}
                            <span>{t('sbr.backToCompleted')}</span>
                          </>
                        )}
                      </Button>
                      
                      {/* Right button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 h-9 text-xs flex-1 justify-end pr-2"
                        onClick={handleGoNext}
                        disabled={isBackLoading || isNextLoading}
                        data-testid={activeTab === "fillout" ? "docExecutionPage.rsb.nextButton" : "docExecutionPage.rsb.nextButtonNonFillout"}
                      >
                        {documentStage === Stage.PreApprove && (
                          <>
                            <span>{t('documents.execution')}</span>
                            {!isNextLoading && <ClipboardPen className="h-4 w-4 text-indigo-500" />}
                          </>
                        )}
                        {documentStage === Stage.Execute && (
                          <>
                            <span>{t('documents.postApproval')}</span>
                            {!isNextLoading && <IconSignature size={14} className="text-purple-600" />}
                          </>
                        )}
                        {documentStage === Stage.PostApprove && (
                          <>
                            <span>{t('buttonTitle.close')}</span>
                            {!isNextLoading && <FileCheck className="h-4 w-4 text-[#0E7C3F]" />}
                          </>
                        )}
                        {documentStage === Stage.Closed && (
                          <>
                            <span>{t('documents.finalPdf')}</span>
                            {isNextLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin ml-1" />
                            ) : (
                              <FinalPDFIcon />
                            )}
                          </>
                        )}
                        {isNextLoading && documentStage !== Stage.Closed ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-1" />
                        ) : documentStage !== Stage.Closed && (
                          <ChevronRight className="h-4 w-4 ml-1" />
                        )}
                      </Button>
                    </div>
                  )}
                </>
                )}
              </div>
            </SidebarFooter>
          </div>
        )}
      </div>
      
      {/* Mini sidebar on right */}
      <div className="h-full bg-background border-l flex flex-col items-center py-4 w-12" style={{ 
        backgroundColor: "#F5F2EE",
        borderLeftColor: "#FAF9F5" 
      }} data-testid="docExecutionPage.rsb.miniSidebar">
        <TooltipProvider delayDuration={300}>
          {/* Tab buttons, including the toggle at the top */}
          <div className="flex flex-col items-center w-full" data-testid="docExecutionPage.rsb.tabButtons">
            {/* Toggle sidebar button as first icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 mb-2"
                  onClick={toggleVisibility}
                  data-testid="docExecutionPage.rsb.toggleButton"
                >
                  {isVisible ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t('sbr.toggleSidebar')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isVisible ? t('sbr.collapseSidebar') : t('sbr.expandSidebar')}
              </TooltipContent>
            </Tooltip>
            
            {/* Tab buttons */}
            {tabs.map((tab) => (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === tab.id && isVisible ? "secondary" : "ghost"}
                    size="icon"
                    className={cn(
                      "h-9 w-9 my-1 rounded-md relative",
                      activeTab === tab.id && isVisible && "bg-[#FAF9F5] text-accent-foreground"
                    )}
                    onClick={() => {
                      if (tab.id === "history") {
                        // Track audit log viewed
                        trackAmplitudeEvent(AMPLITUDE_EVENTS.AUDIT_LOG_VIEWED, {
                          document_id: documentId,
                          document_name: documentTitle || 'Unknown',
                          log_entries_count: 0,
                          view_source: 'right_sidebar_tab'
                        });
                        
                        // For the Audit Log tab, open in a new tab
                        let apiBaseUrl = window.location.origin;
                        
                        // Force port 3000 in development environment for backend API
                        if (window.location.hostname === 'localhost') {
                          apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
                        }
                        
                        // Open the audit log in a new tab with the CORRECT URL format
                        // Use /api/activity/{id}?view=frontend as it was working before
                        window.open(`${apiBaseUrl}/api/activity/${documentId}?view=frontend&lng=${locale}`, '_blank');
                      } else {
                        // Track tab switch
                        trackAmplitudeEvent(AMPLITUDE_EVENTS.TAB_SWITCHED, {
                          from_tab: activeTab,
                          to_tab: tab.id,
                          tab_group: 'right_sidebar',
                          page_name: 'Document Editor'
                        });
                        
                        // For other tabs, use the normal tab switching behavior
                        setTabAndVisibility(tab.id);
                      }
                    }}
                    data-testid={`docExecutionPage.rsb.${tab.id}TabButton`}
                  >
                    {tab.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {tab.title}
                </TooltipContent>
              </Tooltip>
            ))}
            {/* Refresh document button after Audit Log */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 my-1 rounded-md"
                  onClick={handleRefreshDocument}
                  disabled={isRefreshing || !documentId}
                  data-testid="docExecutionPage.rsb.refreshButton"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t('sbr.refreshDocument', 'Refresh Document')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {t('sbr.refreshDocument', 'Refresh Document')}
              </TooltipContent>
            </Tooltip>
          </div>
          
            <div className="mt-auto px-2" data-testid="docExecutionPage.rsb.stageIndicator">
              {documentStage === Stage.Voided ? (
                // Special display for voided documents
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full h-9 w-9 flex items-center justify-center bg-red-100">
                      <BanIcon className="h-4 w-4" color="#EF4444" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {t("documents.voided")}
                  </TooltipContent>
                </Tooltip>
              ) : (
                // Normal stage display
                <>
                  {documentStage === Stage.PreApprove && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-full h-9 w-9 flex items-center justify-center bg-[#FFA100]/20">
                          <IconSignature size={16} color="#FFA100" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {t("documents.preApproval")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {documentStage === Stage.Execute && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-full h-9 w-9 flex items-center justify-center bg-[#6366F1]/20">
                          <ClipboardPen className="h-4 w-4" color="#6366F1" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {t("documents.execution")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {documentStage === Stage.PostApprove && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-full h-9 w-9 flex items-center justify-center bg-[#9C27B0]/20">
                          <IconSignature size={16} color="#9C27B0" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {t("documents.postApproval")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {documentStage === Stage.Closed && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-full h-9 w-9 flex items-center justify-center bg-[#0E7C3F]/20">
                          <FileCheck className="h-4 w-4" color="#0E7C3F" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {t("documents.completed")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {documentStage === Stage.Finalised && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-full h-9 w-9 flex items-center justify-center bg-[#7C7C7C]/20">
                          <FinalPDFIcon />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {t("documents.finalised")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </>
              )}
            </div>
        </TooltipProvider>
      </div>
      
      {/* Add the workflow dialog at the component level */}
      {/* {activeTab === "fillout" && (
        <ParticipantsEditDialog
          isOpen={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          groups={participantGroups}
          onSave={handleSaveParticipants}
        />
      )} */}
      
      {/* Add signing warning modal */}
      <Dialog open={showSigningWarning} onOpenChange={setShowSigningWarning}>
        <DialogContent className="sm:max-w-[425px]" data-testid="docExecutionPage.rsb.signingWarningDialog">
          <DialogHeader>
            <DialogTitle data-testid="docExecutionPage.rsb.signingWarningTitle">{t('sbr.allSignaturesRequired')}</DialogTitle>
            <DialogDescription data-testid="docExecutionPage.rsb.signingWarningDescription">
              {documentStage === Stage.PostApprove 
                ? t("participants.allPostApprovalSignaturesRequired")
                : t("participants.allSignaturesRequired")
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSigningWarning(false)} data-testid="docExecutionPage.rsb.signingWarningCloseButton">
              {t("actions.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add the void confirmation dialog */}
      <VoidDocumentDialog
        isOpen={showVoidDialog}
        onClose={() => setShowVoidDialog(false)}
        onConfirm={handleVoidConfirm}
        documentStage={documentStage}
        isLoading={isOperationLoading}
        data-testid="docExecutionPage.rsb.voidDialog"
      />
      
      {/* Add stage go back confirmation dialog */}
      <StageGoBackModal
        isOpen={showStageGoBackModal}
        onClose={() => setShowStageGoBackModal(false)}
        onConfirm={handleStageGoBackConfirm}
        currentStage={documentStage}
        previousStage={previousStage || 0}
        isLoading={isBackLoading}
        data-testid="docExecutionPage.rsb.stageGoBackModal"
      />
      
      {/* Add delete confirmation dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-[425px]" data-testid="docExecutionPage.rsb.deleteConfirmationDialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="docExecutionPage.rsb.deleteConfirmationTitle">
              <Trash2 className="h-5 w-5 text-destructive" />
              {t("actions.delete")}
            </DialogTitle>
            <DialogDescription data-testid="docExecutionPage.rsb.deleteConfirmationDescription">
              {t("confirmations.confirmDelete")}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirmation(false)}
              disabled={isOperationLoading}
              data-testid="docExecutionPage.rsb.deleteConfirmationCancelButton"
            >
              {t("actions.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isOperationLoading}
              data-testid="docExecutionPage.rsb.deleteConfirmationConfirmButton"
            >
              {isOperationLoading ? t("states.deleting") : t("actions.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add re-open confirmation dialog */}
      <Dialog open={showReopenConfirmation} onOpenChange={setShowReopenConfirmation}>
        <DialogContent className="sm:max-w-[425px]" data-testid="docExecutionPage.rsb.reopenConfirmationDialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="docExecutionPage.rsb.reopenConfirmationTitle">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              {t("actions.reopenDocument", "Re-open Document")}
            </DialogTitle>
            <DialogDescription data-testid="docExecutionPage.rsb.reopenConfirmationDescription">
              {t("actions.confirmReopen", "Are you sure you want to re‑open this document? This will allow you to make further changes. The final PDF will no longer be the current version. Please remember to update records in any other GxP digital system you use in conjunction with Docufen.")}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowReopenConfirmation(false)}
              data-testid="docExecutionPage.rsb.reopenConfirmationCancelButton"
            >
              {t("actions.cancel")}
            </Button>
            <Button 
              variant="default" 
              onClick={handleReOpenDocument}
              data-testid="docExecutionPage.rsb.reopenConfirmationConfirmButton"
            >
              {t("actions.confirm", "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}