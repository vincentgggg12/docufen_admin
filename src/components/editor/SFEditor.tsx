import * as React from 'react'
import { CharacterFormatProperties, DocumentEditor, DocumentEditorKeyDownEventArgs } from '@syncfusion/ej2-react-documenteditor';
import { useAppStore, useDocumentStore, useModalStore, useUserStore } from '@/lib/stateManagement';
import './SFEditor.css';
import '@/styles/aptos-fonts.css';
import { useShallow } from 'zustand/shallow';
import { getStageColor, createCopyCursorSVG } from './lib/stageColors';
import { handleGetLastAuditLogItemError } from './lib/editUtils';
import { useTranslation } from 'react-i18next';
import LoadingScreen from '@/components/ui/loading';
import { DocumentFullState, getDocumentState, getLastAuditLogItem } from '../../lib/apiUtils';
import MasterPopup from './PopupComponents/MasterPopup';
import { useCellSelection } from '@/hooks/CellSelection';
import { useState, useRef } from 'react'
import { isSelectionInAPlaceholder, isSelectionNextToCheckBox } from './lib/cellUtils';
import { DocumentWorkingOverlay } from '@/components/ui/document-overlay';
// import WorkflowEditModeOverlay from './WorkflowEditModeOverlay';
import { Stage } from "@/components/editor/lib/lifecycle";
import { getStageString } from '@/components/editor/lib/utils';
import { Info, ZoomIn, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DocuDialog from './DocuDialog';
import DocumentStatusModal from './DocumentStatusModal';
import { NetworkErrorModal } from './NetworkErrorModal';
import { triggerReloadDocument } from "./lib/editUtils";
import { BusyException } from './lib/errors';
import { useNavigate } from 'react-router-dom';
import { useBulkNA } from '@/hooks/BulkNA';
import { BULK_NA_ING } from './lib/constants';
import { toast } from 'sonner';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import UploadProgressIndicator from './UploadProgressIndicator';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SFEditorProps {
  documentId?: string;
  onDocumentReady?: () => void;
}

// Zoom button component with popover
const ZoomButton: React.FC<{ editor: DocumentEditor | null; documentStage?: Stage }> = ({ editor, documentStage }) => {
  const [open, setOpen] = React.useState(false);
  const [_zoomValue, setZoomValue] = React.useState('100%'); // TODO Something is wrong here _zoomValue is not used
  const { t } = useTranslation();
  const stageString = documentStage ? getStageString(documentStage) : 'unknown';
  // Update zoom value display when editor zoom changes
  React.useEffect(() => {
    if (editor) {
      const updateZoomDisplay = () => {
        setZoomValue(`${Math.round(editor.zoomFactor * 100)}%`);
      };
      
      // Initial value
      updateZoomDisplay();
      
      // Add event listener for zoom changes
      const handleZoomChange = () => {
        updateZoomDisplay();
      };
      
      // Add event listener correctly
      if (editor.zoomFactorChange === undefined) {
        // Handle case where the event isn't available
      } else {
        editor.zoomFactorChange = handleZoomChange;
      }
      
      return () => {
        // Clean up - no need to explicitly set to null as this will be handled by component unmount
      };
    }
  }, [editor]);

  const handleZoomChange = (value: string, e: React.MouseEvent) => {
    // Stop event propagation to prevent document from stealing focus
    e.stopPropagation();
    e.preventDefault();

    if (!editor) return;
    
    let zoomLevel = '';
    
    if (value === t('fit-one-page')) {
      editor.fitPage('FitOnePage' as any);
      zoomLevel = 'fit_page';
    } else if (value === t('fit-page-width')) {
      editor.fitPage('FitPageWidth' as any);
      zoomLevel = 'fit_width';
    } else {
      // Parse the percentage and convert to zoom factor
      const percentage = parseInt(value.replace('%', ''), 10);
      if (!isNaN(percentage)) {
        editor.zoomFactor = percentage / 100;
        zoomLevel = `${percentage}%`;
      }
    }
    
    // Track zoom change
    trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
      button_name: `zoom_change_${zoomLevel}`,
      button_location: 'document_editor_toolbar',
      page_name: 'Document Editor'
    });
    
    // Use setTimeout to prevent immediate closing
    setTimeout(() => {
      setOpen(false);
    }, 100);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    // Prevent event from reaching document
    e.stopPropagation();
    e.preventDefault();
    setOpen(!open);
  };

  // Handle popover content click to prevent closing
  const handlePopoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const zoomOptions = [
    '200%', '175%', '150%', '125%', '100%', '75%', '50%', '25%',
    t('fit-one-page'), t('fit-page-width')
  ];

  return (
    <Popover 
      open={open} 
      onOpenChange={setOpen}
      modal={true} // Using modal mode to prevent auto-closing
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 absolute bottom-4 left-3 bg-white rounded-full hover:bg-gray-50 z-30 shadow-md")}
          aria-label={t('zoom-options')}
          onClick={handleButtonClick}
          data-testid={`editor.${stageString}.zoom.button`}
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2" 
        side="right" 
        align="end"
        sideOffset={16}
        onClick={handlePopoverClick}
        data-testid={`editor.${stageString}.zoom.popover`}
      >
        <div className="flex flex-col space-y-1">
          {zoomOptions.map((option, index) => (
            <React.Fragment key={option}>
              {index === 8 && <Separator className="my-1" />} {/* Add separator before fit options */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start h-8 px-2"
                onClick={(e) => handleZoomChange(option, e)}
                onMouseDown={(e) => e.stopPropagation()} // Extra protection
              >
                {option}
              </Button>
            </React.Fragment>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Search Button Component
const SearchButton: React.FC<{ editor: DocumentEditor | null; documentStage: Stage }> = ({ editor, documentStage }) => {
  const [open, setOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');
  const [currentMatch, setCurrentMatch] = React.useState(0);
  const [totalMatches, setTotalMatches] = React.useState(0);
  const [caseSensitive, setCaseSensitive] = React.useState(false);
  const [wholeWord, setWholeWord] = React.useState(false);
  const { t } = useTranslation();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const matchIndexRef = React.useRef(0);
  const stageString = getStageString(documentStage);

  // Get search options
  const getSearchOption = React.useCallback(() => {
    if (caseSensitive && wholeWord) {
      // Syncfusion doesn't support combined options, so we'll use case sensitive
      return 'CaseSensitive';
    }
    if (caseSensitive) return 'CaseSensitive';
    if (wholeWord) return 'WholeWord';
    return 'None';
  }, [caseSensitive, wholeWord]);

  // Perform search
  const performSearch = React.useCallback(() => {
    if (!editor || !searchText) {
      setTotalMatches(0);
      setCurrentMatch(0);
      return;
    }

    // Track search performed
    trackAmplitudeEvent(AMPLITUDE_EVENTS.SEARCH_PERFORMED, {
      search_query: searchText.substring(0, 50), // Limit query length for privacy
      search_type: 'in_document',
      results_count: 0, // Will update after search
      page_name: 'Document Editor'
    });

    // Store current focus
    const currentlyFocused = document.activeElement;

    // Clear previous search
    editor.search.searchResults.clear();

    // Find all matches
    editor.search.findAll(searchText, getSearchOption());

    // Update match count
    const matches = editor.search.searchResults.length;
    setTotalMatches(matches);
    setCurrentMatch(matches > 0 ? 1 : 0);
    matchIndexRef.current = 0; // Reset index for new search

    // Restore focus
    if (currentlyFocused && currentlyFocused instanceof HTMLElement) {
      setTimeout(() => currentlyFocused.focus(), 0);
    }
  }, [editor, searchText, getSearchOption]);

  // Find next match
  const findNext = React.useCallback(() => {
    if (!editor || !searchText || totalMatches === 0) return;

    editor.search.find(searchText, getSearchOption());
    
    // Update match index
    matchIndexRef.current = (matchIndexRef.current + 1) % totalMatches;
    setCurrentMatch(matchIndexRef.current + 1);
  }, [editor, searchText, totalMatches, getSearchOption]);

  // Find previous match
  const findPrevious = React.useCallback(() => {
    if (!editor || !searchText || totalMatches === 0) return;

    // Syncfusion doesn't have built-in findPrevious, so we cycle through
    for (let i = 0; i < totalMatches - 1; i++) {
      editor.search.find(searchText, getSearchOption());
    }
    
    // Update match index
    matchIndexRef.current = matchIndexRef.current > 0 ? matchIndexRef.current - 1 : totalMatches - 1;
    setCurrentMatch(matchIndexRef.current + 1);
  }, [editor, searchText, totalMatches, getSearchOption]);

  // Handle search text change with debounce
  React.useEffect(() => {
    if (searchText === '') {
      // Clear immediately if search text is empty
      if (editor) {
        editor.search.searchResults.clear();
      }
      setTotalMatches(0);
      setCurrentMatch(0);
      return;
    }

    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 700); // Increased debounce time

    return () => clearTimeout(debounceTimer);
  }, [searchText, performSearch, editor]);

  // Clear search when closing
  React.useEffect(() => {
    if (!open && editor) {
      editor.search.searchResults.clear();
      setSearchText('');
      setTotalMatches(0);
      setCurrentMatch(0);
    }
  }, [open, editor]);

  // Focus input when opening
  React.useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        findPrevious();
      } else {
        findNext();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <>
      <Popover 
        open={open} 
        onOpenChange={setOpen}
        modal={true}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 absolute bottom-16 left-3 bg-white rounded-full hover:bg-gray-50 z-30 shadow-md")}
            aria-label="Search"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(!open);
            }}
            data-testid={`editor.${stageString}.search.button`}
          >
            <Search className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-3" 
          side="right" 
          align="end"
          sideOffset={16}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Don't close if clicking on the search button
            const target = e.target as HTMLElement;
            if (target.closest('[aria-label="Search"]')) {
              e.preventDefault();
            }
          }}
          data-testid={`editor.${stageString}.search.popover`}
        >
          <div className="space-y-3">
            {/* Search Input */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                ref={searchInputRef}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('find-in-document', 'Find in document...')}
                className="h-8 flex-1"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-testid={`editor.${stageString}.search.inputField`}
              />
              {searchText && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => setSearchText('')}
                  data-testid={`editor.${stageString}.search.clearButton`}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            {/* SOME CONFISION HERE AS THE NATIVE SEARCH. IT WAS GIVING "Aa" and "W" to search with matching case but these buttons actually went to previous and next results. */}
            {/* Search Options and Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* <Button
                  variant={caseSensitive ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setCaseSensitive(!caseSensitive)}
                  title={t('match-case', 'Match case')}
                >
                  Aa
                </Button>
                <Button
                  variant={wholeWord ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setWholeWord(!wholeWord)}
                  title={t('whole-word', 'Whole word')}
                >
                  W
                </Button> */}
              </div>

              <div className="flex items-center gap-1">
                {totalMatches > 0 && (
                  <Badge variant="secondary" className="h-6 px-2 text-xs" data-testid={`editor.${stageString}.search.resultsCount`}>
                    {currentMatch}/{totalMatches}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCaseSensitive(!caseSensitive)}
                  disabled={totalMatches === 0}
                  title={t('previous-match', 'Previous match (Shift+Enter)')}
                  data-testid={`editor.${stageString}.search.previousButton`}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setWholeWord(!wholeWord)}
                  disabled={totalMatches === 0}
                  title={t('next-match', 'Next match (Enter)')}
                  data-testid={`editor.${stageString}.search.nextButton`}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Results message */}
            {searchText && totalMatches === 0 && (
              <p className="text-xs text-muted-foreground text-center" data-testid={`editor.${stageString}.search.noResultsMessage`}>
                {t('no-results-found', 'No results found')}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};


const SFEditor: React.FC<SFEditorProps> = ({ documentId: propDocumentId, onDocumentReady }) => {
  // All the existing state and refs remain the same
  // const previousCellRef = React.useRef<TableCellWidget | null>(null);
  const oldSelection = React.useRef<string>('');
  const zoomTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const [languageSet, setLanguageSet] = React.useState(false)
  const [created, setCreated] = React.useState(false)
  const docObject = React.useRef("")
  const [dataReady, setDataReady] = React.useState(false)
  const mouseActTime = React.useRef<number>(0)
  const scrollTopBeforeClick = React.useRef<number>(0)
  // const [_saveToStorage, setSaveToStorage] = React.useState(() => () => { })
  const { t, i18n } = useTranslation();
  const { selectCell, deselectCell } = useCellSelection()
  const containerRef = React.useRef<HTMLDivElement>(null);
  const documentEditorRef = React.useRef<DocumentEditor | null>(null);
  const savedClickLocation = React.useRef<{ top: number, left: number }>({ top: 0, left: 0 });
  // Add a ref to track if instructions have been shown for this document session
  const instructionsShownRef = React.useRef<boolean>(false);
  const [documentIsLoaded, setDocumentIsLoaded] = useState(false);
  // Add a flag to track whether we've attempted to show the popup
  const popupShownForCurrentDocRef = useRef(false);
  // Add a flag to track if this is a newly created document
  const isNewDocumentRef = useRef(false);
  // const { addMessage, setMessages } = useChatStore();
  // Add a ref to track that a reload is in progress
  const isSelectingRef = React.useRef(false);
  const isReloadingRef = React.useRef(false);
  // Add a ref to prevent re-entrant/cascading selection change events
  const isHandlingSelection = React.useRef(false);
  const selectTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [documentNotFound, setDocumentNotFound] = React.useState(false);
  const [noDocumentAccess, setNoDocumentAccess] = React.useState(false)
  
  // Add a flag to track if this is the initial document load
  const isInitialLoadRef = React.useRef(true);
  
  // Add state to track refresh button loading state
  // const [setIsRefreshing] = useState(false);

  // All store access and useEffects remain the same
  const { user, login, setTenantName } = useUserStore(useShallow((state) => ({
    user: state.user,
    login: state.login,
    setTenantName: state.setTenantName
  })))
  const { documentStatus, setDocumentStatus, multipleTableCellsSelected, setMultipleTableCellsSelected,
    multipleParagraphsSelected, setMultipleParagraphsSelected,
    unableToCorrectAttachment, setUnableToCorrectAttachment,
    setUnsupportedAttachmentType, unsupportedAttachmentType,
    isUploading, uploadProgress
  } = useModalStore(useShallow((state) => ({
    documentStatus: state.documentStatus,
    setDocumentStatus: state.setDocumentStatus,
    documentNotUpToDate: state.documentNotUpToDate,
    setDocumentNotUpToDate: state.setDocumentNotUpToDate,
    documentInUse: state.documentInUse,
    setDocumentInUse: state.setDocumentInUse,
    multipleTableCellsSelected: state.multipleTableCellsSelected,
    setMultipleTableCellsSelected: state.setMultipleTableCellsSelected,
    multipleParagraphsSelected: state.multipleParagraphsSelected,
    setMultipleParagraphsSelected: state.setMultipleParagraphsSelected,
    unableToCorrectAttachment: state.unableToCorrectAttachment,
    setUnableToCorrectAttachment: state.setUnableToCorrectAttachment,
    unsupportedAttachmentType: state.unsupportedAttachmentType,
    setUnsupportedAttachmentType: state.setUnsupportedAttachmentType,
    isUploading: state.isUploading,
    uploadProgress: state.uploadProgress,
  })))
  const { documentId, setDocumentId, locale, documentStage, 
    updateDocumentState, setDocumentDescription, setParticipantGroups,
    resetParticipantGroups, reloadTrigger, reloadSelection, setReloadingDoc
  } = useDocumentStore(useShallow((state) => ({
    documentId: state.documentId,
    documentStage: state.documentStage,
    updateDocumentState: state.updateDocumentState,
    setDocumentId: state.setDocumentId,
    locale: state.locale,
    reloadTrigger: state.reloadTrigger,
    reloadSelection: state.reloadSelection,
    setDocumentDescription: state.setDocumentDescription,
    setParticipantGroups: state.setParticipantGroups,
    resetParticipantGroups: state.resetParticipantGroups,
    setReloadingDoc: state.setReloadingDoc,
  })))

  const { editor, hideInsertIntoCellDialog, setEditor, 
  } = useAppStore(useShallow((state) => ({
    setEditor: state.setEditor,
    setClickLocation: state.setClickLocation,
    editor: state.editor,
    hideInsertIntoCellDialog: state.hideInsertIntoCellDialog,
    showInsertIntoCellDialog: state.showInsertIntoCellDialog,
    // setToggleComments: state.setToggleComments,
  })))
  const { updateSelectedCells, reselectBulkNaCells } = useBulkNA();
  const { showNoCheckboxFound, setShowNoCheckboxFound
  } = useModalStore(useShallow((state) => ({
    showNoCheckboxFound: state.showNoCheckboxFound,
    setShowNoCheckboxFound: state.setShowNoCheckboxFound,
  })))
  
  // Note: Document change cleanup is now handled in DocExecutionPage
  // This ensures state is cleared before the editor is recreated
  
  const { insertAtCursor } = useAppStore(useShallow((state) => ({
    insertAtCursor: state.insertAtCursor
  })))
  const navigate = useNavigate()
  // Effect to automatically show instructions popup when document is opened
  React.useEffect(() => {
    // Intentionally leaving this inactive per user request
    // instructionsShownRef tracks whether instructions have been shown
    instructionsShownRef.current = true; // Mark as shown to prevent auto-display
  }, [editor, created]);

  // Detect if this is a newly created document from URL or session storage
  React.useEffect(() => {
    if (documentId) {
      // Check if this document was just created (has a 'newDocument' marker in sessionStorage)
      const isNewlyCreated = sessionStorage.getItem(`newDocument_${documentId}`) === 'true';
      if (isNewlyCreated) {
        isNewDocumentRef.current = true;
        // Remove the marker after using it
        sessionStorage.removeItem(`newDocument_${documentId}`);
      } else {
        isNewDocumentRef.current = false;
      }
    }
  }, [documentId]);

  // Track document loaded state more reliably
  React.useEffect(() => {
    // Reset document loaded state and popup shown flag when document ID changes
    setDocumentIsLoaded(false);
    popupShownForCurrentDocRef.current = false;
    isInitialLoadRef.current = true; // Reset initial load flag on document change
  }, [documentId]);

  // Additional check for document loaded based on page count
  React.useEffect(() => {
    if (editor && created && !documentIsLoaded && !popupShownForCurrentDocRef.current) {
      // If document has pages, it's probably loaded
      if (editor.pageCount > 0) {
        setDocumentIsLoaded(true);
      }
    }
  }, [editor, created, documentIsLoaded]);

  // Add a fallback timer to check document loading after a delay
  React.useEffect(() => {
    if (!documentIsLoaded && editor && created && !popupShownForCurrentDocRef.current) {
      // Set a fallback timer to check document loading status
      const fallbackTimer = setTimeout(() => {
        if (editor && !documentIsLoaded && !popupShownForCurrentDocRef.current) {
          // console.log("Fallback timer triggered - ensuring document loaded state is set");
          
          // Check document content as another indicator
          try {
            const content = editor.documentHelper.pages;
            if (content && content.length > 0) {
              setDocumentIsLoaded(true);
            } else if (isNewDocumentRef.current) {
              // For new documents, set loaded state but don't trigger popup
              setDocumentIsLoaded(true);
              // Don't set popupShownForCurrentDocRef.current = true to avoid opening popup
            }
          } catch (err) {
            console.log("Could not check document content via documentHelper");
            
            // For new documents, set the document loaded state but don't open popup
            if (isNewDocumentRef.current) {
              console.log("New document detected - setting document loaded state despite error");
              setDocumentIsLoaded(true);
              // Don't set popupShownForCurrentDocRef.current = true to avoid opening popup
            }
          }
        }
      }, 1500); // Slightly longer fallback for new documents
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [editor, created, documentIsLoaded]);

  React.useEffect(() => {
    if (locale.length == 0) return
    
    // Check if debug mode is enabled - don't change language if it is
    if (localStorage.getItem('i18nextDebugMode') === 'true') {
      setLanguageSet(true);
      return;
    }
    
    if (locale !== i18n.language) {
      console.log("using document language from server: " + locale + " not " + i18n.language)
    } else {
      // Document language has not been found yet
      setLanguageSet(true)
      return
    }
    i18n.changeLanguage(locale).then(() => {
      setTimeout(() => {
        setLanguageSet(true)
      }, 100)
    }).catch((err: unknown) => {
      if (err instanceof Error) console.error("Error changing language: " + err.message)
    })
  }, [locale, i18n, i18n.language])

  // Render Document Editor component.
  React.useEffect(() => {
    const pathname = window.location.pathname;
    // Remove trailing slash if present
    const cleanPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    // Split by '/' and filter out empty segments
    const segments = cleanPath.split('/').filter(segment => segment);
    // Get the last segment as the document ID
    if (segments.length > 0) {
      setDocumentId(segments[segments.length - 1]);
    }
  }, [])

  const runHideDialog = () => {
    const { editor } = useAppStore.getState()
    if (editor == null) {
      console.warn("Editor is null")
      return
    }
    deselectCell(editor)
    setTimeout(() => {
      // console.log("Running hide dialog")
      hideInsertIntoCellDialog()
    }, 10)
  }

  React.useEffect(() => {
    if (editor == null) return
      editor.isReadOnly = true
  }, [editor, documentStage])


  // Effect to load document data when the component mounts or document ID changes
  React.useEffect(() => {
    // console.log(`Loading document data for ID: ${propDocumentId || documentId}`);
    if (user == null) return
    const id = propDocumentId || documentId;
    if (!id) {
      console.error("No document ID provided");
      return;
    }
    
    // Reset participant groups before loading new document to prevent state persisting from previous document
    resetParticipantGroups();
    
    // Reset workflow edit mode when loading a new document
    const workflowEditModeEvent = new CustomEvent('workflow-edit-mode-change', { detail: false });
    window.dispatchEvent(workflowEditModeEvent);
    
    getDocumentState(id).then((documentState: DocumentFullState) => {
      // Use the existing document state update code from the file
      if (documentState.code === 200) {
        const documentTenantName = documentState.documentDescription?.tenantName
        if (!documentTenantName || documentTenantName !== user.tenantName) {
          setTenantName(documentTenantName ? documentTenantName : "")
          useUserStore.getState().setLoading(true)
          login(documentTenantName ? documentTenantName : "/home")
        }
        if (documentState.lastAuditItem) {
          updateDocumentState(documentState.lastAuditItem, t);
        }
        setDocumentDescription(documentState.documentDescription);
        
        // Update participant groups from document description to ensure workflow sidebar is updated
        if (documentState.documentDescription && documentState.documentDescription.participantGroups) {
          setParticipantGroups(documentState.documentDescription.participantGroups);
        }
        if (documentState.documentContent != docObject.current) {
          if (documentState.documentContent) {
            // console.log("length of docObject: ", docObject.current.length)
            docObject.current = documentState.documentContent;
            setDataReady(true);
            // console.log("Document content loaded, length:", documentState.documentContent.length);
          } else {
            console.error("No document content found in response");
          }
        }
        // Load the document content
      } else if (documentState.code === 404) {
        console.error("Document not found for ID:", id);
        setDocumentNotFound(true)
        // Optionally, you can redirect or show an error message
      } else if (documentState.code === 403) {
        console.error("Access denied to document ID:", id);
        setNoDocumentAccess(true)
        // Optionally, you can redirect or show an error message
      } else if (documentState.code === 410) {
        console.error("Document has been deleted:", id);
        toast.error(t('notifications.documentDeletedError', 'This document has been deleted and is no longer available.'));
        // Wait a moment for the toast to show, then navigate to home
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      }
    }).catch((error) => {
      console.error("Error loading document:", error);
    });
    
  }, [user, propDocumentId, documentId, updateDocumentState, setDocumentDescription, setParticipantGroups, 
    resetParticipantGroups, reloadTrigger, t]);

  const validateDocContent = (content: string): boolean => {
    try {
      // Check if it's a valid JSON string that has the expected structure
      const parsed = JSON.parse(content);
      return parsed &&
        typeof parsed === 'object';
    } catch (e) {
      console.error("Invalid format:", e);
      return false;
    }
  };

  // Update your useEffect for opening the document
  React.useEffect(() => {
    if (isReloadingRef.current) return
    // console.log("Document opening effect triggered:", JSON.stringify({
    //   created,
    //   editorExists: !!editor,
    //   documentId,
    //   docLength: docObject.current.length,
    //   userExists: !!user
    // }));

    if (editor == null) {
      console.log("Editor not initialized yet");
      return;
    }

    if (docObject.current.length < 5) {
      console.log("doc object is too small or empty");
      return;
    }

    if (user == null) {
      console.log("User not logged in yet");
      return;
    }

    if (!created) {
      console.log("Editor not fully created yet");
      return;
    }

    try {
      // Validate the doc content before opening
      if (!validateDocContent(docObject.current)) {
        console.error("Invalid doc format, cannot open document");
        return;
      }
      
      // Save original event handlers
      const originalHandlers = {
        focusIn: editor.focusIn,
        selectionChange: editor.selectionChange,
        documentChange: editor.documentChange,
        contentControl: editor.contentControl,
        contentChange: editor.contentChange,
        zoomFactorChange: editor.zoomFactorChange,
        enableSelection: editor.enableSelection
      };
      
      /**
       * WORKAROUND: Prevent "Maximum call stack size exceeded" error in Syncfusion DocumentEditor
       * 
       * Issue: During document reload, Syncfusion's internal updateFocus method can enter an 
       * infinite recursion loop when DOM focus events cascade during the document loading process.
       * 
       * Solution: We temporarily:
       * 1. Intercept and prevent all DOM focus events at the container level
       * 2. Replace editor event handlers with no-op functions
       * 3. Disable editor selection capability
       * 4. Clear any existing focus before loading
       * 5. Block all user interactions (clicks, keyboard) during reload
       * 
       * This prevents the focus cascade that triggers the infinite recursion.
       */
      
      // Create DOM-level event interceptors
      const preventEvent = (e: Event) => {
        if (isReloadingRef.current) {
          e.preventDefault();
          e.stopImmediatePropagation();
          e.stopPropagation();
        }
      };
      
      // Helper function to add event blockers
      const addEventBlockers = () => {
        // Block focus events at document level to prevent Radix UI conflicts
        document.addEventListener('focus', preventEvent, true);
        document.addEventListener('focusin', preventEvent, true);
        document.addEventListener('blur', preventEvent, true);
        document.addEventListener('focusout', preventEvent, true);
        
        if (containerRef.current) {
          // Block all pointer/mouse events on container
          containerRef.current.addEventListener('pointerdown', preventEvent, true);
          containerRef.current.addEventListener('pointerup', preventEvent, true);
          containerRef.current.addEventListener('pointermove', preventEvent, true);
          containerRef.current.addEventListener('click', preventEvent, true);
          containerRef.current.addEventListener('dblclick', preventEvent, true);
          containerRef.current.addEventListener('mousedown', preventEvent, true);
          containerRef.current.addEventListener('mouseup', preventEvent, true);
          
          // Block keyboard events
          containerRef.current.addEventListener('keydown', preventEvent, true);
          containerRef.current.addEventListener('keyup', preventEvent, true);
          containerRef.current.addEventListener('keypress', preventEvent, true);
          
          // Add visual indicator that document is reloading
          containerRef.current.style.pointerEvents = 'none';
          containerRef.current.style.opacity = '0.7';
        }
      };
      
      // Helper function to remove all event blockers
      const removeEventBlockers = () => {
        // Remove document-level focus event blockers
        document.removeEventListener('focus', preventEvent, true);
        document.removeEventListener('focusin', preventEvent, true);
        document.removeEventListener('blur', preventEvent, true);
        document.removeEventListener('focusout', preventEvent, true);
        
        if (containerRef.current) {
          // Remove pointer/mouse event blockers
          containerRef.current.removeEventListener('pointerdown', preventEvent, true);
          containerRef.current.removeEventListener('pointerup', preventEvent, true);
          containerRef.current.removeEventListener('pointermove', preventEvent, true);
          containerRef.current.removeEventListener('click', preventEvent, true);
          containerRef.current.removeEventListener('dblclick', preventEvent, true);
          containerRef.current.removeEventListener('mousedown', preventEvent, true);
          containerRef.current.removeEventListener('mouseup', preventEvent, true);
          
          // Remove keyboard event blockers
          containerRef.current.removeEventListener('keydown', preventEvent, true);
          containerRef.current.removeEventListener('keyup', preventEvent, true);
          containerRef.current.removeEventListener('keypress', preventEvent, true);
          
          // Restore visual state
          containerRef.current.style.pointerEvents = '';
          containerRef.current.style.opacity = '';
        }
      };
      
      // Helper function to restore editor state
      const restoreEditorState = () => {
        if (editor) {
          editor.enableSelection = originalHandlers.enableSelection;
          editor.focusIn = originalHandlers.focusIn;
          editor.selectionChange = originalHandlers.selectionChange;
          editor.documentChange = originalHandlers.documentChange;
          editor.contentControl = originalHandlers.contentControl;
          editor.contentChange = originalHandlers.contentChange;
          editor.zoomFactorChange = originalHandlers.zoomFactorChange;
        }
      };
      
      // Add comprehensive event blocking during reload
      addEventBlockers();
      
      // Clear any existing focus to prevent cascading focus events
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
      
      // Detach all event handlers using empty functions to avoid TypeScript errors
      editor.focusIn = () => {};
      editor.selectionChange = () => {};
      editor.documentChange = () => {};
      editor.contentControl = () => {};
      editor.contentChange = () => {};
      editor.zoomFactorChange = () => {};
      
      // Disable selection to prevent internal focus handling
      editor.enableSelection = false;
      
      // Set reloading flag
      isReloadingRef.current = true;
      
      try {
        if (editor && editor.getDocumentEditorElement() && dataReady) {
          setReloadingDoc(reloadSelection.length > 1)
          editor.isReadOnly = false
          
          // Open document without any event interference
          editor.open(docObject.current)
          setDataReady(false)
          
          // Poll for document readiness instead of using arbitrary timeout
          let pollCount = 0;
          const maxPolls = 100; // Maximum 1 second of polling (100 * 10ms)
          
          const checkDocumentReady = () => {
            pollCount++;
            
            if (editor && editor.pageCount > 0 && editor.documentHelper) {
              // Document is fully loaded when pageCount > 0 and documentHelper exists
              // Remove all event blockers
              removeEventBlockers();
              
              // Restore editor state
              restoreEditorState();
              
              // Mark initial load as complete after document is opened
              // if (isInitialLoadRef.current) {
              //   isInitialLoadRef.current = false;
              // }
              
              // Now manually trigger document change to handle selection restoration
              if (originalHandlers.documentChange) {
                originalHandlers.documentChange.call(editor);
              }
            } else if (pollCount < maxPolls) {
              // Check again in 10ms if document not ready
              setTimeout(checkDocumentReady, 10);
            } else {
              // Timeout after 1 second - restore state anyway to prevent stuck state
              console.warn("Document load polling timeout - restoring editor state");
              removeEventBlockers();
              restoreEditorState();
              isReloadingRef.current = false
            }
          };
          
          // Start checking after a minimal delay to allow the open() call to initiate
          setTimeout(checkDocumentReady, 10);
        }
      } catch (openError) {
        console.error("Error opening document:", openError);
        // Restore everything even on error
        removeEventBlockers();
        restoreEditorState();
        isReloadingRef.current = false

      }
    } catch (e) {
      console.error("Error processing document:", e);
    }
  }, [created, editor, user, documentId, dataReady]);


  // Editor initialization effect
  React.useEffect(() => {
    // Log document ID changes for debugging
    // console.log("Editor initialization evaluating with documentId:", documentId);
    
    if (documentId.length < 5) {
      console.log("Document ID too short for initialization:", documentId);
      return;
    }
    
    if (languageSet === false) {
      console.log("Language not set yet, waiting for initialization");
      return;
    }
    
    // console.log("Initializing editor with documentId:", documentId);
    
    function onkeydown(args: DocumentEditorKeyDownEventArgs) {
      const { editor, selectMode } = useAppStore.getState()
      if (editor == null) return
      if (args.event.key === "f") {
        args.event.preventDefault();
        args.event.stopPropagation();
        args.isHandled = true;
        return
      }
      if (args.event.ctrlKey) {
        // console.log("allowing ctl key combos")
        return
      }

      // Check if search dialog is open
      // When search dialog is open, we should allow typing
      const searchDialog = document.querySelector('.e-de-search-dlg');
      if (searchDialog) {
        // console.log("Search dialog is open, allowing keyboard input");
        return; // Allow all keyboard input when search dialog is open
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(args.event.key)) {
        return; // Allow arrow keys to navigate
      }
      if (args.event.key === "Escape") {
        if (selectMode !== "select") {
          // console.log("Escape key pressed");
          runHideDialog();
        }
      } else if (args.event.key === "Control") {
        // console.log("Control key pressed");
        return
      }

      // console.log("cancelling keydown: " + args.event.key);
      args.event.preventDefault();
      args.event.stopPropagation();
      args.isHandled = true;
    }

    function handleDocumentChange() {
      const { editor } = useAppStore.getState();
      const { reloadSelection } = useDocumentStore.getState();
      if (editor == null) return;

      // Guard to prevent recursion
      // console.log("Document changed", isReloadingRef.current, reloadingDoc, editor.pageCount, editor.selection, JSON.stringify(reloadSelection));
      // console.log("Document changed", performance.now())
      if (isSelectingRef.current) {
        // console.log("Reload in progress, ignoring documentChange");
        return;
      }
      if (isReloadingRef.current && editor.pageCount > 0) {
        // Set flag so subsequent documentChange events do not trigger reloading
        editor.isReadOnly = true
        isSelectingRef.current = true;
        setReloadingDoc(false);
        isReloadingRef.current = false
        if (reloadSelection.length > 1) {
          editor.selection.select(reloadSelection[0], reloadSelection[1]);
          // console.log("Reselecting location: " + JSON.stringify(reloadSelection))
          if (editor.selection.start.paragraph.isInsideTable) {
            selectCell(editor)
          }
        } else if (reloadSelection.length === 1 && reloadSelection[0] == BULK_NA_ING) {
          reselectBulkNaCells()
        }
        useDocumentStore.getState().setReloadSelection([])
        // Only show the "updated" modal if this is not the initial document load
        if (!isInitialLoadRef.current) {
          useModalStore.getState().setDocumentStatus("updated")
        } else {
          // console.log("Skipping modal on initial document load");
          isInitialLoadRef.current = false
          // Mark initial load as complete
        }
        
        setTimeout(() => {
          useAppStore.getState().setWorking(false)
          isSelectingRef.current = false;
        }, 1000)
        // // Use requestAnimationFrame to ensure DOM updates are complete before focusing
        // requestAnimationFrame(() => {
        //   // Second frame to ensure all browser rendering is complete
        //   requestAnimationFrame(() => {
        //     isSelectingRef.current = false;
        //     // Restore editor focus after document reload
        //     if (editor && editor.focusIn) {
        //       try {
        //         editor.focusIn();
        //       } catch (err) {
        //         let msg = JSON.stringify(err)
        //         if (err instanceof Error) msg = err.message
        //         console.error("Error caught trying to focus: " + msg)
        //       }
        //     }
        //   });
        // });
      }
    }
    
    function handleSelectionChange() {
      if (isReloadingRef.current) {
        // console.log("Reloading, ignoring selection change");
        return;
      }

      // Block re-entrant/cascading calls during processing
      if (isHandlingSelection.current) {
        // console.log("Blocking cascaded selection change");
        return;
      }

      const { selectionMode, selectMode } = useAppStore.getState();
      if (selectionMode === "select") {
        const now = performance.now()
        const isUserInitiated = savedClickLocation.current.top > 0 && (now - mouseActTime.current < 25);
        if(isUserInitiated) {
          // console.warn("User initiated selection change: " + (now - mouseActTime.current).toString())
          mouseActTime.current -= 25
        } else {
          return
        }

        // Set re-entry flag and ensure cleanup
        isHandlingSelection.current = true;
        try {
          if (selectTimerRef.current) {
            clearTimeout(selectTimerRef.current);
          }
          selectTimerRef.current = setTimeout(() => {
            updateSelectedCells(selectMode)
          }, 300)
        } finally {
          isHandlingSelection.current = false;
        }

      } else if (selectionMode === "edit") {
        const { editor } = useAppStore.getState()
        const { showInsertIntoCellDialog, setSelectionIsMade, setSelectionIsNotMade, setClickLocation
        } = useAppStore.getState()
        const { documentStage } = useDocumentStore.getState();

        if (editor == null) return
        if (showInsertIntoCellDialog == null) return

        if (savedClickLocation.current)
          setClickLocation(savedClickLocation.current);

        const selection = editor.selection;
        if (selection == null) return
        const startOffset = selection.startOffset
        const endOffset = selection.endOffset;
        if (selectTimerRef.current) {
          clearTimeout(selectTimerRef.current);
        }
        if (startOffset !== endOffset) {
          selectTimerRef.current = setTimeout(() => {
            // console.log("<----------Selection changed:---------->" + startOffset + " " + endOffset)
            setSelectionIsMade()
          }, 200)
        } else {
          selectTimerRef.current = setTimeout(() => setSelectionIsNotMade(), 200)
        }

        const now = performance.now()
        const isUserInitiated = savedClickLocation.current.top > 0 && (now - mouseActTime.current < 25);

        if(isUserInitiated) {
          // console.warn("User initiated selection change: " + (now - mouseActTime.current).toString())
          mouseActTime.current -= 25
        } else {
          return
        }

        // Set re-entry flag and ensure cleanup
        isHandlingSelection.current = true;
        try {
          // Important: We only open the MasterPopup for user-initiated actions
          // isUserInitiated is true when the user has clicked and triggered a selection change

          // Detect and recover from Syncfusion coordinate mapping corruption
          const scrollTopAfter = editor.documentHelper.viewerContainer.scrollTop
          const scrollTopBefore = scrollTopBeforeClick.current
          const scrollDifference = scrollTopAfter - scrollTopBefore;

          // Large scroll jumps indicate Syncfusion misinterpreted click coordinates
          if (Math.abs(scrollDifference) > 50) {
            // Hide any popup that might have started showing
            runHideDialog()
            // Restore the scroll position to before the click
            editor.documentHelper.viewerContainer.scrollTop = scrollTopBefore
            // Force Syncfusion to recalculate its internal coordinate cache
            void editor.documentHelper.viewerContainer.scrollTop
            void editor.documentHelper.viewerContainer.clientHeight
            void editor.selection.start.location

            // Micro-zoom trick: Force complete relayout
            const currentZoom = editor.zoomFactor
            editor.zoomFactor = currentZoom + 0.0002
            setTimeout(() => {
              if (editor) {
                editor.zoomFactor = currentZoom
                console.error(`✓ Recovery complete - please click again`)
              }
            }, 10)

            // Return early to prevent operations with corrupted coordinates
            return
          }

          // Don't show the MasterPopup if the document is in the Closed stage
          if ((documentStage as number) === Stage.Closed) {
            // console.log('❌ Document is closed - skipping MasterPopup');
            return;
          }

          // Only show dialog if it's not already showing
          const { insertIntoCellDialogShowing: isDialogShowing } = useAppStore.getState();

          if (!isDialogShowing) {
            setTimeout(() => {
              showInsertIntoCellDialog();
            }, 200)
          }

          let shouldSkipCellSelection = false;
          if (isSelectionInAPlaceholder(editor)) {
            oldSelection.current = editor.selection.startOffset + " " + editor.selection.endOffset
            shouldSkipCellSelection = true; // Placeholder already selected, skip cell selection to prevent cascade
            deselectCell(editor)
          } else if (isSelectionNextToCheckBox(editor)) {
            oldSelection.current = editor.selection.startOffset + " " + editor.selection.endOffset
            shouldSkipCellSelection = true; // Checkbox already selected, skip cell selection to prevent cascade
            if (selectTimerRef.current) {
              clearTimeout(selectTimerRef.current);
            }
            deselectCell(editor)
            selectTimerRef.current = setTimeout(() => {
              setSelectionIsMade()
            }, 50);
          }

          // Only call selectCell if we didn't already select a placeholder/checkbox
          if (!shouldSkipCellSelection && selection.start.paragraph.isInsideTable) {
            selectCell(editor);
          } else if (!selection.start.paragraph.isInsideTable) {
            deselectCell(editor)
          }

          // Preventive zoom trick: Keep Syncfusion coordinate system fresh after every selection
          // This proactively prevents coordinate corruption from building up
          const currentZoom = editor.zoomFactor;
          editor.zoomFactor = currentZoom + 0.0002;
          setTimeout(() => {
            if (editor) {
              editor.zoomFactor = currentZoom;
            }
          }, 10);
        } finally {
          isHandlingSelection.current = false;
        }
      }
    }

    function requestNavigate(args: any) {
      // console.log("Request navigate")
      if (args.linkType !== 'Bookmark') {
        let link = args.navigationLink;
        // console.log("Navigating to: " + link);
        if (args.localReference.length > 0) {
          link += '#' + args.localReference;
        }
        //Navigate to the specified URL.
        window.open(link);
        args.isHandled = true;
      }
    }

    // function onContentChange() {
    //   const { reloadingDoc } = useDocumentStore.getState();
    //   if (reloadingDoc) return
    //   console.log("Content changed")
    //   const appStore = useAppStore.getState()
    //   const { editor: localEditor } = appStore
      
    //   if (localEditor == null) return
    //   const contextType = localEditor.selection.contextType;
    //   if (contextType === 'CheckBoxContentControl') {
    //     const selection = localEditor.selection;
    //     console.log("xxxselection: " + selection.startOffset + " " + selection.endOffset);
    //     const currentValue = localEditor.selection.getContentControlInfo();
    //     console.log("selection.startOffset " + selection.startOffset + " handling... ->" + handlingSelection.current + "<- currentValue: " + JSON.stringify(currentValue) + " " + currentValue.canEdit.toString())
    //     if (currentValue.value === "true" && handlingSelection.current === "") {
    //         handlingSelection.current = selection.startOffset
    //         const modalStore = useModalStore.getState()
    //         const documentStore = useDocumentStore.getState()
    //         const userStore = useUserStore.getState()
    //         const { user } = userStore
    //         console.warn("Checking checkbox")
    //         checkContentControlCheckBox(localEditor, user as RUser, deselectCell, appStore, 
    //           modalStore, userStore, documentStore, t).then(() => {
    //           handlingSelection.current = ""
    //         }).catch((e) => {
    //         if (e instanceof Error) console.error("Error checking checkbox: " + e.message)
    //         else console.error("Error checking checkbox: " + JSON.stringify(e))
    //         handlingSelection.current = ""
    //       })
    //     }
    //   } else if (contextType === 'TableText') {
    //     console.log("TableText")
    //     console.log(localEditor.selection.startOffset + " " + localEditor.selection.endOffset)
    //   }
    // }

    // Only initialize once or when destroyed
    if (documentEditorRef.current != null) {
      // console.log("Document editor already initialized, skipping initialization");
      return;
    }
    
    // console.log("Creating new document editor instance");
    
    // Get the sidebar background color from CSS variables
    const sidebarBgColor = "#F5F2EE";
    // Set the default font family through documentEditorSettings instead
    const fontFamilies = {
      fontFamilies: ["Aptos", "Algerian", "Arial","Calibri","Cambria","CambriaMath","Candara","CourierNew","Georgia","Impact","SegoePrint","SegoeScript","SegoeUI","Symbol", "Tahoma", "TimesNewRoman","Verdana","Wingdings"]
    }
      
    const conversionUrl = import.meta.env.VITE_DOCUMENT_UTILS_URL || "docufusiones-server.azurewebsites.net";
    const protocol = import.meta.env.VITE_DOCUMENT_UTILS_PROTOCOL || "https"

    const documentEditor: DocumentEditor = new DocumentEditor({
      height: '100%',
      width: '100%',
      // serviceUrl: 'https://services.syncfusion.com/js/production/api/documenteditor/',
      serviceUrl: `${protocol}://${conversionUrl}/api/documenteditor/`,
      isReadOnly: false,
      enableTrackChanges: false,
      enableCursorOnReadOnly: true,
      enableEditor: true,
      enableLocalPaste: false,
      enableImageResizer: false,
      enableSpellCheck: false,
      enableEditorHistory: true,
      useCtrlClickToFollowHyperlink: false,
      enableHyperlinkDialog: true,
      documentEditorSettings: fontFamilies,
      enableComment: true,
      showComments: false,
    });
    
    
    documentEditorRef.current = documentEditor;
    // documentEditor.contentControl = onContentChange;
    documentEditor.selectionChange = handleSelectionChange
    documentEditor.keyDown = onkeydown;
    documentEditor.requestNavigate = requestNavigate
    // console.log("h: " + h + " w: " + w);
    
    documentEditor.created = function () {
      setEditor(this);
      setCreated(true);
      this.documentChange = handleDocumentChange
      
      this.setCustomFonts([
        { fontFamily: "Kalam", src: "url(/kalam-light.ttf) format('truetype')" },
        // Aptos fonts - only register the base font for each family
        { fontFamily: "Aptos", src: "url(/fonts/aptos/Aptos.ttf) format('truetype')" },
        { fontFamily: "Aptos Display", src: "url(/fonts/aptos/Aptos-Display.ttf) format('truetype')" },
        { fontFamily: "Aptos Narrow", src: "url(/fonts/aptos/Aptos-Narrow.ttf) format('truetype')" },
        { fontFamily: "Aptos Mono", src: "url(/fonts/aptos/Aptos-Mono.ttf) format('truetype')" },
        { fontFamily: "Aptos Serif", src: "url(/fonts/aptos/Aptos-Serif.ttf) format('truetype')" }
      ]);

      // Set the default font family through documentEditorSettings instead
      this.documentEditorSettings.fontFamilies =  ["Aptos", "Aptos Display", "Aptos Narrow", "Aptos Mono", "Aptos Serif", "Algerian", "Arial","Calibri","Cambria","CambriaMath","Candara","CourierNew","Georgia","Impact","SegoePrint","SegoeScript","SegoeUI","Symbol", "Tahoma", "TimesNewRoman","Verdana","Wingdings"];
      // Resize to container dimensions
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        // console.log(`Initial resize to container dimensions: ${containerWidth}x${containerHeight}`);
        this.resize(containerWidth, containerHeight);
        
        // Set the background color of the document editor container
        setTimeout(() => {
          if (containerRef.current) {
            const editorContainer = containerRef.current.querySelector('.e-de-content') || 
                                 containerRef.current.querySelector('.e-content-container');
            if (editorContainer) {
              (editorContainer as HTMLElement).style.backgroundColor = sidebarBgColor;
            }
          }
        }, 0);
      }
    };
    
    const f: CharacterFormatProperties = {
      bold: false,
      italic: false,
      underline: "None",
      strikethrough: "None",
      fontSize: 10,
      fontFamily: "Segoe UI",
      fontColor: "#000000",
      highlightColor: "NoColor"
    }
    documentEditor.setDefaultCharacterFormat(f)
    documentEditor.enableAllModules()
    documentEditor.enableTrackChanges = false
    documentEditor.enableCursorOnReadOnly = true
    documentEditor.enableEditor = true
    documentEditor.enableLocalPaste = false
    documentEditor.enableImageResizer = false
    documentEditor.enableSpellCheck = false
    documentEditor.enableEditorHistory = true
    documentEditor.enableTrackChanges = false
    documentEditor.useCtrlClickToFollowHyperlink = true
    documentEditor.enableHyperlinkDialog = true
    
    // Set page outline to match shadcn card border
    documentEditor.pageOutline = getComputedStyle(document.documentElement).getPropertyValue('--border').trim()
    
    if (!containerRef.current) return;
    documentEditor.appendTo(containerRef.current);
    
    // console.log("Finished appending editor");
    
    return () => {
      // console.log("Editor initialization cleanup");
      // Cleanup logic for removing event handlers is handled in the component unmount effect
    }
  }, [documentId, languageSet, setEditor, t]);

  // onMouseUp is defined with useCallback so it updates when dependencies change
  const onMouseDown = React.useCallback((e: PointerEvent) => {
    const now = performance.now()

    // Capture scroll position BEFORE Syncfusion processes the click
    if (editor && editor.documentHelper?.viewerContainer) {
      scrollTopBeforeClick.current = editor.documentHelper.viewerContainer.scrollTop
    }

    mouseActTime.current = now
    if (zoomTimeout.current) clearTimeout(zoomTimeout.current)


    // Only update the vertical position, don't set the left position at all
    // Left position will be calculated in MasterPopup to be centered
    savedClickLocation.current = {
      top: e.clientY + 50,
      left: 100 // This will be ignored and calculated in MasterPopup
    }

    // Position cursor at click location for document execution
    if (editor && editor.isReadOnly) {
      // Save the current selection
      // const cursorPosition = editor.selection?.startOffset;

    }
  }, [editor]);


  // const flickZoom = (editor: DocumentEditor | null) => {
  //   if (zoomTimeout.current) clearTimeout(zoomTimeout.current)
  //   if (editor == null) return
    
  //   // Skip flick zoom if document is reloading to prevent focus conflicts
  //   if (isReloadingRef.current) {
  //     console.log("Skipping flick zoom during document reload");
  //     return;
  //   }
    
  //   // Skip flick zoom if popup is open to prevent focus conflicts with Radix UI
  //   if (isSelectingRef.current || isReloadingRef.current) {
  //     console.log("Skipping flick zoom while popup is open");
  //     return;
  //   }
    
  //   zoomTimeout.current = setTimeout(() => {
  //     const currentZoom = editor.zoomFactor;
  //     editor.zoomFactor = currentZoom + 0.0002;
  //     setTimeout(() => {
  //       if (editor && !isReloadingRef.current && !isSelectingRef.current) {
  //         const currentZoom = editor.zoomFactor;
  //         editor.zoomFactor = currentZoom - 0.0002;
  //       }
  //     }, 300)
  //   }, 200)
  // }

  const onMouseMove = (e: PointerEvent) => {
    if (e.buttons !== 1) return
    mouseActTime.current = performance.now()
    if (zoomTimeout.current) clearTimeout(zoomTimeout.current)
  }

  const onMouseUp = React.useCallback(() => {
    mouseActTime.current = performance.now()
    // flickZoom(editor)
  }, [editor]);

  // Separate effect to add/remove the mouseup event listener
  React.useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.addEventListener("pointerup", onMouseUp, { passive: true });
    containerRef.current.addEventListener("pointerdown", onMouseDown, { passive: true });
    containerRef.current.addEventListener("pointermove", onMouseMove, { passive: true });
    return () => {
      containerRef.current?.removeEventListener("pointerup", onMouseUp);
      containerRef.current?.removeEventListener("pointerdown", onMouseDown);
      containerRef.current?.removeEventListener("pointermove", onMouseMove);
    };
  }, [onMouseDown, onMouseUp]);

  // Add resize observer to handle container size changes
  React.useEffect(() => {
    if (!containerRef.current || !editor) return;
    
    const handleResize = () => {
      const container = document.getElementById('growingEditorContainer');
      if (container && editor) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        editor.resize(containerWidth, containerHeight);
      }
    };
    
    // Initial resize
    handleResize();
    
    // Set up ResizeObserver to track container size changes
    const resizeObserver = new ResizeObserver(handleResize);
    const container = document.getElementById('growingEditorContainer');
    if (container == null) return
    resizeObserver.observe(container);
    
    // Also listen for window resize events
    window.addEventListener('resize', handleResize);
    
    // Add interval-based resize check similar to the Syncfusion example
    // const resizeInterval = setInterval(handleResize, 1000);
    
    return () => {
      const container = document.getElementById('growingEditorContainer');
      if (container == null) return
      if (resizeObserver) {
        resizeObserver.unobserve(container);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [editor]);


  // Add effect to enhance cursor visibility in document execution mode
  React.useEffect(() => {
    if (editor && documentStage !== Stage.Closed) {
      // Apply additional styling for cursor visibility
      setTimeout(() => {
        // Find the cursor element and enhance its visibility
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          .e-de-blink-cursor {
            border-left: 2px solid #000 !important;
            animation: blink-animation 1s step-end infinite !important;
          }
          
          @keyframes blink-animation {
            50% {
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(styleElement);
        
        return () => {
          // Clean up the style element when component unmounts
          document.head.removeChild(styleElement);
        };
      }, 500);
    }
  }, [editor, documentStage]);

  // Add a function to handle document refresh
  const handleRefreshDocument = React.useCallback(async () => {
    if (!editor || !documentId) return;
    
    try {
      const currentModalStore = useModalStore.getState();
      const appStore = useAppStore.getState();
      // Set loading state for the refresh button
      // setIsRefreshing(true);
      
      // First check if the document is still locked
      const { error } = await getLastAuditLogItem(documentId, true);
      if (error != null && error.length > 0) {
        handleGetLastAuditLogItemError(error, currentModalStore)
        if (appStore.setWorking) appStore.setWorking(false)
        return
      }
      
      await triggerReloadDocument(editor, currentModalStore);
      
      // Update status to indicate successful refresh
      if (currentModalStore.setDocumentStatus) {
        currentModalStore.setDocumentStatus("updating");
      }
    } catch (error) {
      if (error instanceof BusyException) {
        console.error("Document is busy, cannot refresh:", error.message);
      } else {
        console.error("Error refreshing document:", error);
      }
    } finally {
      // setIsRefreshing(false);
    }
  }, [editor, documentId]);

  // Call onDocumentReady when the document is fully loaded
  React.useEffect(() => {
    if (created && languageSet && docObject.current !== "" && onDocumentReady) {
      // Add a small delay to ensure the document is fully rendered
      const timer = setTimeout(() => {
        // Track document ready
        if (documentId) {
          const { documentName } = useDocumentStore.getState();
          trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_EDITED, {
            document_id: documentId,
            document_name: documentName || 'Unknown',
            action: 'document_ready',
            page_count: editor?.pageCount || 0
          });
        }
        onDocumentReady();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [created, languageSet, dataReady, onDocumentReady, documentId, editor]);

  // Effect to handle cursor change based on insertAtCursorMode
  React.useEffect(() => {
    if (containerRef.current) {
      // Add or remove the CSS class based on toggle state
      if (!insertAtCursor) {
        containerRef.current.classList.add('editor-copy-cursor');
      } else {
        containerRef.current.classList.remove('editor-copy-cursor');
      }
      
      // Also inject a style tag to ensure the cursor change works
      const styleId = 'editor-cursor-style';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!insertAtCursor) {
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        
        // Get the stage color and create custom cursor
        const stageColor = getStageColor(documentStage);
        const cursorUrl = createCopyCursorSVG(stageColor);
        
        styleElement.textContent = `
          .e-documenteditor,
          .e-documenteditor *,
          .e-de-page,
          .e-de-page *,
          .e-de-page-container,
          .e-de-page-container *,
          .e-de-content,
          .e-de-content *,
          .e-content-container,
          .e-content-container *,
          .e-de-scrollbar-content,
          .e-de-scrollbar-content *,
          canvas {
            cursor: url('${cursorUrl}') 6 4, copy !important;
          }
        `;
      } else {
        // Remove the style element when toggle is on
        if (styleElement) {
          styleElement.remove();
        }
      }
    }
    
    return () => {
      // Cleanup: remove the style element when component unmounts
      const styleElement = document.getElementById('editor-cursor-style');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [insertAtCursor, documentStage]);

  return (
    <div className={`h-full relative`} ref={containerRef}>
      {/* Hide internal loading screen when onDocumentReady is provided - parent will handle loading state */}
      {(!created || !languageSet || docObject.current === "") && !onDocumentReady ? (
        <LoadingScreen message={t("common.loading")} />
      ) : null}
      <div inert className="pointer-events-none select-none" id="container"></div>
      <MasterPopup />
      <DocumentWorkingOverlay />
      {/* Upload progress indicator */}
      <UploadProgressIndicator
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        isConverting={uploadProgress >= 90}
        />
      {/* <WorkflowEditModeOverlay /> */}
      <SearchButton editor={editor} documentStage={documentStage} />
      <ZoomButton editor={editor} documentStage={documentStage} />
      <DocuDialog
        open={showNoCheckboxFound}
        toggleDialog={() => setShowNoCheckboxFound(!showNoCheckboxFound)}
        title={t("noCheckboxFound.title")} 
        TitleIcon={<Info className="h-5 w-5" />}
        content={t("noCheckboxFound.content")}
        primaryButtonText="OK"
        primaryAction={() => {}}
        warning={false}
      />
      <DocuDialog
        open={multipleTableCellsSelected}
        toggleDialog={()=>setMultipleTableCellsSelected(!multipleTableCellsSelected)}
        title={t('errors.multipleTableCellsSelected')}
        TitleIcon={<Info className="h-5 w-5" />}
        content={t('errors.multipleTableCellsSelectedDesc')}
        primaryButtonText="OK"
        primaryAction={() => {}}
        warning={false}
      />
      <DocuDialog
        open={multipleParagraphsSelected}
        toggleDialog={()=>setMultipleParagraphsSelected(!multipleParagraphsSelected)}
        title={t('errors.multipleParagraphsSelected')}
        TitleIcon={<Info className="h-5 w-5" />}
        content={t('errors.multipleParagraphsSelectedDesc')}
        primaryButtonText="OK"
        primaryAction={() => {}}
        warning={false}
      />
      <DocuDialog
        open={unableToCorrectAttachment}
        toggleDialog={()=>setUnableToCorrectAttachment(!unableToCorrectAttachment)}
        title={t('errors.correctionNotPossible')}
        TitleIcon={<Info className="h-5 w-5" />}
        content={t('errors.correctionNotPossibleDesc')}
        primaryButtonText="OK"
        primaryAction={() => {}}
        warning={false}
      />
      <DocuDialog
        open={unsupportedAttachmentType}
        toggleDialog={()=>setUnsupportedAttachmentType(!unsupportedAttachmentType)}
        title={t('errors.unsupportedAttachmentType')}
        TitleIcon={<Info className="h-5 w-5" />}
        content={t('errors.unsupportedAttachmentTypeDesc')}
        primaryButtonText="OK"
        primaryAction={() => {}}
        warning={false}
      />
      <DocuDialog 
        open={documentNotFound}
        toggleDialog={()=>setDocumentNotFound(!documentNotFound)}
        title={t('errors.documentNotFound')}
        TitleIcon={<Info className="h-5 w-5" />}
        content={t('errors.documentNotFoundDesc')}
        primaryButtonText="OK"
        primaryAction={() => navigate("/home")}
        warning={false}
      />
      <DocuDialog
        open={noDocumentAccess}
        toggleDialog={()=>setNoDocumentAccess(!noDocumentAccess)}
        title={t('errors.noDocumentAccess')}
        TitleIcon={<Info className="h-5 w-5" />}
        content={t('errors.noDocumentAccessDesc')}
        primaryButtonText="OK"
        primaryAction={() => navigate("/home")}
        warning={false}
      />
      <DocumentStatusModal
        isOpen={documentStatus !== null}
        status={documentStatus || "updated"}
        onRefresh={handleRefreshDocument}
        onClose={() => setDocumentStatus(null)}
      />
      <NetworkErrorModal />
    </div>
  )
}

export default SFEditor

