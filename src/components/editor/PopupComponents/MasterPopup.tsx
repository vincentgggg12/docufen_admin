import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Sign from './Sign';
import Insert from './Insert';
import Attach from './Attach';
import Notes from './Notes';
import { useAppStore, useDocumentStore, useUserStore, useModalStore, useAccountStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';
import { Stage } from '@/components/editor/lib/lifecycle';
import SelectionHandler from './SelectionHandler';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import { stageToDocumentStage } from '@/components/editor/lib/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Text as TextIcon, Paperclip, Edit, Square, MessageSquare, X, AlertCircle, ClipboardPen, FileCheck, FileText, BanIcon, TextCursorInput, Info } from 'lucide-react';
import { IconSignature } from "@tabler/icons-react";
import { cn } from '@/lib/utils';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { getStageString } from '@/components/editor/lib/utils';
import { toast } from "sonner";
import { checkUserInWorkflow, isParticipantNextInLine } from "@/lib/workflowUtils";
import { useTranslation } from "react-i18next";
import { useCellSelection } from "@/hooks/CellSelection";
import { formatDatetimeString } from "@/lib/dateUtils";
import { updateAuditLog, insertTextIntoDocument, isStringAPlaceholder, validateCursorPositionForInsertion } from "@/components/editor/lib/addinUtils";
import { doBulkCellNAs, tableCellSelectionAndDocumentState, TableCellSelectionStatus } from "@/components/editor/lib/editUtils";
import { ActionType, AuditLogItem } from "@/components/editor/lib/AuditLogItem";
import { getDocumentContent } from "@/components/editor/lib/editorUtils";
import { VerificationTypes } from '@/lib/apiUtils';
// import { InsertAtCursorAlertModal } from '../InsertAtCursorAlertModal';
import LateEntry from './LateEntry';
import { useBulkNA } from '@/hooks/BulkNA';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MINIMUM_REASON_LENGTH } from '../lib/constants';
import { UserType } from '@/lib/authorisation';

// Define a custom event for content insertion
export interface ContentInsertedEvent {
  type: 'text' | 'signature' | 'attachment' | 'correction' | 'checkbox' | 'note';
  content: string;
}

// Define the tab type with the new tabs
type TabType = 'sign' | 'insert' | 'attach' | 'corrections' | 'checkboxes' | 'notes' | 'bulkNAs';

// Create a NotAuthorizedMessage component for execution stage
const NotAuthorizedMessage = ({ stage, reason }: { stage: Stage; reason?: 'not verified' | 'not_in_list' | 'not_your_turn' | 'site_administrator' }) => {
  const { t } = useTranslation();
  // Set color and message based on stage
  let color = "#6366f1"; // Indigo for Execute (matching execution stage theme)
  let stageName = t('mPopup.notAuthorized.execution');
  
  if (stage === Stage.PostApprove) {
    color = "#9C27B0"; // Purple for Post-Approval
    stageName = t('mPopup.notAuthorized.postApproval');
  } else if (stage === Stage.PreApprove) {
    color = "#FFA100"; // Orange for Pre-Approval
    stageName = t('mPopup.notAuthorized.preApproval');
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 px-4">
      <div className="rounded-full bg-white/60 p-3 mb-4" style={{ backgroundColor: `${color}20` }}>
        <AlertCircle className="h-6 w-6" style={{ color }} />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">{t('mPopup.notAuthorized.title')}</h3>
      <p className="text-sm text-center max-w-md" style={{ color }}>
        {reason === 'not_your_turn' ? (
          <>
            {t('mPopup.notAuthorized.notYourTurn1')}
            <br />
            {t('mPopup.notAuthorized.notYourTurn2')}
          </>
        ) : reason === 'not_in_list' ? (
          <>
            {t('mPopup.notAuthorized.notInList1', { stage: stageName })}
            <br />
            {t('mPopup.notAuthorized.notInList2')}
          </>
        ) : reason === 'site_administrator' ? (
          <>
          {t('mPopup.notAuthorized.siteAdminNotPermitted')}
          </>

        ) : (
          <>
            {t('mPopup.notAuthorized.notVerified1')}
            <br />
            {t('mPopup.notAuthorized.notVerified2')}
          </>
        )}
      </p>
    </div>
  );
};

const MasterPopup: React.FC = () => {
  const { editor, insertIntoCellDialogShowing, hideInsertIntoCellDialog, clickLocation, selectionMade, insertAtCursor, setInsertAtCursor } = useAppStore(
    useShallow((state) => ({
      editor: state.editor,
      insertIntoCellDialogShowing: state.insertIntoCellDialogShowing,
      hideInsertIntoCellDialog: state.hideInsertIntoCellDialog,
      clickLocation: state.clickLocation,
      setWorkingTitle: state.setWorkingTitle,
      selectionMade: state.selectionMade,
      insertAtCursor: state.insertAtCursor,
      setInsertAtCursor: state.setInsertAtCursor,
    }))
  );
  const { enforceDigitalSignatures, accountInsertAtCursorMode } = useAccountStore(useShallow((state) => ({
    enforceDigitalSignatures: state.enforceDigitalSignatures,
    accountInsertAtCursorMode: state.insertAtCursorMode,
  })));
  const [activeTab, setActiveTab] = useState<TabType>('sign');
  const [pointerStartedInside, setPointerStartedInside] = useState(false);
  const popupOpenTimeRef = useRef<number>(Date.now());
  const [popupLeft, setPopupLeft] = useState(clickLocation.left);
  const [popupTop, setPopupTop] = useState(clickLocation.top);
  const popupRef = useRef<HTMLDivElement>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { clearSelectedCells } = useBulkNA();
  const previousDocumentIdRef = useRef<string>("");
  // Add state for custom dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Add state to track if we've hit the boundary of the viewport
  const [isAtBoundary, setIsAtBoundary] = useState(false);
  
  // Add state for text input functionality
  const [textValue, setTextValue] = useState('');
  const textAreaRef = useRef<HTMLInputElement | null>(null);
  
  // Add state for workflow participants
  const [isUserInWorkflow, setIsUserInWorkflow] = useState(false);
  const [isNextInLine, setIsNextInLine] = useState(false);
  // const [isAuthorizedToSign, setIsAuthorizedToSign] = useState(false);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(true);
  
  // Add state for bulk selection mode
  // const [isBulkSelectionMode, setIsBulkSelectionMode] = useState(false);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkLateReason, setBulkLateReason] = useState('');
  const [bulkLateEntry, setBulkLateEntry] = useState(false);
  const [bulkLateActionDate, setBulkLateActionDate] = useState('');
  const [bulkLateActionTime, setBulkLateActionTime] = useState('');
  
  const documentStore = useDocumentStore(useShallow((state) => ({
    documentStage: state.documentStage,
    documentId: state.documentId,
    participantGroups: state.participantGroups,
    setDocumentHasContent: state.setDocumentHasContent,
    setReloadSelection: state.setReloadSelection,
    triggerReload: state.triggerReload,
    editTime: state.editTime,
    setEditTime: state.setEditTime,
  })));
  
  // Get current user from user store
  const { participant, userType } = useUserStore(useShallow((state) => ({
    participant: state.participant,
    userType: state.userType
  })));
  const { participantGroups, documentStage, documentId } = documentStore
  // Add necessary imports and stores for text insertion
  const userStore = useUserStore(useShallow((state) => ({
    user: state.user,
    setUser: state.setUser,
    initials: state.initials,
    legalName: state.legalName,
    digitalSignatureVerification: state.digitalSignatureVerification
  })));
  const { user, setUser, initials, legalName, digitalSignatureVerification } = userStore;
  const { selectionMode, setSelectionMode, selectedCells, selectedCellsCount, selectMode, setSelectMode } = useAppStore(useShallow((state) => ({
    selectionMode: state.selectionMode,
    setSelectionMode: state.setSelectionMode,
    selectedCells: state.selectedCells,
    selectedCellsCount: state.selectedCellsCount,
    selectMode: state.selectMode,
    setSelectMode: state.setSelectMode
  })));
  const { t, i18n } = useTranslation();
  const { deselectCell } = useCellSelection();
  const reason = React.useRef("");
  const modalStore = useModalStore();
  
  // Compute bulk selection mode directly from selectionMode for immediate synchronization
  const isBulkSelectionMode = selectionMode === 'select';
  // Event listener for bulk N/A mode request
  React.useEffect(() => {
    const handleBulkNAModeRequest = () => {
      setSelectionMode('select')
      handleTabChange('bulkNAs')
      // if (editor == null) return
      // deselectCell(editor)
      // Important: Don't hide the dialog to avoid overlay
    };
    
    window.addEventListener('bulkNAModeRequested', handleBulkNAModeRequest);
    
    return () => {
      window.removeEventListener('bulkNAModeRequested', handleBulkNAModeRequest);
    };
  }, [deselectCell, setSelectionMode]);
  
  // Custom drag handlers for both mouse and touch
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start dragging from the drag handle
    if (!(e.target as HTMLElement).closest('.drag-handle')) return;
    
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
      setIsAtBoundary(false);
      
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only start dragging from the drag handle
    if (!(e.target as HTMLElement).closest('.drag-handle')) return;
    
    if (popupRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = popupRef.current.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
      setIsDragging(true);
      setIsAtBoundary(false);
      
      // Prevent text selection and scrolling while dragging
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.touchAction = 'none';
      
      // Prevent default to stop scrolling and other touch behaviors
      e.preventDefault();
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    updatePosition(e.clientX, e.clientY);
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
    
    // Prevent scrolling and text selection during drag - important for iOS
    e.preventDefault();
    e.stopPropagation();
  };

  const updatePosition = (clientX: number, clientY: number) => {
    // Add this check to ensure the popup stays within viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = popupRef.current?.offsetWidth || 0;
    const popupHeight = popupRef.current?.offsetHeight || 0;
    
    // Calculate the raw new position
    const rawLeft = clientX - dragOffset.x;
    const rawTop = clientY - dragOffset.y;
    
    // Calculate new position ensuring the popup stays within viewport
    const newLeft = Math.max(0, Math.min(rawLeft, viewportWidth - popupWidth));
    const newTop = Math.max(0, Math.min(rawTop, viewportHeight - popupHeight));
    
    // Check if we hit a boundary
    if (newLeft !== rawLeft || newTop !== rawTop) {
      setIsAtBoundary(true);
    } else {
      setIsAtBoundary(false);
    }
    
    setPopupTop(newTop);
    setPopupLeft(newLeft);
  };
  
  const handleMouseUp = () => {
    endDrag();
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  const endDrag = () => {
    setIsDragging(false);
    setIsAtBoundary(false);
    
    // Re-enable text selection and touch actions
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.touchAction = '';
  };

  useEffect(() => {
    if (!insertIntoCellDialogShowing) return
    if (documentStage === Stage.Finalised || documentStage === Stage.Closed) {
      runHideDialog();
    }

  }, [insertIntoCellDialogShowing, documentStage])
  
  // Set up mouse and touch move/up listeners
  useEffect(() => {
    if (isDragging) {
      // Mouse events
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Touch events
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchEnd); // Handle touch cancel events
      
      // Prevent text selection while dragging
      document.addEventListener('selectstart', preventSelection);
    }
    
    return () => {
      // Mouse events
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Touch events
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      
      document.removeEventListener('selectstart', preventSelection);
      
      // Clean up styles
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging, dragOffset.x, dragOffset.y]); // Add dragOffset to dependencies
  
  // Function to prevent text selection during drag
  const preventSelection = (e: Event) => {
    if (isDragging) {
      e.preventDefault();
    }
  };
  
  // Track popup opened event and ensure state consistency
  useEffect(() => {
    if (insertIntoCellDialogShowing) {
      
      // State consistency check - if we're not in select mode but have selected cells, clear them
      if (selectionMode !== 'select' && selectedCellsCount > 0) {
        console.log("State inconsistency detected: Not in select mode but have selected cells. Clearing...");
        clearSelectedCells();
      }
      
      // If we're not in select mode but activeTab is bulkNAs, reset to sign
      if (selectionMode !== 'select' && activeTab === 'bulkNAs') {
        console.log("State inconsistency detected: Not in select mode but activeTab is bulkNAs. Resetting tab...");
        setActiveTab('sign');
      }
      
      popupOpenTimeRef.current = Date.now();
      trackAmplitudeEvent(AMPLITUDE_EVENTS.MASTER_POPUP_OPENED, {
        document_id: documentId || 'unknown',
        document_name: useDocumentStore.getState().documentName || 'unknown',
        document_stage: stageToDocumentStage(documentStage),
        open_trigger: 'selection',
        initial_tab: activeTab
      });
    }
  }, [insertIntoCellDialogShowing]);

  // Reset state when document changes
  useEffect(() => {
    if (documentId && documentId !== previousDocumentIdRef.current) {
      if (previousDocumentIdRef.current) {
        // Document changed - reset to default state
        console.log("Document changed in MasterPopup - resetting state");
        setActiveTab('sign');
        setBulkReason('');
        setBulkLateEntry(false);
        setBulkLateActionDate('');
        setBulkLateActionTime('');
        setBulkLateReason('');
      }
      previousDocumentIdRef.current = documentId;
    }
  }, [documentId]);

  // Get actual workflow participants when the popup is shown
  useEffect(() => {
    if (insertIntoCellDialogShowing && documentId && participant) {
      setIsLoadingWorkflow(true);
      
      try {
        // Use our utility function to check if the user is in the workflow
        const userInWorkflow = checkUserInWorkflow(documentStage, participant, participantGroups);
        console.log("User in workflow check result:", userInWorkflow);
        
        // Check if the user is next in line to sign (respecting the signing order)
        const isNextInLine = isParticipantNextInLine(documentStage, participant, participantGroups);
        console.log("User is next in line to sign:", isNextInLine);
        
        // Store these separately to show appropriate error messages
        setIsUserInWorkflow(userInWorkflow);
        setIsNextInLine(isNextInLine);
        
        // User is authorized to sign if they're in the workflow AND they're next in line (or signing order is not enabled)
        // const isAuthorizedToSign_ = userInWorkflow && isNextInLine;
        // setIsAuthorizedToSign(isAuthorizedToSign_);
      } catch (error) {
        console.error("Error checking if user is in workflow:", error);
        setIsUserInWorkflow(false);
        setIsNextInLine(false);
        // setIsAuthorizedToSign(false);
      } finally {
        setIsLoadingWorkflow(false);
      }
    }
  }, [insertIntoCellDialogShowing, documentId, documentStage, participant, participantGroups]);
  
  // Helper function to clean up bulk NA state
  const cleanupBulkNAState = () => {
    clearSelectedCells();
    setSelectionMode("edit");
    handleTabChange('insert');
    setBulkReason('');
    setBulkLateEntry(false);
    setBulkLateActionDate('');
    setBulkLateActionTime('');
    setBulkLateReason('');
  };

  const runHideDialog = () => {
    // If we're in bulk selection mode, clean up the bulk NA state first
    if (isBulkSelectionMode) {
      cleanupBulkNAState();
    }

    // Track popup closed event
    if (insertIntoCellDialogShowing) {
      const timeOpen = Date.now() - popupOpenTimeRef.current;
      trackAmplitudeEvent(AMPLITUDE_EVENTS.MASTER_POPUP_CLOSED, {
        document_id: documentId || 'unknown',
        document_name: useDocumentStore.getState().documentName || 'unknown',
        document_stage: stageToDocumentStage(documentStage),
        time_open_ms: timeOpen,
        close_method: 'button'
      });
    }
    if (editor == null) return
    deselectCell(editor);
    hideInsertIntoCellDialog();
  };

  // Handle tab changes with tracking
  const handleTabChange = (newTab: TabType) => {
    if (newTab !== activeTab) {
      trackAmplitudeEvent(AMPLITUDE_EVENTS.MASTER_POPUP_TAB_SWITCHED, {
        document_id: documentId || 'unknown',
        document_name: useDocumentStore.getState().documentName || 'unknown',
        from_tab: activeTab,
        to_tab: newTab,
        document_stage: stageToDocumentStage(documentStage)
      });
    }
    setActiveTab(newTab);
  };

  // Create a custom event for content insertion
  useEffect(() => {
    // Function to handle content inserted event
    const handleContentInserted = (event: CustomEvent<ContentInsertedEvent>) => {
      const { type, content } = event.detail;
      
      // Display toast notification based on the type of content
      switch (type) {
        case 'text':
          toast.success(t('toast.textInserted', { content }), {
            position: "bottom-center",
            duration: 3000,
          });
          break;
        case 'signature':
          toast.success(t('toast.signatureAdded', { content }), {
            position: "bottom-center",
            duration: 3000,
          });
          break;
        case 'attachment':
          toast.success(t('toast.attachmentAdded', { content }), {
            position: "bottom-center",
            duration: 3000,
          });
          break;
        case 'correction':
          toast.success(t('toast.correctionMade', { content }), {
            position: "bottom-center",
            duration: 3000,
          });
          break;
        case 'checkbox':
          toast.success(t('toast.checkbox', { status: content ? t('toast.checked') : t('toast.unchecked') }), {
            position: "bottom-center",
            duration: 3000,
          });
          break;
        case 'note':
          toast.success(t('toast.noteAdded', { content }), {
            position: "bottom-center",
            duration: 3000,
          });
          break;
        default:
          toast.info(t('toast.contentAdded'), {
            position: "bottom-center",
            duration: 3000,
          });
      }
      
      // Close the modal after any successful operation
      runHideDialog();
    };

    // Add event listener
    document.addEventListener('contentInserted', handleContentInserted as EventListener);
    
    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('contentInserted', handleContentInserted as EventListener);
    };
  }, [runHideDialog, t]);
  
  // Check if the popup was opened from the sidebar button
  // If the editor is null, it means it was opened from the sidebar button
  const isOpenedFromSidebar = !editor?.selection?.start?.paragraph?.isInsideTable;

  // Force bypass Instructions popup - disable but preserve the code
  const shouldShowInstructions = false; // Override to never show instructions popup
  
  
  // Detect if the user selected a checkbox or regular text
  useEffect(() => {
    // Only process selection events in Execute stage
    if (editor && selectionMade && documentStage === Stage.Execute) {
      try {
        const selectedText = editor.selection.text;
        if (selectedText.includes('☐')) {
          handleTabChange('checkboxes');
        } else if (isStringAPlaceholder(selectedText)) {
          handleTabChange('insert');
        } else if (selectedText) {
          handleTabChange('corrections');
        // } else {
          // console.log("Selection is made but no text selected");
        }
      } catch (error) {
        console.error("Error getting selected text:", error);
      }
    } else if (editor && selectionMade === 0 && documentStage === Stage.Execute) {
      if (activeTab === 'checkboxes' || activeTab === 'corrections') {
        // If the user deselects a checkbox or correction, switch back to Sign tab
        handleTabChange('insert');
      }
    }
  }, [editor, selectionMade, documentStage]);
  
  // Force tab restrictions based on document stage
  useEffect(() => {
    // For Pre-Approval and Post-Approval stages, only allow 'sign', 'insert', and 'notes' tabs
    if ((documentStage === Stage.PreApprove || documentStage === Stage.PostApprove) && 
        !['sign', 'insert', 'notes'].includes(activeTab)) {
      handleTabChange('sign');
    }
  }, [documentStage, activeTab]);
  
  // // Update the popup position
  // useEffect(() => {
  //   console.log("Effect Running:")
  //   if (insertIntoCellDialogShowing) {
  //     // Get popup width based on active tab or if opened from sidebar
  //     const width = getPopupWidth();
  //     const numericWidth = parseInt(width, 10);
      
  //     // Get the DocumentEditor container
  //     const editorContainer = document.getElementById('editor');
  //     console.log("Effect Running:")
  //     if (editorContainer) {
  //       // Get the container's width and position
  //       const containerRect = editorContainer.getBoundingClientRect();
        
  //       // Calculate the horizontal center of the editor container
  //       let leftPosition = containerRect.left + (containerRect.width - numericWidth) / 2;
  //       if (activeTab === 'bulkNAs')
  //         leftPosition = containerRect.width - 720; // Align left for Bulk NAs tab
  //       console.log("containerRect: " + JSON.stringify(containerRect));
        
  //       // Ensure the popup doesn't go off the container's edges
  //       const clampedLeft = Math.max(containerRect.left + 20, Math.min(leftPosition, containerRect.right - numericWidth - 20));
        
  //       // Only set initial position if we're not dragging
  //       if (!isDragging) {
  //         setPopupTop(clickLocation.top)
  //         setPopupLeft(clampedLeft)
  //       }
  //     } else {
  //       console.warn("No editor container")
  //     }
  //   }
  // }, [insertIntoCellDialogShowing, clickLocation, activeTab, isOpenedFromSidebar]);
  // console.log("InsertIntoCellDialogShowing: " + insertIntoCellDialogShowing.toString());
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      runHideDialog();
    }
  };

  // Dynamic width based on the active tab
  const getPopupWidth = () => {
    // For all document stages, set appropriate width based on the active tab  
    if (isOpenedFromSidebar) {
      return '680px'; // Match the width of other popups
    }
    
    switch (activeTab) {
      case 'sign':
        return '680px'; // Increased width for Signatures tab
      case 'attach':
        return '680px'; // Increased width for Attachments tab
      case 'bulkNAs':
        return '560px'
      case 'insert':
      case 'corrections':
      case 'checkboxes':
      case 'notes':
      default:
        return '720px'; // Keep original width for Text tab
    }
  };

  if (!insertIntoCellDialogShowing) {
    return null;
  }
  // Function to create SelectionHandler for Corrections and Checkboxes tabs
  const renderSelectionHandlerContent = (type: 'corrections' | 'checkboxes') => {
    if (type === 'corrections') {
      // Create a SelectionHandler with isCheckboxSelected set to false
      return <SelectionHandler forceShowCorrections={selectionMade} />;
    } else {
      // Create a SelectionHandler with isCheckboxSelected set to true
      return <SelectionHandler forceShowCheckboxes={true} />;
    }
  };

  // const cleanUp = async () => {
  //   console.warn("Clearning up in MasterPopup after closing dialog")
  //   releaseLock(documentId).then(() => {
  //     setWorking(false)
  //     setIsNotInTableWarningDialog(false)
  //   })
  // }

  const handleInsertText = () => {
    insertText().catch((error) => {
      if (error instanceof Error) {
        console.error("Error inserting text:", error.message);
      }
    })
  }

    // Text insertion function
  const insertText = async () => {
    // console.log("Entering text data: " + textValue);
    if (!editor) {
      return;
    }

    // Validate cursor position when AtCursor mode is enabled
    if (insertAtCursor) {
      const validationResult = validateCursorPositionForInsertion(editor);
      if (!validationResult.isValid) {
        trackAmplitudeEvent(AMPLITUDE_EVENTS.CURSOR_POSITION_INVALID, {
          document_id: documentId || 'unknown',
          document_name: useDocumentStore.getState().documentName || 'Unknown',
          document_stage: stageToDocumentStage(documentStage),
          error_type: validationResult.errorMessageKey?.includes('inUserContent') ? 'in_user_content'
            : validationResult.errorMessageKey?.includes('inSystemContent') ? 'in_system_content'
            : 'invalid_position',
          component: 'master_popup',
          action_attempted: 'text'
        });
        toast.error(t(validationResult.errorMessageKey || 'mPopup.cursorValidation.invalidPosition'));
        return;
      }
    }

    editor.enableTrackChanges = false;

    // Set empty workingTitle to ensure transparent overlay with stage-specific color
    const appStore = useAppStore.getState();
    appStore.setWorkingTitle("");
    appStore.setWorking(true);

    const dataSanityData: TableCellSelectionStatus | null = 
      await tableCellSelectionAndDocumentState(editor, 
        { setWorkingTitle: appStore.setWorkingTitle, setWorking: appStore.setWorking },
        modalStore, documentStore);
    
    if (!dataSanityData) {
      appStore.setWorking(false);
      return;
    }
    if (!dataSanityData.state) {
      appStore.setWorking(false);
      return;
    }
    runHideDialog()
    
    const { selectionDescriptor, dt, timestamp, state } = dataSanityData;
    const dateString = formatDatetimeString(dt, t);
    const markerCounter = state.markerCounter;
    
    // Insert the text into the document
    const { insertedText, removedText, markerCounter: newMarkerCounter, actionType } = 
      await insertTextIntoDocument(editor, selectionDescriptor, textValue, 
        initials, dateString, markerCounter, false, false, insertAtCursor);
    
    // Dispatch custom event for text insertion
    const contentEvent = new CustomEvent<ContentInsertedEvent>('contentInserted', {
      detail: {
        type: 'text',
        content: insertedText
      }
    });
    document.dispatchEvent(contentEvent);
    
    // Explicitly mark document as having content
    documentStore.setDocumentHasContent(true);
    
    // Update edited info
    const timeStr = formatDatetimeString(dt, t);
    const name = legalName;
    
    const setEditedBy = useDocumentStore.getState().setEditedBy;
    const setEditedAt = useDocumentStore.getState().setEditedAt;
    
    if (setEditedBy) setEditedBy(`${name} (${initials})`);
    if (setEditedAt) setEditedAt(timeStr);
    
    // Create audit log entry
    const auditItem = new AuditLogItem({
      email: user?.email,
      userId: user?.userId,
      legalName: name,
      time: timestamp,
      newText: insertedText,
      emptyCellCountChange: 0,
      removedText,
      cellIndices: JSON.stringify(selectionDescriptor.cellIndices),
      reason: reason.current,
      markerCounter: newMarkerCounter,
      stage: documentStage,
      actionType,
      verifications: state.verifications
    });
    
    deselectCell(editor);
    console.log("Getting content");
    const content: string = await getDocumentContent(editor);
    
    // Update audit log
    const updateAuditLogResult = await updateAuditLog(documentStore, auditItem, content, i18n.language);
    console.log("Updated Audit Log");
    
    if (updateAuditLogResult.error != null && updateAuditLogResult.error.length > 0) {
      if (setUser) setUser(null);
      appStore.setWorking(false);
      return;
    }
    
    // Clear the text field and hide the working indicator
    setTextValue('');
    reason.current = "";
    appStore.setWorking(false);

    return;
  };

  const handleEnterBulkNAs = () => {
    enterBulkNAs().catch((error) => {
      if (error instanceof Error) {
        console.error("Error entering bulk N/As:", error.message);
      }
    })
  }

  const enterBulkNAs = async () => {
    // console.log("Entering text data: " + textValue);
    if (!editor) {
      return;
    }
    editor.enableTrackChanges = false;

    // Set empty workingTitle to ensure transparent overlay with stage-specific color
    const appStore = useAppStore.getState();
    appStore.setWorkingTitle("");
    appStore.setWorking(true);

    const dataSanityData: TableCellSelectionStatus | null = 
      await tableCellSelectionAndDocumentState(editor, 
        { setWorkingTitle: appStore.setWorkingTitle, setWorking: appStore.setWorking },
        modalStore, documentStore);
    if (!dataSanityData) {
      appStore.setWorking(false);
      return;
    }
    if (!dataSanityData.state) {
      appStore.setWorking(false);
      return;
    }
    runHideDialog()
    
    const { dt, timestamp, state } = dataSanityData;
    const dateString = formatDatetimeString(dt, t);
    
    // Insert the text into the document
    await doBulkCellNAs(editor, selectedCells, initials, dateString, bulkLateEntry);
    clearSelectedCells()
    // Dispatch custom event for text insertion
    const contentEvent = new CustomEvent<ContentInsertedEvent>('contentInserted', {
      detail: {
        type: 'text',
        content: t('mPopup.bulkSelection.insertedBulkNA', {count: selectedCellsCount})
      }
    });
    document.dispatchEvent(contentEvent);
    
    // Explicitly mark document as having content
    documentStore.setDocumentHasContent(true);
    
    const setEditedBy = useDocumentStore.getState().setEditedBy;
    const setEditedAt = useDocumentStore.getState().setEditedAt;
    
    setEditedBy(`${legalName} (${initials})`);
    setEditedAt(dateString);
    
    // Create audit log entry
    const auditItem = new AuditLogItem({
      email: user?.email,
      userId: user?.userId,
      legalName,
      time: timestamp,
      newText: "addedNaToNTableCells",
      emptyCellCountChange: selectedCellsCount,
      removedText: "",
      cellIndices: JSON.stringify(Object.keys(selectedCells)),
      reason: bulkReason,
      stage: documentStage,
      actionType: ActionType.BulkNa,
      verifications: state.verifications
    });
    if (bulkLateEntry) {
      auditItem.lateActionDate = bulkLateActionDate;
      auditItem.lateActionTime = bulkLateActionTime;
      auditItem.lateReason = bulkLateReason;
    }
    
    deselectCell(editor);
    setSelectionMode("edit");
    handleTabChange('insert');
    console.log("Getting content");
    const content: string = await getDocumentContent(editor);
    // Update audit log
    const updateAuditLogResult = await updateAuditLog(documentStore, auditItem, content, i18n.language);
    console.log("Updated Audit Log");
    
    if (updateAuditLogResult.error != null && updateAuditLogResult.error.length > 0) {
      if (setUser) setUser(null);
      appStore.setWorking(false);
      return;
    }
    
    // Clear the text field and hide the working indicator
    setTextValue('');
    setBulkReason("")
    setBulkLateReason("")
    reason.current = "";
    appStore.setWorking(false);

    return;
  }
  
  // const insertTextWhenWarned = () => {
  //   if (editor == null) return;
  //   const appStore = useAppStore.getState();
  //   doWhenWarned(handleInsertText, editor, appStore, modalStore, documentStore, setIsNotInTableWarningDialog)
  // }

  // Main popup that appears when clicking in cells
  const popup = (
    <>
      {/* Add overlay when dragging to prevent interactions with elements behind the modal */}
      {isDragging && (
        <div 
          className="fixed inset-0 z-[9998]" 
          style={{ cursor: isAtBoundary ? 'not-allowed' : 'move' }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      )}
      <Card 
        ref={popupRef}
        data-testid={`editor.${getStageString(documentStage)}.popup`}
        className={cn(
          "absolute z-[9999] bg-white overflow-hidden p-0",
          isDragging && "select-none"
        )}
        style={{
          top: popupTop,
          left: popupLeft,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          width: getPopupWidth(),
          padding: 0,
          cursor: isDragging ? (isAtBoundary ? 'not-allowed' : 'move') : 'default',
          touchAction: 'none' // Prevent default touch behaviors
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onPointerDownCapture={(e) => {
          // In bulk selection mode, don't block any events
          if (isBulkSelectionMode) return;
          
          // Only stop propagation for non-interactive elements
          const target = e.target as HTMLElement;
          const isInteractive = target.closest('button, select, [role="combobox"], [role="listbox"], [role="option"], input, label, a, [data-radix-select-trigger], [data-radix-select-item], [data-radix-select-content], [data-radix-select-viewport], [data-slot="select-trigger"], [data-slot="select-item"]') !== null;
          if (!isInteractive) {
            e.stopPropagation();
          }
        }}
        onPointerUpCapture={(e) => {
          // In bulk selection mode, don't block any events
          if (isBulkSelectionMode) return;
          
          // Only stop propagation for non-interactive elements
          const target = e.target as HTMLElement;
          const isInteractive = target.closest('button, select, [role="combobox"], [role="listbox"], [role="option"], input, label, a, [data-radix-select-trigger], [data-radix-select-item], [data-radix-select-content], [data-radix-select-viewport], [data-slot="select-trigger"], [data-slot="select-item"]') !== null;
          if (!isInteractive) {
            e.stopPropagation();
          }
        }}
        onPointerDown={(e) => {
          // In bulk selection mode, don't block any events
          if (!(e.target as HTMLElement).closest('.drag-handle')) return;
    
          if (isBulkSelectionMode) return;
          
          // Don't prevent or stop events for interactive elements
          const target = e.target as HTMLElement;
          const isInteractive = target.closest('button, select, [role="combobox"], [role="listbox"], [role="option"], input, label, a, [data-radix-select-trigger], [data-radix-select-item], [data-radix-select-content], [data-radix-select-viewport], [data-slot="select-trigger"], [data-slot="select-item"]') !== null;
          
          if (!isInteractive) {
            e.stopPropagation();
            e.preventDefault();
            setPointerStartedInside(true);
          }
        }}
        onPointerUp={(e) => {
          // In bulk selection mode, don't block any events
          if (isBulkSelectionMode) return;
          
          // Don't prevent or stop events for interactive elements
          const target = e.target as HTMLElement;
          const isInteractive = target.closest('button, select, [role="combobox"], [role="listbox"], [role="option"], input, label, a, [data-radix-select-trigger], [data-radix-select-item], [data-radix-select-content], [data-radix-select-viewport], [data-slot="select-trigger"], [data-slot="select-item"]') !== null;
          
          if (pointerStartedInside && !isInteractive) {
            e.stopPropagation();
            e.preventDefault();
          }
          if (!isInteractive) {
            setPointerStartedInside(false);
          }
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="flex flex-col w-full h-full">
          {/* Add a draggable header bar with stage-specific styling */}
          <div 
            data-testid={`editor.${getStageString(documentStage)}.dragHandle`}
            className="h-8 border-b cursor-move drag-handle flex items-center justify-center px-3 relative" 
            style={{ 
              backgroundColor: 
                documentStage === Stage.PreApprove ? "#FFF5E6" : // Light amber for Pre-Approval
                documentStage === Stage.Execute ? "#EDEDFF" :    // Light blue for Execution
                documentStage === Stage.PostApprove ? "#F9E6FF" : // Light purple for Post-Approval
                documentStage === Stage.Closed ? "#E6F7EF" :     // Light green for Completed
                documentStage === Stage.Finalised ? "#E6F7EF" :  // Light green for Finalised
                documentStage === Stage.Voided ? "#FFEBEB" :     // Light red for Voided
                "#F5F2EE",                                       // Default beige
              touchAction: 'none' // Prevent default touch behaviors for dragging
            }}
            onTouchStart={handleTouchStart}
          >
            {/* Table Cell Insertion Control - positioned absolute on the left for execution, pre-approval, and post-approval stages */}
            {(documentStage === Stage.Execute || documentStage === Stage.PreApprove || documentStage === Stage.PostApprove) && accountInsertAtCursorMode && (
              <div className="absolute left-2 flex items-center gap-1.5">
                <TextCursorInput className="h-3.5 w-3.5 text-gray-500" />
                <Switch
                  id="table-cell-insertion-popup"
                  checked={insertAtCursor}
                  onCheckedChange={(checked) => {
                    setInsertAtCursor(checked);
                    // Track setting changed
                    trackAmplitudeEvent(AMPLITUDE_EVENTS.SETTING_CHANGED, {
                      setting_name: 'table_cell_insertion_enabled',
                      old_value: !checked,
                      new_value: checked,
                      setting_category: 'editor_behavior'
                    });
                  }}
                  aria-label={t("account.tableCellInsertion.ariaLabel")}
                  className="h-4 w-7"
                  data-testid="masterPopup.tableCellInsertionSwitch"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs z-[99999]" sideOffset={5}>
                      <div className="text-xs space-y-1">
                        <p className="font-medium mb-2">{t('mPopup.tableCellInsertion.title')}</p>
                        <p>
                          <span className="font-medium">• {t('mPopup.tableCellInsertion.on')}:</span> {t('mPopup.tableCellInsertion.onDescription')}
                        </p>
                        <p>
                          <span className="font-medium">• {t('mPopup.tableCellInsertion.off')}:</span> {t('mPopup.tableCellInsertion.offDescription')}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              )}
            
            {/* Close button positioned absolute on the right */}
            <button 
              data-testid={`editor.${getStageString(documentStage)}.closeButton`}
              onClick={runHideDialog}
              className="absolute right-2 p-1 rounded-md hover:bg-gray-200/60 text-gray-500"
              aria-label={t('close-popup')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            
            {/* Center-aligned document stage */}
            <div className="flex items-center justify-center w-full gap-2">
              {/* Show document stage icon */}
              {documentStage === Stage.PreApprove && (
                <>
                  <IconSignature className="h-4 w-4 text-[#FFA100]" />
                  <h3 className="text-sm font-medium text-[#C26C00]">{t('mPopup.stage.preApproval')}</h3>
                </>
              )}
              {documentStage === Stage.Execute && (
                <>
                  <ClipboardPen className="h-4 w-4 text-[#6366F1]" />
                  <h3 className="text-sm font-medium text-[#4045C2]">
                    {t('mPopup.stage.execution')}
                    {isBulkSelectionMode && ` - ${t('mPopup.bulkNASelectionMode')}`}
                  </h3>
                </>
              )}
              {documentStage === Stage.PostApprove && (
                <>
                  <IconSignature className="h-4 w-4 text-[#9C27B0]" />
                  <h3 className="text-sm font-medium text-[#7A1F89]">{t('mPopup.stage.postApproval')}</h3>
                </>
              )}
              {documentStage === Stage.Closed && (
                <>
                  <FileCheck className="h-4 w-4 text-[#0E7C3F]" />
                  <h3 className="text-sm font-medium text-[#0A6031]">{t('mPopup.stage.completed')}</h3>
                </>
              )}
              {documentStage === Stage.Finalised && (
                <>
                  <FileText className="h-4 w-4 text-[#0E7C3F]" />
                  <h3 className="text-sm font-medium text-[#0A6031]">{t('mPopup.stage.finalised')}</h3>
                </>
              )}
              {documentStage === Stage.Voided && (
                <>
                  <BanIcon className="h-4 w-4 text-[#dc2626]" />
                  <h3 className="text-sm font-medium text-[#b91c1c]">{t('mPopup.stage.voided')}</h3>
                </>
              )}
            </div>
          </div>
          
          {/* Main content area */}
          <div className={cn(
            "flex flex-1",
            documentStage === Stage.PreApprove || documentStage === Stage.PostApprove
              ? "min-h-[162px]"
              : "min-h-[242px]"
          )}>
            {/* Tabs on left side - Show for all stages now (hide in bulk mode) */}
            {!isBulkSelectionMode && (
              <div className="border-r w-[140px] bg-white cursor-move drag-handle" 
                   onTouchStart={handleTouchStart}
                   style={{ touchAction: 'none' }}>
                <nav className="flex flex-col p-1.5 gap-1">
                {/* Signatures tab - always visible */}
                <button
                  data-testid={`editor.${getStageString(documentStage)}.tabButton.sign`}
                  onClick={() => handleTabChange('sign')}
                  disabled={false}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors justify-start text-left",
                    activeTab === 'sign' 
                      ? "text-gray-800 shadow-sm" 
                      : "text-gray-600 hover:bg-sidebar-accent"
                  )}
                  style={activeTab === 'sign' ? { 
                    backgroundColor: "#F5F2EE", 
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
                  } : {}}
                >
                  <IconSignature className={cn(
                    "h-4 w-4 flex-shrink-0",
                    documentStage === Stage.PreApprove ? "text-[#FFA100]" : 
                    documentStage === Stage.Execute ? "text-[#6366F1]" : 
                    "text-[#9C27B0]"
                  )} />
                  <span>{t('mPopup.tab.signatures')}</span>
                </button>
                
                {/* Text tab - show for all stages */}
                <button
                  data-testid={`editor.${getStageString(documentStage)}.tabButton.text`}
                  onClick={() => handleTabChange('insert')}
                  disabled={false}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors justify-start text-left",
                    activeTab === 'insert' 
                      ? "text-gray-800 shadow-sm" 
                      : "text-gray-600 hover:bg-sidebar-accent"
                  )}
                  style={activeTab === 'insert' ? { 
                    backgroundColor: "#F5F2EE", 
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
                  } : {}}
                >
                  <TextIcon className={cn(
                    "h-4 w-4 flex-shrink-0",
                    documentStage === Stage.PreApprove ? "text-[#FFA100]" : 
                    documentStage === Stage.Execute ? "text-[#6366F1]" : 
                    "text-[#9C27B0]"
                  )} />
                  <span>{t('mPopup.tab.text')}</span>
                </button>
                
                {/* Notes tab - show for all stages */}
                <button
                  data-testid={`editor.${getStageString(documentStage)}.tabButton.notes`}
                  onClick={() => handleTabChange('notes')}
                  disabled={false}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors justify-start text-left",
                    activeTab === 'notes' 
                      ? "text-gray-800 shadow-sm" 
                      : "text-gray-600 hover:bg-sidebar-accent"
                  )}
                  style={activeTab === 'notes' ? { 
                    backgroundColor: "#F5F2EE", 
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
                  } : {}}
                >
                  <MessageSquare className={cn(
                    "h-4 w-4 flex-shrink-0",
                    documentStage === Stage.PreApprove ? "text-[#FFA100]" : 
                    documentStage === Stage.Execute ? "text-[#6366F1]" : 
                    "text-[#9C27B0]"
                  )} />
                  <span>{t('mPopup.tab.notes')}</span>
                </button>
                
                {/* Other tabs - only enabled in Execute stage */}
                {documentStage === Stage.Execute && (
                  <>
                    <button
                      data-testid={`editor.${getStageString(documentStage)}.tabButton.attachments`}
                      onClick={() => handleTabChange('attach')}
                      disabled={false}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors justify-start text-left",
                        activeTab === 'attach' 
                          ? "text-gray-800 shadow-sm" 
                          : "text-gray-600 hover:bg-sidebar-accent"
                      )}
                      style={activeTab === 'attach' ? { 
                        backgroundColor: "#F5F2EE", 
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
                      } : {}}
                    >
                      <Paperclip className="h-4 w-4 flex-shrink-0 text-[#6366F1]" />
                      <span>{t('mPopup.tab.attachments')}</span>
                    </button>
                    
                    <button
                      data-testid={`editor.${getStageString(documentStage)}.tabButton.corrections`}
                      onClick={() => handleTabChange('corrections')}
                      disabled={false}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors justify-start text-left",
                        activeTab === 'corrections' 
                          ? "text-gray-800 shadow-sm" 
                          : "text-gray-600 hover:bg-sidebar-accent"
                      )}
                      style={activeTab === 'corrections' ? { 
                        backgroundColor: "#F5F2EE", 
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
                      } : {}}
                    >
                      <Edit className="h-4 w-4 flex-shrink-0 text-[#6366F1]" />
                      <span>{t('mPopup.tab.corrections')}</span>
                    </button>
                    
                    <button
                      data-testid={`editor.${getStageString(documentStage)}.tabButton.checkboxes`}
                      onClick={() => handleTabChange('checkboxes')}
                      disabled={false}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors justify-start text-left",
                        activeTab === 'checkboxes' 
                          ? "text-gray-800 shadow-sm" 
                          : "text-gray-600 hover:bg-sidebar-accent"
                      )}
                      style={activeTab === 'checkboxes' ? { 
                        backgroundColor: "#F5F2EE", 
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
                      } : {}}
                    >
                      <Square className="h-4 w-4 flex-shrink-0 text-[#6366F1]" />
                      <span>{t('mPopup.tab.checkboxes')}</span>
                    </button>
                  </>
                )}
                </nav>
              </div>
            )}
            
            {/* Content Area */}
            <div className={cn(
              "flex-1 bg-white", 
              isBulkSelectionMode ? "" : // No padding for bulk mode
              (documentStage === Stage.PreApprove || documentStage === Stage.PostApprove)
                ? "p-4 w-full" 
                : "p-3"
            )}>
              {/* Show bulk selection UI when in bulk mode */}
              {isBulkSelectionMode ? (
                <div className="flex flex-col h-full p-6">
                  {/* Single column layout */}
                  <div className="space-y-4">
                    {/* Title and description */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        {t('mPopup.bulkSelection.selectCells')}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{t('mPopup.bulkSelection.selectionMode')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{t('mPopup.bulkSelection.deselect')}</span>
                            <Switch
                              checked={selectMode === 'select'}
                              onCheckedChange={(checked) => setSelectMode(checked ? 'select' : 'deselect')}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className="text-xs text-gray-500">{t('mPopup.bulkSelection.select')}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {selectMode === 'select' 
                            ? t('mPopup.bulkSelection.selectInstructions') 
                            : t('mPopup.bulkSelection.deselectInstructions')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Reason field */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {t('mPopup.bulkSelection.reason')}
                      </label>
                      <textarea
                        value={bulkReason}
                        spellCheck={true}
                        onChange={(e) => setBulkReason(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px]"
                        placeholder={t('mPopup.bulkSelection.reasonPlaceholder')}
                        rows={3}
                      />
                    </div>
                    
                    {/* Late Entry component */}
                    <LateEntry
                      lateEntry={bulkLateEntry}
                      toggleLateEntry={() => setBulkLateEntry(!bulkLateEntry)}
                      lateActionDate={bulkLateActionDate}
                      setLateActionDate={setBulkLateActionDate}
                      lateActionTime={bulkLateActionTime}
                      setLateActionTime={setBulkLateActionTime}
                      reason={bulkLateReason}
                      setReason={setBulkLateReason}
                      documentStage={documentStage}
                    />
                  </div>
                  
                  {/* Buttons aligned to right */}
                  <div className="mt-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cleanupBulkNAState}
                        className={cn(
                          "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                          "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {t('mPopup.bulkSelection.cancel')}
                      </button>
                      <TooltipPrimitive.Provider>
                        <TooltipPrimitive.Root delayDuration={0}>
                          <TooltipPrimitive.Trigger asChild>
                            <Button
                              className={cn(
                                "py-1.5 rounded-md",
                                "bg-[#6366F1] text-white hover:bg-[#6366F1]/90"
                              )}
                              disabled={bulkReason.trim().length < MINIMUM_REASON_LENGTH || selectedCellsCount === 0}
                              onClick={handleEnterBulkNAs}
                            >
                              {t('mPopup.bulkSelection.enterNAWithCount', { count: selectedCellsCount })}
                            </Button>
                          </TooltipPrimitive.Trigger>
                          {bulkReason.trim().length < MINIMUM_REASON_LENGTH && (
                            <TooltipPrimitive.Content
                              className="bg-gray-900 text-white px-2 py-1 rounded-md shadow-md text-sm z-50"
                              sideOffset={5}
                            >
                              {t('mPopup.bulkSelection.reasonRequired')}
                              <TooltipPrimitive.Arrow className="fill-gray-900" />
                            </TooltipPrimitive.Content>
                          )}
                        </TooltipPrimitive.Root>
                      </TooltipPrimitive.Provider>
                    </div>
                  </div>
                </div>
              ) : (
                /* Normal content when not in bulk mode */
                (userType === UserType.SITE_ADMINISTRATOR) ||
                  (digitalSignatureVerification === VerificationTypes.NOT_VERIFIED && enforceDigitalSignatures) ||  (!isLoadingWorkflow && 
                  (((documentStage === Stage.Execute && !isUserInWorkflow) || 
                   (documentStage === Stage.PostApprove && !isUserInWorkflow) ||
                   (documentStage === Stage.PreApprove && !isUserInWorkflow) ||
                   ((documentStage === Stage.PostApprove || documentStage === Stage.PreApprove) && 
                    activeTab === 'sign' && isUserInWorkflow && !isNextInLine)))) ? (
                  <NotAuthorizedMessage
                    stage={documentStage}
                    reason={userType === UserType.SITE_ADMINISTRATOR ? 'site_administrator' : digitalSignatureVerification === VerificationTypes.NOT_VERIFIED && enforceDigitalSignatures ? "not verified" : isUserInWorkflow && !isNextInLine ? 'not_your_turn' : 'not_in_list'} 
                  />
                ) : (
                  <>
                    {activeTab === 'sign' && (
                      <>
                        {/* Sign component - only show if user is authorized to sign */}
                        {(documentStage === Stage.PreApprove || documentStage === Stage.PostApprove) && isUserInWorkflow ? (
                          // Only show the Sign component if they are next in line (or if there's no signing order)
                          isNextInLine ? <Sign /> : (
                            <NotAuthorizedMessage 
                              stage={documentStage} 
                              reason='not_your_turn'
                            />
                          )
                        ) : null}
                        
                        {/* For Execute stage, show the Sign component directly */}
                        {documentStage === Stage.Execute && isUserInWorkflow && <Sign />}
                      </>
                    )}
                    
                    {/* Text tab - now with text entry field for Pre/Post Approval stages */}
                    {activeTab === 'insert' && (
                      <>
                        {/* For Pre-Approval stage, display a header with the Insert component */}
                        {documentStage === Stage.PreApprove && (
                          <div className="mb-3">
                            <h2 className="text-base font-medium text-gray-800 mb-1 flex items-center gap-2">
                              <TextIcon className="h-4.5 w-4.5" stroke="#FFA100" />
                              {t('mPopup.tab.preApprovalText')}
                            </h2>
                            <p className="text-sm text-gray-600">{t('mPopup.tab.preApprovalTextDescription')}</p>
                          </div>
                        )}
                        {/* For Post-Approval stage, display a header with the Insert component */}
                        {documentStage === Stage.PostApprove && (
                          <div className="mb-3">
                            <h2 className="text-base font-medium text-gray-800 mb-1 flex items-center gap-2">
                              <TextIcon className="h-4.5 w-4.5" stroke="#9C27B0" />
                              {t('mPopup.tab.postApprovalText')}
                            </h2>
                            <p className="text-sm text-gray-600">{t('mPopup.tab.postApprovalTextDescription')}</p>
                          </div>
                        )}
                        
                        {/* Allow text entry for users in workflow, even if not their turn */}
                        {(documentStage === Stage.PreApprove || documentStage === Stage.PostApprove) && isUserInWorkflow && (
                          <div className="flex gap-2 items-center mt-4">

                                <div>
                                  <input
                                    data-testid={`editor.${getStageString(documentStage)}.text.inputField`}
                                    type="text"
                                    placeholder={t('mPopup.tab.textPlaceholder')}
                                    ref={textAreaRef}
                                    value={textValue}
                                    onChange={(e) => setTextValue(e.target.value)}
                                    className="flex-1 bg-background border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-inter text-gray-800"
                                  />
                                  <Button
                                    data-testid={`editor.${getStageString(documentStage)}.text.insertButton`}
                                    onClick={handleInsertText}
                                    disabled={!textValue}
                                    className={cn(
                                      "py-1.5 rounded-md",
                                      documentStage === Stage.PreApprove
                                        ? "bg-[#F5A623] text-white hover:bg-[#F5A623]/90"
                                        : "bg-[#9C27B0] text-white hover:bg-[#9C27B0]/90"
                                    )}
                                  >
                                    {t('mPopup.tab.insert')}
                                  </Button>
                                </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Modify the code to show the Notes tab for all document stages */}
                    {activeTab === 'notes' && (
                      <>
                        {/* For Pre-Approval stages, display a header with the Notes component */}
                        {documentStage === Stage.PreApprove && (
                          <div className="mb-3">
                            <h2 className="text-base font-medium text-gray-800 mb-1 flex items-center gap-2">
                              <MessageSquare className="h-4.5 w-4.5" stroke="#FFA100" />
                              {t('mPopup.tab.preApprovalNotes')}
                            </h2>
                            {/* Allow notes for users in workflow, even if not their turn */}
                            {isUserInWorkflow && <Notes />}
                          </div>
                        )}
                        
                        {/* For Post-Approval stages, display a header with the Notes component */}
                        {documentStage === Stage.PostApprove && (
                          <div className="mb-3">
                            <h2 className="text-base font-medium text-gray-800 mb-1 flex items-center gap-2">
                              <MessageSquare className="h-4.5 w-4.5" stroke="#9C27B0" />
                              {t('mPopup.tab.postApprovalNotes')}
                            </h2>
                            {/* Allow notes for users in workflow, even if not their turn */}
                            {isUserInWorkflow && <Notes />}
                          </div>
                        )}
                        
                        {/* For Execute stage, just show the Notes component */}
                        {documentStage === Stage.Execute && isUserInWorkflow && <Notes />}
                      </>
                    )}
                    
                    {/* Only show these tabs content for Execute stage */}
                    {documentStage === Stage.Execute && (
                      <>
                        {activeTab === 'attach' && <Attach />}
                        {activeTab === 'insert' && isUserInWorkflow && <Insert />}
                        {activeTab === 'corrections' && renderSelectionHandlerContent('corrections')}
                        {activeTab === 'checkboxes' && renderSelectionHandlerContent('checkboxes')}
                      </>
                    )}
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </Card>

    </>
  );
  
  // Instructions popup with same structural changes
  if (isOpenedFromSidebar && shouldShowInstructions) {
    const handleGotItClick = () => {
      if (dontShowAgain) {
        localStorage.setItem('hideInstructionsPopup', 'true');
      }
      runHideDialog();
    };

    const popup = (
      <>
        {/* Dark overlay */}
        <div 
          className="fixed inset-0 bg-black/30 z-[9998]" 
          onClick={() => runHideDialog()}
        />
        
        {/* Add overlay when dragging to prevent interactions with elements behind the modal */}
        {isDragging && (
          <div 
            className="fixed inset-0 z-[9999]" 
            style={{ cursor: isAtBoundary ? 'not-allowed' : 'move' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        )}
        
        <Card 
          ref={popupRef}
          className={cn(
            "absolute z-[9999] border border-gray-200 bg-white overflow-hidden p-0",
            isDragging && "select-none"
          )}
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            width: '680px',
            minHeight: '300px',
            transition: 'opacity 0.15s ease-out',
            padding: 0,
            cursor: isDragging ? (isAtBoundary ? 'not-allowed' : 'move') : 'default'
          }}
          onMouseDown={handleMouseDown}
          onPointerDownCapture={(e) => {
            // Only stop propagation for non-interactive elements
            const target = e.target as HTMLElement;
            const isInteractive = target.closest('button, select, [role="combobox"], [role="listbox"], input, label, a, [data-radix-select-trigger], [data-radix-select-item]') !== null;
            if (!isInteractive) {
              e.stopPropagation();
            }
          }}
          onPointerUpCapture={(e) => {
            // Only stop propagation for non-interactive elements
            const target = e.target as HTMLElement;
            const isInteractive = target.closest('button, select, [role="combobox"], [role="listbox"], input, label, a, [data-radix-select-trigger], [data-radix-select-item]') !== null;
            if (!isInteractive) {
              e.stopPropagation();
            }
          }}
          onPointerUp={(e) => {
            // Don't prevent or stop events for interactive elements
            const target = e.target as HTMLElement;
            const isInteractive = target.closest('button, select, [role="combobox"], [role="listbox"], input, label, a, [data-radix-select-trigger], [data-radix-select-item]') !== null;
            
            if (pointerStartedInside && !isInteractive) {
              e.stopPropagation();
              e.preventDefault();
            }
            if (!isInteractive) {
              setPointerStartedInside(false);
            }
          }}
          onPointerDown={(e) => {
            // Don't prevent or stop events for interactive elements
            const target = e.target as HTMLElement;
            const isInteractive = target.closest('button, select, [role="combobox"], [role="listbox"], input, label, a, [data-radix-select-trigger], [data-radix-select-item]') !== null;
            
            if (!isInteractive) {
              e.stopPropagation();
              e.preventDefault();
              setPointerStartedInside(true);
            }
          }}
          onKeyDown={handleKeyDown}
        >
          <div className="flex flex-col w-full h-full">
            {/* Keep instructions header with default styling */}
            <div className="h-8 border-b cursor-move drag-handle flex items-center justify-center px-3 relative" 
                 style={{ backgroundColor: "#F5F2EE" }}>
              <h3 className="text-sm font-medium text-gray-700">{t('mPopup.tab.instructions')}</h3>
              
              {/* Move close button to absolute position for consistency */}
              <button 
                onClick={() => runHideDialog()}
                className="absolute right-2 p-1 rounded-md hover:bg-gray-200 text-gray-500"
                aria-label={t('close-popup')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <div className="flex flex-1">
              {/* Left sidebar with instructions title and Got it button */}
              <div className="border-r w-[140px] bg-white flex flex-col justify-between py-3 cursor-move drag-handle">
                <div className="px-4">
                  <h3 className="text-lg font-semibold text-gray-800">{t('mPopup.tab.instructionsTitle')}</h3>
                </div>
                <div className="px-4 pt-2 flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="dontShowAgain"
                      className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary/20"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                    />
                    <label htmlFor="dontShowAgain" className="text-xs text-gray-600 cursor-pointer">{t('mPopup.tab.dontShowAgain')}</label>
                  </div>
                  <button
                    onClick={handleGotItClick}
                    className="w-full px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
                  >
                    {t('mPopup.tab.gotIt')}
                  </button>
                </div>
              </div>
              
              {/* Content Area - just the instruction items
              <div className="flex-1 p-3 bg-white">
                <Instructions showTitleAndButton={false} />
              </div> */}
            </div>
          </div>
        </Card>
      </>
    );
    
    return createPortal(popup, document.body);
  }

  return createPortal(popup, document.body);
};

export default MasterPopup;