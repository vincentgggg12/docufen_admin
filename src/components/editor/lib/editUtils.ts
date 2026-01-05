import { DateTime } from "luxon"
import { CORRECTIONFORMAT, DocumentState, formatSelection, getStateFromAuditlogItem, getTableCellFromSelection, SUPERSCRIPTFORMAT, DocumentSelectionDescriptor, makeTextSelection, ENTRYFORMAT, INITIALSANDDATEFORMAT, CLOCKFORMAT, moveSelectionIndexToStartNextParagraph } from "./addinUtils"
import { DocumentEditor, Selection, SelectionCharacterFormat, SelectionParagraphFormat } from "@syncfusion/ej2-react-documenteditor"
import { AppStore, DocumentStore, ModalStore, useAppStore, useDocumentStore, useUserStore } from "@/lib/stateManagement"
import { AuditLogItemResponse, getLastAuditLogItem, releaseLock } from "../../../lib/apiUtils"
import { IAuditLogItem } from "./AuditLogItem"
import { BULK_NA_ING, DOCUMENT_LOCKED, LATE_CLOCK, STAGE_OUT_OF_SYNC, UNAUTHORISED_STALE } from "./constants"
import { useModalStore } from "@/lib/stateManagement"
import { AttachmentCorrectionError, BusyException, MultipleParaGraphsError } from "./errors"

export type TableCellSelectionStatus = {
  selectionDescriptor: DocumentSelectionDescriptor
  dt: DateTime
  timestamp: number
  state: DocumentState
}
export const handleGetLastAuditLogItemError = async (error: unknown, modalStore: Partial<ModalStore> & { 
  setDocumentInUse?: (status: boolean) => void,
  setDocumentStatus?: (status: "locked" | "updated" | null) => void,
  setOperationFailedError?: (error: string | null) => void
}) => {
  console.log("Error getting lastAuditLogItem: " + error)
  if (error === DOCUMENT_LOCKED) {
    if (modalStore.setDocumentStatus) {
      modalStore.setDocumentStatus("locked")
    } else if (modalStore.setDocumentInUse) {
      modalStore.setDocumentInUse(true)
    }
  } else if (error === UNAUTHORISED_STALE) {
    const { setUser, logout } = useUserStore.getState()
    setUser(null);
    logout();
  } else if (error === STAGE_OUT_OF_SYNC) {
    console.error("Stage has been reset. How?");
  } else if (error && typeof error === 'string' && 
    (error.toLowerCase().includes('fetch') || 
     error.toLowerCase().includes('network') || 
     error.toLowerCase().includes('timeout') ||
     error === 'Unknown Error')) {
    // Network error detected
    console.error("Network error during lock acquisition: " + error);
    if (modalStore.setOperationFailedError) {
      modalStore.setOperationFailedError(error);
    }
    // Ensure working state is set to false
    const { setWorking } = useAppStore.getState();
    setWorking(false);
  } // Ignore BUSY error
}

const updateAuditlogData = (state: DocumentState, documentStore: Partial<DocumentStore>) => {
  if (documentStore.setEmptyCellCount) documentStore.setEmptyCellCount(state.emptyCellCount)
  if (documentStore.setMarkerCounter) documentStore.setMarkerCounter(state.markerCounter)
  if (documentStore.setVerifications) documentStore.setVerifications(state.verifications)

  return true
}

export const triggerReloadDocument = async (editor: DocumentEditor,
    modalStore: Partial<ModalStore> & { setDocumentStatus: (status: "locked" | "updated" | "updating" | null) => void}
) => {
  const selection = editor.selection
  const documentStore = useDocumentStore.getState();
  const selectionMode = useAppStore.getState().selectionMode
  // First check if the document is locked
  try {
    const { error } = await getLastAuditLogItem(documentStore.documentId, true);
    if (error != null && error.length > 0) {
      handleGetLastAuditLogItemError(error, modalStore)
      return null
    }
    
    // If the document is locked, update the modal status but don't refresh content
    if (error === DOCUMENT_LOCKED) {
      console.log("Document is locked, cannot reload content");
      
      // Update the document status to "locked"
      modalStore.setDocumentStatus("locked");
      return null;
    }
  } catch (err) {
    if (err instanceof BusyException) {
      console.error("Document is busy, cannot reload content " + err.message);
    } else {
      console.error("Error checking document lock status:", err);
    }
    return null
  }
  
  // If not locked, proceed with the reload
  let newReloadSelection = [selection.startOffset, selection.endOffset]
  if (selectionMode === "select") newReloadSelection = [BULK_NA_ING]
  documentStore.setReloadSelection(newReloadSelection)
  if (!documentStore.triggerReload) {
    console.error("triggerReload is not set")
    return null
  }
  documentStore.triggerReload()
  
  // Use the new setDocumentStatus if available, otherwise fall back to old method
  if (modalStore.setDocumentStatus) {
    modalStore.setDocumentStatus("updating")
  } else {
    console.error("modalStore.setDocumentNotUpToDate and modalStore.setDocumentStatus are not set")
  }
  releaseLock(documentStore.documentId).catch((error) => {
    console.error("Error releasing lock: " + error)
  })
}

export const tableCellSelectionAndDocumentState: (
  editor: DocumentEditor, 
  appStore: Partial<AppStore> & { setWorking: (a: boolean)=>void, setWorkingTitle: (a: string)=>void},
  modalStore: Partial<ModalStore> & { setDocumentStatus: (status: "locked" | "updated" | "updating" | null) => void, 
                                      setOperationFailedError: (error: string | null) => void },
  documentStore: Partial<DocumentStore> & { setReloadSelection: (selection: string[]) => void, 
                                              triggerReload: () => void}) => Promise<TableCellSelectionStatus | null>
  = async (editor: DocumentEditor, 
    appStore: Partial<AppStore> & { setWorking: (a: boolean)=>void, setWorkingTitle: (a: string)=>void}, 
    modalStore: Partial<ModalStore> & { setDocumentStatus: (status: "locked" | "updated" | "updating" | null) => void},
    documentStore: Partial<DocumentStore> & { setReloadSelection: (selection: string[]) => void, 
                                              triggerReload: () => void }
  ) => {
    const selection = editor.selection
    if (selection == null) {
      console.log("Selection is null")
      appStore.setWorking(false)
      return null
    }
    // console.log("Selection is not null here")
    try {
      const selectionDescriptor = await getTableCellFromSelection(editor, selection)
      appStore.setWorkingTitle("Checking document state")
      if (!selectionDescriptor) {
        console.log("selectionDescriptor is null")
        if (appStore.setWorking) appStore.setWorking(false)
        // if (modalStore.toggleTableNotSelected) modalStore.toggleTableNotSelected()
        return null
      }
      if (documentStore.documentId == null) return null
      const { auditLogItem, timestamp, error } = await getLastAuditLogItem(documentStore.documentId, true);
      if (error != null && error.length > 0 || auditLogItem == null) {
        handleGetLastAuditLogItemError(error, modalStore)
        if (appStore.setWorking) appStore.setWorking(false)
        return null
      }
      if (auditLogItem.time !== documentStore.editTime) {
        console.log("timestamp: " + timestamp + " documentStore.editTime: " + documentStore.editTime)
        await triggerReloadDocument(editor, modalStore)
        return null
      }
      const state = getStateFromAuditlogItem(auditLogItem)
      const statusOK = updateAuditlogData(state, documentStore)
      if (!statusOK) {
        console.log("status is not ok")
        if (appStore.setWorking)
          appStore.setWorking(false)
        return null
      }
      const dt = DateTime.fromMillis(timestamp, { zone: state.timezone })
      if (selection == null) {
        console.log("Selection was ok but is now null")
        return null
      }
      return { selectionDescriptor, dt, timestamp, state }
    } catch (error) {
      if (error instanceof BusyException) {
        console.error("Document is busy, cannot proceed with selection: " + error.message);
      } else if (error instanceof MultipleParaGraphsError) {
        // Ignore this error
      } else if (error instanceof Error) {
        console.error("Unexpected error: ", error.message);
      } else {
        console.error("Unexpected error type: ", error);
      }
      if (appStore.setWorking) appStore.setWorking(false)
      return null
    }
  }
export interface DocumentStaleStatus {
  ok: boolean
  timestamp: number // Note this is the server time (just like in the normal lock getting process) to be used for the update time
  auditLogItem: IAuditLogItem | null
}
export const checkDocumentNotStale = async (
  setDocumentLock: boolean
): Promise<DocumentStaleStatus> => {
  const documentStore = useDocumentStore.getState();  
  const modalStore = useModalStore.getState();
  const setWorking = useAppStore.getState().setWorking;
  setWorking(true)
  if (documentStore.documentId == null){
    console.log("documentId is null")
    // Check if it's the new setDocumentStatus function vs the old setDocumentNotUpToDate
    modalStore.setDocumentStatus(null);
    return { ok: false, timestamp: 0, auditLogItem: null }
  }
  const getLastAuditLogItemResult: AuditLogItemResponse | null = await getLastAuditLogItem(documentStore.documentId, setDocumentLock);
  if (getLastAuditLogItemResult.error != null && getLastAuditLogItemResult.error.length > 0) {
    handleGetLastAuditLogItemError(getLastAuditLogItemResult.error, modalStore)
    setWorking(false)
    return { ok: false, timestamp: 0, auditLogItem: null }
  }

  const { auditLogItem, timestamp: serverTime } = getLastAuditLogItemResult
  if (auditLogItem == null) {
    console.log("auditLogItem is null")
    // Reset document status
    modalStore.setDocumentStatus(null);
    return { ok: false, timestamp: 0, auditLogItem: null }
  }
  if (auditLogItem.time !== documentStore.editTime) {
    console.log(auditLogItem.time, documentStore.editTime)
    console.log("Document is stale")
    // Set document updated status
    modalStore.setDocumentStatus("updating");
    return { ok: false, timestamp: serverTime, auditLogItem }
  }
  setWorking(false)
  return { ok: true, timestamp: serverTime, auditLogItem }
}

// export const checkContentControlCheckBox = async (editor: DocumentEditor, user: RUser | null, deselectCell: () => void, 
//     appStore: Partial<AppStore> & { 
//       setWorkingTitle: (title: string) => void, 
//       setWorking: (working: boolean) => void },
//     modalStore: Partial<ModalStore> & { setDocumentStatus: (status: "locked" | "upToDate" | "updated" | "updating" | null) => void},
//     userStore: Partial<UserStore>, 
//     documentStore: Partial<DocumentStore> & { setReloadSelection: (selection: string[]) => void, 
//                                               triggerReload: () => void },
//   t: TFunction) => {
//   if (user === null || editor == null) return
//   const dataSanityData: TableCellSelectionStatus | null = await tableCellSelectionAndDocumentState(editor,
//     appStore, modalStore, documentStore)
//   if (!dataSanityData) {
//     console.log("dataSanityData is null")
//     return false
//   }
//   console.log("Got dataSanityData: ")
//   const { selectionDescriptor, dt, timestamp, state } = dataSanityData
//   const dateString = formatDatetimeString(dt, t)
//   let actionType: ActionType = ActionType.CheckedBox
//   console.log("Looking for checkbox: " + editor.selection.startOffset)
//   const newCheckboxCounter = state.markerCounter + 1
//   const superscriptText = `${userStore.initials}*${newCheckboxCounter}`
//   const insertedText = `\u2612${superscriptText}`
//   const selection = editor.selection
//   const paragraph = selection.start.paragraph
//   const paragraphText = getParagraphText(paragraph)
//   const startOffset = editor.selection.startOffset.split(";").slice(0, -1).join(";")
//   const sOffset = Math.max(0, parseInt(selection.startOffset.split(";").slice(-1)[0]) - 1)
//   const eOffset = Math.min(parseInt(selection.endOffset.split(";").slice(-1)[0]) + 1, paragraphText.length - 1)
//   console.log("Start offset: " + startOffset + ";" + sOffset.toString())
//   console.log("End offset: " + startOffset + ";" + eOffset.toString())
//   const endOffset = selection.endOffset.split(";").slice(0, -1).join(";")
//   const foundCheckbox = searchParagraphForCheckboxes(
//     editor, paragraph, startOffset + ";" + sOffset.toString(), startOffset + ";" + eOffset.toString())
//   if (!foundCheckbox) {
//     console.log("No checkbox found????")
//     return false
//   }
//   if (startOffset !== endOffset) {
//     console.error("Start and end offsets are not the same. This should not happen.")
//   }
//   console.log("deleting")
//   editor.editor.delete()
//   let offset1: string = editor.selection.startOffset
//   let offset2: string
//   const f: Partial<SelectionParagraphFormat> = {
//     textAlignment: "Left",
//     spaceAfterAuto: false,
//     spaceBeforeAuto: false,
//     afterSpacing: 0,
//     beforeSpacing: 0,
//     lineSpacing: 1.0,
//   }
//   console.log("here adding checkbox")
//   editor.editor.insertText("\u2612");
//   console.log("offset1: " + offset1);
//   ({ offset1, offset2 } = makeTextSelection(offset1, 1))
//   console.log("offset1: " + offset1 + " offset2: " + offset2);
//   editor.selection.select(offset1, offset2)
//   formatSelection(editor, CHECKBOXFORMAT, f)
//   editor.selection.select(offset2, offset2)
//   console.log("here adding superscript")
//   console.log("offset2: " + offset2);
//   editor.editor.insertText(superscriptText);
//   ({ offset1, offset2 } = makeTextSelection(offset2, superscriptText.length))
//   console.log("offset1: " + offset1 + " offset2: " + offset2);
//   editor.selection.select(offset1, offset2)
//   formatSelection(editor, SUPERSCRIPTFORMAT, f)
//   editor.selection.select(offset2, offset2)
//   console.log("here adding space")
//   if (documentStore.setEditedBy) documentStore.setEditedBy(`${userStore.legalName} (${userStore.initials})`)
//   if (documentStore.setEditedAt) documentStore.setEditedAt(dateString)
//   const auditItem = new AuditLogItem({
//     email: user?.email,
//     userId: user?.userId,
//     legalName: userStore.legalName,
//     time: timestamp,
//     newText: insertedText,
//     initials: userStore.initials,
//     markerCounter: newCheckboxCounter,
//     // emptyCellCountChange: -1 * 0,
//     removedText: "\u2610",
//     cellIndices: selectionDescriptor ? JSON.stringify(selectionDescriptor.cellIndices) : "",
//     reason: "",
//     stage: Stage.Execute,
//     actionType,
//     verifications: state.verifications
//   })
//   deselectCell()
//   console.log("Getting content")
//   const content = await getDocumentContent(editor)
//   if (documentStore.documentId == null || documentStore.locale == null) {
//     if (appStore.setWorking) appStore.setWorking(false)
//     return false
//   }
//   const updateAuditLogResult = await updateAuditLog(documentStore, auditItem, content, documentStore.locale)

//   console.log("Updated Audit Log")
//   if (updateAuditLogResult.error != null && updateAuditLogResult.error.length > 0) {
//     console.log("Error updating audit log: " + updateAuditLogResult.error)
//     if (userStore.setUser) userStore.setUser(null)
//     // if (setLoggedIn) setLoggedIn(false)
//     if (appStore.setWorking) appStore.setWorking(false)
//     return false
//   }
//   // ampli.dataEntered({
//   //   stage: StageNames[documentStage],
//   //   type: "text",
//   //   shortcut
//   // })
//   if (appStore.setWorking) appStore.setWorking(false)
//   return true
// }

const isWhitspaceNext = (selection: Selection) => {
  const initialStartOffset = selection.startOffset
  const initialEndOffset = selection.endOffset
  const offsetBits = selection.endOffset.split(";")
  const blockIndex = offsetBits.slice(0, -1).join(";")
  const lastIdx = parseInt(offsetBits.slice(-1)[0])
  selection.select(`${blockIndex};${lastIdx}`, `${blockIndex};${lastIdx + 1}`)
  const nextChar = selection.text
  if (nextChar === "") {
    selection.select(initialStartOffset, initialEndOffset)
    return true
  }
  selection.select(initialStartOffset, initialEndOffset)
  return nextChar.match(/\s/)
}

export const getLastOffset = (selection: Selection) => {
  if (selection.isForward) return selection.endOffset
  return selection.startOffset
}

export const doBulkCellNAs = async (editor: DocumentEditor, selectedCells: {[key: string]: string}, 
  initials: string, dateString: string, lateEntry: boolean) => {
  editor.isReadOnly = false
  editor.editor.beginBatchEdit()
  const selection = editor.selection
  const f: Partial<SelectionParagraphFormat> = {
    textAlignment: "Left",
    lineSpacing: 1.0,
    afterSpacing: 0,
    beforeSpacing: 0,
    spaceAfterAuto: false,
    spaceBeforeAuto: false,
    listId: 0,
    listLevelNumber: -1,
    leftIndent: 0.1,
    rightIndent: 0,
    firstLineIndent: 0,
  }
  // selection.cellFormat.leftMargin = 5.4
  // selection.cellFormat.rightMargin = 5.4
  const scrollTop = editor.documentHelper.viewerContainer.scrollTop
  for (const cellIndex of Object.keys(selectedCells)) {
    try {
      selection.select(cellIndex, cellIndex)
      selection.selectCell()
      let endOffset = selection.endOffset
      let offset1:string
      let offset2: string
      const cellText = selection.text
      if (endOffset.slice(-3) === "0;0" || cellText === "\r") {
        offset1 = selection.startOffset
        selection.select(offset1, offset1)
        editor.editor.insertText("N/A");
        ({ offset1, offset2 } = makeTextSelection(offset1, 3))
      } else {
        offset1 = selection.endOffset
        selection.select(offset1, offset1)
        const startOfNAContent = moveSelectionIndexToStartNextParagraph(offset1)
        editor.editor.insertText("\nN/A");
        const endOfNAContent = getLastOffset(selection)
        offset1 = startOfNAContent
        offset2 = endOfNAContent
      }
      selection.select(offset1, offset2)
      formatSelection(editor, ENTRYFORMAT, f)
      selection.select(offset2, offset2)
      if (lateEntry) {
        const lateEntryText = LATE_CLOCK
        editor.editor.insertText(lateEntryText);
        ({ offset1, offset2 } = makeTextSelection(offset2, lateEntryText.length))
        editor.selection.select(offset1, offset2)
        const clockFormat: Partial<SelectionCharacterFormat> = { ...SUPERSCRIPTFORMAT, ...CLOCKFORMAT }
        formatSelection(editor, clockFormat, f)
        editor.selection.select(offset2, offset2)
      }
      const startOfDateContent = moveSelectionIndexToStartNextParagraph(offset2)
      const dateText = `${initials} ${dateString}`
      editor.editor.insertText("\n" + dateText);
      const endOfDateContent = getLastOffset(selection)
      offset1 = startOfDateContent
      offset2 = endOfDateContent
      selection.select(offset1, offset2)
      formatSelection(editor, INITIALSANDDATEFORMAT, f)
    } catch (err: unknown) {
      if (err instanceof Error)
        console.warn("Error inserting N/A in cell " + cellIndex + ": " + err.message)
      else
        console.warn("Unknown error inserting N/A in cell " + cellIndex)
    }
  }
  editor.documentHelper.viewerContainer.scrollTop = scrollTop
  editor.editor.endBatchEdit()
  editor.isReadOnly = true
}

export const doWhenWarned = (
  task: () => void,
  editor: DocumentEditor,
  appStore: Partial<AppStore> & 
  { 
    setWorkingTitle: (title: string) => void, 
    setWorking: (working: boolean) => void },
  modalStore: Partial<ModalStore> & { 
    setDocumentStatus: (
      status: "locked" | "updated" | "updating" | null) => void, setOperationFailedError: (error: string | null) => void },
  documentStore: Partial<DocumentStore> & {
    setReloadSelection: (selection: string[]) => void,
    triggerReload: () => void
  },
  setIsNotInTableWarningDialog: (isOpen: boolean) => void
) => {
  // Show warning dialog before inserting text
  if (editor == null) return;
  appStore.setWorking(true);
  tableCellSelectionAndDocumentState(editor,
    { setWorkingTitle: appStore.setWorkingTitle, setWorking: appStore.setWorking },
    modalStore, documentStore).then((dataSanityData: TableCellSelectionStatus | null) => {
      if (!dataSanityData || !dataSanityData.state) {
        appStore.setWorking(false);
        return false;
      }
      const { selectionDescriptor } = dataSanityData;
      if (!selectionDescriptor.tableCell && !selectionDescriptor.placeholder) {
        setIsNotInTableWarningDialog(true)
      } else {
        // If we have a valid selection, proceed with text insertion
        task();
      }
    }).catch((error) => {
      console.error("Error checking document state:", error);
      appStore.setWorking(false);
    })
}

const trimSelection = (editor: DocumentEditor) => {
  const selection = editor.selection
  const startOffset = selection.startOffset
  const endOffset = selection.endOffset
  const sOffsetBits = startOffset.split(";")
  const sBlockIndex = sOffsetBits.slice(0, -1).join(";")
  const startIdx = parseInt(sOffsetBits.slice(-1)[0])
  const endOffsetBits = endOffset.split(";")
  const endBlockIndex = endOffsetBits.slice(0, -1).join(";")
  const endIdx = parseInt(endOffsetBits.slice(-1)[0])
  const text = selection.text
  const trimmedText = text.trim()
  const deltaStartIdx = text.indexOf(trimmedText)
  let firstIdx = 0
  let secondIdx = 0
  if (sBlockIndex === endBlockIndex) {
    if (startIdx < endIdx) {
      firstIdx = startIdx + deltaStartIdx
      secondIdx = firstIdx + trimmedText.length
      selection.select(`${sBlockIndex};${firstIdx}`, `${sBlockIndex};${secondIdx}`)
    } else {
      firstIdx = endIdx + deltaStartIdx
      secondIdx = firstIdx + trimmedText.length
      selection.select(`${sBlockIndex};${firstIdx}`, `${sBlockIndex};${secondIdx}`)
    }
  } else if (sBlockIndex < endBlockIndex) {
    console.log("Selection is accross different paragraphs")
  }
}

export const insertCorrection = async (editor: DocumentEditor, selection: Selection, superscriptText: string, newText: string) => {
  editor.isReadOnly = false
  let removedText = ""
  try {
    trimSelection(editor)
    console.log("selection trimmed", Date.now())
    try {
      selection.copyHyperlink()
      throw new AttachmentCorrectionError("Selected hyperlink")
    } catch (err) {
      if (err instanceof AttachmentCorrectionError) {
        editor.isReadOnly = true
        throw err
      } else if (err instanceof Error) {
        console.log("Error copying hyperlink: " + err.message)
      } else {
        console.log("Unexpected error copying hyperlink: " + err)
      }
    }
    editor.selection.characterFormat["strikethrough"] = "SingleStrike"
    removedText = selection.text
    if (!editor.selection.characterFormat["strikethrough"]) throw new AttachmentCorrectionError("Failed to set strikethrough format");
    console.log("format after change: " + editor.selection.characterFormat["strikethrough"].toString())
    // ] = { ...editor.selection.characterFormat, strikethrough: "SingleStrike" }
    // formatSelection(editor, { strikethrough: "SingleStrike" })
    let offset1: string = getLastOffset(selection)
    selection.select(offset1, offset1)
    let offset2: string
    if (newText.length > 0) {
      editor.editor.insertText(" [");
      console.log("Inserted [");
      ({ offset1, offset2 } = makeTextSelection(offset1, 2))
      selection.select(offset1, offset2)
      formatSelection(editor, ENTRYFORMAT)
      selection.select(offset2, offset2)
      editor.editor.insertText(newText);
      console.log(newText);
      ({ offset1, offset2 } = makeTextSelection(offset2, newText.length))
      selection.select(offset1, offset2)
      formatSelection(editor, CORRECTIONFORMAT)
      selection.select(offset2, offset2)
    } else {
      editor.editor.insertText("[");
      console.log("Inserted \"[\"");
      ({ offset1, offset2 } = makeTextSelection(offset1, 1))
      selection.select(offset1, offset2)
      formatSelection(editor, ENTRYFORMAT)
      selection.select(offset2, offset2)
    }
    editor.editor.insertText(superscriptText);
    ({ offset1, offset2 } = makeTextSelection(offset2, superscriptText.length))
    selection.select(offset1, offset2)
    formatSelection(editor, SUPERSCRIPTFORMAT)
    selection.select(offset2, offset2)
    if (!isWhitspaceNext(editor.selection)) {
      editor.editor.insertText("] ");
      ({ offset1, offset2 } = makeTextSelection(offset2, 2))
    } else {
      editor.editor.insertText("]");
      ({ offset1, offset2 } = makeTextSelection(offset2, 1))
    }
    editor.selection.select(offset1, offset2)
    formatSelection(editor, ENTRYFORMAT)
    editor.selection.select(offset2, offset2)
    editor.isReadOnly = true
  } catch (err: unknown) {
    if (err instanceof AttachmentCorrectionError) {
      const setUnableToCorrectAttachment = useModalStore.getState().setUnableToCorrectAttachment
      setUnableToCorrectAttachment(true)
    } else if (err instanceof Error) {
      console.error("Error inserting correction: " + err.message)
    } else {
      console.error("Unexpected error inserting correction: " + err)
    }
    editor.isReadOnly = true
    return { corrected: false, removedText: "" } 
  }
  return { corrected: true, removedText }
}