import { CHECKBOXFORMAT, CLOCKFORMAT, formatSelection, makeTextSelection, SUPERSCRIPTFORMAT } from "./addinUtils"
import { DocumentEditor, Selection, SelectionCharacterFormat, } from "@syncfusion/ej2-react-documenteditor";
import { searchParagraphForEmptyCheckboxes } from "./cellUtils";
import { LATE_CLOCK } from "./constants";

export const checkCheckboxInCell = (editor: DocumentEditor, selection: Selection, superScriptText: string, lateEntry: boolean) => {
  if (!selection) {
    console.log('no selection')
    return { removedText: "", cellsFilled: 0 }
  }
  // console.warn("checkCheckboxInCell called with selection: ", selection)
  let globalStartIndex = selection.startOffset
  let globalEndIndex = selection.endOffset
  if (!selection.isForward) {
    globalStartIndex = selection.endOffset
    globalEndIndex = selection.startOffset
  }
  const paragraph1 = selection.start.paragraph
  const paragraph2 = selection.end.paragraph
  if (paragraph1 !== paragraph2) {
    console.log('selection spans multiple paragraphs')
    return { removedText: "", cellsFilled: 0 }
  }

  try {
    const foundCheckbox = searchParagraphForEmptyCheckboxes(
      editor, paragraph1, globalStartIndex, globalEndIndex
    )
    let removedText = ""
    if (foundCheckbox) {
      ({ removedText } = replaceCheckbox(editor, superScriptText, lateEntry))
    }
    return { removedText, cellsFilled: foundCheckbox ? 1 : 0 }
  } catch (error) {
    console.error('Checkbox replacement failed:', error)
    return { removedText: "", cellsFilled: 0 }
  }
}

const replaceCheckbox = (editor: DocumentEditor, superScriptText: string, lateEntry: boolean) => {
  editor.isReadOnly = false

  const removedText = editor.selection.text
  editor.editor.delete()

  const start = editor.selection.startOffset
  // Always use cross-marked checkbox for consistency
  const text = "\u2611" // ☒
  editor.editor.insertText(text);

  let offset1: string
  let offset2: string;
  ({ offset1, offset2 } = makeTextSelection(start, text.length))
  editor.selection.select(offset1, offset2)
  formatSelection(editor, CHECKBOXFORMAT)

  editor.selection.select(offset2, offset2)
  editor.editor.insertText(superScriptText);
  ({ offset1, offset2 } = makeTextSelection(offset2, superScriptText.length))
  editor.selection.select(offset1, offset2)
  formatSelection(editor, SUPERSCRIPTFORMAT)
  editor.selection.select(offset2, offset2)

  if (lateEntry) {
    const lateEntryText = LATE_CLOCK // LATE_CLOCK
    editor.editor.insertText(lateEntryText);
    ({ offset1, offset2 } = makeTextSelection(offset2, lateEntryText.length))
    editor.selection.select(offset1, offset2)
    const clockFormat: Partial<SelectionCharacterFormat> = { ...SUPERSCRIPTFORMAT, ...CLOCKFORMAT }
    formatSelection(editor, clockFormat)
    editor.selection.select(offset2, offset2)
  }

  console.log("inserted checkbox and " + superScriptText)

  editor.isReadOnly = true

  return { removedText, cellsFilled: 1 }
}
