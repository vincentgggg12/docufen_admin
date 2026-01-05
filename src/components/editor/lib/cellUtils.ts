import { BookmarkElementBox, ContentControl, DocumentEditor, FieldElementBox, IWidget, LineWidget, ListTextElementBox, ParagraphWidget, Selection, TextElementBox } from "@syncfusion/ej2-react-documenteditor";
import { isStringAPlaceholder } from "./addinUtils";

export const CELLISEMPTY: string = "cellIsEmptysdjfadf";
export const CELLISNOTEMPTY: string = "cellIsNotEmptyasdfasdf";
export const TABLECELLNOTSELECTED = "tableCellNotSelectedasdfp";

/* global console */

interface ParagraphTextResult {
  textWithSpaces: string;      // Maintains offset accuracy with spaces for invisible elements
  textWithoutSpaces: string;   // For detecting contiguous placeholders
  positionMapping: number[];   // Maps positions from textWithoutSpaces to textWithSpaces
}

/**
 * Extract all text from a paragraph widget without calling editor.selection.select()
 * This avoids expensive document tree traversal in large documents.
 *
 * Returns both a version with spaces (for offset accuracy) and without spaces
 * (for placeholder detection), plus a mapping between the two.
 *
 * @param paragraph - The ParagraphWidget to extract text from
 * @returns Object containing both text versions and position mapping
 */
const extractParagraphText = (paragraph: ParagraphWidget): ParagraphTextResult => {
  let textWithSpaces = '';
  let textWithoutSpaces = '';
  const positionMapping: number[] = [];

  for (let i = 0; i < paragraph.childWidgets.length; i++) {
    const child: IWidget = paragraph.childWidgets[i];

    if (child instanceof LineWidget) {
      // LineWidget contains the actual text elements
      for (let j = 0; j < child.children.length; j++) {
        const lineChild = child.children[j];

        if (lineChild instanceof TextElementBox) {
          const textLength = lineChild.text.length;
          // Add to both versions
          textWithSpaces += lineChild.text;
          textWithoutSpaces += lineChild.text;
          // Create mapping for each character
          for (let k = 0; k < textLength; k++) {
            positionMapping.push(textWithSpaces.length - textLength + k);
          }
        } else if (lineChild instanceof ListTextElementBox) {
          // Skip list bullets/numbers - they're not part of the editable content
          continue;
        } else if (lineChild instanceof ContentControl) {
          // Content controls: add spaces to withSpaces version, skip in withoutSpaces
          const controlLength = lineChild.getLength();
          textWithSpaces += ' '.repeat(controlLength);
          // No mapping entries - these positions don't exist in textWithoutSpaces
        } else if (lineChild instanceof FieldElementBox || lineChild instanceof BookmarkElementBox) {
          // These don't contribute to visible text but affect offsets
          const elementLength = lineChild.getLength();
          textWithSpaces += ' '.repeat(elementLength);
          // No mapping entries - these positions don't exist in textWithoutSpaces
        } else {
          // Unknown widget type - use space to maintain offset accuracy
          const elementLength = lineChild.getLength?.() ?? 0;
          textWithSpaces += ' '.repeat(elementLength);
          // No mapping entries - these positions don't exist in textWithoutSpaces
        }
      }
    } else if (child instanceof TextElementBox) {
      // Direct text element (less common, but handle it)
      const textLength = child.text.length;
      textWithSpaces += child.text;
      textWithoutSpaces += child.text;
      for (let k = 0; k < textLength; k++) {
        positionMapping.push(textWithSpaces.length - textLength + k);
      }
    }
  }

  return { textWithSpaces, textWithoutSpaces, positionMapping };
};


export const PLACEHOLDER_FOUND = "blankFoundamcgzlsdghm";

export const isSameTableCell = (selection1: Selection, selection2: Selection) => {
  const start1 = selection1.startOffset.split(";").slice(0, 4)
  const start2 = selection2.startOffset.split(";").slice(0, 4)
  const end1 = selection1.endOffset.split(";").slice(0, 4)
  const end2 = selection2.endOffset.split(";").slice(0, 4)
  if (start1.length !== 4 || start2.length !== 4 || end1.length !== 4 || end2.length !== 4) {
    console.error("One of the cells is null")
    return false
  }
  return start1.join(";") == start2.join(";") && end1.join(";") === end2.join(";") && start1.join(";") == end1.join(";")
}

// Helper function to get the next sibling element
function getNextSibling(element: any, parentLine: any) {
  const children = parentLine.children;
  for (let i = 0; i < children.length - 1; i++) {
    if (children[i] === element) {
      return children[i + 1];
    }
  }
  return null;
}

// Helper function to check if content control is an unchecked checkbox
function isUncheckedContentControl(contentControl: ContentControl): boolean {
  // Check if contentControl has type property and it's a checkbox
  return contentControl.contentControlProperties.type === "CheckBox" && 
         // @ts-ignore - ContentControl properties structure
         !contentControl.contentControlProperties?.isChecked;
}

// Helper function to check if form field is an unchecked checkbox
// function isUncheckedFormField(fieldElement: FieldElementBox): boolean {
//   // Form fields in Syncfusion have formFieldData property
//   // @ts-ignore - FieldElementBox type extension
//   const formFieldData = fieldElement.formFieldData;
//   if (!formFieldData) return false;
  
//   // Check if it's a checkbox type and not checked
//   // @ts-ignore - FormField type extension
//   return formFieldData.fieldType === 'CheckBox' && !formFieldData.checked;
// }

// Find complete form field boundaries from any position within the field
function findFormFieldAtOffset(lineWidget: LineWidget, targetOffset: number): {
  startElement: FieldElementBox;
  endElement: FieldElementBox;
  startOffset: number;
  totalLength: number;
  startIndex: number;
  endOffset: number
} | null {
  let currentOffset = 0;
  let activeFormField: any = null;
  let retVal: {
    startElement: FieldElementBox;
    endElement: FieldElementBox;
    startOffset: number;
    totalLength: number;
    startIndex: number;
    endOffset: number
  } | null = null;
  const partsFound = [false, false, false, false]
  for (let i = 0; i < lineWidget.children.length; i++) {
    const element = lineWidget.children[i];
    const currentLength = element.getLength ? element.getLength() : 0; // Use getLength if available
    // console.log("element: " + element.constructor.name, currentOffset, currentLength)
    //ts-ignore 
    // if (element.text) console.log("text: " + element.text, element.constructor.name)
    //ts-ignore
    // if (element.fieldType) console.log("fieldType: " + element.fieldType, element.constructor.name)
    // console.log("targetOffset: " + targetOffset)
    if (currentOffset + currentLength < targetOffset) {
      // console.log("Skipping element: " + element.constructor.name + " at offset: " + currentOffset + " (length: " + currentLength + ")");
      currentOffset += currentLength;
      continue
    }
    
    if (element instanceof FieldElementBox) {
      const fieldEndOffset = currentOffset + element.getLength();
      // console.log("Found FieldElementBox: " + element.fieldType + " at end offset: " + fieldEndOffset);
      // Look for start marker (fieldType === 0 or 1)
      partsFound[element.fieldType] = true;
      if (!activeFormField) {
        activeFormField = {
          startElement: element,
          startOffset: currentOffset,
          startIndex: i
        };
      }
      
      // Look for end marker (fieldType === 2)
      if (activeFormField) {
        // console.log("New end offset: " + fieldEndOffset)
        // Check if target cursor position is within this field
        if (targetOffset >= activeFormField.startOffset && targetOffset <= fieldEndOffset) {
          // console.warn("Should be returning from field boundaries:: ")
          retVal = {
            startElement: activeFormField.startElement,
            endElement: element,
            startOffset: activeFormField.startOffset,
            totalLength: fieldEndOffset - activeFormField.startOffset,
            startIndex: activeFormField.startIndex,
            endOffset: fieldEndOffset
          };
        }
        if (partsFound.filter((x) => x).length === 4) {
          // We found all parts of the form field
          // console.log("Found complete form field at index: " + i);
          return retVal;
        }
      }
    } else if (element instanceof TextElementBox) {
      // console.log("match: " + element.text, element.text.match(/[\u2610\u25a1]/i) != null)
      partsFound[3] = partsFound[3] ? true :element.text.match(/[\u2610\u25a1]/i) != null; // Check for empty checkbox character
    }
    // console.log("Flags: " + partsFound.join(", "))
    currentOffset += currentLength;
  }
  return null;
}

// export const searchParagraphForCheckboxes = (editor: DocumentEditor, paragraph: ParagraphWidget, startIndex: string, endIndex: string) => {
//   const regularExpressions = [/[\u2610\u25a1]/]
//   const startIdxBits = startIndex.split(";")
//   let st: string = ""
//   let en: string = ""
//   const tableCellPrefix = startIdxBits.slice(0, -2).join(";"); // Remove the block index and offset
//   const [startParagraphIndex, _startOffset] = startIdxBits.slice(-2).map((x) => parseInt(x));
//   const [endParagraphIndex, endOffset] = endIndex.split(";").slice(-2).map((x) => parseInt(x));
//   const startOffset = Math.max(0, _startOffset-1) // Ensure startOffset is not negative
//   if (startParagraphIndex !== endParagraphIndex) {
//     console.error("Start and end paragraph indices are not the same")
//     return false
//   }
//   const foundList = []
//   console.log("ParagraphINdex: " + startParagraphIndex.toString())
//   let textLengthSoFar = 0
//   for (let i = 0; i < paragraph.childWidgets.length; i++) {
//     const child: IWidget = paragraph.childWidgets[i]
//     if (child instanceof TextElementBox) {
//       const childLength = child.getLength()
//       console.log("TextElementBox text: " + child.text)
//       foundList.push("TextElementBox")
//       let match = null
//       for (const regex of regularExpressions) {
//         match = child.text.match(regex)
//         if (match != null) {
//           break
//         }
//       }
//       if (match == null) {
//         console.log("No matches found")
//         textLengthSoFar += childLength
//         continue
//       }
//       const matchLength = match[0].length
//       const matchindex = match.index as number
//       console.log("Match: " + matchindex.toString())
//       if (startOffset <= matchindex + textLengthSoFar && endOffset >= textLengthSoFar + matchindex + matchLength) {
//         const strtOffset = matchindex + textLengthSoFar
//         const endOSet = matchindex + matchLength + textLengthSoFar
//         st = `${tableCellPrefix};${startParagraphIndex};${strtOffset}`
//         const en = `${tableCellPrefix};${startParagraphIndex};${endOSet}`
//         console.log("st: " + st + " en: " + en)
//         editor.selection.select(st, en)
//         return true
//       } else {
//         console.log("->->->Match: " + matchindex.toString() + " " + matchLength.toString())
//         console.log("Cursor not in placeholder")
//       }
//       textLengthSoFar += childLength
//     } else if (child instanceof LineWidget) {
//       foundList.push("LineWidget")
//       for (let i = 0; i < child.children.length; i++) {
//         const childof = child.children[i]
//         if (childof instanceof TextElementBox) {
//           foundList.push("Inner TextElementBox")
//           const childOfLength = childof.getLength()
//           console.log("LineWidget Child text: " + childof.text + " name " + childof.constructor.name)
//           console.log("length: " + childOfLength.toString())
//           let match

//           for (const regex of regularExpressions) {
//             console.log("Regex: " + regex.toString())
//             match = childof.text.match(regex)
//             if (match != null) {
//               break
//             }
//           }
//           if (match == null) {
//             console.log("No matches found")
//             textLengthSoFar += childOfLength
//             continue
//           }
//           const matchLength = match[0].length
//           const matchindex = match.index as number
//           console.log("LineWidget Match: " + matchindex.toString() + " " + matchLength.toString())
//           console.log("textLengthSoFar: " + textLengthSoFar.toString())
//           if (startOffset <= matchindex + textLengthSoFar && endOffset >= textLengthSoFar + matchindex + matchLength) {
//             console.log("LineWidget Matching started")
//             const stOffset = matchindex + textLengthSoFar
//             const edOffset = matchindex + matchLength + textLengthSoFar
//             st = `${tableCellPrefix};${startParagraphIndex};${stOffset}`
//             const en = `${tableCellPrefix};${startParagraphIndex};${edOffset}`
//             console.log("st: " + st + " en: " + en)
//             editor.selection.select(st, en)
//             console.log("Matching finished")
//             console.log("Foundlist:  " + JSON.stringify(foundList))
//             return true
//           }
//           textLengthSoFar += childOfLength
//         } else if (childof instanceof ContentControl) {
//           foundList.push("Inner ContentControl")
//           console.log("IF " + textLengthSoFar.toString() + " is the same as: " + startOffset + "??????????????" + childof.getLength().toString())
//           if (textLengthSoFar <= startOffset && textLengthSoFar + childof.getLength() >= startOffset) {
//             let length = childof.getLength()
//             st = `${tableCellPrefix};${startParagraphIndex};${textLengthSoFar}`
//             // Find the next element after this content control
//             if (i + 1 < child.children.length) {
//               const nextElement = child.children[i + 1];
//               if (nextElement instanceof TextElementBox &&
//                 nextElement.text &&
//                 /[\u2610\u25a1\u2612]/.test(nextElement.text.charAt(0))) {
//                 // Include the extra checkbox character in our selection
//                 length += 1;
//                 console.log("Detected extra checkbox character after content control");
//               }
//             }
//             en = `${tableCellPrefix};${startParagraphIndex};${textLengthSoFar + length}`
//             console.log("Selecting: " + st + " to " + en)
//             editor.selection.select(st, en)
//             return true
//           } else {
//             textLengthSoFar += childof.getLength()
//           }
//         } else if (childof instanceof FieldElementBox) {
//           foundList.push("Inner FieldElementBox")
//           console.log("IF these shou " + textLengthSoFar.toString() + " is the same as: " + startOffset + "??????????????")
//           if (textLengthSoFar <= startOffset && textLengthSoFar + childof.getLength() >= startOffset) {
//             // Find the complete field structure - start marker, content, and end marker
//             let fieldEnd = null;
//             let fieldLength = childof.getLength();
//             let currentElement = childof;

//             // For form fields, we need to find all related elements
//             // Each form field has a start element, content elements, and an end element
//             while (currentElement && !fieldEnd) {
//               const nextSibling = getNextSibling(currentElement, child);
//               if (!nextSibling) break;

//               currentElement = nextSibling;
//               fieldLength += currentElement.getLength();

//               // Check if we found the end marker
//               if (currentElement instanceof FieldElementBox &&
//                 currentElement.fieldType === 2) {
//                   console.warn("Found end marker for field: ");
//                 fieldEnd = currentElement;
//               }
//             }
//             const nextSibling = getNextSibling(currentElement, child);
//             if (nextSibling && nextSibling instanceof TextElementBox &&
//               nextSibling.text &&
//               /[\u2610\u25a1]/.test(nextSibling.text.charAt(0))) {
//               // Include the extra checkbox character in our selection
//               fieldLength += 1;
//               console.log("Detected extra checkbox character after content control");
//             }


//             // Create selection that includes the entire field
//             st = `${tableCellPrefix};${startParagraphIndex};${textLengthSoFar}`;
//             en = `${tableCellPrefix};${startParagraphIndex};${textLengthSoFar + fieldLength}`;

//             console.log("Set selection for form field: " + st + " to " + en);
//             editor.selection.select(st, en);
//             textLengthSoFar += fieldLength;
//             return true;
//           } else {
//             textLengthSoFar += childof.getLength()
//           }
//         } else if (childof instanceof BookmarkElementBox) {
//           foundList.push("Inner BookmarkElementBox")
//           textLengthSoFar += childof.getLength()
//           console.log("BookmarkElementBox text: length: " + childof.getLength())
//         } else {
//           textLengthSoFar += childof.getLength()
//           console.error("LineWidget Child is not a text element box: " + childof.constructor.name)
//         }
//       }
//     } else
//       console.error("outside: Child is not a text element box: " + child.constructor.name)
//   }
//   return false
// }

// Generic function to find and select checkboxes based on selection mode
const findAndSelectCheckbox = (
  editor: DocumentEditor,
  paragraph: ParagraphWidget,
  startIndex: string,
  endIndex: string,
  mode: 'within' | 'adjacent'
): boolean => {
  const regularExpressions = [/[\u2610\u25a1]/] // ☐ □ (only unchecked boxes)
  const startIdxBits = startIndex.split(";")
  let st: string = ""
  let en: string = ""
  const tableCellPrefix = startIdxBits.slice(0, -2).join(";");
  const [startParagraphIndex, _startOffset] = startIdxBits.slice(-2).map((x) => parseInt(x));
  const [endParagraphIndex, endOffset] = endIndex.split(";").slice(-2).map((x) => parseInt(x));
  const startOffset = Math.max(0, _startOffset-1) // Ensure startOffset is not negative

  if (startParagraphIndex !== endParagraphIndex) {
    console.error("Start and end paragraph indices are not the same")
    return false
  }

  console.log(`Searching for ${mode === 'adjacent' ? 'adjacent' : 'empty'} checkboxes in paragraph: ${startParagraphIndex}`)

  let textLengthSoFar = 0

  for (let i = 0; i < paragraph.childWidgets.length; i++) {
    const child: IWidget = paragraph.childWidgets[i]
    if (child instanceof LineWidget) {
      const fieldBoundaries = findFormFieldAtOffset(child, startOffset+1);
      if (fieldBoundaries) {
        const newStart = Math.max(0, fieldBoundaries.startOffset)
        st = `${tableCellPrefix};${startParagraphIndex};${newStart}`;
        en = `${tableCellPrefix};${startParagraphIndex};${fieldBoundaries.endOffset}`;
        console.log(`Selecting complete unchecked form field: ${st} to ${en}`);

        editor.selection.select(st, en);
        return true;
      }
      for (let j = 0; j < child.children.length; j++) {
        const childof = child.children[j]
        if (childof instanceof ListTextElementBox){
          // ignore list bullets and numbers
        } else if (childof instanceof TextElementBox) {
          const childOfLength = childof.getLength()
          // console.log("LineWidget Child text: " + childof.text + " name " + childof.constructor.name)
          // Check for empty checkbox Unicode characters
          let match = null
          for (const regex of regularExpressions) {
            match = childof.text.match(regex)
            if (match != null) break
          }
          
          if (match) {
            const matchLength = match[0].length
            const matchindex = match.index as number
            const checkboxStart = textLengthSoFar + matchindex
            const checkboxEnd = checkboxStart + matchLength
            console.log('Match: ' + checkboxStart.toString() + ' Length: ' + checkboxEnd.toString())
            let shouldSelect = false
            if (mode === 'within') {
              // Check if selection is within the checkbox
              shouldSelect = startOffset <= checkboxStart && endOffset >= checkboxEnd
            } else if (mode === 'adjacent') {
              // Check if cursor is immediately before or after the checkbox
              console.log("start: " + startOffset + " checkboxStart: " + checkboxStart )
              console.log("end: " + endOffset + " checkboxEnd: " + checkboxEnd)
              shouldSelect = (_startOffset === checkboxStart || startOffset === checkboxStart) || 
                           (startOffset === checkboxEnd && endOffset === checkboxEnd)
            } else {
              console.log("no match")
              console.log("offsets", startOffset, endOffset, checkboxStart, checkboxEnd)
            }

            if (shouldSelect) {
              console.log("offsets", startOffset, endOffset, checkboxStart, checkboxEnd)
              st = `${tableCellPrefix};${startParagraphIndex};${checkboxStart}`
              en = `${tableCellPrefix};${startParagraphIndex};${checkboxEnd}`
              console.log(`Found A ${mode === 'adjacent' ? 'adjacent' : 'empty'} checkbox: ${st} to ${en}`)
              editor.selection.select(st, en)
              return true
            }
          }
          textLengthSoFar += childOfLength
          
        } else if (childof instanceof ContentControl) {
          const controlStart = textLengthSoFar
          const controlEnd = textLengthSoFar + childof.getLength()
          
          let shouldSelect = false
          if (mode === 'within') {
            // Check if selection overlaps with content control
            shouldSelect = isUncheckedContentControl(childof) && 
                         controlStart <= startOffset && 
                         controlEnd >= startOffset
          } else if (mode === 'adjacent') {
            // Check if cursor is adjacent to content control
            console.log("start: " + startOffset + " controlStart: " + controlStart )
            console.log("end: " + endOffset + " controlEnd: " + controlEnd)
            console.log("isUnchecked" + isUncheckedContentControl(childof))
            shouldSelect = isUncheckedContentControl(childof) &&
                        (startOffset === controlStart || endOffset === controlEnd)
          }

          if (shouldSelect) {
            let length = childof.getLength()
            st = `${tableCellPrefix};${startParagraphIndex};${controlStart}`

            // Check for adjacent empty checkbox character
            const nextElement = getNextSibling(childof, child);
            if (nextElement instanceof TextElementBox &&
                /[\u2610\u25a1]/.test(nextElement.text.charAt(0))) {
              length += 1;
              console.log("Including adjacent empty checkbox character");
            }

            en = `${tableCellPrefix};${startParagraphIndex};${controlStart + length}`
            console.log(`Selecting ${mode === 'adjacent' ? 'adjacent' : ''} unchecked content control: ${st} to ${en}`)

            editor.selection.select(st, en)
            return true
          }
          textLengthSoFar += childof.getLength()
          
        } else if (childof instanceof BookmarkElementBox) {
          textLengthSoFar += childof.getLength()
        } else if (childof instanceof FieldElementBox) {
          textLengthSoFar += childof.getLength()
        } else {
          textLengthSoFar += childof.getLength()
          console.warn(`LineWidget Child is not a TextElementBox or ContentControl: ${childof.constructor.name}`);
        }
      }
    } else {
      console.warn(`Child is not a LineWidget: ${child.constructor.name}`);
    }
  }

  return false
}

export const isSelectionNextToCheckBox = (editor: DocumentEditor): boolean => {
  const selection = editor.selection
  let globalStartIndex = selection.startOffset
  let globalEndIndex = selection.endOffset
  if (!selection.isForward) {
    globalStartIndex = selection.endOffset
    globalEndIndex = selection.startOffset
  }

  if (globalStartIndex !== globalEndIndex) {
    return false
  }

  try {
    const foundCheckbox = selectAdjacentCheckbox(editor, selection.start.paragraph, globalStartIndex, globalEndIndex)

    if (!foundCheckbox) {
      console.log("Not found checkbox", editor.selection.startOffset, globalStartIndex, editor.selection.endOffset, globalEndIndex)
      return false
    }

    return true
  } catch (error) {
    console.error('Checkbox selection failed:', error)

    return false
  }
}

export const searchParagraphForEmptyCheckboxes = (editor: DocumentEditor, paragraph: ParagraphWidget, startIndex: string, endIndex: string): boolean => {
  return findAndSelectCheckbox(editor, paragraph, startIndex, endIndex, 'within')
}

export const selectAdjacentCheckbox = (editor: DocumentEditor, paragraph: ParagraphWidget, startIndex: string, endIndex: string): boolean => {
  return findAndSelectCheckbox(editor, paragraph, startIndex, endIndex, 'adjacent')
}

const searchParagrphForPlaceholders = (editor: DocumentEditor, paragraph: ParagraphWidget, startIndex: string, endIndex: string, wholeCell?: boolean) => {
  // wholeCell specifies whether to look for a placeholder in the whole cell or just the selected text.
  const startIdxBits = startIndex.split(";")
  const tableCellPrefix = startIdxBits.slice(0, -2).join(";"); // Remove the block index and offset
  const [startParagraphIndex, startOffset] = startIdxBits.slice(-2).map((x) => parseInt(x));
  const [endParagraphIndex, endOffset] = endIndex.split(";").slice(-2).map((x) => parseInt(x));
  if (startParagraphIndex !== endParagraphIndex) {
    console.error("Start and end paragraph indices are not the same")
    return false
  }
  console.log("ParagraphINdex: " + startParagraphIndex.toString())
  let textLengthSoFar = 0
  for (let i = 0; i < paragraph.childWidgets.length; i++) {
    const child: IWidget = paragraph.childWidgets[i]
    if (child instanceof TextElementBox) {
      const childLength = child.getLength()
      console.log("TextElementBox text: " + child.text)
      const matches1 = child.text.matchAll(/_{3,}/g)
      const matches2 = child.text.matchAll(/.{3,}/g)
      // const matches3 = child.text.matchAll(/ {3,}/g)
      // const matches4 = child.text.matchAll(/\t{2,}/g)
      if (matches1 == null && matches2 == null) {
        console.log("No matches found")
        textLengthSoFar += childLength
        continue
      }
      const matches = matches1 ? matches1 : matches2
      for (const match of matches) {
        const matchLength = match[0].length
        console.log("Match: " + match.index.toString() + " " + JSON.stringify(match))
        console.log("Did that one work?")

        if (wholeCell || (startOffset >= match.index + textLengthSoFar && endOffset <= textLengthSoFar + match.index + matchLength)) {
          console.log("Matching started")
          const startOffset = match.index + textLengthSoFar
          const endOffset = match.index + matchLength + textLengthSoFar
          const st = `${tableCellPrefix};${startParagraphIndex};${startOffset}`
          const en = `${tableCellPrefix};${startParagraphIndex};${endOffset}`
          console.log("st: " + st + " en: " + en)
          editor.selection.select(st, en)
          return true
        } else {
          console.log("->->->Match: " + match.index.toString() + " " + matchLength.toString())
          console.log("Cursor not in placeholder")
        }
      }
      textLengthSoFar += childLength
    } else if (child instanceof LineWidget) {
      for (let i = 0; i < child.children.length; i++) {
        const childof = child.children[i]
        if (childof instanceof TextElementBox) {
          const childOfLength = childof.getLength()
          console.log("LineWidget Child text: " + childof.text)
          const matches1 = childof.text.matchAll(/_{3,}/g)
          const matches2 = childof.text.matchAll(/.{3,}/g)
          // const matches3 = childof.text.matchAll(/ {3,}/g)
          // const matches4 = childof.text.matchAll(/\t{2,}/g)
          if (matches1 == null && matches2 == null) {
            console.log("No matches found")
            textLengthSoFar += childOfLength
            continue
          }
          const matches = matches1 ? matches1 : matches2
          for (const match of matches) {
            const matchLength = match[0].length
            console.log("LineWidget Match: " + match.index.toString() + " " + matchLength.toString())
            console.log("textLengthSoFar: " + textLengthSoFar.toString())
            if (wholeCell || startOffset >= match.index + textLengthSoFar && endOffset <= textLengthSoFar + match.index + matchLength) {
              console.log("LineWidget Matching started")
              const startOffset = match.index + textLengthSoFar
              const endOffset = match.index + matchLength + textLengthSoFar
              const st = `${tableCellPrefix};${startParagraphIndex};${startOffset}`
              const en = `${tableCellPrefix};${startParagraphIndex};${endOffset}`
              console.log("st: " + st + " en: " + en)
              editor.selection.select(st, en)
              console.log("Matching finished")
              return true
            }
          }
          textLengthSoFar += childOfLength
        } else if (childof instanceof ContentControl) {
          textLengthSoFar += childof.getLength()
          console.log("Content controls may cause unexpected behavior")
        } else if (childof instanceof FieldElementBox) {
          textLengthSoFar += childof.getLength()
        } else {
          textLengthSoFar += childof.getLength()
          console.error("LineWidget Child is not a text element box: " + childof.constructor.name)
        }
      }
    } else
      console.error("outside: Child is not a text element box: " + child.constructor.name)
  }
  return false
}

export const selectNextTableCellPlaceholder = (editor: DocumentEditor, tableCellIndex: string) => {
  console.log("Selecting next table cell placeholder")
  editor.selection.select(tableCellIndex, tableCellIndex)
  const tableCell = editor.selection.start.paragraph.associatedCell
  if (tableCell == null) {
    console.log("Lost table cell")
    return false
  }
  console.log("Found table cell: looking in : " + tableCellIndex)
  const tableCellPrefix = tableCellIndex.split(";").slice(0, -2).join(";")
  console.log("Found tableSelection index: " + tableCellIndex)
  let foundPlaceholder = false
  for (let i = 0; i < tableCell.childWidgets.length; i++) {
    const child = tableCell.childWidgets[i]
    if (child instanceof ParagraphWidget) {
      console.log("Checking paragraph: " + (i + 1).toString())
      const selectionIndex = `${tableCellPrefix};${i};0`
      foundPlaceholder = searchParagrphForPlaceholders(editor, child, selectionIndex, selectionIndex, true)
      if (foundPlaceholder) {
        console.log("Found placeholder in paragraph: " + (i + 1).toString())
        return true
      }
    }
  }
  return false
}

// Only placeholder characters regex
const placeholderRegExp = /^[_\.\u2026]+$/
// Placeholder character regex
const placeholderCharRegex = /[_\.\u2026]/;

export const isSelectionInAPlaceholder = (editor: DocumentEditor) => {
  const selection = editor.selection
  let startIndex = selection.startOffset
  let endIndex = selection.endOffset

  // Ensure we're working with the correct order of indices
  if (!selection.isForward) {
    startIndex = selection.endOffset
    endIndex = selection.startOffset
  }

  // Quick check if current selection is already a placeholder
  if (startIndex !== endIndex) {
    if (selection.text.match(placeholderRegExp) == null) {
      return false;
    }
  }

  let startOffset = parseInt(startIndex.split(";").slice(-1)[0])
  let endOffset = parseInt(endIndex.split(";").slice(-1)[0])
  const baseIndex = startIndex.split(";").slice(0, -1).join(";")
  const paragraph = selection.start.paragraph

  // ===== OPTIMIZATION: Extract paragraph text ONCE instead of calling select() 40 times =====
  const { textWithoutSpaces, positionMapping } = extractParagraphText(paragraph);

  // Early exit if paragraph has no actual text (only invisible elements)
  if (positionMapping.length === 0 || textWithoutSpaces.length === 0) {
    return false;
  }

  // Helper function: Find closest valid position in withoutSpaces for a withSpaces position
  const findClosestWithoutSpacesPos = (withSpacesPos: number): number => {
    // If exact match exists, use it
    const exactMatch = positionMapping.findIndex(pos => pos === withSpacesPos);
    if (exactMatch !== -1) return exactMatch;

    // Otherwise find the closest position before this one
    for (let i = positionMapping.length - 1; i >= 0; i--) {
      if (positionMapping[i] < withSpacesPos) {
        return i;
      }
    }
    return 0;
  };

  // Convert cursor positions to withoutSpaces coordinates
  const startPosNoSpaces = findClosestWithoutSpacesPos(startOffset);
  const endPosNoSpaces = findClosestWithoutSpacesPos(endOffset);

  // Search backward from cursor to find start of placeholder in textWithoutSpaces
  let placeholderStartNoSpaces = startPosNoSpaces;
  while (placeholderStartNoSpaces > 0 && placeholderCharRegex.test(textWithoutSpaces[placeholderStartNoSpaces - 1])) {
    placeholderStartNoSpaces--;
  }

  // Search forward from cursor to find end of placeholder in textWithoutSpaces
  let placeholderEndNoSpaces = endPosNoSpaces;
  while (placeholderEndNoSpaces < textWithoutSpaces.length && placeholderCharRegex.test(textWithoutSpaces[placeholderEndNoSpaces])) {
    placeholderEndNoSpaces++;
  }

  // Extract the potential placeholder text from textWithoutSpaces
  const potentialPlaceholder = textWithoutSpaces.substring(placeholderStartNoSpaces, placeholderEndNoSpaces);
  const isValidPlaceholder = isStringAPlaceholder(potentialPlaceholder);

  if (isValidPlaceholder) {
    // Safety check: invalid placeholder range (defensive programming)
    if (placeholderEndNoSpaces === 0 || placeholderStartNoSpaces < 0) {
      return false;
    }

    // Convert back to withSpaces coordinates for selection
    const placeholderStartWithSpaces = positionMapping[placeholderStartNoSpaces];
    const placeholderEndWithSpaces = positionMapping[placeholderEndNoSpaces - 1] + 1; // +1 because we want position after last char

    // console.log('Found placeholder:', potentialPlaceholder);
    // console.log('NoSpaces positions:', placeholderStartNoSpaces, '-', placeholderEndNoSpaces);
    // console.log('WithSpaces positions:', placeholderStartWithSpaces, '-', placeholderEndWithSpaces);

    // Only call select() ONCE to select the found placeholder
    selection.select(`${baseIndex};${placeholderStartWithSpaces}`, `${baseIndex};${placeholderEndWithSpaces}`);
  }

  return isValidPlaceholder;
}
