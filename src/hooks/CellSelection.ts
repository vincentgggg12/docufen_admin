import React from "react";
import { DocumentEditor } from "@syncfusion/ej2-react-documenteditor";
import { getStageSelectionColor } from "@/components/editor/lib/addinUtils";
import { useAppStore, useDocumentStore } from "../lib/stateManagement";
import { Stage } from "@/components/editor/lib/lifecycle";

export const useCellSelection = () => {

  const deselectCell = React.useCallback((editor: DocumentEditor) => {
    const { previousCellIndex, setPreviousCellIndex, previousCellColour } = useAppStore.getState();

    if (previousCellIndex === "") {
      return
    }

    // Validate editor is ready before attempting deselection
    // This prevents errors when switching documents rapidly
    if (!editor || !editor.documentHelper || !editor.documentHelper.pages ||
        editor.documentHelper.pages.length === 0 || !editor.selection) {
      console.warn("Editor not ready for cell deselection - clearing state");
      setPreviousCellIndex("");
      return;
    }

    try {
      const scrollTop = editor.documentHelper.viewerContainer.scrollTop
      editor.isReadOnly = false
      const initialStartOffset = editor.selection.startOffset;
      const initialEndOffset = editor.selection.endOffset;
      editor.selection.select(previousCellIndex, previousCellIndex);
      editor.selection.cellFormat.background = previousCellColour;
      setPreviousCellIndex("");
      editor.selection.select(initialStartOffset, initialEndOffset);
      editor.documentHelper.viewerContainer.scrollTop = scrollTop
      editor.isReadOnly = true

      // Force Syncfusion to update its internal layout/coordinate cache by reading layout properties
      // This forces a synchronous reflow and ensures coordinate mappings are current
      void editor.documentHelper.viewerContainer.scrollTop;
      void editor.selection.start.location;
    } catch (error) {
      console.warn("Failed to deselect cell - clearing state anyway", error);
      // Clear state even if deselection failed to prevent stuck state
      setPreviousCellIndex("");
      try {
        editor.isReadOnly = true;
      } catch {
        // Ignore errors in cleanup
      }
    }
  }, []);

  const indexesAreSameCell = (startIndex: string, endIndex: string) => {
    // console.log("Comparing cell indexes: " + startIndex + " and " + endIndex)
    const startParts = startIndex.split(";").map(part => parseInt(part, 10));
    const endParts = endIndex.split(";").map(part => parseInt(part, 10));
    if (startParts.length !== endParts.length) {
      return false;
    }
    for (let i = 0; i < startParts.length - 2; i += 2) {
      if (startParts[i] !== endParts[i] || startParts[i + 1] !== endParts[i + 1]) {
        return false;
      }
    }
    return true;
  }

  const selectCell = React.useCallback((editor: DocumentEditor) => {
    const { setPreviousCellIndex, setPreviousCellColour } = useAppStore.getState()
    const { documentStage } = useDocumentStore.getState()

    // Save the user's selection BEFORE deselectCell modifies it
    const initialStartOffset = editor.selection.startOffset;
    const initialEndOffset = editor.selection.endOffset;
    const scrollTop = editor.documentHelper.viewerContainer.scrollTop;
    console.log("Selecting cell at offsets: " + initialStartOffset + " to " + initialEndOffset)

    deselectCell(editor);
    if (!indexesAreSameCell(initialStartOffset, initialEndOffset)) {
      return
    }

    // Get stage-specific selection color
    const stageSelectionColor = getStageSelectionColor(documentStage as Stage)
    console.log("Stage selection color: " + stageSelectionColor + " for stage: " + documentStage)

    if (editor == null || editor.selection == null || editor.selection.cellFormat == null) {
      return;
    }

    let currentColor = editor.selection.cellFormat.background.slice(0, 9)
    if (!currentColor || currentColor === "empty") {
      currentColor = "#FFFFFFFF"
    }
    console.log("Current cell color: " + currentColor)

    const allStageColors = ["#FFF5E6FF", "#EDEDFFFF", "#F9E6FFFF", "#E6F7EFFF", "#FFEBEBFF", "#CEFFD6FF"]
    if (allStageColors.includes(currentColor)) {
      return
    }

    editor.isReadOnly = false;

    const currentCellIndex = editor.selection.startOffset

    setPreviousCellColour(currentColor)
    setPreviousCellIndex(currentCellIndex)
    console.log("Setting previous cell index: " + currentCellIndex + " with colour: " + currentColor)

    editor.selection.cellFormat.background = stageSelectionColor
    console.log("Setting cell colour to: " + stageSelectionColor)

    // Restore the user's original selection
    editor.selection.select(initialStartOffset, initialEndOffset);
    editor.documentHelper.viewerContainer.scrollTop = scrollTop;

    editor.isReadOnly = true;

    // Force Syncfusion to update its internal layout/coordinate cache by reading layout properties
    // This forces a synchronous reflow and ensures coordinate mappings are current
    void editor.documentHelper.viewerContainer.scrollTop;
    void editor.selection.start.location;

    // switch (currentColor) {
    //   case EMPTY_CELL_COLOUR:
    //   case PLACEHOLDER_CELL_COLOUR:
    //   case TOGGLED_PLACEHOLDER_CELL_COLOUR:
    //   case FILLED_CELL_COLOUR:
    //     // console.log("Setting cell colour to stage-specific color: " + stageSelectionColor)
    //     break
    //   case SELECTED_EMPTY_CELL_COLOUR:
    //   case SELECTED_PLACEHOLDER_CELL_COLOUR:
    //   case SELECTED_TOGGLED_PLACEHOLDER_CELL_COLOUR:
    //   case SELECTED_FILLED_CELL_COLOUR:
    //     console.warn("Already selected doing nothing: " + currentColor)
    //     // Do nothing
    //     break
    //   default:
    //     let searching = true
    //     let i = 1
    //     while (searching) {
    //       const newColour = bigYellowNudge(currentColor, i)
    //       if (![EMPTY_CELL_COLOUR, PLACEHOLDER_CELL_COLOUR, TOGGLED_PLACEHOLDER_CELL_COLOUR, FILLED_CELL_COLOUR,
    //         SELECTED_EMPTY_CELL_COLOUR, SELECTED_PLACEHOLDER_CELL_COLOUR, SELECTED_TOGGLED_PLACEHOLDER_CELL_COLOUR,
    //         SELECTED_FILLED_CELL_COLOUR
    //       ].includes(newColour)) {
    //         editor.selection.cellFormat.background = newColour
    //         console.log("Setting cell colour to: " + newColour)
    //         searching = false
    //       } else {
    //         console.log("Not original colour: " + newColour)
    //       }
    //       i++
    //     }
    // }
  }, []);
  return { selectCell, deselectCell };
}
