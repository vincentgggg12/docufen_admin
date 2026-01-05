import { getStageSelectionColor } from "@/components/editor/lib/addinUtils";
import { useAppStore, useDocumentStore } from "@/lib/stateManagement";
import React from "react";
import { useShallow } from "zustand/shallow";


export const useBulkNA = () => {
  const { documentStage } = useDocumentStore(useShallow((state) => ({
    documentStage: state.documentStage,
  })));
  const highlightColor = React.useRef<string>("#777777");
  
  // Try accessing the store directly without useShallow to see if that makes a difference
  // const selectedCells = useAppStore(state => state.selectedCells);
  // const setSelectedCells = useAppStore(state => state.setSelectedCells);
  // const clearSelectedCellsState = useAppStore(state => state.clearSelectedCells);
  

  React.useEffect(() => {
    highlightColor.current = getStageSelectionColor(documentStage);
  }, [documentStage]);

  // Note: Document change detection has been moved to SFEditor to ensure it always runs
  // (MasterPopup may be unmounted when document changes)

  const selectCellIndex = (rawIndex: string, editor: any) => {
    // Check the store state directly for comparison
    const cellIndex = rawIndex.split(";").slice(0, -2).join(";") + ";0;0";
    const storeState = useAppStore.getState();
    console.log("Store state before update:", JSON.stringify(storeState.selectedCells));
    const selectedCells = useAppStore.getState().selectedCells;
    const setSelectedCells = useAppStore.getState().setSelectedCells;
    if (!selectedCells[cellIndex]) {
      console.log("Cell being selected: ", JSON.stringify(selectedCells));
      const newObj = {...selectedCells};
      newObj[cellIndex] = editor.selection.cellFormat.background;
      setSelectedCells(newObj);

      // Check if the store was updated properly
      console.log("Store state after update:", JSON.stringify(useAppStore.getState().selectedCells));
      console.log("Cell selected: ", JSON.stringify(newObj));
      editor.selection.cellFormat.background = highlightColor.current;
      console.log("Cell selected: ", editor.selection.cellFormat.background, highlightColor.current);
    }
  }
  const deSelectCellIndex = (rawIndex: string, editor: any) => {
    const cellIndex = rawIndex.split(";").slice(0, -2).join(";") + ";0;0";
    // Check the store state directly for comparison
    const storeState = useAppStore.getState();
    console.log("Store state before update:", JSON.stringify(storeState.selectedCells));
    const selectedCells = useAppStore.getState().selectedCells;
    const setSelectedCells = useAppStore.getState().setSelectedCells;
    if (selectedCells[cellIndex]) {
      console.log("Cell being deselected: ", JSON.stringify(selectedCells));
      editor.selection.cellFormat.background = selectedCells[cellIndex];
      const newObj = {...selectedCells};
      delete newObj[cellIndex];
      setSelectedCells(newObj);

      // Check if the store was updated properly
      console.log("Store state after update:", JSON.stringify(useAppStore.getState().selectedCells));
      console.log("Cell deselected: ", JSON.stringify(newObj));
      console.log("Cell deselected: ", editor.selection.cellFormat.background);
    }
  }

  const makeCellIndices = (startIndex: string, endIndex: string) => {
    const startBits = startIndex.split(";").slice(0,-2)
    const endBits = endIndex.split(";").slice(0,-2)
    const { editor } = useAppStore.getState();
    if (editor == null) return []
    if (startBits.length !== endBits.length) {
      console.warn("Start and end indices do not match in length");
      return [];
    }
    //  if selection in the same table
    if (startBits[startBits.length - 3] === endBits[startBits.length - 3]) {
      // if Rows are the same
      if (startBits[startBits.length - 2] === endBits[endBits.length - 2]) {
        // if Columns are the same
        if (startBits[startBits.length - 1] === endBits[endBits.length - 1]) {
          return [startIndex];
        } else {
          const startColumn = Math.min(parseInt(startBits[startBits.length - 1], 10), parseInt(endBits[endBits.length - 1], 10));
          const endColumn = Math.max(parseInt(startBits[startBits.length - 1], 10), parseInt(endBits[endBits.length - 1], 10));
          const cellIndices = [];
          for (let i = startColumn; i <= endColumn; i++) {
            const cellIndex = [...startBits.slice(0, -1), i.toString(), 0, 0].join(";");
            cellIndices.push(cellIndex);
          }
          console.log("single row cellIndices: ", JSON.stringify(cellIndices));
          return cellIndices;
        }
      } else {
        console.log("The rows are not the same")
        const startRow_ = parseInt(startBits[startBits.length - 2], 10);
        const endRow_ = parseInt(endBits[endBits.length - 2], 10);
        const startRow = Math.min(startRow_, endRow_);
        const endRow = Math.max(startRow_, endRow_);
        const startCol_ = parseInt(startBits[startBits.length - 1], 10);
        const endCol_ = parseInt(endBits[endBits.length - 1], 10);
        const startCol = Math.min(startCol_, endCol_);
        const endCol = Math.max(startCol_, endCol_);
        const cellIndices = [];
        console.log("startRow: ", startRow, " endRow: ", endRow, " startCol: ", startCol, " endCol: ", endCol);
        for (let i = startRow; i <= endRow; i++) {
          for (let j = startCol; j <= endCol; j++) {
            const cellIndex = [...startBits.slice(0, -2), i.toString(), j.toString(), "0", "0"].join(";");
            cellIndices.push(cellIndex);
          }
        }
        console.log("cellIndices: ", JSON.stringify(cellIndices));
        return cellIndices;
      }
    } else {
      console.warn("Multi table selection not supported yet")
      console.log("initialStartIndex: ", startIndex);
      console.log("initialEndIndex: ", endIndex);
      return []
    }
  }

  const updateSelectedCells = (mode: "select" | "deselect") => {
    console.log("mode called: " + mode);
    const { editor } = useAppStore.getState();
    if (!editor) {
      console.warn("Editor is not initialized");
      return;
    }

    const selection = editor.selection;
    if (!selection) {
      console.warn("No cell selected or selection is not empty");
      return;
    }
    const initialStartIndex = selection.startOffset
    const initialEndIndex = selection.endOffset
    const scrollTop = editor.documentHelper.viewerContainer.scrollTop
    const cellIndices: string[] = makeCellIndices(initialStartIndex, initialEndIndex);

    // Set editor to editable and start batch edit
    editor.isReadOnly = false;
    editor.editor.beginBatchEdit();

    for (const cellIndex of cellIndices) {
      selection.select(cellIndex, cellIndex);
      selection.selectCell()
      if (mode === "select") {
        selectCellIndex(cellIndex, editor);
      } else if (mode === "deselect") {
        deSelectCellIndex(cellIndex, editor);
      }
    }

    // End batch edit and restore read-only state
    editor.editor.endBatchEdit();
    editor.isReadOnly = true;

    selection.select(initialStartIndex, initialStartIndex)
    editor.documentHelper.viewerContainer.scrollTop = scrollTop
  }
  const reselectBulkNaCells = () => {
    const { editor } = useAppStore.getState();
    if (!editor) {
      console.warn("Editor is not initialized");
      return;
    }

    const selectedCells = useAppStore.getState().selectedCells;

    // Set editor to editable and start batch edit
    editor.isReadOnly = false;
    editor.editor.beginBatchEdit();

    Object.keys(selectedCells).forEach((cellIndex) => {
      editor.selection.select(cellIndex, cellIndex);
      editor.selection.cellFormat.background = highlightColor.current;
    });

    // End batch edit and restore read-only state
    editor.editor.endBatchEdit();
    editor.isReadOnly = true;
  }

  const clearSelectedCells = () => {
    const { editor } = useAppStore.getState();
    if (!editor) {
      console.warn("Editor is not initialized");
      return;
    }

    const selectedCells = useAppStore.getState().selectedCells;
    const clearSelectedCellsState = useAppStore.getState().clearSelectedCells;

    // Set editor to editable and start batch edit
    editor.isReadOnly = false;
    editor.editor.beginBatchEdit();

    Object.entries(selectedCells).forEach(([cellIndex, colour]) => {
      editor.selection.select(cellIndex, cellIndex);
      editor.selection.cellFormat.background = colour;
    });

    // End batch edit and restore read-only state
    editor.editor.endBatchEdit();
    editor.isReadOnly = true;

    clearSelectedCellsState();
  }
  return {
    updateSelectedCells,
    clearSelectedCells,
    reselectBulkNaCells
  }
}
