import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { CheckIcon } from '@radix-ui/react-icons';
import React, { useState, useRef, JSX, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { useAppStore, useDocumentStore, useModalStore, useUserStore } from '@/lib/stateManagement';
import { updateAuditLog } from '../lib/addinUtils';
import { formatDatetimeString } from '@/lib/dateUtils';
import { checkCheckboxInCell } from '../lib/checkboxUtils';
import { insertCorrection, tableCellSelectionAndDocumentState, TableCellSelectionStatus } from '../lib/editUtils';
import { useTranslation } from 'react-i18next';
import { ActionType, AuditLogItem } from '../lib/AuditLogItem';
import { Stage } from '../lib/lifecycle';
import { getDocumentContent } from '../lib/editorUtils';
import { useCellSelection } from '@/hooks/CellSelection';
import './SelectionHandler.css';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ContentInsertedEvent } from './MasterPopup';
import { MINIMUM_REASON_LENGTH } from '../lib/constants';
import LateEntry from './LateEntry';
import { getStageString, stageToDocumentStage } from '../lib/utils';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import { useTimeComparison } from '@/hooks/useTimeComparison';
import { releaseLock } from '@/lib/apiUtils';
import { BorderTrail } from '@/components/motion-primitives/border-trail';

interface SelectionHandlerProps {
  forceShowCorrections?: number;
  forceShowCheckboxes?: boolean;
}

interface InsertButtonProps {
  label?: string;
  icon?: JSX.Element;
  tooltip: string;
  isIcon?: boolean;
  isGreen?: boolean;
  action: () => void;
  disabled?: boolean;
}

const SelectionHandler: React.FC<SelectionHandlerProps> = ({ 
  forceShowCorrections = 0, 
  forceShowCheckboxes = false 
}) => {
  const userStore = useUserStore(useShallow((state) => ({
    user: state.user,
    setUser: state.setUser,
    legalName: state.legalName,
    initials: state.initials,
  })))
  const { user, setUser, legalName, initials } = userStore
  const { t, i18n } = useTranslation()
  const documentStore = useDocumentStore(useShallow((state) => ({
    documentId: state.documentId,
    documentStage: state.documentStage,
    setDocumentStage: state.setDocumentStage,
    setMarkerCounter: state.setMarkerCounter,
    setEmptyCellCount: state.setEmptyCellCount,
    setEditedBy: state.setEditedBy,
    setEditedAt: state.setEditedAt,
    editTime: state.editTime,
    setEditTime: state.setEditTime,
    triggerReload: state.triggerReload,
    setReloadSelection: state.setReloadSelection,
  })))
  const { documentId, setEmptyCellCount, setEditedBy, setEditedAt, documentStage } = documentStore
  const modalStore = useModalStore(useShallow((state) => ({
    setCellEmpty: state.setCellEmpty,
    tableNotSelected: state.tableNotSelected,
    toggleTableNotSelected: state.toggleTableNotSelected,
    toggleCellNotEmpty: state.toggleCellNotEmpty,
    setDocumentInUse: state.setDocumentInUse,
    cellNotEmpty: state.cellNotEmpty,
    setShowNoCheckboxFound: state.setShowNoCheckboxFound,
    setDocumentNotUpToDate: state.setDocumentNotUpToDate,
    setDocumentStatus: state.setDocumentStatus,
    setOperationFailedError: state.setOperationFailedError
  })))
  const setShowNoCheckboxFound = modalStore.setShowNoCheckboxFound
  const appStore = useAppStore(useShallow((state) => ({
    setWorkingTitle: state.setWorkingTitle,
    setShowList: state.setShowList,
    setWorking: state.setWorking,
    working: state.working,
    editor: state.editor,
    hideInsertIntoCellDialog: state.hideInsertIntoCellDialog,
    selectionMade: state.selectionMade,
  })))
  const { setWorking, editor, hideInsertIntoCellDialog, selectionMade, working } = appStore
  const [newText, setNewText] = useState('');
  const { deselectCell } = useCellSelection()
  const [isCheckboxSelected, setIsCheckboxSelected] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const [lateEntry, setLateEntry] = React.useState(false);
  const [lateActionDate, setLateActionDate] = React.useState<string>("");
  const [lateActionTime, setLateActionTime] = React.useState<string>("");
  const [disableButtons, setDisableButtons] = React.useState(false);
  const [reason, setReason] = React.useState<string>("");
  const [lateReason, setLateReason] = React.useState<string>("");
  const { lateTimeInPast } = useTimeComparison(lateActionDate, lateActionTime);

  const [buttons, setButtons] = useState<InsertButtonProps[]>([]);
  const newContentRef = useRef<HTMLInputElement | null>(null);
  const [isWithFieldFocused, setIsWithFieldFocused] = useState(false);
  const [isReasonFieldFocused, setIsReasonFieldFocused] = useState(false);

  React.useEffect(() => {
    setDisableButtons(working || (lateEntry && (lateReason.trim().length < MINIMUM_REASON_LENGTH || !lateTimeInPast)))
  }, [lateEntry, lateReason, working, lateTimeInPast])

  const toggleLateEntry = () => {
    setLateEntry(!lateEntry);
  };

  // Check if the selected text is a checkbox and capture the selected text
  useEffect(() => {
    if (editor) {
      const selection = editor.selection;
      if (selection) {
        console.log("actual selectedText: " + selection.text)
        try {
          const text = selection.text;
          // Save the selected text for display
          setSelectedText(text);
          
          // Check if the selected text is a checkbox character
          if (text.includes('☐')) {
            setIsCheckboxSelected(true);
          } else {
            setIsCheckboxSelected(false);
            // No longer pre-filling the new text field
          }
        } catch (error) {
          console.error(t('selectionHandler.errors.gettingSelectedText'), error);
          setIsCheckboxSelected(false);
        }
      }
    }
    if (forceShowCorrections) {
      setIsCheckboxSelected(false);
      return;
    }
    
    if (forceShowCheckboxes) {
      setIsCheckboxSelected(true);
      return;
    }
    
  }, [editor, forceShowCorrections, forceShowCheckboxes, setSelectedText, setIsCheckboxSelected, selectionMade]);
  // Add a new effect to update selected text when the component is visible
  // This ensures we get the full selection when the user finishes selecting
  useEffect(() => {
    if (!isCheckboxSelected && editor && editor.selection) {
      try {
        // Add a small delay to ensure we get the complete selection
          if (editor && editor.selection) {
            const fullText = editor.selection.text;
            if (fullText && !fullText.includes('☐')) {
              setSelectedText(fullText);
              // No longer updating the newText here
            }
          }
      } catch (error) {
        console.error(t('selectionHandler.errors.updatingSelectedText'), error);
      }
    }
  }, [editor, editor?.selection, isCheckboxSelected]);

  const doCheckCheckBox = React.useCallback(async () => {
    if (!editor) {
      setWorking(false)
      return false
    }
    // Set empty workingTitle to ensure transparent overlay
    appStore.setWorkingTitle("")
    setWorking(true)
    
    editor.enableTrackChanges = false
    const dataSanityData: TableCellSelectionStatus | null = await tableCellSelectionAndDocumentState(editor,
      appStore, modalStore, documentStore)
    if (!dataSanityData) {
      setWorking(false); // Reset working state if data sanity check fails
      return false;
    }
    if (dataSanityData.state === null) {
      setWorking(false)
      return false;
    }
    const { selectionDescriptor: selectionDescriptor, dt, timestamp, state } = dataSanityData
    if (selectionDescriptor == null) {
      console.error(t('selectionHandler.errors.noTableCellDescriptor'))
      return false
    }
    const dateString = formatDatetimeString(dt, t)
    let actionType: ActionType = ActionType.CheckedBox
    const newCheckboxCounter = state.markerCounter + 1
    let superscriptText = `${initials}*${newCheckboxCounter}`
    console.log("SuperscriptText: " + superscriptText + " initials " + initials)
    const insertedText = `\u2611${superscriptText}`
    const { removedText, cellsFilled } = checkCheckboxInCell(editor, selectionDescriptor.selection, superscriptText, lateEntry)
    console.log("removedText: " + removedText)
    if (removedText.length === 0) {
      setShowNoCheckboxFound(true)
      setWorking(false)
      await releaseLock(documentId)
      return false
    }
    // Track checkbox toggled event
    trackAmplitudeEvent(AMPLITUDE_EVENTS.CHECKBOX_TOGGLED, {
      document_id: useDocumentStore.getState().documentId || 'unknown',
      document_name: useDocumentStore.getState().documentName || 'unknown',
      checkbox_id: selectionDescriptor.cellIndices ? JSON.stringify(selectionDescriptor.cellIndices) : 'unknown',
      new_state: true, // Always true when checking
      document_stage: stageToDocumentStage(documentStore.documentStage),
      cell_location: selectionDescriptor.cellIndices ? JSON.stringify(selectionDescriptor.cellIndices) : undefined
    });
    
    // Dispatch custom event for checked checkbox
    const contentEvent = new CustomEvent<ContentInsertedEvent>('contentInserted', {
      detail: {
        type: 'checkbox',
        content: 'checked'
      }
    });
    document.dispatchEvent(contentEvent);
    
    const newEmptyCellCount = state.emptyCellCount - cellsFilled
    if (setEmptyCellCount) setEmptyCellCount(newEmptyCellCount)
    if (setEditedBy) setEditedBy(`${legalName} (${initials})`)
    if (setEditedAt) setEditedAt(dateString)

    const auditItem = new AuditLogItem({
      email: user?.email,
      userId: user?.userId,
      legalName,
      time: timestamp,
      newText: insertedText,
      initials,
      emptyCellCountChange: -1 * cellsFilled,
      removedText,
      cellIndices: JSON.stringify(selectionDescriptor.cellIndices),
      reason: "",
      stage: Stage.Execute,
      actionType,
      verifications: state.verifications
    })
    if (lateEntry) {
      auditItem.lateActionDate = lateActionDate
      auditItem.lateActionTime = lateActionTime
      auditItem.lateReason = lateReason
    }
    if (!documentId) return false
    deselectCell(editor)
    console.log("Getting content")
    const content: string = await getDocumentContent(editor)
    const updateAuditLogResult = await updateAuditLog(documentStore, auditItem, content, i18n.language, false, editor, modalStore)
    console.log("Updated Audit Log")
    if (updateAuditLogResult.error != null && updateAuditLogResult.error.length > 0) {
      if (updateAuditLogResult.error === "Network Error - Document reloaded") {
        // Document has already been reloaded by updateAuditLog
        setWorking(false)
        return false
      }
      if (setUser) setUser(null)
      setWorking(false)
      return false
    }
    setLateReason("")
    setWorking(false)
    return true
  }, [editor, setWorking, appStore, modalStore, userStore, documentStore, setEmptyCellCount, setEditedBy, 
    setEditedAt, i18n.language, lateEntry, lateActionDate, lateActionTime, lateReason])

  const makeCorrection = React.useCallback(async () => {
    if (!editor) {
      setWorking(false)
      return false
    }
    
    // Make sure we have a reason before proceeding
    if (reason.trim().length < MINIMUM_REASON_LENGTH) {
      console.error("Cannot make correction: Reason must be at least 4 characters")
      return false
    }
    
    // Set empty workingTitle to ensure transparent overlay
    appStore.setWorkingTitle("")
    setWorking(true)
    
    editor.enableTrackChanges = false
    const dataSanityData: TableCellSelectionStatus | null = await tableCellSelectionAndDocumentState(editor,
      appStore, modalStore, documentStore)
    if (!dataSanityData) {
      setWorking(false); // Reset working state if data sanity check fails
      return false;
    }
    if (dataSanityData.state === null) {
      setWorking(false)
      return false;
    }
    const { selectionDescriptor: selectionDescriptor, dt, timestamp, state } = dataSanityData
    const dateString = formatDatetimeString(dt, t)
    let actionType: ActionType = ActionType.MadeCorrection
    const newCorrectionCounter = state.markerCounter + 1
    const superscriptText = `${initials}*${newCorrectionCounter}`
    const insertedText = `${newText}`
    const cellsFilled = 0
    // const cf = editor.selection.characterFormat
    // console.log("Character Format: col: " + cf.fontColor + " b " + cf.bold + " i " + cf.italic + " ul " + cf.underline + " st " + cf.strikethrough)
    const { corrected, removedText } = await insertCorrection(editor, selectionDescriptor.selection, superscriptText, newText)
    if (!corrected) {
      setWorking(false)
      return false
    }
    if (setEmptyCellCount) setEmptyCellCount(state.emptyCellCount)
    if (setEditedBy) setEditedBy(`${legalName} (${initials})`)
    if (setEditedAt) setEditedAt(dateString)
    const auditItem = new AuditLogItem({
      email: user?.email,
      userId: user?.userId,
      legalName,
      time: timestamp,
      newText: insertedText,
      initials,
      emptyCellCountChange: -1 * cellsFilled,
      removedText,
      cellIndices: selectionDescriptor ? JSON.stringify(selectionDescriptor.cellIndices) : "",
      reason,
      stage: Stage.Execute,
      actionType,
      verifications: state.verifications
    })
    if (!documentId) return false
    deselectCell(editor)
    console.log("Getting content")
    const content = await getDocumentContent(editor)
    const updateAuditLogResult = await updateAuditLog(documentStore, auditItem, content, i18n.language, false, editor, modalStore)
    console.log("Updated Audit Log")
    if (updateAuditLogResult.error != null && updateAuditLogResult.error.length > 0) {
      if (updateAuditLogResult.error === "Network Error - Document reloaded") {
        // Document has already been reloaded by updateAuditLog
        setWorking(false)
        return false
      }
      if (setUser) setUser(null)
      setWorking(false)
      return false
    }
    setReason("")
    setWorking(false)

    // Track correction made event
    trackAmplitudeEvent(AMPLITUDE_EVENTS.CORRECTION_MADE, {
      document_id: useDocumentStore.getState().documentId || 'unknown',
      document_name: useDocumentStore.getState().documentName || 'unknown',
      original_text: removedText,
      corrected_text: newText,
      correction_reason: reason,
      is_late_entry: lateEntry,
      late_entry_date: lateEntry ? lateActionDate : undefined,
      document_stage: stageToDocumentStage(documentStore.documentStage)
    });
    
    // Dispatch custom event for correction
    const contentEvent = new CustomEvent<ContentInsertedEvent>('contentInserted', {
      detail: {
        type: 'correction',
        content: `"${truncateText(removedText)}" → "${truncateText(newText)}"`
      }
    });
    document.dispatchEvent(contentEvent);

    return true
  }, [reason, newText, editor, appStore, modalStore, userStore, documentStore, setEmptyCellCount, setEditedBy, setEditedAt, t, i18n.language])

  React.useEffect(() => {
    console.log("User: " + JSON.stringify(user))
    if (!editor) return

    const checkCheckBox = async () => {
      // First, close the MasterPopup immediately, just like with text insertion
      runHideDialog()
      
      // Then perform the checkbox operation asynchronously
      await doCheckCheckBox()
    }
    
    // Set up the checkbox button
    setButtons([
      {
        icon: <CheckIcon className="h-5 w-5" />,
        tooltip: t('selectionHandler.checkboxButton.tooltip'),
        isIcon: true,
        action: checkCheckBox,
        disabled: disableButtons
      }
    ])
  }, [user, editor, doCheckCheckBox, disableButtons, t, doCheckCheckBox, lateEntry, reason])

  React.useEffect(() => {
    if (newContentRef.current) {
      setTimeout(() => {
        if (!newContentRef.current) return
        newContentRef.current.focus()
      }, 50)
    }
  }, []);

  const runHideDialog = () => {
    if (editor == null) return
    deselectCell(editor)
    // editor.focusIn()
    // setTimeout(() => {
    hideInsertIntoCellDialog()
    // }, 10)
  }

  // console.log("Document is Locked: " + editor?.isReadOnly)
  // console.log("Number of buttons: " + buttons.length)
  // console.log("Document Stage: " + documentStage)
  // console.log("Is checkbox selected: " + isCheckboxSelected)
  // console.log("Selected Text: " + selectedText)
  
  // Function to truncate text if it's too long
  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  const stageString = getStageString(documentStage);
  
  return (
    <TooltipPrimitive.Provider>
      <div className="space-y-4" data-testid={`editor.${stageString}.selectionHandler.container`}>
        {/* Only show checkbox button if a checkbox is selected */}
        {isCheckboxSelected && (
          <>
          {/* Instructional text for checkbox selection */}
          <div className="mb-3" data-testid={`editor.${stageString}.selectionHandler.checkboxInstructions`}>
            <p className="text-sm text-gray-600">
              {t('selectionHandler.checkboxInstructions')}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2" data-testid={`editor.${stageString}.selectionHandler.checkboxSection`}>
            {buttons.map((button, index) => (
              <TooltipPrimitive.Root key={index}>
                <TooltipPrimitive.Trigger asChild>
                  <button 
                    className={cn(
                      "h-9 min-w-[40px] px-3 rounded-md font-medium transition-colors font-inter cursor-pointer",
                      "bg-[#6366f1] text-white hover:bg-[#6366f1]/90",
                      button.disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={button.action}
                    disabled={button.disabled}
                    data-testid={`editor.${stageString}.selectionHandler.checkboxButton`}
                  >
                    {button.icon || button.label}
                  </button>
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                  <TooltipPrimitive.Content className="tooltip-content bg-background" sideOffset={5}>
                    {button.tooltip}
                    <TooltipPrimitive.Arrow className="tooltip-arrow" />
                  </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
              </TooltipPrimitive.Root>
            ))}
          </div>
            <LateEntry 
              lateEntry={lateEntry}
              toggleLateEntry={toggleLateEntry}
              lateActionDate={lateActionDate}
              setLateActionDate={setLateActionDate}
              lateActionTime={lateActionTime}
              setLateActionTime={setLateActionTime}
              reason={lateReason}
              setReason={setLateReason}
              documentStage={documentStage}
            />
          </>
        )}
        
        {/* Only show correction fields if not a checkbox selection */}
        {!isCheckboxSelected && (
          <>
            {/* Display the correction fields with clear labels on the left */}
            <div className="space-y-3" data-testid={`editor.${stageString}.selectionHandler.correctionSection`}>
              {selectedText && !selectedText.includes('☐') ? (
                <>
                  <div className="flex items-center gap-2">
                    <label htmlFor="correct-text" className="text-sm font-medium text-gray-700 w-20">{t('selectionHandler.labels.correct')}:</label>
                    <input
                      id="correct-text"
                      type="text"
                      readOnly
                      value={truncateText(selectedText)}
                      title={selectedText}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-600 line-through font-inter cursor-default focus:outline-none"
                      data-testid={`editor.${stageString}.selectionHandler.originalTextInput`}
                    />
                  </div>
                
                  <div className="flex items-center gap-2">
                    <label htmlFor="new-content" className="text-sm font-medium text-gray-700 w-20">{t('selectionHandler.labels.with')}:</label>
                    <div className="relative flex-1 overflow-hidden rounded-md">
                      <input
                        id="new-content"
                        type="text"
                        placeholder={t('selectionHandler.placeholders.newContent')}
                        ref={newContentRef}
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        onFocus={() => setIsWithFieldFocused(true)}
                        onBlur={() => setIsWithFieldFocused(false)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none bg-background text-gray-700 font-inter"
                        data-testid={`editor.${stageString}.selectionHandler.newTextInput`}
                      />
                      {isWithFieldFocused && (
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
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label htmlFor="correction-reason" className="text-sm font-medium text-gray-700 w-20">{t('selectionHandler.labels.reason')}:</label>
                    <div className="relative flex-1 overflow-hidden rounded-md">
                      <input
                        id="correction-reason"
                        type="text"
                        placeholder={t('selectionHandler.placeholders.reasonForCorrection')}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        onFocus={() => setIsReasonFieldFocused(true)}
                        onBlur={() => setIsReasonFieldFocused(false)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none bg-background text-gray-700 font-inter"
                        data-testid={`editor.${stageString}.selectionHandler.reasonInput`}
                      />
                      {isReasonFieldFocused && (
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
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button
                      className={cn(
                        "py-1.5 rounded-md",
                        documentStage === Stage.PreApprove
                          ? "bg-[#F5A623] text-white hover:bg-[#F5A623]/90"
                          : documentStage === Stage.Execute
                            ? "bg-[#6366F1] text-white hover:bg-[#6366F1]/90"
                            : documentStage === Stage.PostApprove
                              ? "bg-[#9C27B0] text-white hover:bg-[#9C27B0]/90"
                              : "bg-primary text-white hover:bg-primary/90"
                      )}
                      disabled={working || reason.trim().length < MINIMUM_REASON_LENGTH}
                      onClick={() => {
                        // First close the MasterPopup immediately
                        runHideDialog();
                        // Then perform the correction operation
                        makeCorrection();
                      }}
                      data-testid={`editor.${stageString}.selectionHandler.correctButton`}
                    >
                      {t('selectionHandler.buttons.correct')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40" data-testid={`editor.${stageString}.selectionHandler.helpText`}>
                  <p className="text-sm font-medium text-gray-700">
                    {t('selectionHandler.helpText')}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </TooltipPrimitive.Provider>
  );
};

export default SelectionHandler;
