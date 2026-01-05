import React, { useState } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDownIcon, CheckIcon } from '@radix-ui/react-icons';
import { getFullUser, Stage } from '@/components/editor/lib/lifecycle';
import { getStageString } from '@/components/editor/lib/utils';
import { useAppStore, useDocumentStore, useModalStore, useUserStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';
import { RAWSERVERURL, SERVERURL } from '@/lib/server';
import i18n from '@/i18n';
import { LoginMessage, releaseLock } from '@/lib/apiUtils';
import { useTranslation } from 'react-i18next';
import { tableCellSelectionAndDocumentState, TableCellSelectionStatus } from '@/components/editor/lib/editUtils';
import { appendSignatureIntoDocument, updateAuditLog, getTableCellFromSelection, validateCursorPositionForInsertion } from '@/components/editor/lib/addinUtils';
import { toast } from 'sonner';
import { formatDatetimeString } from '@/lib/dateUtils';
import { ActionType, AuditLogItem } from '@/components/editor/lib/AuditLogItem';
import { getDocumentContent } from '@/components/editor/lib/editorUtils';
import { useCellSelection } from '@/hooks/CellSelection';
import { ContentInsertedEvent } from './MasterPopup';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { markParticipantAsSigned } from '@/lib/workflowUtils';
import LateEntry from './LateEntry';
// import { InsertAtCursorAlertModal } from '../InsertAtCursorAlertModal';
import { AttachmentCorrectionError, MultipleParaGraphsError } from '../lib/errors';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import { useTimeComparison } from '@/hooks/useTimeComparison';
import { BorderTrail } from '@/components/motion-primitives/border-trail';
import { getStageColor } from '@/components/editor/lib/stageColors';

const Sign: React.FC = () => {
  const [selectedItemKey, setSelectedItemKey] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [pointerStartedInside, setPointerStartedInside] = useState(false);
  const [lateEntry, setLateEntry] = React.useState(false);
  const [isCustomReasonFocused, setIsCustomReasonFocused] = useState(false);
  const customReasonInputRef = React.useRef<HTMLInputElement>(null);

  const [lateActionDate, setLateActionDate] = React.useState<string>("");
  const [lateActionTime, setLateActionTime] = React.useState<string>("");
  const [lateReason, setLateReason] = React.useState<string>("");
  const lateEntryRef = React.useRef({ lateEntry, lateActionDate, lateActionTime, reason: lateReason });

  React.useEffect(() => {
    lateEntryRef.current = { lateEntry, lateActionDate, lateActionTime, reason: lateReason };
  }, [lateEntry, lateActionDate, lateActionTime, lateReason]);

  const userStore = useUserStore(useShallow((state) => ({
    user: state.user,
    setUser: state.setUser,
    userType: state.userType,
    legalName: state.legalName,
    initials: state.initials,
    tenantName: state.tenantName,
    participant: state.participant,
  })))

  const { user, setUser, legalName, initials, tenantName, participant } = userStore
  const documentStore = useDocumentStore(useShallow((state) => ({
    documentId: state.documentId,
    documentStage: state.documentStage,
    setDocumentStage: state.setDocumentStage,
    setMarkerCounter: state.setMarkerCounter,
    setEmptyCellCount: state.setEmptyCellCount,
    setEditedBy: state.setEditedBy,
    setEditedAt: state.setEditedAt,
    participantGroups: state.participantGroups,
    setParticipantGroups: state.setParticipantGroups,
    setDocumentHasContent: state.setDocumentHasContent,
    editTime: state.editTime,
    triggerReload: state.triggerReload,
    setReloadSelection: state.setReloadSelection,
    setEditTime: state.setEditTime,
    timezone: state.timezone,
  })))
  const modalStore = useModalStore(useShallow((state) => ({
    setCellEmpty: state.setCellEmpty,
    tableNotSelected: state.tableNotSelected,
    toggleTableNotSelected: state.toggleTableNotSelected,
    toggleCellNotEmpty: state.toggleCellNotEmpty,
    setDocumentInUse: state.setDocumentInUse,
    cellNotEmpty: state.cellNotEmpty,
    toggleNotMemberOfDocufenUsers: state.toggleNotMemberOfDocufenUsers,
    setDocumentNotUpToDate: state.setDocumentNotUpToDate,
    setDocumentStatus: state.setDocumentStatus,
    setOperationFailedError: state.setOperationFailedError
  })))
  const appStore = useAppStore(useShallow((state) => ({
    editorInstance: state.editor,
    hideInsertIntoCellDialog: state.hideInsertIntoCellDialog,
    setWorking: state.setWorking,
    setWorkingTitle: state.setWorkingTitle,
    setWorkingMessage: state.setWorkingMessage,
    insertAtCursor: state.insertAtCursor,
  })))
  const { editorInstance, hideInsertIntoCellDialog, setWorking, setWorkingTitle, setWorkingMessage, insertAtCursor } = appStore
  const { documentId, documentStage, setEmptyCellCount, setEditedBy, setEditedAt, setParticipantGroups, participantGroups } = documentStore
  const { t } = useTranslation()
  const stageColor = getStageColor(documentStage);
  const { deselectCell } = useCellSelection()
  const [reasons, setReasons] = useState<string[]>([]);
  // const [setIsNotInTableWarningDialog] = React.useState(false)
  const currentlySigning = React.useRef(false);
  const { lateTimeInPast } = useTimeComparison(lateActionDate, lateActionTime);
  
  const handlekeydown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      runHideDialog?.()
    }
  }

  const runHideDialog = () => {
    if (editorInstance == null) return
    deselectCell(editorInstance)
    // editorInstance.focusIn()
    // setTimeout(() => {
    hideInsertIntoCellDialog()
    // }, 10)
  }

  // const cleanUp = async () => {
  //   console.warn("Cleaning up after cancelling signing operation")
  //   releaseLock(documentId).then(() => {
  //     setWorking(false)
  //     // setIsNotInTableWarningDialog(false)
  //   })
  // }

  const toggleLateEntry = () => {
    setLateEntry(!lateEntry);
  };

  const signCell = async () => {
    if (!editorInstance) {
      return false;
    }

    // Validate cursor position when AtCursor mode is enabled
    if (insertAtCursor) {
      const validationResult = validateCursorPositionForInsertion(editorInstance);
      if (!validationResult.isValid) {
        // Show toast error but DO NOT clear reason selection - preserve user's choice
        const documentName = useDocumentStore.getState().documentName;
        trackAmplitudeEvent(AMPLITUDE_EVENTS.CURSOR_POSITION_INVALID, {
          document_id: documentId,
          document_name: documentName || 'Unknown',
          document_stage: getStageString(documentStage) as any,
          error_type: validationResult.errorMessageKey?.includes('inUserContent') ? 'in_user_content'
            : validationResult.errorMessageKey?.includes('inSystemContent') ? 'in_system_content'
            : 'invalid_position',
          component: 'sign',
          action_attempted: 'signature'
        });
        toast.error(t(validationResult.errorMessageKey || 'mPopup.cursorValidation.invalidPosition'));
        return false;
      }
    }

    try {
      // Original selection might be lost during edit operations, so get it now
      const selectionDescriptor = await getTableCellFromSelection(editorInstance);
      if (!selectionDescriptor) {
        return false;
      }

      let actionType: ActionType = ActionType.Undefined
      let reasonText = "";
      let cellsFilled = 0;
      let insertedText = "";
      let newCorrectionCounter = 0;

      let reason = selectedItemKey === "customReason" ? customReason : selectedItemKey;
      
      // Track signature initiated
      const documentName = useDocumentStore.getState().documentName;
      trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_SIGNED, {
        document_id: documentId,
        document_name: documentName || 'Unknown',
        signature_role: reason,
        signature_type: selectedItemKey === "customReason" ? 'custom' : (selectedItemKey as any),
        custom_reason: selectedItemKey === "customReason" ? customReason : undefined,
        document_stage: getStageString(documentStage) as any
      });

      console.log("documentStage: " + documentStage + " role: " + reason)

      const dataSanityData: TableCellSelectionStatus | null = await tableCellSelectionAndDocumentState(editorInstance,
        appStore, modalStore, documentStore)
      if (!dataSanityData) {
        return false
      }
      if (!dataSanityData.state) {
        return false
      }
      const { state, dt, timestamp } = dataSanityData
      const dateString = formatDatetimeString(dt, t);


      if (documentStage === Stage.PreApprove) {
        switch (selectedItemKey) {
          case "preparedby":
          case "reviewedby":
          case "approvedby":
            actionType = insertAtCursor ? ActionType.CursorPreApproveSign : ActionType.PreApproveSign
            break
          case "customReason":
            actionType = insertAtCursor ? ActionType.CursorCustomPreApproveSign : ActionType.CustomPreApproveSign
            break
          default:
            console.warn("Unknown role for pre-approval: " + selectedItemKey)
            break
        }
      } else if (documentStage === Stage.PostApprove) {
        switch (selectedItemKey) {
          case "preparedby":
          case "reviewedby":
          case "approvedby":
            actionType = insertAtCursor ? ActionType.CursorPostApproveSign : ActionType.PostApproveSign
            break
          case "customReason":
            actionType = insertAtCursor ? ActionType.CursorCustomPostApproveSign : ActionType.CustomPostApproveSign
            break
          default:
            console.warn("Unknown role for post-approval: " + selectedItemKey)
            break
        }
      } else if (documentStage === Stage.Execute) {
        switch (selectedItemKey) {
          case "performedby":
            actionType = insertAtCursor ? ActionType.CursorPerformedBySign : ActionType.PerformedBySign
            break
          case "reviewedby":
            actionType = insertAtCursor ? ActionType.CursorReviewedBySign : ActionType.ReviewedBySign
            break
          case "approvedby":
            actionType = insertAtCursor ? ActionType.CursorApprovedBySign : ActionType.ApprovedBySign
            break
          case "verifiedby":
            actionType = insertAtCursor ? ActionType.CursorVerifiedBySign : ActionType.VerifiedBySign
            break
          case "customReason":
            actionType = insertAtCursor ? ActionType.CursorCustomSign : ActionType.CustomSign
            break
          default:
            actionType = insertAtCursor ? ActionType.CursorPerformedBySign : ActionType.PerformedBySign
            console.warn("Unknown role for execution: " + selectedItemKey)
            break
        }
      }
      reasonText = selectedItemKey === "customReason" ? reason : t(`reason.${reason}`);
      ({ cellsFilled, insertedText, markerCounter: newCorrectionCounter } = await appendSignatureIntoDocument(
        editorInstance,
        selectionDescriptor,
        legalName,
        initials,
        state.markerCounter,
        reasonText,
        dateString,
        lateEntryRef.current.lateEntry,
        insertAtCursor,
        t
      ))

      // Dispatch custom event for approval signature
      const contentEvent = new CustomEvent<ContentInsertedEvent>('contentInserted', {
        detail: {
          type: 'signature',
          content: `${legalName} (${reason})`
        }
      });
      document.dispatchEvent(contentEvent);

      // Get document content for audit
      console.log("Getting content");
      const content = await getDocumentContent(editorInstance);

      const newEmptyCellCount = state.emptyCellCount - cellsFilled;
      if (setEmptyCellCount) setEmptyCellCount(newEmptyCellCount)
      if (setEditedBy) setEditedBy(`${legalName} (${initials})`)
      if (setEditedAt) setEditedAt(dateString)
      const pageCount = editorInstance.pageCount
      // Create audit log entry
      const auditItem = new AuditLogItem({
        email: user?.email,
        userId: user?.userId,
        legalName,
        time: timestamp,
        initials,
        newText: insertedText,
        emptyCellCountChange: -1 * cellsFilled,
        stage: documentStage,
        actionType,
        markerCounter: newCorrectionCounter,
        removedText: "",
        reason: reason,
        pageCount,
        verifications: state.verifications
      })
      if (lateEntryRef.current.lateEntry) {
        auditItem.lateActionDate = lateEntryRef.current.lateActionDate;
        auditItem.lateActionTime = lateEntryRef.current.lateActionTime;
        auditItem.lateReason = lateEntryRef.current.reason;
      }
      const newGroups = markParticipantAsSigned(documentStage, participant, participantGroups)
      if (newGroups) {
        setParticipantGroups(newGroups)
      }


      // Update the audit log
      if (!documentId) {
        return false;
      }

      runHideDialog?.();
      const updateAuditLogResult = await updateAuditLog(documentStore, auditItem, content, i18n.language, false, editorInstance, modalStore);
      console.log("Updated Audit Log");

      if (updateAuditLogResult.error != null && updateAuditLogResult.error.length > 0) {
        if (updateAuditLogResult.error === "Network Error - Document reloaded") {
          // Document has already been reloaded by updateAuditLog
          return false;
        }
        if (setUser) setUser(null);
        return false;
      }
      if (documentStage === Stage.Execute) {
        const documentStore = useDocumentStore.getState();
        documentStore.setDocumentHasContent(true);
      }
      // Clear state and finish
      return true;
    } catch (error) {
      if (error instanceof MultipleParaGraphsError) {
        console.log("Multiple paragraphs error when signing: " + error.message);
      } else if (error instanceof AttachmentCorrectionError) {
        console.log("Attachment correction error when signing: " + error.message);
      } else if (error instanceof Error) {
        console.error("Error during signing operation:", error.message);
      } else {
        console.error("Unknown error during signing operation:", error);
      }
      return false;
    }
  }

  const processMessage = React.useCallback((event: MessageEvent) => {
    // Verify the origin of the message
    if (event.origin !== RAWSERVERURL) {
      console.log("Origin not allowed: " + event.origin)
      console.log("Allowed origin: " + RAWSERVERURL)
      return;
    }
    // console.log("Message: type: " + (typeof event.data))
    if (typeof event.data !== "string") return
    if (event.data.startsWith("ej2")) {
      // console.log("ej2 message: " + event.source)
      return
    }
    // console.log("Received message: ")
    // console.log("it is: " + event.data)
    // console.log("user: " + user?.email)
    // console.log("sign userRole:  " + userType)
    // console.log("initials: " + initials)
    // console.log("Set currently signing to false", performance.now())
    currentlySigning.current = false;
    const data = JSON.parse(event.data) as LoginMessage;
    const signedAsUser = getFullUser(data)
    if (user?.email != signedAsUser.email || user?.tenantName != signedAsUser.tenantName) {
      console.log("user")
      console.dir(user)
      console.log("signedAsUser")
      console.dir(signedAsUser)
      console.log("User signed in is different from current user")
      return
    }
    console.log("Do the signing")
    signCell().catch((err: unknown) => {
      if (err instanceof Error)
        console.error("Unable to sign cell: " + err.message)
    })
    .finally(() => {
      setWorking(false);
    })
  }, [user, initials, signCell])

  React.useEffect(() => {
    window.addEventListener('message', processMessage)
    return () => {
      window.removeEventListener('message', processMessage)
    }
  }, [processMessage])

  const handleChange = (value: string) => {
    setSelectedItemKey(value);
  };

  // Auto-focus custom reason input when selected
  React.useEffect(() => {
    if (selectedItemKey === 'customReason' && customReasonInputRef.current) {
      setTimeout(() => {
        customReasonInputRef.current?.focus();
      }, 50);
    }
  }, [selectedItemKey]);

  React.useEffect(() => {
    if (documentStage === Stage.PreApprove || documentStage === Stage.PostApprove) {
      setReasons([
        "preparedby", "reviewedby", "approvedby", "customReason"
      ])
    } else if (documentStage === Stage.Execute) {
      setReasons([
        "performedby", "reviewedby", "verifiedby", "approvedby", "customReason"
      ])
    }
  }, [documentStage])

  const releaseLockIfNecessary = async (docId: string) => {
    return new Promise<void>(async (resolve) => {
      if (!docId || docId.length < 5) {
        console.warn("Document ID is not valid, skipping lock release");
        resolve();
        return;
      }
      setTimeout(() => {
        console.log("Checing if need to releaseLog: " + performance.now())
        if (currentlySigning.current) {
          currentlySigning.current = false;
          console.log("Releasing lock for document: " + docId);
          releaseLock(docId).then(() => {
            console.log("Lock released successfully");
          }).catch((err) => {
            if (err instanceof Error) {
              console.error("Error releasing lock:", err.message);
            } else {
              console.error("Error releasing lock:", err);
            }
          }).finally(() => {
            resolve();
          })
        } else {
          console.log("Aborted auto release");
        }
    }, 100)
    });
  }

  const handleOpenLogin = () => {
    if (editorInstance == null) return;
    if (insertAtCursor) {
      const validationResult = validateCursorPositionForInsertion(editorInstance);
      if (!validationResult.isValid) {
        // Show toast error but DO NOT clear reason selection - preserve user's choice
        const documentName = useDocumentStore.getState().documentName;
        trackAmplitudeEvent(AMPLITUDE_EVENTS.CURSOR_POSITION_INVALID, {
          document_id: documentId,
          document_name: documentName || 'Unknown',
          document_stage: getStageString(documentStage) as any,
          error_type: validationResult.errorMessageKey?.includes('inUserContent') ? 'in_user_content'
            : validationResult.errorMessageKey?.includes('inSystemContent') ? 'in_system_content'
            : 'invalid_position',
          component: 'sign',
          action_attempted: 'signature'
        });
        toast.error(t(validationResult.errorMessageKey || 'mPopup.cursorValidation.invalidPosition'));
        return;
      }
    }

      // Show the DocumentWorkingOverlay during the signing process
      setWorkingTitle(t('signing-document'));
      setWorkingMessage(t('please-complete-the-signature-process'));
      setWorking(true);
      currentlySigning.current = true;

      let url: string = "";
      if (!SERVERURL.includes("localhost")) {
        const selfUrl = window.location.origin;
        if (documentId.length > 5)
          url = selfUrl + "/api/sign/" + tenantName + "?lng=" + i18n.language;
      } else {
        if (documentId.length > 5)
          url = `${SERVERURL}sign/${tenantName}?lng=${i18n.language}`;
      }

      // Open the signature window
      const signWindow = window.open(url, 'loginWindow', 'width=600,height=600,top=100,left=300');
      
      // Handle if the window is closed without signing
      if (signWindow) {
        const timer = setInterval(() => {
          if (signWindow.closed) {
            clearInterval(timer);
            releaseLockIfNecessary(documentId).then(() => {
              setWorking(false);
            })
          }
        }, 1000);
      }
  };

  // const handleOpenLoginWhenWarned = () => {
  //   if (editorInstance == null) return
  //   doWhenWarned(handleOpenLogin, editorInstance, appStore, modalStore, documentStore, setIsNotInTableWarningDialog)
  // };

  const isValidSignatureReason = (!lateEntry || (lateTimeInPast && lateReason.trim().length >= 4)) && selectedItemKey && (
    ['performedby', 'reviewedby', 'verifiedby', 'approvedby', "preparedby"].includes(selectedItemKey) ||
    (selectedItemKey === 'customReason' && customReason.trim().length >= 4)
  ) ;
  return (
    <div
      className={cn(
        "space-y-2",
        (documentStage === Stage.PreApprove || documentStage === Stage.PostApprove) && "space-y-2"
      )}
      onPointerDownCapture={(e) => {
        // Only stop propagation for non-interactive elements
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button, select, [role="combobox"], [role="listbox"], [role="option"], input, label, a, [data-radix-select-trigger], [data-radix-select-item], [data-radix-select-content], [data-radix-select-viewport], [data-slot="select-trigger"], [data-slot="select-item"]') !== null;
        if (!isInteractive) {
          e.stopPropagation();
        }
      }}
      onPointerUpCapture={(e) => {
        // Only stop propagation for non-interactive elements
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button, select, [role="combobox"], [role="listbox"], [role="option"], input, label, a, [data-radix-select-trigger], [data-radix-select-item], [data-radix-select-content], [data-radix-select-viewport], [data-slot="select-trigger"], [data-slot="select-item"]') !== null;
        if (!isInteractive) {
          e.stopPropagation();
        }
      }}
      onPointerDown={(e) => {
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
      onKeyDown={handlekeydown}
    >
      <div className={cn(
        "space-y-2",
        (documentStage === Stage.PreApprove || documentStage === Stage.PostApprove) && "mb-0 space-y-0"
      )}>
            <div className="flex items-center gap-2">
              <SelectPrimitive.Root key={selectedItemKey} value={selectedItemKey} onValueChange={handleChange}>
                <SelectPrimitive.Trigger
                  data-testid={`editor.${getStageString(documentStage)}.sign.roleDropdown`}
                  className={cn(
                    "flex items-center justify-between rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--stage-color)]/20 focus:border-[var(--stage-color)] data-[state=open]:ring-2 data-[state=open]:ring-[var(--stage-color)]/20 data-[state=open]:border-[var(--stage-color)] bg-background font-inter text-gray-800 cursor-pointer",
                    "w-[330px]"
                  )}
                  style={{ '--stage-color': stageColor } as React.CSSProperties}
                  tabIndex={0}
                >
                  <SelectPrimitive.Value placeholder={documentStage === Stage.Execute ? t('select-signing-reason') : t('select-signing-role')} >
                    {selectedItemKey && t(`reason.${selectedItemKey}`)}
                  </SelectPrimitive.Value>
                  <SelectPrimitive.Icon className="text-gray-500 ml-2">
                    <ChevronDownIcon />
                  </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>

                <SelectPrimitive.Portal>
                  <SelectPrimitive.Content
                    className="z-[9999] overflow-hidden rounded-md border border-gray-200 bg-background shadow-md font-inter"
                    position="popper"
                    sideOffset={4}
                  >
                    <SelectPrimitive.Viewport className="p-1">
                      <SelectPrimitive.Group>
                        {reasons.map((role) => (
                          <SelectOptionWithKey key={role} roleKey={role} t={t} documentStage={documentStage} />
                        ))}
                      </SelectPrimitive.Group>
                    </SelectPrimitive.Viewport>
                  </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
              </SelectPrimitive.Root>

              <Button
                data-testid={`editor.${getStageString(documentStage)}.sign.signButton`}
                onClick={handleOpenLogin}
                disabled={!isValidSignatureReason}
                className={cn(
                  "py-1.5 w-[90px] rounded-md",
                  isValidSignatureReason
                    ? documentStage === Stage.PreApprove
                      ? "bg-[#F5A623] text-white hover:bg-[#F5A623]/90"
                      : documentStage === Stage.Execute
                        ? "bg-[#6366F1] text-white hover:bg-[#6366F1]/90"
                        : documentStage === Stage.PostApprove
                          ? "bg-[#9C27B0] text-white hover:bg-[#9C27B0]/90"
                          : "bg-[#F5A623] text-white hover:bg-[#F5A623]/90"
                    : "bg-muted/70 text-gray-400 border border-gray-300",
                  !isValidSignatureReason && "cursor-not-allowed opacity-50"
                )}
              >
                {t('sign')}
              </Button>
            </div>
        {(selectedItemKey === "customReason") && (
          <div className="flex gap-2 items-center mt-2">
            <div
              className="relative flex-1 overflow-hidden rounded-md"
              style={{ '--stage-color': stageColor } as React.CSSProperties}
            >
              <input
                ref={customReasonInputRef}
                data-testid={`editor.${getStageString(documentStage)}.sign.customReasonInput`}
                type="text"
                placeholder={t('popupSign.enterCustomReason')}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                onFocus={() => setIsCustomReasonFocused(true)}
                onBlur={() => setIsCustomReasonFocused(false)}
                className="w-full bg-background border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none font-inter text-gray-800"
              />
              {isCustomReasonFocused && (
                <BorderTrail
                  className="bg-gradient-to-l from-[var(--stage-color)]/30 via-[var(--stage-color)] to-[var(--stage-color)]/30"
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
        )}
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
      </div>
    </div>
  );
};


// New helper component for select options with keys
const SelectOptionWithKey = ({ roleKey, t, documentStage }: { roleKey: string, t: any, documentStage: Stage }) => (
  <SelectPrimitive.Item
    data-testid={`editor.${getStageString(documentStage)}.sign.roleOption.${roleKey}`}
    value={roleKey}
    className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none focus:bg-muted/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-gray-800"
  >
    <SelectPrimitive.ItemText>{t(`reason.${roleKey}`)}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center justify-center text-gray-600">
      <CheckIcon />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
);

export default Sign;