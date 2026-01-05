import base64ArrayBuffer from "./arrayBuffer2base64"
import { Sha256 } from "@aws-crypto/sha256-js"
import { Buffer } from "buffer"
import { ActionType, AuditLogItem, IAuditLogItem, Verifications } from "./AuditLogItem"
import {
  // DOCUFENID,
  // HEADERSANDFOOTERS,
  Stage,
} from "./lifecycle"
// import { TryingToEditSignature, UnableToLockError } from "./errors"
import {
  sendAuditLogItem,
  // callVerifyDocumentContents, getLastAuditLogItem, logoutUser,
  // sendAuditLogItem, 
  setServerDocumentStage
} from "@/lib/apiUtils"
// import { lightTheme } from "../syncFusion/DocuTheme2"
// import { toggleCellShadingColourToWhite } from "../taskpane/AddToggleDialogBox"
import { User } from "@/lib/User"
import { CharacterFormatProperties, DocumentEditor, IWidget, LineWidget, ParagraphWidget, Selection, SelectionCharacterFormat, SelectionParagraphFormat, TableCellWidget, TableRowWidget, TableWidget, TextElementBox } from "@syncfusion/ej2-react-documenteditor"
import { docuTheme, encodeUrlFilename } from "@/lib/utils"
import { pad } from "@/lib/dateUtils"
import { LATE_CLOCK } from "./constants"
import { DocumentStore, useModalStore } from "@/lib/stateManagement"
import { getLastOffset } from "./editUtils"
import { MultipleParaGraphsError } from "./errors"
import { TFunction } from "i18next"
// import { ModalStore } from "./stateManagement"

export const TEMPORARYTAG: string = "temporaryTag"
export const CURRENTDATE = "getCurrentDate_aofnlsakdg"
export const CURRENTTIME = "getCurrentTime_asidflasvn"

// export const DOCUFEN_CONTENT: string = "docufen_content"
export const MAX_HASH_TRIES = 10
// const REHASH_WAIT_TIME = 500
// const EXISTINGCONTENTTAG = "existingContentTag";

// export let CONNECTIONTYPE = 3; // 1: ONLINE ONLY, 2: OFFLINE ONLY, 3: BOTH ONLINE AND OFFLINE

export const FAINTBLUE = "#859cff"
export const BLUE = "#0000ff"

export const nudgeDown = (colour: string) => {
  const nudge = 1
  const r = parseInt(colour.slice(1, 3), 16)
  const g = Math.max(parseInt(colour.slice(3, 5), 16) - nudge, 0)
  const b = parseInt(colour.slice(5, 7), 16)
  return "#" + r.toString(16).toUpperCase() + g.toString(16).toUpperCase() + pad(b.toString(16).toUpperCase(), 2)
}
export const nudgeUp = (colour: string) => {
  const nudge = 1
  const r = parseInt(colour.slice(1, 3), 16)
  const g = Math.min(parseInt(colour.slice(3, 5), 16) + nudge, 255)
  const b = parseInt(colour.slice(5, 7), 16)
  return "#" + r.toString(16).toUpperCase() + g.toString(16).toUpperCase() + pad(b.toString(16).toUpperCase(), 2)
}
export const bigYellowNudge = (colour: string, tryNumber: number) => {
  const r = Math.max((255 - tryNumber), 0)
  const g = Math.max((255 - tryNumber), 0)
  const b = parseInt(colour.slice(5, 7), 16)
  return "#" + r.toString(16).toUpperCase() + g.toString(16).toUpperCase() + pad(b.toString(16).toUpperCase(), 2)
}


export const EMPTY_CELL_COLOUR = "#FEFFFE"
export const PLACEHOLDER_CELL_COLOUR = nudgeDown(EMPTY_CELL_COLOUR)  //(lightTheme.colorBrandBackground2)
export const TOGGLED_PLACEHOLDER_CELL_COLOUR = nudgeDown(PLACEHOLDER_CELL_COLOUR)
export const FILLED_CELL_COLOUR = "#FFFFFF"
export const SELECTED_FILLED_CELL_COLOUR = docuTheme[130]  //lightTheme.colorBrandBackground2.toLocaleUpperCase()
export const SELECTED_PLACEHOLDER_CELL_COLOUR = nudgeDown(SELECTED_FILLED_CELL_COLOUR)
export const SELECTED_TOGGLED_PLACEHOLDER_CELL_COLOUR = nudgeDown(SELECTED_PLACEHOLDER_CELL_COLOUR)
export const SELECTED_EMPTY_CELL_COLOUR = nudgeDown(SELECTED_TOGGLED_PLACEHOLDER_CELL_COLOUR)

// Stage-specific selection colors (matching the light tints used in MasterPopup)
export const STAGE_SELECTION_COLORS: Record<Stage, string> = {
  [Stage.Draft]: "#CEFFD6FF",          // Default light green for Draft
  [Stage.External]: "#CEFFD6FF",       // Default light green for External
  [Stage.Uploaded]: "#CEFFD6FF",       // Default light green for Uploaded
  [Stage.PreApprove]: "#FFF5E6FF",     // Light amber for Pre-Approval
  [Stage.PreExecute]: "#EDEDFFFF",     // Light blue for Pre-Execute
  [Stage.Execute]: "#EDEDFFFF",        // Light blue for Execution (matching MasterPopup)
  [Stage.PostApprove]: "#F9E6FFFF",    // Light purple for Post-Approval
  [Stage.Closed]: "#E6F7EFFF",         // Light green for Completed
  [Stage.Finalised]: "#E6F7EFFF",      // Light green for Finalised
  [Stage.Voided]: "#FFEBEBFF"          // Light red for Voided
}

export const getStageSelectionColor = (stage: Stage): string => {
  return STAGE_SELECTION_COLORS[stage] || "#CEFFD6FF"
}

export interface BasicResult {
  statusOK: boolean
  error?: string
}

const setCellBackgroundColor = (tableCell: TableCellWidget, color: string): void => {
  if (tableCell.cellFormat && tableCell.cellFormat.shading) {
    try {
      tableCell.cellFormat.shading.backgroundColor = color
      // console.log("Successfully set cell background color to:", color)
    } catch (error) {
      console.error("Error setting cell background color:", error)
      // Fallback method if available
      if (tableCell.cellFormat.shading.hasOwnProperty('backgroundColor')) {
        // console.log("Trying again: " + color)
        tableCell.cellFormat.shading.backgroundColor = color
        // console.log("Successfully reset cell background color to:", color)
      }
    }
  }
}

export const toggleCellShadingColourToWhite = (selectionDescriptor: DocumentSelectionDescriptor) => {
  let emptyCellCountChange = 0

  const tableCell = selectionDescriptor.tableCell
  if (tableCell == null) {
    return emptyCellCountChange
  }

  const cellState = selectionDescriptor.cellState ? selectionDescriptor.cellState : CellState.EMPTY
  // console.log("cellState: " + cellState.toString())

  if ([CellState.EMPTY, CellState.CHECKBOX].includes(cellState)) {
    // console.log("cellState is empty or checkbox")
    setCellBackgroundColor(tableCell, FILLED_CELL_COLOUR)
    emptyCellCountChange = -1
  } else if (cellState === CellState.PLACEHOLDER) {
    // console.log("cellState is placeholder")
    setCellBackgroundColor(tableCell, TOGGLED_PLACEHOLDER_CELL_COLOUR)
    emptyCellCountChange = -1
  }

  return emptyCellCountChange
}
// 'Inter',
export const ENTRYFORMAT: Partial<CharacterFormatProperties> = {
  fontFamily: 'Inter', 
  fontSize: 9,
  fontColor: BLUE,
  bold: false,
  underline: "None",
  strikethrough: "None",
  highlightColor: "NoColor",
  allCaps: false,
  italic: false,
  baselineAlignment: "Normal"
}
export const HYPERFORMAT: Partial<CharacterFormatProperties> = {
  fontFamily: 'Inter', 
  fontSize: 9,
  bold: false,
  strikethrough: "None",
  highlightColor: "NoColor",
  allCaps: false,
  italic: false,
  baselineAlignment: "Normal"
}

export const CORRECTIONFORMAT: Partial<CharacterFormatProperties> = {
  fontFamily: 'Inter', 
  fontSize: 9,
  fontColor: BLUE,
  bold: true,
  underline: "None",
  strikethrough: "None",
  highlightColor: "NoColor",
  allCaps: false,
  italic: false,
  baselineAlignment: "Normal"
}

export const PLACEHOLDERFORMAT: Partial<CharacterFormatProperties> = { ...ENTRYFORMAT, underline: "Single" }

export const SIGNATUREFORMAT: Partial<CharacterFormatProperties> = {
  fontFamily: 'Kalam',
  fontSize: 10,
  fontColor: BLUE,
  bold: false,
  underline: "None",
  strikethrough: "None",
  highlightColor: "NoColor",
  allCaps: false,
  italic: false,
  baselineAlignment: "Normal"
}

export const INITIALSANDDATEFORMAT: Partial<CharacterFormatProperties> = {
  fontFamily: 'Roboto Mono',
  fontSize: 6,
  fontColor: FAINTBLUE,
  bold: false,
  underline: "None",
  strikethrough: "None",
  highlightColor: "NoColor",
  allCaps: false,
  italic: false,
  baselineAlignment: "Normal"
}
const TRIANGLEGREEN = "#005C07"
export const TRIANGLEFORMAT: Partial<CharacterFormatProperties> = {
  fontFamily: 'Roboto Mono',
  fontSize: 8,
  fontColor: TRIANGLEGREEN,
  bold: false,
  underline: "None",
  strikethrough: "None",
  highlightColor: "NoColor",
  allCaps: false,
  italic: false,
  baselineAlignment: "Normal"
}

export const CHECKBOXFORMAT: Partial<CharacterFormatProperties> = { ...ENTRYFORMAT, fontFamily: 'Segoe UI Symbol', fontSize: 12 }

export const SUPERSCRIPTFORMAT: Partial<CharacterFormatProperties> = {
  fontFamily: 'Roboto Mono',
  fontSize: 9,
  fontColor: FAINTBLUE,
  bold: false,
  underline: "None",
  strikethrough: "None",
  highlightColor: "NoColor",
  allCaps: false,
  italic: false,
  baselineAlignment: "Superscript",
}
export const CLOCKFORMAT: Partial<CharacterFormatProperties> = {
  fontFamily: 'Segoe UI Emoji',
}

export const formatSelection = (editor: DocumentEditor, characterFormat: Partial<SelectionCharacterFormat>, paragraphFormat?: Partial<SelectionParagraphFormat>) => {
  const readOnlyProps = ['renderedFontFamily']; // Add any other read-only properties here

  // Apply character formatting
  for (const key in characterFormat) {
    if (characterFormat.hasOwnProperty(key) && !readOnlyProps.includes(key)) {
      const formatKey = key as keyof SelectionCharacterFormat;
      const value = characterFormat[formatKey];
      //console.warn(key, performance.now())
      if (value !== undefined && value !== editor.selection.characterFormat[formatKey]) {
        (editor.selection.characterFormat as any)[formatKey] = value;
        // console.log("formatKey: " + formatKey + " value: " + value)
      }
      //console.warn(key, performance.now())
    // } else {
      // console.log("Ignoring key: " + key)
    }
  }

  // Apply paragraph formatting if provided
  if (paragraphFormat) {
    for (const key in paragraphFormat) {
      if (paragraphFormat.hasOwnProperty(key)) {
        const formatKey = key as keyof SelectionParagraphFormat;
        const value = paragraphFormat[formatKey];
        if (value !== undefined && value !== editor.selection.paragraphFormat[formatKey]) {
          // console.warn("Applying paragraph format: " + formatKey + " with value: " + value, editor.selection.paragraphFormat[formatKey]);
          // const indentKey = ["leftIndent", "rightIndent", "firstLineIndent"].includes(formatKey)
          (editor.selection.paragraphFormat as any)[formatKey] = value;
          // console.log("formatKey: " + formatKey + " value: " + value)
        }
      }
    }
  }
}

export const makeTextSelection = (index: string, length: number) => {
  const blockIndex = index.split(";").slice(0, -1).join(";")
  const offset = parseInt(index.split(";").slice(-1)[0])
  const offset1 = blockIndex + ";" + offset.toString()
  const offset2 = blockIndex + ";" + (offset + length).toString()
  return { offset1, offset2 }
}

const addSignatureFirstLine = (editor: DocumentEditor, legalName: string, reason: string, f: Partial<SelectionParagraphFormat>, addSpace: boolean, lateEntry: boolean, prependNewline: boolean = false) => {
  let offset1: string = getLastOffset(editor.selection)
  let offset2: string = offset1
  editor.selection.select(offset2, offset2)
  let reasonText = reason
  if (addSpace) {
    reasonText = ` ${reason}`
  }
  let startOfReasonContent = offset2
  if (prependNewline) {
    startOfReasonContent = moveSelectionIndexToStartNextParagraph(offset2)
    reasonText = "\n" + reasonText
  }
  editor.editor.insertText(reasonText);
  const endOfReasonContent = getLastOffset(editor.selection)
  offset1 = startOfReasonContent
  offset2 = endOfReasonContent
  // console.log("addSignature Firstline offset1: " + offset1 + " offset2: " + offset2)
  editor.selection.select(offset1, offset2)
  formatSelection(editor, INITIALSANDDATEFORMAT, f)
  editor.selection.select(offset2, offset2)
  const nameText = ` ${legalName}`
  editor.editor.insertText(nameText);
  ({ offset1, offset2 } = makeTextSelection(offset2, nameText.length))
  // console.log("offset1: " + offset1 + " offset2: " + offset2)
  editor.selection.select(offset1, offset2)
  formatSelection(editor, SIGNATUREFORMAT, f)
  editor.selection.select(offset2, offset2)
  if (lateEntry) {
    const clock = LATE_CLOCK
    editor.editor.insertText(clock);
    ({ offset1, offset2 } = makeTextSelection(offset2, clock.length))
    // console.log("offset1: " + offset1 + " offset2: " + offset2)
    editor.selection.select(offset1, offset2)
    const clockFormat: Partial<CharacterFormatProperties> = { ...SUPERSCRIPTFORMAT, ...CLOCKFORMAT }
    formatSelection(editor, clockFormat, f)
    editor.selection.select(offset2, offset2)
  }
  return offset2
}

const addSignatureSecondLine = (editor: DocumentEditor, offset: string, initials: string, date: string, f: Partial<SelectionParagraphFormat>, newLine: boolean, t: TFunction<"translation", undefined>) => {
  let offset1: string = offset
  let offset2: string = offset
  const dateString = t('digitalSignature.initialsLine', { initials, date })
  if (newLine) {
    const startOfDateContent = moveSelectionIndexToStartNextParagraph(offset2)
    editor.editor.insertText("\n" + dateString);
    const endOfDateContent = getLastOffset(editor.selection)
    offset1 = startOfDateContent
    offset2 = endOfDateContent
  } else {
    editor.editor.insertText(dateString);
    ({ offset1, offset2 } = makeTextSelection(offset2, dateString.length))
  }
  editor.selection.select(offset1, offset2)
  formatSelection(editor, INITIALSANDDATEFORMAT, f)
  editor.selection.select(offset2, offset2)
  return offset2
}


const insertSignatureInline = (editor: DocumentEditor, legalName: string, 
  reason: string, initials: string, counter: number, lateEntry: boolean) => {
  editor.isReadOnly = false
  const f: Partial<SelectionParagraphFormat> = {
    textAlignment: "Left",
    afterSpacing: 0,
    beforeSpacing: 0,
    lineSpacing: 1.0,
    spaceAfterAuto: false,
    spaceBeforeAuto: false,
  }
  const latestOffset = addSignatureFirstLine(editor, legalName, reason, f, true, false)

  let superScriptString = `${initials}*${counter}`
  // if (lateEntry) superScriptString += LATE_CLOCK
  editor.editor.insertText(superScriptString)
  let offset1: string
  let offset2: string;
  ({ offset1, offset2 } = makeTextSelection(latestOffset, superScriptString.length))
  editor.selection.select(offset1, offset2)
  formatSelection(editor, SUPERSCRIPTFORMAT, f)
  editor.selection.select(offset2, offset2)
  if (lateEntry) {
    editor.editor.insertText(LATE_CLOCK);
    ({ offset1, offset2 } = makeTextSelection(offset2, LATE_CLOCK.length))
    editor.selection.select(offset1, offset2)
    const clockFormat: Partial<CharacterFormatProperties> = { ...SUPERSCRIPTFORMAT, ...CLOCKFORMAT }
    formatSelection(editor, clockFormat, f)
    editor.selection.select(offset2, offset2)
  }
  const text = " "
  editor.editor.insertText(text);
  ({ offset1, offset2 } = makeTextSelection(offset2, text.length))
  editor.selection.select(offset1, offset2)
  formatSelection(editor, INITIALSANDDATEFORMAT, f)  // Use system font so trailing space isn't detected as user content
  editor.selection.select(offset2, offset2)
  editor.isReadOnly = true
}

const appendFullSignatureToPara = (editor: DocumentEditor, legalName: string, initials: string,
  reason: string, dateString: string, newParagraph: boolean, lateEntry: boolean, t: TFunction<"translation", undefined>) => {
  // console.dir(editor.selection.paragraphFormat)
  editor.isReadOnly = false
  const f: Partial<SelectionParagraphFormat> = {
    textAlignment: "Left",
    afterSpacing: 0,
    beforeSpacing: 0,
    lineSpacing: 1.0,
    spaceAfterAuto: false,
    spaceBeforeAuto: false,
    listId: 0,
    listLevelNumber: -1,
    leftIndent: 0.1,
    rightIndent: 0,
    firstLineIndent: 0
  }
  // editor.selection.cellFormat.leftMargin = 5.4
  // editor.selection.cellFormat.rightMargin = 5.4
  let offset1: string = addSignatureFirstLine(editor, legalName, reason, f, false, lateEntry, newParagraph)
  offset1 = addSignatureSecondLine(editor, offset1, initials, dateString, f, true, t)
  editor.selection.select(offset1, offset1)
  editor.isReadOnly = true
}

const matchUnderscoresRegExp = /^_{2,}$/g
const matchDotsRegExp = /^[\.\u2026]{2,}$/g
export const isStringAPlaceholder = (text: string) => {
  if (text == null || text.length === 0) {
    return false
  }
  if (text.match(matchUnderscoresRegExp) !== null) {
    return true
  } else if (text.match(matchDotsRegExp) !== null) {
    return true
  } else {
    return false
  }
}

export const insertTextIntoDocument = async (editor: DocumentEditor,
  selectionDescriptor: DocumentSelectionDescriptor, textValue: string,
  initials: string, dateString: string, markerCounter: number, lateEntry: boolean,
  excludeInitials: boolean, atCursorMode: boolean) => {
  if (editor.enableTrackChanges) editor.enableTrackChanges = false

  // const selection = editor.selection
  let endOfParagraphIndex = ""
  let lastIdx = 0
  let removedText = ""

  editor.isReadOnly = false

  let isPlaceholder = false
  const selectedText = editor.selection.text
  // console.log("Selected text: " + selectedText)
  const scrollTop = editor.documentHelper.viewerContainer.scrollTop

  if (isStringAPlaceholder(selectedText)) {
    // console.log("Placeholder selected")
    removedText = selectedText

    editor.editor.delete()

    isPlaceholder = true
    if (selectionDescriptor.tableCell) {
      toggleCellShadingColourToWhite(selectionDescriptor)
    }
  } else {
    if (selectionDescriptor.tableCell && !atCursorMode) {
      toggleCellShadingColourToWhite(selectionDescriptor)

      endOfParagraphIndex = selectionDescriptor.cellIndices[0]
      // const { initialWhitespace } = assessTableCell(tableCellDescriptor)
      // console.log("Move to end of cell: " + endOfParagraphIndex)
      lastIdx = parseInt(endOfParagraphIndex.split(";").slice(-1)[0], 10)

      editor.selection.select(endOfParagraphIndex, endOfParagraphIndex)
      // console.log("Moved to endo fo paragraph: " + endOfParagraphIndex)
    } else if (!atCursorMode) {
      // If not at cursor mode, find correct insertion point after user content
      editor.selection.selectParagraph();

      let offset = getLastOffset(editor.selection)

      // Skip past any BLUE paragraphs to insert after initials/date line
      offset = findInsertionPointAfterUserContent(editor, offset)

      lastIdx = parseInt(offset.split(";").slice(-1)[0], 10)
      // console.log("Selecting end of paragraph: " + lastIdx.toString())

      editor.selection.select(offset, offset)
    } else {
      const offset = getLastOffset(editor.selection)
      editor.selection.select(offset, offset)
    }
  }
  let newMarkerCounter = markerCounter

  let actionType = ActionType.EnterText
  if (atCursorMode) {
    actionType = excludeInitials ? ActionType.CursorEnterInitials : ActionType.TextAtCursor
  } else if (isPlaceholder) {
    actionType = ActionType.FillInBlank
  } else {
    actionType = excludeInitials ? ActionType.EnterInitials : ActionType.EnterText
  }

  let insertedText = ""
  if (!atCursorMode && !isPlaceholder) {
    // console.log("Inserting into table cell")
    // console.log("txtValue: " + textValue + " lastIdx: " + lastIdx.toString() + " initials: " + initials);
    ({ insertedText } = appendDataAfterContent(editor, textValue, initials, dateString, lastIdx !== 0, excludeInitials, lateEntry))
    // const cellsFilled = (tableCellDescriptor.cellState === CellState.EMPTY || tableCellDescriptor.cellState === CellState.PLACEHOLDER) ? 1 : 0
  } else {
    newMarkerCounter = markerCounter + 1
    let markerString = ""
    // if (lateEntry) markerString += LATE_CLOCK
    markerString += `${initials}*${newMarkerCounter}`
    // console.log("Inserting into body")
    let textToInsert = textValue.replace(/[\r\n]+/g, ' ')  // Strip newlines for cursor/placeholder insertions
    if (textToInsert[0] !== " ") textToInsert = " " + textToInsert
    // console.log("txtValue: " + textValue + " markerString: " + markerString);
    insertTextAtCursor(editor, textToInsert, markerString, isPlaceholder, lateEntry)
    insertedText = textValue
  }

  editor.documentHelper.viewerContainer.scrollTop = scrollTop

  editor.isReadOnly = true

  return { insertedText, removedText, markerCounter: newMarkerCounter, actionType }
}

export const appendSignatureIntoDocument = async (editor: DocumentEditor, selectionDescriptor: DocumentSelectionDescriptor | null,
  legalName: string, initials: string, markerCounter: number, reason: string, dateString: string, lateEntry: boolean, atCursor: boolean, t: TFunction<"translation", undefined>) => {
  if (editor.enableTrackChanges) editor.enableTrackChanges = false
  
  const description = reason;  // + "\n" + email;
  // console.log("reason " + description);
  if (selectionDescriptor == null) {
    // Restore read-only state if it was read-only before
    return { cellsFilled: 0, insertedText: "", markerCounter }
  }
  let endOfParagraphIndex = ""
  let lastIdx = 0
  editor.isReadOnly = false
  const scrollTop = editor.documentHelper.viewerContainer.scrollTop
  try {
    const isPlaceholder = isStringAPlaceholder(editor.selection.text)
    if (isPlaceholder) {
      // console.warn("Placeholder selected: " + editor.selection.text)
      editor.editor.delete()
      editor.editor.insertText("")
      if (selectionDescriptor.tableCell) {
        toggleCellShadingColourToWhite(selectionDescriptor)
      }
    } else {
      if (!atCursor && selectionDescriptor.tableCell) {
        toggleCellShadingColourToWhite(selectionDescriptor)
        endOfParagraphIndex = selectionDescriptor.cellIndices[0]
        // const { initialWhitespace } = assessTableCell(tableCellDescriptor)
        lastIdx = parseInt(endOfParagraphIndex.split(";").slice(-1)[0], 10)
        editor.selection.select(endOfParagraphIndex, endOfParagraphIndex)
      } else if (atCursor) {
        // If at cursor mode,
        const offset = getLastOffset(editor.selection)
        editor.selection.select(offset, offset)
      } else {
        // Body text path - find correct insertion point after user content
        editor.selection.selectParagraph();
        let offset = getLastOffset(editor.selection)

        // Skip past any BLUE paragraphs to insert after initials/date line
        offset = findInsertionPointAfterUserContent(editor, offset)

        lastIdx = parseInt(offset.split(";").slice(-1)[0], 10)
        // console.log("Selecting end of paragraph: " + lastIdx.toString())
        editor.selection.select(offset, offset)
      }
    }

    let newCorrectionCounter = markerCounter
    try {
      if (!isPlaceholder && !atCursor) {
        appendFullSignatureToPara(editor, legalName, initials, description, dateString, lastIdx !== 0, lateEntry, t)
        const insertedText = lastIdx !== 0 ? "\n" : ""
        editor.isReadOnly = true;
        // const cellsFilled = (tableCellDescriptor.cellState === CellState.EMPTY || tableCellDescriptor.cellState === CellState.PLACEHOLDER) ? 1 : 0
        return { cellsFilled: 0, insertedText, markerCounter }
      } else {
        newCorrectionCounter = markerCounter + 1
        insertSignatureInline(editor, legalName, reason, initials, newCorrectionCounter, lateEntry)
      }
      // Restore read-only state if it was read-only before
      editor.documentHelper.viewerContainer.scrollTop = scrollTop
      editor.isReadOnly = true;
      return { cellsFilled: 0, insertedText: "", markerCounter: newCorrectionCounter }
    } catch (error: unknown) {
      // Restore read-only state if it was read-only before
      editor.documentHelper.viewerContainer.scrollTop = scrollTop
      editor.isReadOnly = true;
      if (error == null) {
        return { cellsFilled: 0, insertedText: "", markerCounter: newCorrectionCounter }
      }
      if (error instanceof Error) {
        console.error("Unable to add signature: " + error.message)
      } else {
        console.error("Unknown error adding signature")
      }
      return { cellsFilled: 0, insertedText: "", markerCounter: newCorrectionCounter }
    }
  } catch (error) {
    // Ensure we restore read-only state even if there's an error
    editor.documentHelper.viewerContainer.scrollTop = scrollTop
    editor.isReadOnly = true;
    console.error("Error in appendSignatureIntoDocument:", error);
    return { cellsFilled: 0, insertedText: "", markerCounter };
  }
}


export const fileHash = async (data: ArrayBuffer) => {
  const hash = new Sha256();
  hash.update(data);
  const hashValue: Uint8Array = await hash.digest();
  const buffer = Buffer.from(hashValue.buffer)
  return buffer.toString("hex");
  // const o = new TextDecoder().decode(hashValue)
}

export const hashFromString = async (data: string) => {
  const hash = new Sha256();
  const cleanData = JSON.stringify(data).slice(1, -1)
  if (data !== cleanData) console.error("Content not equal after stringify")
  hash.update(cleanData);
  const hashValue: Uint8Array = await hash.digest();
  return base64ArrayBuffer(hashValue);
  // const o = new TextDecoder().decode(hashValue)
}

export const getStateFromAuditlogItem = (auditLogItem: IAuditLogItem): DocumentState => {
  if (auditLogItem === null) {
    console.error("Trying to edit unknown documentId")
    const state: DocumentState = {
      markerCounter: -1,
      emptyCellCount: -1,
      attachmentNumber: -1,
      nApprovalSignatures: -1,
      currentStage: -1,
      timezone: "",
      verifications: {},
      lastModified: 0
    }
    return state;
  }
  const state: DocumentState = {
    emptyCellCount: auditLogItem.emptyCellCount ? auditLogItem.emptyCellCount : 0,
    markerCounter: auditLogItem.markerCounter ? auditLogItem.markerCounter : 0,
    attachmentNumber: auditLogItem.attachmentNumber ? auditLogItem.attachmentNumber : 0,
    nApprovalSignatures: auditLogItem.nPostApprovals ? auditLogItem.nPostApprovals : 0,
    currentStage: auditLogItem.stage ? auditLogItem.stage : 0,
    timezone: auditLogItem.timezone ? auditLogItem.timezone : "",
    verifications: auditLogItem.verifications ? auditLogItem.verifications : {},
    lastModified: auditLogItem.time ? auditLogItem.time : 0
  }
  return state
};

export interface DocumentState {
  markerCounter: number
  emptyCellCount: number
  attachmentNumber: number
  nApprovalSignatures: number
  currentStage: number
  timezone: string,
  verifications: Verifications
  lastModified: number
}

export interface IGetCurrentStateResult {
  statusOK: boolean,
  timestamp: number,
  state: DocumentState,
  error?: string
}

export interface IVerifyDocumentContents {
  statusOK: boolean,
  time: string,
  error?: string
}

export const updateAuditLog = async (
  documentStore: Partial<DocumentStore>, auditItem: AuditLogItem, content: string,
  lng: string, leaveLock?: boolean, editor?: DocumentEditor | null, modalStore?: any
): Promise<BasicResult> => {
  if (documentStore.documentId == null || documentStore.setEditTime == null) {
    console.error("DocumentId or setEditTime is null")
    return { statusOK: false, error: "DocumentId or setEditTime is null" }
  }
  leaveLock = leaveLock != null ? leaveLock : false
  const returnVal: number = await sendAuditLogItem(documentStore.documentId, auditItem, content, lng, leaveLock);
  if (returnVal === 0) {
    documentStore.setEditTime(auditItem.time);
    return { statusOK: true, error: "" };
  }
  else if (returnVal >= 400 && returnVal <= 500) {
    return { statusOK: false, error: returnVal.toString() };
  } else if (returnVal === 2) {
    // Network error - show modal and trigger reload
    if (modalStore && modalStore.setNetworkError && editor) {
      console.log("Network error occurred - triggering document reload");
      modalStore.setNetworkError(true);
      // Import triggerReloadDocument dynamically to avoid circular dependency
      const { triggerReloadDocument } = await import('./editUtils');
      await triggerReloadDocument(editor, modalStore);
    }
    return { statusOK: false, error: "Network Error - Document reloaded" }
  } else {
    console.log("Connection with server failed");
    return { statusOK: false, error: "Connection with server failed" };
  }
};

export enum CellState {
  FILLED = 0,
  TOGGLEDPLACEHOLDER = 1,
  EMPTY = 2,
  PLACEHOLDER = 3,
  CHECKBOX = 4
}

export interface DocumentSelectionDescriptor {
  tableCell?: TableCellWidget
  cellState?: CellState
  cellIndices: string[]
  selection: Selection
  placeholder: boolean
}

// const scanTableCell = (cell: TableCellWidget, emptyCellCount: number, prefixIndex: string) => {
//   console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%Found a cell%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
//   console.log("Cell found")
//   console.log("Cell colour:" + cell.cellFormat.shading.backgroundColor + ":")

//   const cellColor = cell.cellFormat.shading.backgroundColor
//   if (cellColor.startsWith(FILLED_CELL_COLOUR) || cellColor == "empty") {
//     console.log("Cell color is white or empty")
//     const { cellState, emptyCellCountChange } = getCellState(cell, prefixIndex);
//     console.log("Cell state: " + cellState.toString())
//     emptyCellCount += emptyCellCountChange
//     switch (cellState) {
//       case CellState.EMPTY:
//         console.log("coloring empty cell")
//         cell.cellFormat.shading.backgroundColor = EMPTY_CELL_COLOUR
//         break
//       case CellState.CHECKBOX:
//         console.log("Coloring checkbox")
//         cell.cellFormat.shading.backgroundColor = EMPTY_CELL_COLOUR
//         break
//       case CellState.PLACEHOLDER:
//         console.log("coloring placeholder cell")
//         cell.cellFormat.shading.backgroundColor = PLACEHOLDER_CELL_COLOUR
//         break;
//       case CellState.FILLED:
//         console.log("coloring filled cell")
//         cell.cellFormat.shading.backgroundColor = FILLED_CELL_COLOUR
//         break
//       default:
//         console.warn("Unknown cell state")
//         break  // Do nothing
//     }
//   }
//   return emptyCellCount
// }

// const scanTableRow = (row: TableRowWidget, emptyCellCount: number, tableIndex: string) => {
//   row.childWidgets.forEach((_cell) => {
//     // Access the cell's content
//     console.log("Checking cell")
//     // if (!_cell.constructor.name.startsWith("TableCellWidget")) {
//     //   console.warn("Cell not of Cell widget type: " + _cell.constructor.name)
//     //   return emptyCellCount
//     // }
//     try {
//       const cell = _cell as TableCellWidget;
//       const prefixIndex = `${tableIndex};${cell.cellIndex};`
//       emptyCellCount = scanTableCell(cell, emptyCellCount, prefixIndex)
//     }
//   });
//   return emptyCellCount
// }

// const selectNextCell = (editor: DocumentEditor, table: TableWidget, indexPrefix: string, rowIndex?: number, cellIndex?: number): boolean => {
//   let selected = false
//   if (rowIndex === undefined) rowIndex = 0
//   if (cellIndex === undefined) cellIndex = -1
//   cellIndex += 1
//   for (let i = rowIndex; i < table.childWidgets.length; i++) {
//     console.log("#### - row index: " + i)
//     const row = table.childWidgets[i] as TableRowWidget;
//     const cellIndex0 = (i === rowIndex) ? cellIndex : 0
//     for (let j = cellIndex0; j < row.childWidgets.length; j++) {
//       console.log("####### - cell index: " + j)
//       const cell = row.childWidgets[j] as TableCellWidget;
//       if (cell.cellFormat.shading.backgroundColor === EMPTY_CELL_COLOUR || cell.cellFormat.shading.backgroundColor === PLACEHOLDER_CELL_COLOUR) {
//         console.log("selecting: row " + row.index + " " + row.rowIndex + " cell: " + cell.cellIndex)
//         const startIndex = indexPrefix + ";" + i.toString() + ";" + j.toString() + ";0;0"
//         const endIndex = indexPrefix + ";" + i.toString() + ";" + j.toString() + ";0;0"
//         console.log("Selecting start: " + startIndex + " end: " + endIndex)
//         editor.selection.select(startIndex, endIndex)
//         selected = true
//         return selected
//       }
//       if (cell.childWidgets.length > 0) {
//         for (let k = 0; k < cell.childWidgets.length; k++) {
//           const cellChild = cell.childWidgets[k]
//           if (cellChild instanceof ParagraphWidget) {
//             //do nothing
//           } else if (cellChild instanceof TableWidget) {
//             const table = cellChild as TableWidget
//             console.log("Found a table in cell: " + table.index + " " + k)
//             selected = selectNextCell(editor, table, indexPrefix + ";" + i.toString() + ";" + j.toString() + ";" + k.toString())
//             if (selected) return selected
//           } else {
//             console.warn("Unknown cell child type: " + cellChild.constructor.name)
//           }
//         }
//       }
//     }
//   }
//   return selected
// }

// const analyzeTableForEmptyCells = (table: TableWidget, emptyCellCount: number, sectionIndex: string) => {
//   table.childWidgets.forEach(_row => {
//     if (!_row.constructor.name.startsWith("TableRowWidget")) {
//       console.warn("Row not of TableRowWidget type: " + _row.constructor.name)
//       console.log("prototype" + stringifyCircular(TableRowWidget.prototype))
//       const proto = Object.getPrototypeOf(_row);
//       console.log("prototype" + stringifyCircular(proto))
//       return
//     }
//     console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%Found a row%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
//     const row = _row as TableRowWidget;
//     const prefixIndex = `${sectionIndex};${row.rowIndex};`
//     emptyCellCount = scanTableRow(row, emptyCellCount, prefixIndex)
//   })
//   return emptyCellCount
// }

export type IndexSet = {
  sectionIndex: number,
  tableIndex: number,
  rowIndex: number,
  cellIndex: number,
  blockIndex: number,
  otherIndices: number[],
  offset: number
}

export const compareFirstCellToSecond = (index1: string, index2: string): Comparison => {
  const firstIdxs = index1.split(";").map(idx => parseInt(idx))
  const secondIdxs = index2.split(";").map(idx => parseInt(idx))
  const length1 = firstIdxs.length
  const length2 = secondIdxs.length
  const shortest = Math.min(length1, length2)
  for (let i = 0; i < shortest - 2; i++) {
    if (firstIdxs[i] < secondIdxs[i]) return Comparison.FIRST_BEFORE_SECOND
    if (firstIdxs[i] > secondIdxs[i]) return Comparison.FIRST_AFTER_SECOND
  }
  if (length1 < length2) return Comparison.FIRST_BEFORE_SECOND
  if (length1 > length2) return Comparison.FIRST_AFTER_SECOND
  return Comparison.FIRST_SAME_AS_SECOND
}

const addEmptyTableCells = (tableIndex: string, table: TableWidget, tableCellIndicies: string[]) => {
  table.childWidgets.forEach((_row, rowIndex) => {
    if (_row instanceof TableRowWidget) {
      const row = _row as TableRowWidget
      row.childWidgets.forEach((_cell, cellIndex) => {
        if (_cell instanceof TableCellWidget) {
          const cell = _cell as TableCellWidget
          const cellFullIndex = tableIndex + ";" + rowIndex.toString() + ";" + cellIndex.toString()
          tableCellIndicies.push(cellFullIndex)
          cell.childWidgets.forEach((block, widgetIndex) => {
            if (block instanceof TableWidget) {
              const subTable = block as TableWidget
              const newTableIndex = cellFullIndex + ";" + widgetIndex.toString()
              addEmptyTableCells(newTableIndex, subTable, tableCellIndicies)
            }
          })
        }
      })
    }
  })
}

// const getAllTableCells = (editor: DocumentEditor) => {
//   const tableCells: TableCellWidget[] = []
//   const tableCellIndicies: string[] = []
//   const sections = editor.documentHelper.pages.map(section => section.bodyWidgets).flat();
//   sections.forEach(section => {
//     const sectionIndex = section.index
//     section.childWidgets.forEach(_block => {
//       if (_block instanceof TableWidget) {
//         const table = _block as TableWidget;
//         const tableIndex = sectionIndex.toString() + ";" + table.index.toString()
//         addEmptyTableCells(tableIndex, table, tableCellIndicies)
//       } else {
//         const block = _block as BlockWidget
//         console.log("Block not of type TableWidget: " + block.constructor.name)
//       }
//     });
//   })
//   return { tables: tableCells, tableCellIndicies }
// }

// export const selectNextEmptyTableCell = async (editor: DocumentEditor, _selection?: Selection) => {
//   console.log("Selecting next empty cell")
//   let docIndex = "0;0;0"
//   if (_selection) {
//     docIndex = _selection.endOffset
//   } else if (editor.selection) {
//     docIndex = editor.selection.endOffset
//   }
//   const { tableCellIndicies } = getAllTableCells(editor)
//   for (let i = 0; i < tableCellIndicies.length; i++) {
//     const tableCellIndex = tableCellIndicies[i]
//     const compareResult = compareFirstCellToSecond(tableCellIndex, docIndex)
//     console.log("Comparing: " + tableCellIndex + " " + docIndex + " " + compareResult)
//     if (compareResult === Comparison.FIRST_AFTER_SECOND) {
//       const selectionIndex = tableCellIndex + ";0;0"
//       editor.selection.select(selectionIndex, selectionIndex)
//       return
//     }
//   }
//   for (let i = 0; i < tableCellIndicies.length; i++) {
//     const tableCellIndex = tableCellIndicies[i]
//     const compareResult = compareFirstCellToSecond(tableCellIndex, docIndex)
//     if (compareResult === Comparison.FIRST_AFTER_SECOND) {
//       editor.selection.select(tableCellIndex, tableCellIndex)
//       return
//     }
//   }
// }

// export const scanDocumentForEmptyTableCells = (editor: DocumentEditor) => {
//   let emptyCellCount = 0;
//   const pages = editor.documentHelper.pages.map(page => page.bodyWidgets).flat();
//   console.log("Scanning document for empty cells")
//   console.log("Number of pages: " + pages.length)
//   pages.forEach(page => {
//     console.log("page: index: " + page.index.toString())
//     const sectionIndex = page.index
//     page.childWidgets.forEach(_block => {
//       console.log("looking for widgets")
//       if (_block instanceof TableWidget) {
//         const block = _block as TableWidget;
//         console.log("Found a table: " + block.index)
//         emptyCellCount = analyzeTableForEmptyCells(block, emptyCellCount, sectionIndex.toString())
//       } else {
//         console.warn("Block not of type TableWidget: " + _block.constructor.name)
//         console.log("Block not of type TableWidget: ")
//       }
//     });
//   });
//   return emptyCellCount;
// }

export function stringifyCircular(obj: unknown) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  });
}

// const updateCellState = (currentState: CellState, newState: CellState) => {
//   switch (newState) {
//     case (CellState.PLACEHOLDER):
//       return newState
//     case (CellState.CHECKBOX):
//       if (currentState !== CellState.PLACEHOLDER)
//         return newState
//       else
//         return currentState
//     case (CellState.FILLED):
//       if (currentState === CellState.EMPTY)
//         return newState
//       else
//         return currentState
//     default:
//       return currentState
//   }
// }

// const getLineWidgetText = (line: LineWidget): string => {
//   let text = ""
//   for (let k = 0; k < line.children.length; k++) {
//     const inlineLineChild: ElementBox = line.children[k]
//     // console.log("child: " + inlineLineChild.constructor.name)
//     if (inlineLineChild instanceof TextElementBox) {
//       const textBox = inlineLineChild as TextElementBox
//       console.log("text: " + textBox.text)
//       console.log("length: " + textBox.text.length)
//       text += textBox.text
//     } else if (inlineLineChild instanceof ContentControl) {
//       const a = inlineLineChild as unknown as ContentControl
//       console.log("Found ContentControl")
//       console.log("length of content control: " + a.getLength() || 0)
//       if (inlineLineChild.isCheckBoxElement) {
//         const a = inlineLineChild as unknown as CheckBoxFormField
//         if (a.checked) {
//           text += "\u2611"
//         } else {
//           text += "\u2610"
//         }
//       }
//     } else {
//       console.warn("Inline Line children not text elementBoxes: " + inlineLineChild.constructor.name)
//     }
//   }
//   return text
// }

// export const getParagraphText = (paragraph: ParagraphWidget): string => {
//   if (paragraph.childWidgets == null) return ""
//   if (paragraph.childWidgets.length === 0) return ""
//   console.log("Found paragraph%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
//   console.log("Number of childWidgets: " + paragraph.childWidgets.length)
//   let text = ""
//   for (let j = 0; j < paragraph.childWidgets.length; j++) {
//     const inline = paragraph.childWidgets[j]
//     if (inline instanceof TextElementBox) {
//       console.log("text: " + text)
//       console.log("length: " + text.length + "  " + inline.getLength()
//       )
//       text += inline.text
//     } else if (inline instanceof LineWidget) {
//       console.log("Found LineWidget in get ParagraphText")
//       const tex = getLineWidgetText(inline as LineWidget)
//       console.log("Line text: ->" + tex + "<-")
//       console.log("length: " + tex.length)
//       text += getLineWidgetText(inline as LineWidget)
//     } else {
//       console.warn("Unknown child type: " + inline.constructor.name)
//     }
//   }
//   console.log("Paragraph text: ->" + text + "<-")
//   return text
// }

// const updateCellStateWithText = (text: string, currentState: CellState, emptyCellCountChange: number) => {
//   if (text.trim().length !== 0) {
//     console.log("Cell text: " + text)
//     if (text.match(/_{3,}/)) {
//       currentState = updateCellState(currentState, CellState.PLACEHOLDER)
//       emptyCellCountChange++
//     } else if (text.match(/\u2610/)) {
//       console.log("Setting Checkbox")
//       console.log("Current state: " + currentState)
//       currentState = updateCellState(currentState, CellState.CHECKBOX)
//       console.log("Current state: " + currentState)
//       emptyCellCountChange++
//     } else {
//       currentState = updateCellState(currentState, CellState.FILLED)
//     }
//   }
//   return { currentState, emptyCellCountChange }
// }

// interface IGetCellState {
//   cellState: CellState
//   emptyCellCountChange: number
// }
// const getCellState = (cell: TableCellWidget, prefix: string): IGetCellState => {
//   let currentState = CellState.EMPTY
//   let emptyCellCountChange = 0
//   for (let i = 0; i < cell.childWidgets.length; i++) {
//     const child = cell.childWidgets[i]
//     if (child instanceof ParagraphWidget) {
//       console.warn("Found ParagraphWidget in table cell")
//       const text = getParagraphText(child)
//       console.log("Cell text: " + text);
//       ({ currentState, emptyCellCountChange } = updateCellStateWithText(text, currentState, emptyCellCountChange))
//     } else if (child instanceof LineWidget) {
//       console.warn("Found LineWidget in getCellState")
//       const text = getLineWidgetText(child as LineWidget);
//       ({ currentState, emptyCellCountChange } = updateCellStateWithText(text, currentState, emptyCellCountChange))
//     } else if (child instanceof ImageElementBox) {
//       console.warn("Found ImageElementBox in getCellState");
//       ({ currentState, emptyCellCountChange } = updateCellStateWithText("not empty", currentState, emptyCellCountChange))
//     } else if (child instanceof TableWidget) {
//       ({ currentState, emptyCellCountChange } = updateCellStateWithText("not empty", currentState, emptyCellCountChange))
//       emptyCellCountChange = analyzeTableForEmptyCells(child, emptyCellCountChange, prefix)
//     } else {
//       console.warn("Unknown child type: " + child.constructor.name)
//     }
//   }
//   return { cellState: currentState, emptyCellCountChange }
// }

const getCellStateFromCellColour = (colour: string): CellState => {
  // console.log("Colour: " + colour)
  colour = colour == "empty" ? "#FFFFFF" : colour
  switch (colour.toUpperCase()) {
    case EMPTY_CELL_COLOUR:
    case SELECTED_EMPTY_CELL_COLOUR:
      return CellState.EMPTY
    case PLACEHOLDER_CELL_COLOUR:
    case SELECTED_PLACEHOLDER_CELL_COLOUR:
      return CellState.PLACEHOLDER
    case FILLED_CELL_COLOUR:
    case SELECTED_FILLED_CELL_COLOUR:
      return CellState.FILLED
    default:
      return CellState.FILLED
  }
}

const sameParagraphs = (para1: ParagraphWidget, para2: ParagraphWidget): boolean => {
  // First check if they're the same object reference
  if (para1 === para2) {
    return true;
  }
  // Check if they have the same index in the document
  if (para1.index === para2.index &&
    para1.containerWidget === para2.containerWidget) {
    return true;
  }
  // // Additional check: compare their hierarchical index if available
  // if (para1.getHierarchicalIndex && para2.getHierarchicalIndex) {
  //   const index1 = para1.getHierarchicalIndex("");
  //   const index2 = para2.getHierarchicalIndex("");
  //   const result = index1 === index2;
  //   console.log("Same hierarchical index: " + result.toString())
  // }

  return false;
}
export const getTableCellFromSelection = async (editor: DocumentEditor, _selection?: Selection): Promise<DocumentSelectionDescriptor | null> => {
  const selection = _selection || editor.selection
  if (selection == null) return null
  const initialStartIndex = selection.startOffset
  const initialEndIndex = selection.endOffset
  const placeholder = isStringAPlaceholder(selection.text)
  const selectionPrefix = initialStartIndex.split(";").slice(0, -2).join(";")
  let blockIndex = initialStartIndex.split(";").slice(-2)[0]
  let offset = "0"
  const start = selection.start
  const end = selection.end
  let startCell: TableCellWidget | null = null
  let endCell: TableCellWidget | null = null

  const scrollTop = editor.documentHelper.viewerContainer.scrollTop
  startCell = start.paragraph.associatedCell as TableCellWidget
  endCell = end.paragraph.associatedCell as TableCellWidget
  let cellState: CellState | undefined = undefined
  if (start.paragraph.isInsideTable && end.paragraph.isInsideTable) {
    if (startCell && !startCell.equals(endCell)) {
      const modalStore = useModalStore.getState()
      modalStore.setMultipleTableCellsSelected(true)
      return null  // Selction is not in a single cell
    }
    cellState = getCellStateFromCellColour(startCell.cellFormat.shading.backgroundColor)
    editor.selection.selectCell()
    if (editor.selection && editor.selection.isForward) {
      if (editor.selection.text === "\r")
        offset = "0"
      else 
        offset = editor.selection.endOffset.split(";").slice(-1)[0]
      blockIndex = editor.selection.endOffset.split(";").slice(-2)[0]
    } else {
      offset = editor.selection.endOffset.split(";").slice(-2)[0]
      blockIndex = editor.selection.endOffset.split(";").slice(-1)[0]
    }
    editor.selection.select(initialStartIndex, initialEndIndex)
  } else if (!start.paragraph.isInsideTable && !end.paragraph.isInsideTable) {
    if (sameParagraphs(start.paragraph, end.paragraph)) {
      offset = start.paragraph.getTotalLength().toString()
    } else {
      const modalStore = useModalStore.getState()
      modalStore.setMultipleParagraphsSelected(true)
      console.log("Selection not in same paragraph")
      throw new MultipleParaGraphsError("Not in same table cell or paragraph")
    }
  } else {
    console.warn("Selection not in same table cell")
    throw new MultipleParaGraphsError("Not in same table cell")
  }
  editor.documentHelper.viewerContainer.scrollTop = scrollTop
  const endCellIndex = `${selectionPrefix};${blockIndex};${offset}`
  return { tableCell: startCell, cellState, cellIndices: [endCellIndex], selection, placeholder }
};

export const appendAttachmentTitleAndLinkIntoSelectedCell = async (
  editor: DocumentEditor,
  selectionDescriptor: DocumentSelectionDescriptor,
  url: string,
  attachmentName: string,
  attachmentText: string,
  initials: string,
  dateString: string,
  lateEntry: boolean,
  atCursor: boolean,
  markerCounter: number
) => {
  let insertedText = attachmentText

  if (selectionDescriptor == null) return { cellsFilled: 0, insertedText: "", newMarkerCounter: markerCounter }
  // console.log("Inserting hyperlink into selected cell")
  const emptyCellCountChange = toggleCellShadingColourToWhite(selectionDescriptor)

  editor.isReadOnly = false
  const scrollTop = editor.documentHelper.viewerContainer.scrollTop
  let newMarkerCounter = markerCounter
  try {
    let lastIdx = "0"
    let replacingPlaceholder = false
    if (isStringAPlaceholder(editor.selection.text)) {
      replacingPlaceholder = true
    } else if (!atCursor && selectionDescriptor.tableCell){
      const endOfCellIndex = selectionDescriptor.cellIndices[0]
      lastIdx = endOfCellIndex.split(";").slice(-1)[0]
      editor.selection.select(endOfCellIndex, endOfCellIndex)
    } else if (!atCursor) {
      // Body text path - find correct insertion point after user content
      editor.selection.selectParagraph();
      let offset = getLastOffset(editor.selection)

      // Skip past any BLUE paragraphs to insert after initials/date line
      offset = findInsertionPointAfterUserContent(editor, offset)

      lastIdx = offset.split(";").slice(-1)[0]
      editor.selection.select(offset, offset)
      // not a placeholder, and not in a table cell, that leaves adding in the body
    } else {
      const offset = getLastOffset(editor.selection)
      editor.selection.select(offset, offset)
    }
    const f: Partial<SelectionParagraphFormat> = {
      textAlignment: "Left",
      afterSpacing: 0,
      beforeSpacing: 0,
      spaceAfterAuto: false,
      spaceBeforeAuto: false,
      lineSpacing: 1.0,
      listId: 0,
      listLevelNumber: -1,
      leftIndent: 0.1,
      rightIndent: 0,
      firstLineIndent: 0
    }
    // editor.selection.cellFormat.leftMargin = 5.4
    // editor.selection.cellFormat.rightMargin = 5.4
    // formatSelection(editor, ENTRYFORMAT, f)
    let offset1 = getLastOffset(editor.selection)
    let textToInsert = ""
    let startOfContent = offset1

    if (lastIdx !== "0") {
      f.firstLineIndent = 0
      startOfContent = moveSelectionIndexToStartNextParagraph(offset1)
      textToInsert = "\n"
    }

    if (attachmentText[0] !== " ") {
      textToInsert += " "
    }

    if (textToInsert) {
      editor.editor.insertText(textToInsert);
      const endOfContent = getLastOffset(editor.selection)
      editor.selection.select(startOfContent, endOfContent)
      if (replacingPlaceholder || atCursor)
        formatSelection(editor, ENTRYFORMAT)
      else
        formatSelection(editor, ENTRYFORMAT, f)
      editor.selection.select(endOfContent, endOfContent)
      offset1 = endOfContent
    }
    editor.editor.insertHyperlink(encodeUrlFilename(url), attachmentText, attachmentName);
    // ({ offset1, offset2 } = makeTextSelection(offset1, attachmentText.length + url.length + 2)) // +2 for the brackets
    let offset2 = editor.selection.endOffset
    editor.selection.select(offset1, offset2)
    if (replacingPlaceholder || atCursor) {
      formatSelection(editor, HYPERFORMAT)
    } else {
      formatSelection(editor, HYPERFORMAT, f)
    }
    editor.selection.select(offset2, offset2)
    if (lateEntry) {
      const lateEntryText = LATE_CLOCK
      editor.editor.insertText(lateEntryText);
      ({ offset1, offset2 } = makeTextSelection(offset2, lateEntryText.length))
      editor.selection.select(offset1, offset2)
      const clockFormat: Partial<SelectionCharacterFormat> = { ...HYPERFORMAT, ...CLOCKFORMAT }
      if (replacingPlaceholder || atCursor) {
        formatSelection(editor, clockFormat)
      } else {
        formatSelection(editor, clockFormat, f)
      }
      editor.selection.select(offset2, offset2)
    }
    if (replacingPlaceholder || atCursor) {
      newMarkerCounter += 1
      const superScriptText = `${initials}*${newMarkerCounter}`
      editor.editor.insertText(superScriptText);
      ({ offset1, offset2 } = makeTextSelection(offset2, superScriptText.length))
      editor.selection.select(offset1, offset2)
      formatSelection(editor, SUPERSCRIPTFORMAT)
    } else {
      const startOfDateContent = moveSelectionIndexToStartNextParagraph(offset2)
      const initialsAndDate = initials + " " + dateString
      editor.editor.insertText("\n" + initialsAndDate);
      const endOfDateContent = getLastOffset(editor.selection)
      offset1 = startOfDateContent
      offset2 = endOfDateContent
      editor.selection.select(offset1, offset2)
      formatSelection(editor, INITIALSANDDATEFORMAT, f)
    }
    editor.selection.select(offset2, offset2)

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error inserting attachment title and link: " + err.message)
    } else {
      console.error("Unknown error inserting attachment title and link")
    }
  } finally {
    editor.documentHelper.viewerContainer.scrollTop = scrollTop
    editor.isReadOnly = true
  }
  return { cellsFilled: -emptyCellCountChange, insertedText, newMarkerCounter }
}

const insertTextAtCursor = (
  editor: DocumentEditor,
  text: string,
  markerString: string,
  isPlaceholder: boolean,
  lateEntry: boolean
) => {
  if (!editor.selection) return

  editor.isReadOnly = false

  let offset1 = editor.selection.startOffset
  let offset2 = ""

  editor.editor.insertText(text);

  ({ offset1, offset2 } = makeTextSelection(offset1, text.length))
  editor.selection.select(offset1, offset2)

  if (isPlaceholder) {
    formatSelection(editor, PLACEHOLDERFORMAT)
  } else {
    formatSelection(editor, ENTRYFORMAT)
  }

  editor.selection.select(offset2, offset2)

  editor.editor.insertText(markerString);

  ({ offset1, offset2 } = makeTextSelection(offset2, markerString.length))
  editor.selection.select(offset1, offset2)

  formatSelection(editor, SUPERSCRIPTFORMAT)

  editor.selection.select(offset2, offset2)

  if (lateEntry) {
    const lateEntryText = LATE_CLOCK
    editor.editor.insertText(lateEntryText);
    ({ offset1, offset2 } = makeTextSelection(offset2, lateEntryText.length))
    editor.selection.select(offset1, offset2)
    const clockFormat: Partial<SelectionCharacterFormat> = { ...SUPERSCRIPTFORMAT, ...CLOCKFORMAT }
    formatSelection(editor, clockFormat)
    editor.selection.select(offset2, offset2)
  }

  editor.isReadOnly = true
}

// export const replaceSelectedUnderscore = async (
//   editor: DocumentEditor,
//   selectionDescriptor: DocumentSelectionDescriptor | null,
//   newText: string,
//   markerCounter: number,
//   user: RUser,
//   lateEntry: boolean
// ) => {
//   if (selectionDescriptor === null) {
//     return { cellsFilled: 0, insertedText: "", removedText: "", foundPlaceholder: false }
//   }
//   if (selectionDescriptor.selection === null) {
//     return { cellsFilled: 0, insertedText: "", removedText: "", foundPlaceholder: false }
//   }
//   let currentSelection = selectionDescriptor.selection
//   const removedText = currentSelection.text
//   let insertedText = ""
//   editor.editor.delete()
//   // const cellState = tableCellDescriptor.cellState
//   // const cellsFilled = cellState === CellState.PLACEHOLDER ? 1 : 0
//   let markerString = user.tenants[user.tenantName].initials + "*" + markerCounter.toString()
//   if (lateEntry) {
//     markerString += LATE_CLOCK
//   }
//   insertTextAtCursor(editor, newText, markerString, true)
//   insertedText = newText
//   let foundPlaceholder = false
//   // if (selectionDescriptor !== null && selectionDescriptor.cellIndices.length > 0) {
//   //   foundPlaceholder = selectNextTableCellPlaceholder(editor, selectionDescriptor.cellIndices[0])
//   // }
//   console.log("Selected next placeholder: " + foundPlaceholder.toString())
//   if (!foundPlaceholder && selectionDescriptor !== null) {
//     toggleCellShadingColourToWhite(selectionDescriptor)
//   }
//   return { cellsFilled: 0, insertedText, removedText, foundPlaceholder }
// }

export const moveSelectionIndexToStartNextParagraph = (offset: string): string => {
  const parts = offset.split(";")
  if (parts.length < 2) {
    return offset
  }
  const root = parts.slice(0, -2).join(";")
  const blockIndex = parseInt(parts.slice(-2)[0])
  return `${root};${blockIndex + 1};0`
}

// Fonts used for user-entered content (text entries, attachments)
export const USER_CONTENT_FONTS = ['inter']

// Fonts used for signature names (protected - no insertion allowed)
export const SIGNATURE_CONTENT_FONTS = ['kalam']

// Fonts used for system content (initials/date line, markers, checkboxes)
export const SYSTEM_CONTENT_FONTS = ['roboto mono', 'segoe ui emoji', 'segoe ui symbol']

/**
 * Classification of paragraph content based on the font of its last text element:
 * - 'user': Inter - user entries, attachments, text content
 * - 'signature': Kalam - signature names (protected, no insertion allowed)
 * - 'system': Roboto Mono/Segoe UI - initials/date line, markers, checkboxes
 * - 'document': Unknown font - original document text
 * - 'empty': No text content
 */
export type ParagraphContentType = 'user' | 'signature' | 'system' | 'document' | 'empty'

/**
 * Classify what type of content a paragraph ENDS with based on the font of its last text element.
 * Skips empty/whitespace-only text elements (paragraph markers, artifacts).
 */
export const classifyParagraphContent = (paragraph: ParagraphWidget): ParagraphContentType => {
  // Iterate backwards through lines to find the last meaningful text element
  for (let i = paragraph.childWidgets.length - 1; i >= 0; i--) {
    const child: IWidget = paragraph.childWidgets[i]
    if (child instanceof LineWidget) {
      for (let j = child.children.length - 1; j >= 0; j--) {
        const lineChild = child.children[j]
        if (lineChild instanceof TextElementBox) {
          const text = lineChild.text

          // Skip empty or whitespace-only text elements (paragraph markers, etc.)
          if (!text || text.trim().length === 0) {
            continue
          }

          const fontFamily = (lineChild as any).characterFormat?.fontFamily?.toLowerCase()

          if (fontFamily && USER_CONTENT_FONTS.includes(fontFamily)) {
            return 'user'
          }
          if (fontFamily && SIGNATURE_CONTENT_FONTS.includes(fontFamily)) {
            return 'signature'
          }
          if (fontFamily && SYSTEM_CONTENT_FONTS.includes(fontFamily)) {
            return 'system'
          }
          // Unknown font - original document text
          return 'document'
        }
      }
    }
  }

  return 'empty'
}

/**
 * Check if a paragraph ends with user-entered content.
 */
export const isParagraphUserContent = (paragraph: ParagraphWidget): boolean => {
  return classifyParagraphContent(paragraph) === 'user'
}

/**
 * Look backwards from current paragraph to check if we're inside a user entry.
 * Returns true if we find user content before hitting system/document content.
 */
export const checkBackwardsForUserContent = (
  editor: DocumentEditor,
  currentOffset: string
): boolean => {
  const parts = currentOffset.split(";")
  const root = parts.slice(0, -2).join(";")
  let blockIndex = parseInt(parts.slice(-2)[0])

  // Look backwards through previous paragraphs
  while (blockIndex > 0) {
    blockIndex--
    const prevParagraphOffset = `${root};${blockIndex};0`
    editor.selection.select(prevParagraphOffset, prevParagraphOffset)
    const prevParagraph = editor.selection.start.paragraph

    const contentType = classifyParagraphContent(prevParagraph)

    if (contentType === 'user') {
      // Found user content - we're inside a user entry
      return true
    } else if (contentType === 'system' || contentType === 'document') {
      // Found system/document content - we're not inside a user entry
      return false
    }
    // Empty paragraph - keep looking backwards
  }

  // Reached beginning without finding user content
  return false
}

/**
 * For body text insertions: find the correct insertion point by skipping
 * past any user content paragraphs to insert after the initials/date line.
 *
 * Uses state-based search:
 * 1. First looks BACKWARDS to check if we're inside a user entry (handles clicking on blank line)
 * 2. Then looks FORWARD:
 *    - 'user' paragraph → continue to next paragraph
 *    - 'system' paragraph → found end marker (initials/date), return end of this paragraph
 *    - 'document' paragraph → found original document text, return end of this paragraph
 *    - 'empty' paragraph → if we've seen user content, continue (blank line); otherwise stop
 *
 * @param editor - The DocumentEditor instance
 * @param currentOffset - The current selection offset
 * @returns The offset at the end of the insertion point paragraph
 */
export const findInsertionPointAfterUserContent = (
  editor: DocumentEditor,
  currentOffset: string
): string => {
  let paragraph = editor.selection.start.paragraph
  let lastOffset = currentOffset

  // First check current paragraph
  const currentType = classifyParagraphContent(paragraph)

  // Determine initial state - check if we're already inside a user entry
  let foundUserContent = currentType === 'user'

  // If current paragraph is empty, look backwards to see if we're inside a user entry
  if (currentType === 'empty') {
    foundUserContent = checkBackwardsForUserContent(editor, currentOffset)
    // Restore selection to current position
    editor.selection.select(currentOffset, currentOffset)
  }

  // If we're on system/document content, return end of this paragraph
  if (currentType === 'system' || currentType === 'document') {
    editor.selection.selectParagraph()
    lastOffset = getLastOffset(editor.selection)
    editor.selection.select(lastOffset, lastOffset)
    // console.log("findInsertionPoint: current is " + currentType + ", inserting at: " + lastOffset)
    return lastOffset
  }

  // If empty and no user content found backwards, stop here
  if (currentType === 'empty' && !foundUserContent) {
    // console.log("findInsertionPoint: empty paragraph, no user content found, stopping")
    return lastOffset
  }

  // Now search forward
  // console.log("findInsertionPoint: searching forward, foundUser=" + foundUserContent)

  while (true) {
    // Move to next paragraph
    const parts = lastOffset.split(";")
    const root = parts.slice(0, -2).join(";")
    const blockIndex = parseInt(parts.slice(-2)[0])
    const nextParagraphOffset = `${root};${blockIndex + 1};0`

    editor.selection.select(nextParagraphOffset, nextParagraphOffset)
    const newParagraph = editor.selection.start.paragraph

    if (newParagraph === paragraph) {
      // Couldn't move to next paragraph - we're at the end of the container
      const paragraphLength = paragraph.getTotalLength()
      lastOffset = `${root};${blockIndex};${paragraphLength}`
      editor.selection.select(lastOffset, lastOffset)
      // console.log("findInsertionPoint: reached end at: " + lastOffset)
      return lastOffset
    }

    // Update for next iteration
    paragraph = newParagraph
    editor.selection.selectParagraph()
    lastOffset = getLastOffset(editor.selection)
    editor.selection.select(lastOffset, lastOffset)

    const contentType = classifyParagraphContent(paragraph)
    // console.log("findInsertionPoint: type=" + contentType + " foundUser=" + foundUserContent)

    if (contentType === 'system' || contentType === 'document') {
      // System content (initials/date) or document text - this is our insertion point
      // console.log("findInsertionPoint: found " + contentType + " paragraph, inserting at: " + lastOffset)
      return lastOffset
    }
  }
}

export const appendDataAfterContent = (
  editor: DocumentEditor,
  text: string,
  initials: string,
  dateString: string,
  initialNewline: boolean,
  excludeInitials: boolean,
  lateEntry: boolean,
) => {
  if (editor.selection === null) return { insertedText: "" }
  if (text.length === 0) return { insertedText: "" }

  editor.isReadOnly = false
  let insertedText = ""
  try {
    const selection = editor.selection
    let offset1:string
    let offset2:string
    let startOfEntryContent = getLastOffset(selection)
    const f: Partial<SelectionParagraphFormat> = {
      textAlignment: "Left",
      afterSpacing: 0,
      beforeSpacing: 0,
      spaceAfterAuto: false,
      spaceBeforeAuto: false,
      lineSpacing: 1.0,
      listId: 0,
      listLevelNumber: -1,
      leftIndent: 0.1,
      rightIndent: 0,
      firstLineIndent: 0
    }
    // selection.cellFormat.leftMargin = 5.4
    // selection.cellFormat.rightMargin = 5.4
    if (initialNewline) {
      // formatSelection(editor, ENTRYFORMAT, f)
      // editor.editor.insertText("\n");
      insertedText = "\n"
      startOfEntryContent = moveSelectionIndexToStartNextParagraph(startOfEntryContent)
    }
    // offset2 = selection.endOffset
    insertedText += text
    editor.editor.insertText(insertedText);
    const endOfEntryContent = getLastOffset(editor.selection);
    editor.selection.select(startOfEntryContent, endOfEntryContent)
    formatSelection(editor, ENTRYFORMAT, f)
    editor.selection.select(endOfEntryContent, endOfEntryContent)
    offset2 = endOfEntryContent
    if (lateEntry) {
      const lateEntryText = LATE_CLOCK
      editor.editor.insertText(lateEntryText);
      ({ offset1, offset2 } = makeTextSelection(offset2, lateEntryText.length))
      editor.selection.select(offset1, offset2)
      const clockFormat: Partial<SelectionCharacterFormat> = { ...SUPERSCRIPTFORMAT, ...CLOCKFORMAT }
      formatSelection(editor, clockFormat, f)
      editor.selection.select(offset2, offset2)
    }
    // editor.editor.insertText("\n");
    startOfEntryContent = moveSelectionIndexToStartNextParagraph(offset2);
    let dateTimeString = "\n" + (excludeInitials ? dateString : initials + " " + dateString)
    editor.editor.insertText(dateTimeString);
    const endOfDateTimeString = getLastOffset(editor.selection);
    // ({ offset1, offset2 } = makeTextSelection(offset2, dateTimeString.length));
    editor.selection.select(startOfEntryContent, endOfDateTimeString)
    formatSelection(editor, INITIALSANDDATEFORMAT, f)
    editor.selection.select(endOfDateTimeString, endOfDateTimeString)
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Ignoring Error appending data after content: " + err.message)
    } else {
      console.error("Unknown error appending data after content")
    }
  } finally {
    editor.isReadOnly = true
  }
  return { insertedText }
}

export const appendDataIntoSelectedCell = async (
  editor: DocumentEditor,
  selectionDescriptor: DocumentSelectionDescriptor,
  newText: string,
  initials: string,
  dateString: string,
  excludeInitials: boolean,
  lateEntry: boolean
) => {
  let emptyCellCountChange = 0
  // if (!tableCellDescriptor.tableCell) {
  //   return { cellsFilled: 0, insertedText: "" }
  // }
  emptyCellCountChange = toggleCellShadingColourToWhite(selectionDescriptor)
  // const { initialWhitespace } = assessTableCell(tableCellDescriptor)
  const endOfCellIndex = selectionDescriptor.cellIndices[0]
  const lastIdx = endOfCellIndex.split(";").slice(-1)[0]
  let initialWhitespace = ""
  if (lastIdx !== "0") {
    initialWhitespace = "\n"
  }
  editor.selection.select(endOfCellIndex, endOfCellIndex)
  const { insertedText } = appendDataAfterContent(editor, newText, initials, dateString, initialWhitespace.length !== 0, excludeInitials, lateEntry)
  return { cellsFilled: -emptyCellCountChange, insertedText }
}

export const goToStage = async (
  documentId: string,
  stage: number,
  lng: string,
  reason: string,
  time: number,
  setDocumentInUse: (value: boolean) => void,
  setUser: (user: User | null) => void,
  setDocumentStage: (v: number) => void,
  nPages?: number
) => {
  // const oldStage = documentStage ? documentStage : -1;
  try {
    if (stage === Stage.Draft) {
      // await updateDocumentStage(stage);
      setDocumentStage(stage);
      sessionStorage.setItem("documentStage", stage.toString());
      return;
    }
    const setServerReturnVal = await setServerDocumentStage(documentId, stage, lng, reason, time, nPages);
    if (setServerReturnVal === 0) {
      // await updateDocumentStage(stage);
      setDocumentStage(stage);
      sessionStorage.setItem("documentStage", stage.toString());
    } else if (setServerReturnVal === 111) {
      setDocumentInUse(true);
    } else if (setServerReturnVal === 401) {
      setUser(null)
    } else {
      console.error("Unknown Error:");
    }
  } catch (err: unknown) {
    const eee = err as Error;
    console.error(" set stage fail", eee.toString());
  }
  return;
};

export interface IUniqueCellDict {
  [key: string]: TableCellWidget
}

// Add Comparison enum declaration
export enum Comparison {
  FIRST_BEFORE_SECOND = -1,
  FIRST_SAME_AS_SECOND = 0,
  FIRST_AFTER_SECOND = 1
}

/**
 * Result of cursor position validation for AtCursor insertion
 */
export interface CursorValidationResult {
  isValid: boolean
  reason?: 'in_user_content' | 'in_system_content' | 'valid_document' | 'valid_boundary' | 'valid_after_system'
  errorMessageKey?: string
}

/**
 * Gets the content type at the current cursor position by examining
 * the font family of the text element at that offset.
 *
 * Unlike classifyParagraphContent() which looks at the END of the paragraph,
 * this function examines content AT the cursor position.
 *
 * Also tracks:
 * - isBeforeFirstNonWhitespace: true if cursor is in leading whitespace of the element
 * - precedingElementType: content type of the immediately preceding text element
 */
export const getContentTypeAtCursor = (editor: DocumentEditor): {
  contentType: ParagraphContentType
  isAtElementStart: boolean
  isAtElementEnd: boolean
  isBeforeFirstNonWhitespace: boolean
  precedingElementType: ParagraphContentType
  followingElementType: ParagraphContentType
  currentOffset: string
  fontFamily: string  // Actual font family of the current element
  followingFontFamily: string  // Actual font family of the following element
} => {
  const selection = editor.selection
  const paragraph = selection.start.paragraph
  const currentOffset = selection.startOffset

  // Default return for empty/no paragraph
  if (!paragraph || !paragraph.childWidgets || paragraph.childWidgets.length === 0) {
    return { contentType: 'empty', isAtElementStart: true, isAtElementEnd: true, isBeforeFirstNonWhitespace: true, precedingElementType: 'empty', followingElementType: 'empty', currentOffset, fontFamily: '', followingFontFamily: '' }
  }

  // Parse cursor offset from selection
  const offsetParts = currentOffset.split(';')
  const cursorOffsetInParagraph = parseInt(offsetParts[offsetParts.length - 1])

  // Walk through paragraph to find text element at cursor position
  // IMPORTANT: We must count ALL element lengths (not just TextElementBox) because
  // the cursor offset includes bookmarks, fields, images, etc.
  let accumulatedLength = 0
  let foundElement: TextElementBox | null = null
  let lastTextElement: TextElementBox | null = null
  let precedingTextElement: TextElementBox | null = null
  let followingTextElement: TextElementBox | null = null
  let offsetInElement = 0
  let foundElementFlag = false

  for (const child of paragraph.childWidgets) {
    if (child instanceof LineWidget) {
      for (const lineChild of child.children) {
        // Use getLength() for accurate element length including hidden content
        const elementLength = typeof (lineChild as any).getLength === 'function'
          ? (lineChild as any).getLength()
          : (lineChild as any).text?.length ?? 1

        // Track the last TextElementBox we've seen (for end-of-paragraph case)
        if (lineChild instanceof TextElementBox) {
          lastTextElement = lineChild
        }

        // If we already found the element, capture the next TextElementBox as following
        // followingTextElement is always null as we break the inner and later the out loop... leaving in for clarity of intent
        if (foundElementFlag && !followingTextElement && lineChild instanceof TextElementBox) {
          followingTextElement = lineChild
          break // We have everything we need
        }

        // Check if cursor is within or at the start of this element
        if (accumulatedLength + elementLength >= cursorOffsetInParagraph && !foundElement) {
          if (lineChild instanceof TextElementBox) {
            foundElement = lineChild
            offsetInElement = cursorOffsetInParagraph - accumulatedLength
            // precedingTextElement was set in previous iterations
            foundElementFlag = true
            // Don't break - continue to find the following element
          } else {
            // If cursor is on a non-text element, we'll use the last text element
            break
          }
        }

        // Track this TextElementBox as potential predecessor (before we find the target)
        if (!foundElementFlag && lineChild instanceof TextElementBox) {
          precedingTextElement = lineChild
        }

        accumulatedLength += elementLength
      }
      // Only break if we found the following element (we're done)
      // Do NOT break just because we haven't found an element - we need to check more lines!
      if (followingTextElement) break
    }
  }

  // If cursor is past all elements or on a non-text element, use the last text element
  if (!foundElement && lastTextElement) {
    foundElement = lastTextElement
    offsetInElement = foundElement.text?.length || 0 // Cursor is at end
  }

  // If no text elements found at all, paragraph is truly empty
  if (!foundElement) {
    return { contentType: 'empty', isAtElementStart: true, isAtElementEnd: true, isBeforeFirstNonWhitespace: true, precedingElementType: 'empty', followingElementType: 'empty', currentOffset, fontFamily: '', followingFontFamily: '' }
  }

  // Classify the found element by font
  const fontFamily = (foundElement as any).characterFormat?.fontFamily?.toLowerCase()
  const elementText = foundElement.text || ''
  let contentType: ParagraphContentType = 'document'

  if (fontFamily && USER_CONTENT_FONTS.includes(fontFamily)) {
    contentType = 'user'
  } else if (fontFamily && SIGNATURE_CONTENT_FONTS.includes(fontFamily)) {
    contentType = 'signature'
  } else if (fontFamily && SYSTEM_CONTENT_FONTS.includes(fontFamily)) {
    contentType = 'system'
  }

  const elementLength = foundElement.text?.length || 0
  const isAtElementStart = offsetInElement === 0
  const isAtElementEnd = offsetInElement >= elementLength

  // Calculate if cursor is before the first non-whitespace character in this element
  const leadingWhitespaceLength = elementText.length - elementText.trimStart().length
  const isBeforeFirstNonWhitespace = offsetInElement <= leadingWhitespaceLength

  // Classify the preceding text element (if any)
  let precedingElementType: ParagraphContentType = 'empty' // 'empty' means no preceding element
  if (precedingTextElement) {
    const precedingFont = (precedingTextElement as any).characterFormat?.fontFamily?.toLowerCase()
    if (precedingFont && USER_CONTENT_FONTS.includes(precedingFont)) {
      precedingElementType = 'user'
    } else if (precedingFont && SIGNATURE_CONTENT_FONTS.includes(precedingFont)) {
      precedingElementType = 'signature'
    } else if (precedingFont && SYSTEM_CONTENT_FONTS.includes(precedingFont)) {
      precedingElementType = 'system'
    } else {
      precedingElementType = 'document'
    }
  }

  // Classify the following text element (if any)
  let followingElementType: ParagraphContentType = 'empty' // 'empty' means no following element
  let followingFontFamily = ''
  if (followingTextElement) {
    followingFontFamily = (followingTextElement as any).characterFormat?.fontFamily?.toLowerCase() || ''
    if (followingFontFamily && USER_CONTENT_FONTS.includes(followingFontFamily)) {
      followingElementType = 'user'
    } else if (followingFontFamily && SIGNATURE_CONTENT_FONTS.includes(followingFontFamily)) {
      followingElementType = 'signature'
    } else if (followingFontFamily && SYSTEM_CONTENT_FONTS.includes(followingFontFamily)) {
      followingElementType = 'system'
    } else {
      followingElementType = 'document'
    }
  }


  return { contentType, isAtElementStart, isAtElementEnd, isBeforeFirstNonWhitespace, precedingElementType, followingElementType, currentOffset, fontFamily: fontFamily || '', followingFontFamily }
}

/**
 * Validates if the current cursor position is valid for AtCursor insertion.
 *
 * ALLOWED positions:
 * - In original document text (non-Docufen fonts/black text)
 * - Right before the first character of user-entered text (at start boundary)
 * - After initials/date line (end of system content)
 * - After initials superscript markers (end of system content)
 *
 * DISALLOWED positions:
 * - In the middle of user-entered text (between characters in 'user' content)
 * - In the middle of system content (between characters in 'system' content)
 * - In empty paragraph or user paragraph that is part of a multi-paragraph entry
 *
 * @param editor - The DocumentEditor instance
 * @returns CursorValidationResult with isValid flag and optional error message key
 */
export const validateCursorPositionForInsertion = (editor: DocumentEditor): CursorValidationResult => {
  const selection = editor.selection
  if (!selection) {
    return { isValid: true, reason: 'valid_document' }
  }

  // Save scroll position - validation may move selection which can cause scroll
  const scrollTop = editor.documentHelper.viewerContainer.scrollTop

  const { contentType, isAtElementStart, isAtElementEnd, isBeforeFirstNonWhitespace, precedingElementType, followingElementType, currentOffset, fontFamily, followingFontFamily } = getContentTypeAtCursor(editor)

  // Helper to restore scroll position before returning
  const restoreScroll = () => {
    editor.documentHelper.viewerContainer.scrollTop = scrollTop
  }

  // Case 1: Cursor is in document content (black text, unknown fonts)
  // ALWAYS VALID - can insert anywhere in original document text
  if (contentType === 'document') {
    restoreScroll()
    return { isValid: true, reason: 'valid_document' }
  }

  // Case 2: Cursor is in signature content (Kalam font)
  // ALWAYS INVALID - signature names are protected
  if (contentType === 'signature') {
    restoreScroll()
    return {
      isValid: false,
      reason: 'in_user_content',
      errorMessageKey: 'mPopup.cursorValidation.inUserContent'
    }
  }

  // Case 3: Cursor is in user content (Inter font)
  // Valid if:
  // - At the start of the element AND no user content before us (in previous paragraphs)
  // - OR in leading whitespace AND immediately preceded by system/document content
  if (contentType === 'user') {

    // Check if cursor is in a valid boundary position (start or leading whitespace)
    if (isAtElementStart || isBeforeFirstNonWhitespace) {
      // Check what's immediately before this element in the same line
      if (precedingElementType === 'system' || precedingElementType === 'document') {
        // Immediately preceded by system/document content - VALID
        restoreScroll()
        return { isValid: true, reason: 'valid_boundary' }
      }

      if (precedingElementType === 'user' || precedingElementType === 'signature') {
        // Immediately preceded by user/signature content - INVALID (continuing protected content)
        restoreScroll()
        return {
          isValid: false,
          reason: 'in_user_content',
          errorMessageKey: 'mPopup.cursorValidation.inUserContent'
        }
      }

      // No preceding element in this line - check previous paragraphs
      const isInsideMultiParagraphEntry = checkBackwardsForUserContent(editor, currentOffset)

      // Restore selection (checkBackwardsForUserContent may have moved it)
      editor.selection.select(currentOffset, currentOffset)
      restoreScroll()

      if (!isInsideMultiParagraphEntry) {
        return { isValid: true, reason: 'valid_boundary' }
      }

      // Inside a multi-paragraph user entry - INVALID
      return {
        isValid: false,
        reason: 'in_user_content',
        errorMessageKey: 'mPopup.cursorValidation.inUserContent'
      }
    }

    // Cursor is in the middle of user content (not at start, not in leading whitespace) - INVALID
    restoreScroll()
    return {
      isValid: false,
      reason: 'in_user_content',
      errorMessageKey: 'mPopup.cursorValidation.inUserContent'
    }
  }

  // Case 4: Paragraph is empty
  // Valid only if we're not inside a multi-paragraph user entry
  if (contentType === 'empty') {
    const isInsideMultiParagraphEntry = checkBackwardsForUserContent(editor, currentOffset)

    // Restore selection (checkBackwardsForUserContent may have moved it)
    editor.selection.select(currentOffset, currentOffset)
    restoreScroll()

    if (isInsideMultiParagraphEntry) {
      return {
        isValid: false,
        reason: 'in_user_content',
        errorMessageKey: 'mPopup.cursorValidation.inUserContent'
      }
    }

    return { isValid: true, reason: 'valid_boundary' }
  }

  // Case 5: Cursor is in system content (Roboto Mono/Segoe UI)
  // Valid if:
  // - At the END of system content AND not followed by signature
  // - At the START of system content AND no user content before us (start of new entry)
  if (contentType === 'system') {

    // Check if at the START of system content - may be valid insertion point before a new entry
    if (isAtElementStart) {
      // If current element is a clock (late entry indicator), never allow insertion before it
      // The clock is in 'segoe ui emoji' font and should not be separated from the marker
      if (fontFamily === 'segoe ui emoji') {
        restoreScroll()
        return {
          isValid: false,
          reason: 'in_system_content',
          errorMessageKey: 'mPopup.cursorValidation.inSystemContent'
        }
      }

      // If preceded by user or signature content, we're inserting into existing content - INVALID
      if (precedingElementType === 'user' || precedingElementType === 'signature') {
        restoreScroll()
        return {
          isValid: false,
          reason: 'in_system_content',
          errorMessageKey: 'mPopup.cursorValidation.inSystemContent'
        }
      }

      // If preceded by system or document, this could be start of a new entry - check previous paragraphs
      if (precedingElementType === 'system' || precedingElementType === 'document' || precedingElementType === 'empty') {
        const isInsideMultiParagraphEntry = checkBackwardsForUserContent(editor, currentOffset)
        editor.selection.select(currentOffset, currentOffset)
        restoreScroll()

        if (!isInsideMultiParagraphEntry) {
          return { isValid: true, reason: 'valid_boundary' }
        }

        return {
          isValid: false,
          reason: 'in_system_content',
          errorMessageKey: 'mPopup.cursorValidation.inSystemContent'
        }
      }
    }

    // Check if at the END of system content
    if (isAtElementEnd) {
      // Check if the following element is a signature - if so, INVALID
      if (followingElementType === 'signature') {
        restoreScroll()
        return {
          isValid: false,
          reason: 'in_system_content',
          errorMessageKey: 'mPopup.cursorValidation.inSystemContent'
        }
      }
      // Check if the following element is a clock (late entry indicator) - if so, INVALID
      // The clock is in 'segoe ui emoji' font and should not be separated from the marker
      if (followingFontFamily === 'segoe ui emoji') {
        restoreScroll()
        return {
          isValid: false,
          reason: 'in_system_content',
          errorMessageKey: 'mPopup.cursorValidation.inSystemContent'
        }
      }
      restoreScroll()
      return { isValid: true, reason: 'valid_after_system' }
    }

    // In the middle of system content - INVALID
    restoreScroll()
    return {
      isValid: false,
      reason: 'in_system_content',
      errorMessageKey: 'mPopup.cursorValidation.inSystemContent'
    }
  }

  // Default: allow insertion (shouldn't reach here)
  restoreScroll()
  return { isValid: true, reason: 'valid_document' }
}
