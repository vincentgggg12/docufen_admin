import React, { JSX, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useAppStore, useDocumentStore, useModalStore, useUserStore } from '@/lib/stateManagement';
import { Clock, Calendar } from 'lucide-react';
import {
  BasicResult, CURRENTDATE, CURRENTTIME,
  insertTextIntoDocument, updateAuditLog, validateCursorPositionForInsertion
} from '@/components/editor/lib/addinUtils';
import { formatDate, formatDatetimeString, formatTime } from '@/lib/dateUtils';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import { stageToDocumentStage } from '@/components/editor/lib/utils';
import { tableCellSelectionAndDocumentState, TableCellSelectionStatus } from '../lib/editUtils';
import { useTranslation } from 'react-i18next';
import { AuditLogItem } from '../lib/AuditLogItem';
import { Stage } from '../lib/lifecycle';
import { getStageString } from '../lib/utils';
import { getDocumentContent } from '../lib/editorUtils';
import { useCellSelection } from '@/hooks/CellSelection';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AutosizeTextarea, AutosizeTextAreaRef } from '@/components/ui/autosize-textarea';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ContentInsertedEvent } from './MasterPopup';
import LateEntry from './LateEntry';
import { DateTime } from 'luxon';
import { useTimeComparison } from '@/hooks/useTimeComparison';
import { MINIMUM_REASON_LENGTH } from '../lib/constants';
import { toast } from 'sonner';
import { BorderTrail } from '@/components/motion-primitives/border-trail';

interface InsertProps {
}

interface InsertButtonProps {
  label?: string;
  icon?: JSX.Element;
  tooltip: string;
  isIcon?: boolean;
  isGreen?: boolean;
  action: () => void;
  disabled?: boolean;
  skipWorkingState?: boolean;
}

// Helper function to categorize quick buttons
const getButtonCategory = (shortCut: string): 'yes_no' | 'pass_fail' | 'na' | 'initials' | 'date_time' | 'custom' => {
  switch (shortCut.toLowerCase()) {
    case 'yes':
    case 'no':
      return 'yes_no';
    case 'pass':
    case 'fail':
      return 'pass_fail';
    case 'n/a':
    case 'na':
    case 'bulkna':
      return 'na';
    case 'initials':
      return 'initials';
    case 'currenttime':
    case 'currentdate':
      return 'date_time';
    default:
      return 'custom';
  }
};

const Insert: React.FC<InsertProps> = () => {
  const { t, i18n } = useTranslation();
  const userStore = useUserStore(useShallow((state) => ({
    user: state.user,
    setUser: state.setUser,
    initials: state.initials,
    legalName: state.legalName,
  })))
  const { user, setUser, initials, legalName } = userStore;
  const documentStore = useDocumentStore(useShallow((state) => ({
    documentId: state.documentId,
    setEmptyCellCount: state.setEmptyCellCount,
    setEditedBy: state.setEditedBy,
    setEditedAt: state.setEditedAt,
    documentStage: state.documentStage,
    setDocumentHasContent: state.setDocumentHasContent,
    timezone: state.timezone,
    editTime: state.editTime,
    triggerReload: state.triggerReload,
    setReloadSelection: state.setReloadSelection,
    setEditTime: state.setEditTime,
  })));
  const { documentId, setEmptyCellCount, setEditedBy, setEditedAt, documentStage, setDocumentHasContent, timezone } = documentStore;
  const tableCellSelectionStatus = React.useRef<TableCellSelectionStatus | null | undefined>(undefined)
  const modalStore = useModalStore(useShallow((state) => ({
    setCellEmpty: state.setCellEmpty,
    tableNotSelected: state.tableNotSelected,
    toggleTableNotSelected: state.toggleTableNotSelected,
    toggleCellNotEmpty: state.toggleCellNotEmpty,
    setDocumentInUse: state.setDocumentInUse,
    cellNotEmpty: state.cellNotEmpty,
    setDocumentNotUpToDate: state.setDocumentNotUpToDate,
    setDocumentStatus: state.setDocumentStatus,
    setOperationFailedError: state.setOperationFailedError
  })));
  const appStore = useAppStore(useShallow((state) => ({
    setWorkingTitle: state.setWorkingTitle,
    setShowList: state.setShowList,
    setWorking: state.setWorking,
    working: state.working,
    editor: state.editor,
    hideInsertIntoCellDialog: state.hideInsertIntoCellDialog,
    previousCellIndex: state.previousCellIndex,
  })));
  const { setWorkingTitle, setShowList, setWorking, editor, hideInsertIntoCellDialog, working, previousCellIndex } = appStore;
  const [textValue, setTextValue] = useState('');


  const [lateEntry, setLateEntry] = React.useState(false);
  const [lateActionDate, setLateActionDate] = React.useState<string>("");
  const [lateActionTime, setLateActionTime] = React.useState<string>("");
  const { lateTimeInPast } = useTimeComparison(lateActionDate, lateActionTime);
  const [disableButtons, setDisableButtons] = React.useState(false);
  const [reason, setReason] = React.useState<string>("");
  const [isTextareaFocused, setIsTextareaFocused] = React.useState(false);
  const { deselectCell } = useCellSelection();

  // console.log("Disable buttons: " + disableButtons);
  const lateEntryRef = React.useRef({ lateEntry, lateActionDate, lateActionTime, reason });
  React.useEffect(() => {
    lateEntryRef.current = { lateEntry, lateActionDate, lateActionTime, reason };
    const db = working || (lateEntry && (reason.trim().length < MINIMUM_REASON_LENGTH || !lateTimeInPast));
    setDisableButtons(db);
  }, [lateEntry, lateActionDate, lateActionTime, reason, working, setWorking, lateTimeInPast]);

  // ===== BACKGROUND SYNC QUEUE (RESERVED FOR FUTURE HYBRID APPROACH) =====
  // TODO: When implementing hybrid async/sync approach, add background queue here
  // See: docs/hybrid-audit-log-approach.md for complete implementation
  // Reference: src/lib/auditLogQueue.ts contains existing queue implementation

  const [buttons, setButtons] = useState<InsertButtonProps[]>([]);
  const textAreaRef = React.useRef<AutosizeTextAreaRef | null>(null);

  React.useEffect(() => {
    // console.log("User: " + JSON.stringify(user));
    if (!editor) return;

    const insertNo = () => {
      setWorkingTitle(""); // Set empty workingTitle
      runHideDialog();
      callEnterTextData(t("buttonTitle.no"), "No");
    };
    const insertYes = () => {
      setWorkingTitle(""); // Set empty workingTitle
      runHideDialog();
      callEnterTextData(t("buttonTitle.yes"), "Yes");
    };
    const insertNA = () => {
      setWorkingTitle(""); // Set empty workingTitle
      runHideDialog();
      callEnterTextData(t("buttonTitle.na"), "NA");
    };
    const insertPass = () => {
      setWorkingTitle(""); // Set empty workingTitle
      runHideDialog();
      callEnterTextData(t("buttonTitle.pass"), "Pass");
    };
    const insertFail = () => {
      setWorkingTitle(""); // Set empty workingTitle
      runHideDialog();
      callEnterTextData(t("fail"), "Fail");
    };

    const insertCurrentTime = () => {
      setWorkingTitle(""); // Set empty workingTitle
      runHideDialog();
      callEnterTextData(CURRENTTIME, "CurrentTime");
    };

    const insertCurrentDate = () => {
      setWorkingTitle(""); // Set empty workingTitle
      runHideDialog();
      callEnterTextData(CURRENTDATE, "CurrentDate");
    };

    const insertInitials = () => {
      if (user == null) {
        return;
      }
      setWorkingTitle(""); // Set empty workingTitle
      runHideDialog();
      callEnterTextData(initials, "Initials", true);
    };

    const insertBulkNA = () => {
      // Track bulk NA mode toggle
      trackAmplitudeEvent(AMPLITUDE_EVENTS.BULK_NA_MODE_TOGGLED, {
        document_id: documentId || 'unknown',
        document_name: useDocumentStore.getState().documentName || 'unknown',
        enabled: true,
        document_stage: stageToDocumentStage(documentStage)
      });

      deselectCell(editor)
      // Trigger bulk selection mode in MasterPopup
      const event = new CustomEvent('bulkNAModeRequested');
      window.dispatchEvent(event);
    };

    const buttons: InsertButtonProps[] = [
      { label: t('buttonTitle.yes'), tooltip: t('tt.clickToAddYes'), action: insertYes, disabled: disableButtons },
      { label: t('buttonTitle.no'), tooltip: t('tt.clickToAddNo'), action: insertNo, disabled: disableButtons },
      { label: t('buttonTitle.na'), tooltip: t('tt.clickToAddNa'), action: insertNA, disabled: disableButtons }
    ];

    // Add Bulk N/A button only in execution stage
    if (documentStage === Stage.Execute) {
      buttons.push({ 
        label: t('buttonTitle.bulkNA', 'Bulk N/A'), 
        tooltip: t('tt.clickToAddBulkNa', 'Add N/A to multiple cells'), 
        action: insertBulkNA, 
        disabled: disableButtons,
        skipWorkingState: true // Flag to skip setting working state
      });
    }

    buttons.push(
      { label: initials, tooltip: t('tt.clickToAddInitials', { initials }), action: insertInitials, disabled: disableButtons },
      { label: t('buttonTitle.pass'), tooltip: t('tt.clickToAddPass'), action: insertPass, disabled: disableButtons },
      { label: t('fail'), tooltip: t('tt.clickToAddFail'), action: insertFail, disabled: disableButtons },
      {
        icon: <Clock className="h-4 w-4" />,
        tooltip: t('mPopup.insert.tooltip.insertCurrentTime'),
        isIcon: true,
        action: insertCurrentTime, disabled: disableButtons
      },
      {
        icon: <Calendar className="h-4 w-4" />,
        tooltip: t('mPopup.insert.tooltip.insertCurrentDate'),
        isIcon: true,
        action: insertCurrentDate, disabled: disableButtons
      }
    );
    
    setButtons(buttons);
  }, [user, editor, t, lateEntry, disableButtons, initials, documentStore.editTime, documentStore, modalStore.setDocumentNotUpToDate]);

  // // Focus the text input when component mounts
  // React.useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     if (textAreaRef.current) {
  //       textAreaRef.current.focus();
  //     }
  //   }, 150);

  //   return () => clearTimeout(timeout);
  // }, []);

  // Refocus the text input after cell selection changes
  // (when user clicks a cell while typing, we want to restore focus to the input)
  // SKIP auto-focus when AtCursor mode is enabled - user needs to see cursor position in document
  React.useEffect(() => {
    const insertAtCursor = useAppStore.getState().insertAtCursor;

    // When AtCursor mode is enabled, don't auto-focus textarea
    // User needs to see where cursor is in document before entering text
    if (insertAtCursor) {
      return;
    }

    if (textAreaRef.current) {
      // Small delay to ensure cell selection operations complete
      const timeout = setTimeout(() => {
        if (textAreaRef.current) {
          console.log("Focusing text area")
          textAreaRef.current.focus();
        }
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [previousCellIndex]);

  // const cleanUp = async () => {
  //   console.warn("Clearning up in MasterPopup after closing dialog")
  //   releaseLock(documentId).then(() => {
  //     setWorking(false)
  //     setIsNotInTableWarningDialog(false)
  //   })
  // }

  const runHideDialog = () => {
    if (editor == null) return;
    deselectCell(editor);
    // editor.focusIn();
    hideInsertIntoCellDialog();
  };

  const enterTextData = React.useCallback(async (inTextData: string, shortcut: string, excludeInitials: boolean) => {
    setWorkingTitle("");
    useAppStore.getState().setWorking(true)

    if (!editor) {
      setWorking(false);
      console.error(t('mPopup.insert.error.editorNotAvailable'));
      return false;
    }

    // Validate cursor position when AtCursor mode is enabled
    const insertAtCursor = useAppStore.getState().insertAtCursor;
    if (insertAtCursor) {
      const validationResult = validateCursorPositionForInsertion(editor);
      if (!validationResult.isValid) {
        // Show toast error but DO NOT clear textValue - preserve user's input
        trackAmplitudeEvent(AMPLITUDE_EVENTS.CURSOR_POSITION_INVALID, {
          document_id: documentId || 'unknown',
          document_name: useDocumentStore.getState().documentName || 'Unknown',
          document_stage: stageToDocumentStage(documentStage),
          error_type: validationResult.errorMessageKey?.includes('inUserContent') ? 'in_user_content'
            : validationResult.errorMessageKey?.includes('inSystemContent') ? 'in_system_content'
            : 'invalid_position',
          component: 'insert',
          action_attempted: 'text'
        });
        toast.error(t(validationResult.errorMessageKey || 'mPopup.cursorValidation.invalidPosition'));
        setWorking(false);
        return false;
      }
    }

    modalStore.setCellEmpty();
    editor.enableTrackChanges = false;

    const dataSanityData = tableCellSelectionStatus.current;
    if (!dataSanityData || dataSanityData.state === null) {
      setWorking(false);
      return false;
    }

    setTextValue("");
    const { selectionDescriptor, dt, timestamp, state } = dataSanityData;
    const dateString = formatDatetimeString(dt, t);
    console.log("Entering: " + inTextData);
    let textData: string = inTextData;
    textData = textData.replace(/\n?\t?$/, "");
    if (inTextData === CURRENTTIME)
      textData = formatTime(dt);
    else if (inTextData === CURRENTDATE)
      textData = formatDate(dt, t);
    const markerCounter = state.markerCounter;

    // Insert the text into the document
    const { insertedText, removedText, markerCounter: newMarkerCounter, actionType } =
      await insertTextIntoDocument(editor, selectionDescriptor, textData,
        initials, dateString, markerCounter, lateEntryRef.current.lateEntry, excludeInitials, insertAtCursor);

    // Track text insertion event
    trackAmplitudeEvent(AMPLITUDE_EVENTS.TEXT_INSERTED, {
      document_id: documentId || 'unknown',
      document_name: useDocumentStore.getState().documentName || 'unknown',
      text_content: insertedText,
      text_length: insertedText.length,
      insertion_method: 'typed',
      document_stage: stageToDocumentStage(documentStage),
      cell_location: selectionDescriptor.cellIndices ? JSON.stringify(selectionDescriptor.cellIndices) : undefined
    });

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

    const setEditedBy = useDocumentStore.getState().setEditedBy;
    const setEditedAt = useDocumentStore.getState().setEditedAt;

    if (setEditedBy) setEditedBy(`${legalName} (${initials})`);
    if (setEditedAt) setEditedAt(timeStr);

    // Create audit log entry
    const auditItem = new AuditLogItem({
      email: user?.email,
      userId: user?.userId,
      legalName,
      time: timestamp,
      newText: insertedText,
      emptyCellCountChange: 0,
      removedText,
      cellIndices: JSON.stringify(selectionDescriptor.cellIndices),
      lateReason: lateEntryRef.current.reason,
      markerCounter: newMarkerCounter,
      stage: documentStage,
      actionType,
      verifications: state.verifications
    });
    if (lateEntryRef.current.lateEntry) {
      auditItem.lateActionDate = lateEntryRef.current.lateActionDate;
      auditItem.lateActionTime = lateEntryRef.current.lateActionTime;
    }

    if (!documentId) return false;

    deselectCell(editor);

    if (timezone != null) {
      const dateTime = DateTime.now().setZone(timezone).toISODate()
      if (dateTime != null) {
        setLateActionDate(dateTime);
      }
    }
    // Cleanup late entry data
    setLateActionTime("")
    setReason("");

    // Track quick text insertion after successful insertion
    if (shortcut && shortcut !== '') {
      const category = getButtonCategory(shortcut);
      trackAmplitudeEvent(AMPLITUDE_EVENTS.QUICK_TEXT_INSERTED, {
        document_id: documentId || 'unknown',
        document_name: useDocumentStore.getState().documentName || 'unknown',
        button_text: insertedText,
        button_category: category,
        document_stage: stageToDocumentStage(documentStage),
        bulk_mode: false
      });
    }

    console.log("shortcut for amplitude: " + shortcut);

    // ===== SYNCHRONOUS AUDIT LOG UPDATE (SAFE) =====
    // NOTE: UI stays blocked until audit log succeeds to prevent race conditions
    //
    // TODO: FUTURE OPTIMIZATION - Hybrid Async/Sync Approach
    // After thorough testing, implement hybrid approach:
    // 1. Get content and unblock UI immediately (setWorking(false))
    // 2. Queue audit log in background
    // 3. On error: Re-block UI and show specific error modal
    //    - 401: Re-auth modal (don't log out)
    //    - 412: Document locked modal
    //    - 111: Document in use modal
    //    - 2: Retry 2x before reload
    //    - Other: Generic error (don't log out)
    // See docs/hybrid-audit-log-approach.md for full implementation
    const content = await getDocumentContent(editor);
    const updateAuditLogResult: BasicResult = await updateAuditLog(documentStore, auditItem, content, i18n.language, false, editor, modalStore);

    if (updateAuditLogResult.error != null && updateAuditLogResult.error.length > 0) {
      if (updateAuditLogResult.error === "Network Error - Document reloaded") {
        console.error('Network error - document was reloaded');
        toast.info(t('notifications.documentReloaded', 'Document was reloaded with latest changes'));
        setWorking(false);
        return false;
      }
      console.error('Audit log update failed:', updateAuditLogResult.error);
      toast.error(t('notifications.syncFailed', 'Failed to sync changes to server.'));
      if (setUser) setUser(null);
      setWorking(false);
      return false;
    }

    console.log('✅ Audit log synced successfully');
    setWorking(false); // Only unblock UI after successful sync

    return true;
  }, [editor, setWorking, timezone, user, initials, t, i18n.language, documentId,
    setEmptyCellCount, setEditedBy, setEditedAt, setDocumentHasContent, documentStage, legalName, modalStore,
    deselectCell]);


  const callEnterTextData = (text: string, shortCut: string, tmpExcludeInitials?: boolean) => {
    console.log("Calling EnterTextData");
    const excludeInitials = tmpExcludeInitials ?? false;

    // Set working state but don't show inserting message
    // We want the overlay but not the modal message
    setWorkingTitle(""); // Empty title to avoid showing the inserting message
    setShowList(true);
    setWorking(true); // Enable the working state to show the overlay

    // doWhenWarned(() => {
    console.log("the do when warned callback is running");
    enterTextData(text, shortCut, excludeInitials).then((clearText: boolean) => {
      if (clearText) {
        setShowList(false);
      }
    }).catch((err: unknown) => {
      if (err instanceof Error) {
        console.error(t('mPopup.insert.error.unableToInsert', { text }), err.message);
      }
    }).finally(() => setWorking(false))
    // });
  };

  const toggleLateEntry = () => {
    setLateEntry(!lateEntry);
  };

  const insertText = () => {
    const text = textValue;
    setWorkingTitle(""); // Set empty workingTitle
    runHideDialog();
    callEnterTextData(text, "");
  };

  const handleButtonClick = (action: () => void) => {
    if (editor == null) return
    setWorking(true);
    tableCellSelectionAndDocumentState(
      editor,
      { setWorkingTitle: appStore.setWorkingTitle, setWorking: appStore.setWorking },
      modalStore, 
      documentStore
    ).then((dataSanityData: TableCellSelectionStatus | null) => {
      if (!dataSanityData || !dataSanityData.state) {
        appStore.setWorking(false);
        return false;
      }
      tableCellSelectionStatus.current = dataSanityData;
      action();
    }).catch((err: unknown) => {
      if (err instanceof Error) {
        console.error(t('mPopup.insert.error.unableToInsert', { text: err.message }), err.message);
      }
      appStore.setWorking(false);
    });
  };

  if (editor == null) return null
  return (
    <>
    <TooltipPrimitive.Provider>
      <div className="space-y-4">
        {/* Buttons row with improved styling */}
        <div className="flex flex-wrap gap-2">
          {buttons.map((button, index) => (
            <TooltipPrimitive.Root key={index}>
              <TooltipPrimitive.Trigger asChild>
                <button
                  data-testid={`editor.${getStageString(documentStage)}.text.quickButton.${button.label || (button.icon ? 'icon' : 'button')}.${index}`}
                  className={cn(
                    "h-9 rounded-md font-medium transition-colors font-inter cursor-pointer",
                    button.isIcon ? "min-w-[40px] px-3" : "min-w-[56px] px-4",
                    button.isGreen
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-background text-gray-700 border border-gray-200 hover:bg-background/90",
                    button.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (button.skipWorkingState) button.action()
                    else {
                      setWorking(true)
                      handleButtonClick(button.action)
                    }
                  }}
                  disabled={disableButtons || button.disabled}
                >
                  {button.icon || button.label}
                </button>
              </TooltipPrimitive.Trigger>
              <TooltipPrimitive.Content
                className="bg-background px-3 py-1.5 rounded-md shadow-md text-sm z-50 border border-gray-200"
                sideOffset={5}
              >
                {button.tooltip}
                <TooltipPrimitive.Arrow className="fill-background" />
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Root>
          ))}
        </div>

        {/* Text input with improved styling - auto-sizing textarea for multi-paragraph input */}
          <div className="flex gap-2 items-start">
            <div className="relative w-[calc(100%-100px)] overflow-hidden rounded-md">
              <AutosizeTextarea
                data-testid={`editor.${getStageString(documentStage)}.text.inputField`}
                spellCheck={true}
                placeholder={t("typeTextHere")}
                ref={textAreaRef}
                value={textValue}
                onChange={(e: any) => setTextValue(e.target.value)}
                onFocus={() => setIsTextareaFocused(true)}
                onBlur={() => setIsTextareaFocused(false)}
                onKeyDown={(e: any) => {
                  if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    // Same conditions as the Insert button's disabled state
                    if (textValue.trim() && !disableButtons) {
                      handleButtonClick(insertText);  // Here is the control-Enter insert implementation
                    }
                  }
                }}
                minHeight={62}
                maxHeight={200}
                className="w-full bg-background border border-gray-200 rounded-md px-3 py-2 focus:outline-none text-gray-700 font-inter"
              />
              {isTextareaFocused && (
                <BorderTrail
                  className="bg-gradient-to-l from-[#6366F1]/30 via-[#6366F1] to-[#6366F1]/30"
                  size={120}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: 'linear',
                  }}
                />
              )}
            </div>
            <Button
              data-testid={`editor.${getStageString(documentStage)}.text.insertButton`}
              className={cn(
                "h-9 w-[90px] rounded-md",
                documentStage === Stage.PreApprove
                  ? "bg-[#F5A623] text-white hover:bg-[#F5A623]/90"
                  : documentStage === Stage.Execute
                    ? "bg-[#6366F1] text-white hover:bg-[#6366F1]/90"
                    : documentStage === Stage.PostApprove
                      ? "bg-[#9C27B0] text-white hover:bg-[#9C27B0]/90"
                      : "bg-primary text-white hover:bg-primary/90"
              )}
              disabled={!textValue.trim() || disableButtons}
              onClick={() => handleButtonClick(insertText)}
            >
              {t('mPopup.insert.button.insert')}
            </Button>
          </div>

        <LateEntry
          lateEntry={lateEntry}
          toggleLateEntry={toggleLateEntry}
          lateActionDate={lateActionDate}
          setLateActionDate={setLateActionDate}
          lateActionTime={lateActionTime}
          setLateActionTime={setLateActionTime}
          reason={reason}
          setReason={setReason}
          documentStage={documentStage}
        />
      </div>

    </TooltipPrimitive.Provider>
</>
  );
};

export default Insert;
