import React, { useRef, useState, useCallback } from 'react';
import {
  appendAttachmentTitleAndLinkIntoSelectedCell, fileHash, updateAuditLog, validateCursorPositionForInsertion
} from '@/components/editor/lib/addinUtils';
import { toast } from 'sonner';
import { formatDatetimeString, pad } from '@/lib/dateUtils';
import { useAppStore, useDocumentStore, useModalStore, useUserStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';
import { useTranslation } from 'react-i18next';
import { checkDocumentNotStale, DocumentStaleStatus, tableCellSelectionAndDocumentState, TableCellSelectionStatus, triggerReloadDocument } from '@/components/editor/lib/editUtils';
import { uploadFile, UploadResult } from '@/lib/apiUtils';
import { DirectUploadService } from '@/services/directUploadService';
import { features } from '@/config/features';
import { ActionType, AuditLogItem } from '@/components/editor/lib/AuditLogItem';
import { Stage } from '@/components/editor/lib/lifecycle';
import { getStageString } from '@/components/editor/lib/utils';
import { getDocumentContent } from '@/components/editor/lib/editorUtils';
import { useCellSelection } from '@/hooks/CellSelection';
import { ExternalLink, Link2, Trash2, Info } from 'lucide-react';
import { ContentInsertedEvent } from './MasterPopup';
import { StoreAttachment } from '@/lib/stateManagement';
import AttachmentLinkToDocumentModal from '@/pages/DocumentCompletion/Right-sidebar/AttachmentLinkToDocumentModal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import LateEntry from './LateEntry';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import { stageToDocumentStage } from '@/components/editor/lib/utils';
import { fileNameRegExp } from '@/lib/constants';
import { useTimeComparison } from '@/hooks/useTimeComparison';
import { MINIMUM_REASON_LENGTH } from '../lib/constants';
import DocuDialog from '../DocuDialog';
import { UPLOAD_CUT, useConversionStatus } from '@/hooks/useConversionStatus';
import { DateTime } from 'luxon';
import { BorderTrail } from '@/components/motion-primitives/border-trail';

const Attach: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentNameInputRef = useRef<HTMLInputElement>(null)
  const [attachmentName, setAttachmentName] = React.useState<string>("")
  const [attachmentTooLarge, setAttachmentTooLarge] = useState(false)
  // const [actionType, setActionType] = React.useState<ActionType>(ActionType.AddAttachment)
  const attachmentHash = React.useRef<string>("")
  const attachmentFilename = React.useRef<string>("")
  const attachmentFile = React.useRef<File | null>(null)
  const [fileSelected, setFileSelected] = React.useState(false)
  const isProcessingConversion = React.useRef(false)
  //const [hashValue, setHashValue] = React.useState<string>("")
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string>("")
  const { deselectCell } = useCellSelection()
  // State for document link modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ id: string, name: string, url: string } | null>(null);
  
  // Store upload data during conversion
  interface PendingAttachmentData {
    url: string;
    pageCount: number;
    selectionDescriptor: any;
    dt: DateTime;
    timestamp: number;
    state: any;
    dateString: string;
    newAttachmentNumber: number;
    newAttachmentNumberText: string;
    attachmentName: string;
  }
  // const [pendingAttachmentData, setPendingAttachmentData] = useState<PendingAttachmentData | null>(null);
  const pendingAttachmentDataRef = useRef<PendingAttachmentData | null>(null);
  
  // Custom setter that updates both state and ref
  const updatePendingAttachmentData = useCallback((data: PendingAttachmentData | null) => {
    console.log("Updating pending attachment data:", data);
    // setPendingAttachmentData(data);
    pendingAttachmentDataRef.current = data;
  }, []);

  const userStore = useUserStore(useShallow((state) => ({
    user: state.user,
    setUser: state.setUser,
    legalName: state.legalName,
    initials: state.initials,
    logout: state.logout
  })))
  const { user, legalName, initials, setUser, logout } = userStore
  const { t } = useTranslation()
  const documentStore = useDocumentStore(useShallow((state) => ({
    documentId: state.documentId,
    documentStage: state.documentStage,
    documentName: state.documentName,
    locale: state.locale,
    setAttachmentNumber: state.setAttachmentNumber,
    setDocumentStage: state.setDocumentStage,
    setMarkerCounter: state.setMarkerCounter,
    setEmptyCellCount: state.setEmptyCellCount,
    setEditedBy: state.setEditedBy,
    setEditedAt: state.setEditedAt,
    addAttachment: state.addAttachment,
    setDocumentHasContent: state.setDocumentHasContent,
    timezone: state.timezone,
    editTime: state.editTime,
    setEditTime: state.setEditTime,
    triggerReload: state.triggerReload,
    setReloadSelection: state.setReloadSelection,
  })))
  const { documentId, setEditedBy, setEditedAt, locale,
    setAttachmentNumber, documentName, addAttachment, setDocumentHasContent } = documentStore

  const modalStore = useModalStore(useShallow((state) => ({
    setCellEmpty: state.setCellEmpty,
    tableNotSelected: state.tableNotSelected,
    toggleTableNotSelected: state.toggleTableNotSelected,
    toggleCellNotEmpty: state.toggleCellNotEmpty,
    setDocumentInUse: state.setDocumentInUse,
    cellNotEmpty: state.cellNotEmpty,
    setDocumentNotUpToDate: state.setDocumentNotUpToDate,
    setDocumentStatus: state.setDocumentStatus,
    setUnsupportedAttachmentType: state.setUnsupportedAttachmentType,
    isUploading: state.isUploading,
    setIsUploading: state.setIsUploading,
    uploadProgress: state.uploadProgress,
    setUploadProgress: state.setUploadProgress,
    setOperationFailedError: state.setOperationFailedError
  })))
  const { setUploadProgress, setIsUploading } = modalStore;
  
  const appStore = useAppStore(useShallow((state) => ({
    working: state.working,
    setWorkingTitle: state.setWorkingTitle,
    setShowList: state.setShowList,
    setWorking: state.setWorking,
    editor: state.editor,
    insertAtCursor: state.insertAtCursor,
    hideInsertIntoCellDialog: state.hideInsertIntoCellDialog,
    insertIntoCellDialogShowing: state.insertIntoCellDialogShowing,
  })))
  const { setWorking, editor, hideInsertIntoCellDialog, working, insertAtCursor } = appStore
  
  // Handler for conversion completion
  const handleConversionComplete = useCallback((url: string, uniqueFilename: string) => {
    console.log("handleConversionComplete called with:", { url, uniqueFilename });
    console.log("Pending attachment data from ref:", pendingAttachmentDataRef.current);
    
    const currentPendingData = pendingAttachmentDataRef.current;
    if (!currentPendingData || isProcessingConversion.current) {
      console.log("Skipping conversion completion - no pending data or already processing");
      return;
    }
    
    console.log("Conversion completed, updating URL:", url);
    isProcessingConversion.current = true;
    
    // Update the attachment filename to reflect MP4
    if (attachmentFilename.current.toLowerCase().endsWith('.mov')) {
      attachmentFilename.current = attachmentFilename.current.replace(/\.mov$/i, '.mp4');
    }
    
    // Update the pending data with the new MP4 URL
    const updatedData = {
      ...currentPendingData,
      url: url
    };
    console.log("Updated attachment data with new URL:", updatedData);
    
    // Complete the attachment insertion with the MP4 URL
    doInsertAttachment(updatedData).then((success) => {
      if (success) {
        console.log("Attachment inserted successfully with MP4 URL");
      } else {
        console.error("Failed to insert attachment after conversion");
      }
      // Clear pending data and reset flags
      updatePendingAttachmentData(null);
      isProcessingConversion.current = false;
      // Hide dialog after successful insertion
      hideInsertIntoCellDialog();
    });
    
    setUploadProgress(100);
    setIsUploading(false);
  }, [hideInsertIntoCellDialog, setUploadProgress, setIsUploading, updatePendingAttachmentData]);

  // Handler for conversion failure
  const handleConversionFailure = useCallback(() => {
    console.log("handleConversionFailure called");
    console.log("Pending attachment data from ref:", pendingAttachmentDataRef.current);
    
    const currentPendingData = pendingAttachmentDataRef.current;
    if (!currentPendingData || isProcessingConversion.current) {
      console.log("Skipping conversion failure handling - no pending data or already processing");
      return;
    }
    
    console.error("Conversion failed, using original MOV URL");
    isProcessingConversion.current = true;
    
    // Insert with original MOV URL
    doInsertAttachment(currentPendingData).then((success) => {
      if (success) {
        console.log("Attachment inserted with original MOV URL after conversion failure");
      }
      // Clear pending data and reset flags
      updatePendingAttachmentData(null);
      isProcessingConversion.current = false;
      // Hide dialog after insertion
      hideInsertIntoCellDialog();
    });
    
    setUploadProgress(0);
    setIsUploading(false);
  }, [hideInsertIntoCellDialog, setUploadProgress, setIsUploading, updatePendingAttachmentData]);

  // Conversion status hook
  const hookResult = useConversionStatus(documentId, {
    onComplete: handleConversionComplete,
    onFailure: handleConversionFailure
  });
  const { startPolling } = hookResult;
  
  // Debug effect to log state changes
  // useEffect(() => {
  //   console.log("Conversion state changed:", { isConverting, conversionFilename, documentId });
  // }, [isConverting, conversionFilename, documentId]);
  
  // Debug hook result changes
  // useEffect(() => {
  //   console.log("hookResult changed:", {
  //     status: hookResult.status,
  //     url: hookResult.url,
  //     progress: hookResult.progress,
  //     message: hookResult.message,
  //   });
  // }, [hookResult]);
  
  // Update progress bar during conversion
  // useEffect(() => {
  //   if ((hookResult.status === 'processing' || hookResult.status === 'pending') && isConverting) {
  //     const totalProgress = 90 + (hookResult.progress * 0.1); // 90-100% range
  //     setUploadProgress(totalProgress);
  //   }
  // }, [hookResult.status, hookResult.progress, isConverting, setUploadProgress]);
  const [unableToReadFile, setUnableToReadFile] = React.useState(false);
  const [isAttachmentNameFocused, setIsAttachmentNameFocused] = React.useState(false);
  // Add lateEntry state
  const [lateEntry, setLateEntry] = React.useState(false);
  const [lateActionDate, setLateActionDate] = React.useState<string>("")
  const [lateActionTime, setLateActionTime] = React.useState<string>("");
  const [reason, setReason] = React.useState<string>("");
  const { lateTimeInPast } = useTimeComparison(lateActionDate, lateActionTime);
  // console.log("lateTimeInPast", lateTimeInPast, "lateActionDate", lateActionDate, "lateActionTime", lateActionTime)
  const toggleLateEntry = () => {
    setLateEntry(!lateEntry);
  };

  const cleanUp = () => {
    setWorking(false)
    console.log("Cleaning up")
  }
  
  // // Debug unmounting
  // useEffect(() => {
  //   console.log("Attach component mounted");
  //   return () => {
  //     console.log("Attach component unmounting!");
  //   };
  // }, []);


  // Handler for document link selection
  const handleDocumentSelected = (document: { id: string, name: string, url: string }) => {
    setSelectedDocument(document);
    setAttachmentName(document.name);
    
    // Track document link selected
    trackAmplitudeEvent(AMPLITUDE_EVENTS.ATTACHMENT_LINKED, {
      document_id: documentId,
      document_name: useDocumentStore.getState().documentName || 'unknown',
      linked_document_id: document.id,
      linked_document_name: document.name,
      document_stage: stageToDocumentStage(documentStore.documentStage)
    });
  };

  // Function to insert document link
  const insertDocumentLink = async () => {
    if (!selectedDocument || !editor) return;

    // Validate cursor position when AtCursor mode is enabled
    if (insertAtCursor) {
      const validationResult = validateCursorPositionForInsertion(editor);
      if (!validationResult.isValid) {
        // Show toast error but DO NOT clear selectedDocument - preserve user's selection
        trackAmplitudeEvent(AMPLITUDE_EVENTS.CURSOR_POSITION_INVALID, {
          document_id: documentId,
          document_name: documentName || 'Unknown',
          document_stage: stageToDocumentStage(documentStore.documentStage),
          error_type: validationResult.errorMessageKey?.includes('inUserContent') ? 'in_user_content'
            : validationResult.errorMessageKey?.includes('inSystemContent') ? 'in_system_content'
            : 'invalid_position',
          component: 'attach',
          action_attempted: 'document_link'
        });
        toast.error(t(validationResult.errorMessageKey || 'mPopup.cursorValidation.invalidPosition'));
        return;
      }
    }

    // Close the dialog
    hideInsertIntoCellDialog();

    // Set working state
    appStore.setWorkingTitle("");
    setWorking(true);

    const dataSanityData: TableCellSelectionStatus | null = await tableCellSelectionAndDocumentState(
      editor,
      appStore,
      modalStore,
      documentStore
    );

    if (!dataSanityData) {
      cleanUp();
      return false;
    }
    if (dataSanityData.state == null) {
      console.log("Document is out of sync")
      cleanUp();
      return false;
    }
    const { selectionDescriptor, dt, timestamp, state } = dataSanityData;
    const dateString = formatDatetimeString(dt, t);
    const newAttachmentNumber = state.attachmentNumber + 1;
    const attNumStr = pad(newAttachmentNumber.toString(), 2);
    const newAttachmentNumberText = `${t("Att_abrev")} ${attNumStr}`;

    try {
      // Here we're adding a document link instead of a file attachment
      const markerCounter = state.markerCounter
      const { cellsFilled, insertedText, newMarkerCounter } = await appendAttachmentTitleAndLinkIntoSelectedCell(
        editor,
        selectionDescriptor,
        selectedDocument.url,
        selectedDocument.name,
        newAttachmentNumberText,
        initials,
        dateString,
        lateEntry,
        insertAtCursor,
        markerCounter
      );

      // Dispatch custom event for content insertion
      const contentEvent = new CustomEvent<ContentInsertedEvent>('contentInserted', {
        detail: {
          type: 'attachment',
          content: selectedDocument.name
        }
      });
      document.dispatchEvent(contentEvent);
      console.log("Dispatching contentInserted event with details:")
      
      // Dispatch a separate event with more detailed attachment information
      const nameEvent = new CustomEvent('attachmentNameEntered', {
        detail: {
          attachmentName: selectedDocument.name,
          attachmentNumber: newAttachmentNumber,
          attachmentUrl: selectedDocument.url,
          attachmentHash: "",
          attachmentFilename: "",
          fileType: "document",
          legalName,
          dateString
        }
      });
      console.log("Dispatching attachmentNameEntered event for document link:", {
        name: selectedDocument.name,
        number: newAttachmentNumber,
        url: selectedDocument.url
      });
      document.dispatchEvent(nameEvent);
      
      // Add the document link to the document store
      addAttachment({
        name: selectedDocument.name,
        number: newAttachmentNumber,
        url: selectedDocument.url,
        fileType: "document",
        fileHash: "",
        attachedBy: legalName,
        attachedOn: dateString,
        verifications: []
      });
      
      // Explicitly mark document as having content
      setDocumentHasContent(true);

      // Update edited info
      setEditedBy(`${legalName} (${initials})`);
      setEditedAt(dateString);

      // Create audit log entry
      const auditItem = new AuditLogItem({
        email: user?.email,
        userId: user?.userId,
        legalName,
        time: timestamp,
        timeStr: dateString,
        newText: insertedText || "",
        attachmentName: selectedDocument.name,
        attachmentUrl: selectedDocument.url,
        markerCounter: newMarkerCounter,
        cellIndices: JSON.stringify(selectionDescriptor.cellIndices),
        emptyCellCountChange: -1 * (cellsFilled || 0),
        actionType: insertAtCursor ? ActionType.CursorAddDocufenLink : ActionType.AddDocufenLink,
        initials,
        stage: Stage.Execute,
        verifications: state.verifications
      });
      console.log("Updating audit log: " + JSON.stringify(auditItem));
      // If late entry is enabled, add the late action date and time
      if (lateEntry) {
        auditItem.lateActionDate = lateActionDate;
        auditItem.lateActionTime = lateActionTime;
        auditItem.lateReason = reason;
      }

      // Update audit log
      deselectCell(editor);
      const content = await getDocumentContent(editor);
      console.log("  " + content.length);
      const updateAuditLogResult = await updateAuditLog(documentStore, auditItem, content, locale, false, editor, modalStore);
      if (updateAuditLogResult.error != null && updateAuditLogResult.error.length > 0) {
        if (updateAuditLogResult.error === "Network Error - Document reloaded") {
          // Document has already been reloaded by updateAuditLog
          cleanUp();
          return false;
        }
        setUser(null);
        cleanUp();
        return false;
      }

      // Update attachment number
      setAttachmentNumber(state.attachmentNumber + 1);

      // Reset state
      setAttachmentName("");
      setSelectedDocument(null);

      cleanUp();
      return true;
    } catch (error) {
      console.error("Error inserting document link:", error);
      cleanUp();
      return false;
    }
  };

  // Function to insert attachment after upload is complete
  const doInsertAttachment = async (data: PendingAttachmentData) => {
    if (!editor || !user) return false;
    
    const { url, pageCount, selectionDescriptor, timestamp, state, dateString, newAttachmentNumber, newAttachmentNumberText, attachmentName: dataAttachmentName } = data;
    
    // Insert attachment link into selected cell
    const markerCounter = state.markerCounter;
    const { cellsFilled, insertedText, newMarkerCounter } = await appendAttachmentTitleAndLinkIntoSelectedCell(
      editor,
      selectionDescriptor,
      url,
      dataAttachmentName,
      newAttachmentNumberText,
      initials,
      dateString,
      lateEntry,
      insertAtCursor,
      markerCounter
    );

    // Log the actual upload URL and attachment name for debugging
    console.log("Attachment upload complete with details:", {
      url: url,
      name: dataAttachmentName,
      number: newAttachmentNumber,
      filename: attachmentFilename.current,
      hash: attachmentHash.current,
      fileType: isImageFile(attachmentFilename.current) ? 'image' :
        isVideoFile(attachmentFilename.current) ? 'video' :
          attachmentFilename.current.toLowerCase().endsWith('.pdf') ? 'pdf' : 'document'
    });

    // Add the attachment to the document store
    const fileExtension = attachmentFilename.current.split('.').pop()?.toLowerCase() || '';
    const fileType: StoreAttachment['fileType'] =
      fileExtension === 'pdf' ? 'pdf' :
        ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension) ? 'image' :
          ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(fileExtension) ? 'video' :
            'document';

    console.log(`Adding attachment to document store:`, {
      name: dataAttachmentName,
      number: newAttachmentNumber,
      url,
      fileType,
      fileHash: attachmentHash.current,
      attachedBy: legalName,
      attachedOn: dateString
    });

    addAttachment({
      name: dataAttachmentName,
      number: newAttachmentNumber,
      url,
      fileType,
      fileHash: attachmentHash.current,
      attachedBy: legalName,
      attachedOn: dateString,
      verifications: []
    });

    // Dispatch custom event for attachment insertion
    const contentEvent = new CustomEvent<ContentInsertedEvent>('contentInserted', {
      detail: {
        type: 'attachment',
        content: dataAttachmentName
      }
    });
    document.dispatchEvent(contentEvent);

    // Explicitly mark document as having content
    setDocumentHasContent(true);

    // Dispatch a separate event with more detailed attachment information
    const nameEvent = new CustomEvent('attachmentNameEntered', {
      detail: {
        attachmentName: dataAttachmentName,
        attachmentNumber: newAttachmentNumber,
        attachmentUrl: url,
        attachmentHash: attachmentHash.current,
        attachmentFilename: attachmentFilename.current,
        fileType: isImageFile(attachmentFilename.current) ? 'image' :
          isVideoFile(attachmentFilename.current) ? 'video' :
            attachmentFilename.current.toLowerCase().endsWith('.pdf') ? 'pdf' : 'document',
        legalName,
        dateString
      }
    });
    console.log("Dispatching attachmentNameEntered event with details:", {
      name: dataAttachmentName,
      number: newAttachmentNumber,
      url: url,
      hash: attachmentHash.current,
      filename: attachmentFilename.current
    });
    document.dispatchEvent(nameEvent);

    setEditedBy(`${legalName} (${initials})`);
    setEditedAt(dateString);
    
    const auditItem = new AuditLogItem({
      email: user.email,
      userId: user.userId,
      legalName,
      time: timestamp,
      timeStr: dateString,
      newText: insertedText ? insertedText : "",
      attachmentName: dataAttachmentName,
      attachmentHash: attachmentHash.current,
      attachmentUrl: url,
      attachmentFilename: attachmentFilename.current,
      attachmentItemId: "",
      markerCounter: newMarkerCounter,
      cellIndices: JSON.stringify(selectionDescriptor.cellIndices),
      emptyCellCountChange: -1 * (cellsFilled ? cellsFilled : 0),
      actionType: insertAtCursor ? ActionType.CursorAddAttachment : ActionType.AddAttachment,
      initials,
      pageCount,
      removedText: "",
      stage: Stage.Execute,
      verifications: state.verifications
    });
    
    if (lateEntry) {
      auditItem.lateActionDate = lateActionDate;
      auditItem.lateActionTime = lateActionTime;
      auditItem.lateReason = reason;
    }
    
    // console.log("Updating audit log: " + JSON.stringify(auditItem));
    deselectCell(editor);
    const content = await getDocumentContent(editor);
    const updateAuditLogResult = await updateAuditLog(documentStore, auditItem, content, locale, false, editor, modalStore);
    
    if (updateAuditLogResult.error != null && updateAuditLogResult.error.length > 0) {
      if (updateAuditLogResult.error === "Network Error - Document reloaded") {
        // Document has already been reloaded by updateAuditLog
        cleanUp();
        return false;
      }
      console.log("Problem updating audit log: " + updateAuditLogResult.error);
      setUser(null);
      cleanUp();
      return false;
    }
    
    setAttachmentNumber(state.attachmentNumber + 1);
    cleanUp();
    setAttachmentName("");
    attachmentFilename.current = "";
    if (fileInputRef.current != null)
      fileInputRef.current.value = "";
      
    return true;
  };

  const doAddAttachmentLink = async (): Promise<{ success: boolean; conversionPending: boolean }> => {
    // Set empty workingTitle to ensure transparent overlay
    appStore.setWorkingTitle("")

    // workingTitle.current = t("addingAttachmentLink")
    // workingMessage.current = t("defaultWorkingMessage")
    // showList.current = true
    if (attachmentFile.current == null) return { success: false, conversionPending: false }
    if (editor == null) return { success: false, conversionPending: false }

    // Validate cursor position when AtCursor mode is enabled
    if (insertAtCursor) {
      const validationResult = validateCursorPositionForInsertion(editor);
      if (!validationResult.isValid) {
        // Show toast error but DO NOT clear attachmentFile.current - preserve uploaded file
        trackAmplitudeEvent(AMPLITUDE_EVENTS.CURSOR_POSITION_INVALID, {
          document_id: documentId,
          document_name: documentName || 'Unknown',
          document_stage: stageToDocumentStage(documentStore.documentStage),
          error_type: validationResult.errorMessageKey?.includes('inUserContent') ? 'in_user_content'
            : validationResult.errorMessageKey?.includes('inSystemContent') ? 'in_system_content'
            : 'invalid_position',
          component: 'attach',
          action_attempted: 'attachment'
        });
        toast.error(t(validationResult.errorMessageKey || 'mPopup.cursorValidation.invalidPosition'));
        return { success: false, conversionPending: false };
      }
    }
    let url: string | null = null
    let pageCount: number | undefined
    setWorking(true)
    editor.enableTrackChanges = false
    const dataSanityData: TableCellSelectionStatus | null = await tableCellSelectionAndDocumentState(editor,
      appStore, modalStore, documentStore)
    if (!dataSanityData) {
      cleanUp()
      return { success: false, conversionPending: false }
    }
    const { selectionDescriptor, dt, timestamp, state } = dataSanityData
    const dateString = formatDatetimeString(dt, t)
    const newAttachmentNumber = state.attachmentNumber + 1
    console.log("New attachment number: " + newAttachmentNumber)
    const attNumStr = pad(newAttachmentNumber.toString(), 2)
    const newAttachmentNumberText = `${t("Att_abrev")} ${attNumStr}`
    // let newMarkerCounter = state.markerCounter;
    let localConversionNeeded = false
    try {
      const filenameBits = attachmentFilename.current.split(".")
      const suffix = filenameBits[filenameBits.length - 1]
      // const documentName = filenameBits.slice(0, -1).join(".")
      const newFilename = `${documentName}_Att_${attNumStr}_${attachmentName}.${suffix}`.replace(/ /g, "_")
      console.log("Uploading file: " + newFilename)
      
      // Determine if we should use direct upload
      const useDirectUpload = features.ENABLE_DIRECT_UPLOAD && 
        (attachmentFile.current.size > features.TRADITIONAL_UPLOAD_MAX_SIZE);
      
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ATTACHMENT_UPLOADED, {
        document_id: documentId,
        document_name: useDocumentStore.getState().documentName || 'unknown',
        attachment_id: attachmentHash.current || 'unknown',
        attachment_name: attachmentName,
        file_type: suffix,
        file_size_mb: attachmentFile.current ? attachmentFile.current.size / (1024 * 1024) : 0,
        document_stage: stageToDocumentStage(documentStore.documentStage)
      });
      if (useDirectUpload) {
        // Use direct blob upload
        try {
          modalStore.setIsUploading(true);
          modalStore.setUploadProgress(0);
          console.log("should have progress initializing direct upload service")
          const cut = attachmentFile.current.name.split(".").pop()?.toLowerCase() === 'mov' ? UPLOAD_CUT : 1.0
          const uploadResponse = await DirectUploadService.uploadFile(
            documentId,
            attachmentFile.current,
            (progress) => {
              modalStore.setUploadProgress(Math.round(progress.percentage*cut));
            }
          );
          console.log("Direct upload response:", uploadResponse.url, uploadResponse.uniqueFilename);
          url = uploadResponse.url;
          pageCount = uploadResponse.pageCount;

          
          // Store the pageCount temporarily since we'll need it later
          if (uploadResponse.conversionStatus === 'pending') {
            localConversionNeeded = true;
            // Don't set isProcessingConversion here - it should only be set when actually processing completion
            // const conversionFile = attachmentFile.current?.name || "";
            // modalStore.setIsUploading(false);
            // modalStore.setUploadProgress(90); // Show 90% to indicate conversion starting
            
            // Start polling after a brief delay to ensure refs are updated
            setTimeout(() => {
              console.log("Starting conversion polling for file:", uploadResponse.uniqueFilename);
              startPolling(documentId, uploadResponse.uniqueFilename);
            }, 1000);
            
            // We'll create the full attachment data later when we have all the document state info
            // For now, just continue to get that info, then return early
          } else {
            modalStore.setIsUploading(false);
          }
        } catch (error: any) {
          modalStore.setIsUploading(false);
          if (error.message?.includes('not logged in')) {
            logout();
          // } else {
          //   console.error('Direct upload failed:', error);
          //   // Fallback to traditional upload
          //   const uploadResult: UploadResult = await uploadFile(documentId, attachmentName, attachmentFile.current, newFilename);
          //   if (uploadResult.error != null && uploadResult.error.startsWith("User not logged in")) {
          //     logout();
          //   } else if(uploadResult.error != null && uploadResult.error != "") {
          //     console.log("problem uploading: " + uploadResult.error);
          //   } else {
          //     url = uploadResult.url;
          //     pageCount = uploadResult.pageCount;
          //   }
          }
          // Track upload error
          trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
            error_type: 'attachment_upload_failed',
            error_code: 'UPLOAD_ERROR',
            error_message: error.message,
            error_source: 'Attach.uploadFile',
            page_name: 'Document Editor',
            action_attempted: 'upload_attachment'
          });
          throw(error)
        }
      } else {
        // Use traditional upload
        const uploadResult: UploadResult = await uploadFile(documentId, attachmentName, attachmentFile.current, newFilename)
        if (uploadResult.error != null && uploadResult.error.startsWith("User not logged in")) {
          logout()
        } else if(uploadResult.error != null && uploadResult.error != "") {
          console.log("problem uploading: " + uploadResult.error)
          // Track upload error
          trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
            error_type: 'attachment_upload_failed',
            error_code: 'UPLOAD_ERROR',
            error_message: uploadResult.error,
            error_source: 'Attach.uploadFile',
            page_name: 'Document Editor',
            action_attempted: 'upload_attachment'
          });
          throw new Error(uploadResult.error)
        } else {
          url = uploadResult.url
          pageCount = uploadResult.pageCount
        }
      }
    } catch (err: any) {
      console.log("Caught upload error: " + JSON.stringify(err))
      cleanUp()
      return { success: false, conversionPending: false }
    }
    console.log("Original attachment url: " + url);

    if (dt == null || user == null || timestamp == null || url == null || pageCount == null) {
      console.log("Problem with data" + JSON.stringify({ dt, user, timestamp, url, pageCount }))
      cleanUp();
      return { success: false, conversionPending: false };
    }

    // Prepare the attachment data
    const attachmentData: PendingAttachmentData = {
      url,
      pageCount,
      selectionDescriptor,
      dt,
      timestamp,
      state,
      dateString,
      newAttachmentNumber,
      newAttachmentNumberText,
      attachmentName
    };

    // If conversion is not in progress, insert immediately
    if (!localConversionNeeded) {
      const insertResult = await doInsertAttachment(attachmentData);
      return { success: insertResult, conversionPending: false };
    } else {
      // Store data for later insertion after conversion completes
      console.log("Storing pending attachment data for conversion:", attachmentData);
      updatePendingAttachmentData(attachmentData);
      // Return success with conversion pending
      return { success: true, conversionPending: true };
    }
  }

  const handleFileResult = async (result: ArrayBuffer | string | null) => {
    if (typeof result === "string") {
      console.log(result)
      throw new Error("type of result is string???")
    }
    if (result == null) {
      return
    }
    if (result.byteLength > 100 * 1024 * 1024) {
      setAttachmentTooLarge(true)
      return
    }

    // Just calculate the hash but don't call doAddAttachmentLink yet
    attachmentHash.current = await fileHash(result)
    // setHashValue(attachmentHash.current)
    setFileSelected(true)

    // Auto-populate attachment name from filename (without extension)
    if (attachmentFilename.current) {
      const filenameWithoutExt = attachmentFilename.current.replace(/\.[^/.]+$/, '');
      setAttachmentName(filenameWithoutExt);
    }

    // Generate thumbnail if it's an image or video file
    if (attachmentFile.current) {
      if (isImageFile(attachmentFile.current.name)) {
        createThumbnail(attachmentFile.current);
      } else if (isVideoFile(attachmentFile.current.name)) {
        createVideoThumbnail(attachmentFile.current);
      } else {
        setThumbnailUrl("");
      }
    }
    
    // Focus on the attachment name input field after a file is uploaded
    setTimeout(() => {
      if (attachmentNameInputRef.current) {
        attachmentNameInputRef.current.focus();
      }
    }, 100);
  }

  // Check if the file is an image
  const isImageFile = (filename: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif'].includes(ext || '');
  };

  // Check if the file is a video
  const isVideoFile = (filename: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['mp4', 'mov', 'webm', 'avi', 'mkv', 'wmv'].includes(ext || '');
  };

  // Create a thumbnail for image files
  const createThumbnail = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        if (e.target.result === 'data:image/jpeg;base64,VGhpcyBpcyBhbiBpbWFnZQ==') {
          console.warn("Received empty image data, skipping thumbnail creation.");
          setUnableToReadFile(true);
          return;
        }
        setThumbnailUrl(e.target.result as string);
      }
    };
    reader.onerror = (err: unknown) => {
      if (err instanceof Error)
        console.error("Reading file failed: " + err.message);
    };
    reader.readAsDataURL(file);
  };

  // Create a thumbnail for video files using a video element
  const createVideoThumbnail = (file: File) => {
    const videoUrl = URL.createObjectURL(file);
    setThumbnailUrl(videoUrl);
  };

  const readAndPreviewFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleFileResult(reader.result).catch((err: unknown) => {
        if (err instanceof Error)
          console.error("Reading file failed: " + err.message)
      });
      
      // Focus on the attachment name input after file upload via drag/drop
      setTimeout(() => {
        if (attachmentNameInputRef.current) {
          attachmentNameInputRef.current.focus();
        }
      }, 100);
    };

    // Check if the file extension is allowed
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (
      ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'mov', 'webm', 'avi', 'mkv', 'wmv'].includes(ext)
    ) {
      attachmentFilename.current = file.name
      attachmentFile.current = file
      reader.readAsArrayBuffer(file)
    } else {
      modalStore.setUnsupportedAttachmentType(true);
    }
  };

  const attachmentSelected = React.useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    fileReader.onload = async (e) => {
      if (e.target == null) {
        return
      }
      const { result } = e.target
      await handleFileResult(result)
    }
    fileReader.onerror = (err: unknown) => {
      if (err instanceof Error)
        console.error("Reading file failed: " + err.message)
    }
    const { files } = ev.target
    if (files == null) {
      return
    }
    const _file: File = files[0]

    // Check if the file extension is allowed
    const ext = _file.name.split('.').pop()?.toLowerCase() || '';
    if (
      ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'mov', 'webm', 'avi', 'mkv', 'wmv'].includes(ext)
    ) {
      attachmentFilename.current = _file.name
      attachmentFile.current = _file
      fileReader.readAsArrayBuffer(_file)
    } else {
      modalStore.setUnsupportedAttachmentType(true);
    }
  }, [modalStore])

  // Handle events from drag & drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readAndPreviewFile(e.dataTransfer.files[0]);
    }
  };

  // Prevent default behavior for drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle file paste from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          readAndPreviewFile(file);
        }
      }
    }
  };

  const safeUpdateAttachmentName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id !== "attachment-name") return;
    const sanitizedValue = value.replace(fileNameRegExp, '');
    setAttachmentName(sanitizedValue)
  }
  // Clear the selected file
  const clearSelectedFile = () => {
    attachmentFilename.current = "";
    attachmentFile.current = null;
    attachmentHash.current = "";
    // setHashValue("");
    setFileSelected(false);
    setThumbnailUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Open the document link modal
  const openLinkModal = () => {
    setIsLinkModalOpen(true);
  };
  const buttonDisabled = (!attachmentName || (!fileSelected && !selectedDocument)) || 
              working || modalStore.isUploading || 
              (lateEntry && (!lateTimeInPast || reason.trim().length < MINIMUM_REASON_LENGTH))

  return (
    <div className="space-y-4">
      <input 
        id="file-upload" 
        data-testid={`editor.${getStageString(documentStore.documentStage)}.attachments.fileInput`}
        ref={fileInputRef} 
        type="file" 
        className="hidden" 
        onChange={attachmentSelected} 
        disabled={working} 
      />
      
      {/* Two-column layout for drop area and link to document */}
      <div className="flex flex-row gap-3 w-full">
        {/* Left side: Drop area */}
        <div
          className="w-1/2 flex flex-col items-center justify-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onPaste={handlePaste}
        >
          <div className="border-2 border-dashed border-gray-300 rounded-md bg-background hover:bg-background/90 p-4 w-full h-full flex flex-col items-center justify-center gap-2">
            {!fileSelected ? (
              <>
                <p className="text-sm text-gray-600 text-center mb-1">
                  {t('mPopup.attachments.fileTypePrompt')}
                </p>
                <label
                  data-testid={`editor.${getStageString(documentStore.documentStage)}.attachments.uploadButton`}
                  htmlFor="file-upload"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-background border border-input px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer transition-colors relative group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {t('mPopup.attachments.buttonUpload')}
                  <div className="rounded-full bg-muted/70 p-1 hover:bg-muted transition-colors cursor-help ml-1">
                    <Info className="h-3 w-3 info-icon" />
                  </div>
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 w-80 px-3 py-2 bg-background rounded-md shadow-md text-xs z-50 border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <p className="mb-1">{t('mPopup.attachments.helpText')}</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>{t('mPopup.attachments.fileFormats.images')}</li>
                      <li>{t('mPopup.attachments.fileFormats.documents')}</li>
                      <li>{t('mPopup.attachments.fileFormats.videos')}</li>
                    </ul>
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-1 border-8 border-solid border-transparent border-r-gray-200"></div>
                  </div>
                </label>
              </>
            ) : (
              <div className="mt-2 text-center w-full flex flex-col items-center">
                {thumbnailUrl && (
                  <div className="mb-3 border border-gray-200 rounded overflow-hidden" style={{ maxWidth: '120px', maxHeight: '120px' }}>
                    {isVideoFile(attachmentFilename.current) ? (
                      <video
                        src={thumbnailUrl}
                        controls
                        muted
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: '120px' }}
                      />
                    ) : (
                      <img
                        src={thumbnailUrl}
                        alt={t('mPopup.attachments.filePreview')}
                        className="w-full h-auto object-contain"
                      />
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-600">
                  {attachmentFilename.current}
                </p>
                <button
                  data-testid={`editor.${getStageString(documentStore.documentStage)}.attachments.clearFileButton`}
                  type="button"
                  onClick={clearSelectedFile}
                  disabled={working}
                  className="mt-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Link to Document */}
        <div className="w-1/2 flex flex-col items-center justify-center">
          <div
            className="border-2 border-solid border-gray-300 rounded-md bg-background hover:bg-background/90 p-4 w-full h-full flex flex-col items-center justify-center gap-2"
          >
            {selectedDocument ? (
              <div className="text-center w-full flex flex-col items-center">
                <div className="mb-3">
                  <ExternalLink className={cn(
                    "h-10 w-10",
                    documentStore.documentStage === Stage.PreApprove
                      ? "text-[#F5A623]"
                      : documentStore.documentStage === Stage.Execute
                        ? "text-[#6366F1]"
                        : documentStore.documentStage === Stage.PostApprove
                          ? "text-[#9C27B0]"
                          : "text-primary"
                  )} />
                </div>
                <p className="text-sm font-medium mb-1">
                  {selectedDocument.name}
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  ID: {selectedDocument.id.slice(0, 8)}...{selectedDocument.id.slice(-8)}
                </p>
                <button
                  data-testid={`editor.${getStageString(documentStore.documentStage)}.attachments.clearDocumentButton`}
                  type="button"
                  onClick={() => setSelectedDocument(null)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-1 text-center">
                  {t('mPopup.attachments.linkaDoc')}
                </p>
                <button
                  data-testid={`editor.${getStageString(documentStore.documentStage)}.attachments.linkDocumentButton`}
                  type="button"
                  onClick={openLinkModal}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-background border border-input px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer transition-colors"
                  disabled={fileSelected || working}
                >
                  <Link2 className="h-4 w-4" />
                  {t('mPopup.attachments.buttonSelectLinkedDoc')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Attachment name input - only show when file is selected or document is linked */}
      {(fileSelected || selectedDocument) && (
        <div className="relative w-full overflow-hidden rounded-md">
          <input
            data-testid={`editor.${getStageString(documentStore.documentStage)}.attachments.nameInput`}
            id="attachment-name"
            ref={attachmentNameInputRef}
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none bg-background text-foreground font-inter"
            value={attachmentName}
            onChange={safeUpdateAttachmentName}
            onFocus={() => setIsAttachmentNameFocused(true)}
            onBlur={() => setIsAttachmentNameFocused(false)}
            onKeyDown={(e) => {
              // Control+Enter to insert attachment
              if (e.ctrlKey && e.key === 'Enter' && !buttonDisabled) {
                e.preventDefault();
                checkDocumentNotStale(true).then((staleState: DocumentStaleStatus) => {
                  if (!staleState || !staleState.ok) {
                    if (editor == null) return;
                    triggerReloadDocument(editor, modalStore);
                    return false;
                  } else {
                    hideInsertIntoCellDialog();
                    if (selectedDocument) {
                      insertDocumentLink();
                    } else if (fileSelected && attachmentName) {
                      doAddAttachmentLink().then((result) => {
                        console.log("doAddAttachmentLink completed with result:", result);
                      });
                    }
                  }
                }).catch((err: unknown) => {
                  if (err instanceof Error)
                    console.error("Error checking document state: " + err.message);
                });
              }
            }}
            placeholder={t('mPopup.attachments.enterName')}
          />
          {isAttachmentNameFocused && (
            <BorderTrail
              className="bg-gradient-to-l from-[#6366F1]/30 via-[#6366F1] to-[#6366F1]/30"
              size={50}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: 'linear',
              }}
            />
          )}
        </div>
      )}


      {/* Insert button - full width */}
      <Button
        data-testid={`editor.${getStageString(documentStore.documentStage)}.attachments.insertButton`}
        onClick={() => {
          // Close the MasterPopup immediately
          checkDocumentNotStale(true).then((staleState: DocumentStaleStatus) => {
            if (!staleState || !staleState.ok) {
              if (editor == null) return
              console.warn("Triggering reload of document")
              triggerReloadDocument(editor, modalStore)
              return false
            } else {
              // Then perform the appropriate action based on what's selected
              hideInsertIntoCellDialog()
              if (selectedDocument) {
                insertDocumentLink();
              } else if (fileSelected && attachmentName) {
                // Don't hide dialog immediately - let doAddAttachmentLink decide
                doAddAttachmentLink().then((result) => {
                  console.log("doAddAttachmentLink completed with result:", result);
                });
              }
            }
          }).catch((err: unknown) => {
            if (err instanceof Error)
              console.error("Error checking document state: " + err.message)
          })
        }}
        disabled={buttonDisabled}

        className={cn(
          "w-full py-1.5 rounded-md",
          documentStore.documentStage === Stage.PreApprove
            ? "bg-[#F5A623] text-white hover:bg-[#F5A623]/90"
            : documentStore.documentStage === Stage.Execute
              ? "bg-[#6366F1] text-white hover:bg-[#6366F1]/90"
              : documentStore.documentStage === Stage.PostApprove
                ? "bg-[#9C27B0] text-white hover:bg-[#9C27B0]/90"
                : "bg-primary text-white hover:bg-primary/90"
        )}
      >
        {t('mPopup.attachments.button.insertAttachment')}
      </Button>
      <LateEntry
        lateEntry={lateEntry}
        toggleLateEntry={toggleLateEntry}
        lateActionDate={lateActionDate}
        setLateActionDate={setLateActionDate}
        lateActionTime={lateActionTime}
        setLateActionTime={setLateActionTime}
        reason={reason}
        setReason={setReason}
        documentStage={documentStore.documentStage}
      />
      <DocuDialog
        open={unableToReadFile}
        toggleDialog={() => setUnableToReadFile(!unableToReadFile)}
        title={t("att.unableToReadFile")} 
        TitleIcon={<Info className="h-5 w-5" />}
        content={t("att.unableToReadFileContent")}
        primaryButtonText="OK"
        primaryAction={() => {}}
        warning={false}
      />
      <DocuDialog
        open={attachmentTooLarge}
        toggleDialog={() => setAttachmentTooLarge(prev => !prev)}
        title={t("attachmentTooLarge")} 
        TitleIcon={<Info className="h-5 w-5" />}
        content={t("attachmentTooLargeContent")}
        primaryButtonText="OK"
        primaryAction={() => {}}
        warning={false}
      />

      {/* Document Link Modal */}
      <AttachmentLinkToDocumentModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSelectDocument={handleDocumentSelected}
      />
    </div>
  );
};

export default Attach;