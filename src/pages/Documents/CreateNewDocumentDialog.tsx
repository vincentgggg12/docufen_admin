import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserIcon, Trash2, Globe, Info, Upload, Plug } from "lucide-react";
import { v4 as uuid } from "uuid";
import {
  Dialog,
  DialogContent as BaseDialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay as BaseDialogOverlay,
  DialogPortal
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getTimezoneName } from "@/lib/dateUtils";
import { useAppStore, useDocumentsStore, useUserStore, useDocumentStore } from "@/lib/stateManagement";
import { useNavigate } from "react-router-dom";
import { claimDocument, DocumentDescription, GroupTitles, NewDocument, ParticipantGroup, registerDocument } from "@/lib/apiUtils";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { useShallow } from "zustand/react/shallow";
import WordIcon from "@/assets/word_icon.svg";
import { Stage } from "@/components/editor/lib/lifecycle";
import { cn } from "@/lib/utils";
import { DateTime } from "luxon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { convertDocxFileToDfn } from "@/lib/documentUtils";
import DocumentCategorySelector from "@/pages/Documents/DocumentCategorySelector";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";
import { fileNameRegExp, MAX_DOCUMENT_NAME_LENGTH } from "@/lib/constants";
import CreateNewDocumentDialogConnector, { ConnectorQueueDocument } from "@/pages/Documents/CreateNewDocumentDialogConnector";
import { SERVERURL } from "@/lib/server";

// Custom DialogOverlay with higher z-index to appear above other modals
const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof BaseDialogOverlay>,
  React.ComponentPropsWithoutRef<typeof BaseDialogOverlay>
>(({ className, ...props }, ref) => (
  <BaseDialogOverlay
    ref={ref}
    className={cn("z-[10000]", className)}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

// Custom DialogContent with higher z-index to appear on top of other modals
const DialogContent = React.forwardRef<
  React.ComponentRef<typeof BaseDialogContent>,
  React.ComponentPropsWithoutRef<typeof BaseDialogContent>
>(({ className, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <BaseDialogContent
      ref={ref}
      className={cn("z-[10001]", className)}
      {...props}
    />
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

interface CreateNewDocumentDialogProps {
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
}

export function CreateNewDocumentDialog({
  createDialogOpen,
  setCreateDialogOpen,
}: CreateNewDocumentDialogProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { tenantName, connectorsEnabled } = useUserStore(useShallow((state) => ({
    tenantName: state.tenantName,
    connectorsEnabled: state.connectorsEnabled,
  })));
  const { setWorking, setWorkingTitle, setWorkingMessage } = useAppStore(useShallow((state) => ({
    setWorking: state.setWorking,
    setWorkingTitle: state.setWorkingTitle,
    setWorkingMessage: state.setWorkingMessage,
  })));
  const [documentData, setDocumentData] = useState<NewDocument>({
    filename: "",
    documentName: "",
    externalReference: "",
    documentCategory: "",
    stage: Stage.PreApprove,
    timezone: getTimezoneName(),
    tenantName,
    locale: "",
    docObject: "",
  });
  
  // Add document type state
  const [documentType, setDocumentType] = useState<string>("");
  const [customDocumentType, setCustomDocumentType] = useState<string>("");
  // const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  
  // Handle document type change
  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
    if (value !== "custom") {
      setCustomDocumentType("");
    }
  };
  
  const { addNewDocument, documents } = useDocumentsStore(useShallow((state) => ({
    addNewDocument: state.addNewDocument,
    documents: state.documents,
    recentDocuments: state.recentDocuments
  })))
  
  // // Get user legalName for document owner
  const { participant, logout } = useUserStore(useShallow((state) => ({
    logout: state.logout,
    participant: state.participant
  })));
  if (participant == null) return null;
  React.useEffect(() => {
    if (i18n.language) {
      setDocumentData({ ...documentData, locale: i18n.language });
    }
  }, [i18n.language]);

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedConnectorDoc, setSelectedConnectorDoc] = useState<ConnectorQueueDocument | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [hasTokens, setHasTokens] = useState<boolean>(false);
  const [isCheckingTokens, setIsCheckingTokens] = useState<boolean>(false);
  const [usedTokens, setUsedTokens] = useState<Array<{tokenName: string, connector: string}>>([]);

  // Get resetParticipantGroups from documentStore
  const { resetParticipantGroups } = useDocumentStore(
    useShallow((state) => ({
      resetParticipantGroups: state.resetParticipantGroups,
    }))
  );

  const [currentTime, setCurrentTime] = useState<string>("");

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      const dt = DateTime.now();
      setCurrentTime(dt.toFormat("h:mma").toLowerCase());
    };
    
    updateTime();
    const timer = setInterval(updateTime, 60000);
    
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    validateData()
  }, [documentData])
  const validateData = () => {
    // Check if we have the required fields
    if (documentData.documentName.trim() === "") {
      setDataReady(false);
      return;
    } 
    
    if (documentData.docObject === "" && (selectedConnectorDoc === null || selectedConnectorDoc.documentId == null)) {
      setDataReady(false);
      return;
    }
    
    // All required fields are present
    setDataReady(true);
  }

  // Reset form and state when dialog opens/closes
  React.useEffect(() => {
    if (!createDialogOpen) {
      // Reset when dialog closes
      resetForm();
      setDocumentFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      setIsCreating(false);
      setUploadError(null);
      resetParticipantGroups();
    }
  }, [createDialogOpen, resetParticipantGroups]);

  // Check token availability when dialog opens and connectors are enabled
  React.useEffect(() => {
    if (createDialogOpen && connectorsEnabled) {
      setIsCheckingTokens(true);
      fetch(`${SERVERURL}tokens/list`, {
        method: 'GET',
        credentials: 'include',
      })
        .then(response => response.json())
        .then(tokens => {
          const tokensAvailable = Array.isArray(tokens) && tokens.length > 0;
          console.log("tokens available: " + tokensAvailable.toString())

          // Filter for tokens that have been used (lastUsedAt is not null)
          const used = tokensAvailable
            ? tokens
                .filter((token: any) => token.lastUsedAt !== null)
                .map((token: any) => ({
                  tokenName: token.name,
                  connector: token.connector,
                }))
            : [];
          console.log("Used tokens: " + JSON.stringify(usedTokens))
          setUsedTokens(used);
          setHasTokens(tokensAvailable);
          setIsCheckingTokens(false);

          // If no tokens available, ensure we're on the upload tab
          if (!tokensAvailable && activeTab === 'connector') {
            setActiveTab('upload');
          }
        })
        .catch(error => {
          console.error('Error checking tokens:', error);
          setUsedTokens([]);
          setHasTokens(false);
          setIsCheckingTokens(false);

          // On error, ensure we're on the upload tab
          if (activeTab === 'connector') {
            setActiveTab('upload');
          }
        });
    } else {
      // Reset token state when connectors are not enabled
      setUsedTokens([]);
      setHasTokens(false);
      setIsCheckingTokens(false);

      // Ensure we're on the upload tab if connectors are disabled
      if (activeTab === 'connector') {
        setActiveTab('upload');
      }
    }
  }, [createDialogOpen, connectorsEnabled]);

  const processCreation = (registerResult: number, docId: string) => {
      switch (registerResult) {
        case 0:
          console.log("Successfully registered document: " + docId)

          // Track document created
          trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_CREATED, {
            document_id: docId,
            document_name: documentData.documentName,
            document_type: documentData.documentCategory || '',
            document_category: documentData.documentCategory || '',
            creation_method: documentFile ? 'upload' : 'blank',
            file_size_mb: documentFile ? documentFile.size / (1024 * 1024) : undefined,
            file_extension: documentFile ? documentFile.name.split('.').pop() : undefined
          });

          const participantGroups: ParticipantGroup[] = [{ title: GroupTitles.OWNERS, participants: [participant], icon: React.createElement(UserIcon, { className: "h-4 w-4 text-gray-500" }) }];
          // Create a new document object to add to the documents list
          const newDocument: DocumentDescription = {
            id: docId,
            documentName: documentData.documentName,
            externalReference: documentData.externalReference,
            documentCategory: documentData.documentCategory,
            stage: Stage.PreApprove,
            participantGroups,
            lastModified: new Date().getTime(),
            filename: documentData.filename ? documentData.filename : "",
            timezone: getTimezoneName(),
            locale: i18n.language,
            companyName: "",
            tenantName: "",
            documentFolder: "",
            created_at: 0
          };
          
          // Add the new document to the documents list and update recents
          addNewDocument(newDocument);
          // console.log("Document added to context:", newDocument);
          console.log("Total documents in context:", documents.length + 1);
          
          // Reset participantGroups to avoid persisting workflow data from previous document
          resetParticipantGroups();

          // Navigate to the new document and force a page reload to ensure clean state
          const documentUrl = `/document/${docId}`;
          setCreateDialogOpen(false);
          sessionStorage.removeItem("navigationId");
          navigate(documentUrl);
          // // Force a page reload after a short delay to ensure everything is reset properly
          // setTimeout(() => {
          //   window.location.href = documentUrl;
          // }, 100);
          break;
        case 1:
          console.log("Failed to register document: " + docId)
          break;
        case 2:
          console.log("Document already exists: " + docId)
          return
        case 3:
          console.log("Document registration failed: No network connection")
          setUploadError(t('CreateNewDocumentDialog.noNetworkConnectionPleaseTryAgain'));
          setIsCreating(false);
          return
        case 403:
          console.log("Unauthorized to register document: " + docId)
          logout()
          break;
        case 401:
          console.log("Unauthorized to register document: " + docId)
          logout()
          break;
        default:
          console.log("Unknown error registering document: " + docId)
          break;
      }
      setIsCreating(false);
      resetForm();
    }

  const handleClaimDocument = () => {
    setIsCreating(true);
    documentData.documentCategory = documentType === "custom" ? customDocumentType : documentType;
    // console.log("documentDAta:" + JSON.stringify(documentData));
    if (selectedConnectorDoc === null || selectedConnectorDoc.documentId == null) return setIsCreating(false)
    console.log("Claiming document id: " + selectedConnectorDoc.documentId)
    const claimedDocId = selectedConnectorDoc.documentId;
    setWorking(true);
    claimDocument(claimedDocId, documentData).then((registerResult) => processCreation(registerResult, claimedDocId))
    .catch((error: unknown) => {
      if (error instanceof Error)
        console.error("Error creating document:", error);
      setIsCreating(false);
    }).finally(() => {
      setWorking(false);
      setWorkingTitle("");
      setWorkingMessage("");
    })

  }

  const handleCreateDocument = () => {
    setIsCreating(true);
    documentData.documentCategory = documentType === "custom" ? customDocumentType : documentType;
    // console.log("documentDAta:" + JSON.stringify(documentData));
    setWorking(true);
    const newDocId = uuid()
    registerDocument(newDocId, documentData).then((registerResult) => processCreation(registerResult, newDocId))
    .catch(error => {
      console.error("Error creating document:", error);
      setIsCreating(false);
    }).finally(() => {
      setWorking(false);
      setWorkingTitle("");
      setWorkingMessage("");
    })
  };

  const resetForm = () => {
    setDocumentData({
      filename: "",
      documentName: "",
      externalReference: "",
      documentCategory: "",
      stage: Stage.PreApprove,
      timezone: getTimezoneName(),
      tenantName: useUserStore.getState().tenantName,
      locale: "",
      docObject: "",
    });
    setDocumentFile(null);
    setDocumentType("");
    setCustomDocumentType("");
    // setShowCustomInput(false);
    setUploadProgress(0);
    setIsUploading(false);
    setIsCreating(false);
    setUploadError(null);
    setDataReady(false);
    setSelectedConnectorDoc(null);
  };

  const handleFile = React.useCallback(async (file: File) => {
      // Clear any previous errors
      setUploadError(null);
      if (file.size > 2 * 1024 * 1024) {
        setUploadError(t('CreateNewDocumentDialog.fileSizeExceeds2MB'));
        return
      }
      // Check file type
      const validExtensions = ['.docx'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
        setUploadError(t('CreateNewDocumentDialog.onlyModernWordDocumentsDocxAreSupported'));
        return;
      }
      
      console.log("converting file: " + file.name);
      const formData = new FormData();
      formData.append('file', file);

      
      // Set initial upload state
      setIsUploading(true);
      setUploadProgress(0);
      try {
      // Use XMLHttpRequest to track upload progress
        const docObject = await convertDocxFileToDfn(formData, setUploadProgress, setIsUploading)
      //   const docObject = await uploadPromise;
        setDocumentFile(file);
        
        // Update file-related fields but DO NOT automatically submit the form
        setDocumentData(prevData => ({ 
          ...prevData,
          filename: file.name, 
          docObject: docObject
        }));
        setUploadProgress(100);
        console.log("File uploaded successfully:", file.name);

    } catch (error) {
      console.error('Error processing file:', error);
      setIsUploading(false);
      // Set document file to null to allow retry
      setDocumentFile(null);
      // Clear docObject
      setDocumentData(prevData => ({ 
        ...prevData,
        filename: "",
        docObject: "" 
      }));
      // Set error message
      setUploadError(t('CreateNewDocumentDialog.anErrorOccurredWhileProcessingTheFilePleaseTryAgain'));
    }
  }, []);

  const handleFileUpload = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
      // Reset the input so the same file can be selected again if needed
      event.target.value = '';
    }
  }, [handleFile]);

  const handleDragOver = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragIn = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      handleFile(file);
      event.dataTransfer.clearData();
    }
  }, []);

  const handleConnectorDocumentSelect = (doc: ConnectorQueueDocument) => {
    setSelectedConnectorDoc(doc);
    // Pre-fill the document data from the connector queue
    setDocumentData(prevData => ({
      ...prevData,
      documentName: doc.documentName,
      externalReference: doc.externalReference,
      documentCategory: doc.documentCategory,
      // Note: docObject would come from the connector API when creating the document
    }));

    // Programmatically trigger the document type change
    setCustomDocumentType(doc.documentCategory)
    handleDocumentTypeChange("custom")

    setDataReady(true)
  };

  const handleTabChange = (value: string) => {
    const previousTab = activeTab;
    setActiveTab(value);

    // Track tab switch
    trackAmplitudeEvent(AMPLITUDE_EVENTS.TAB_SWITCHED, {
      from_tab: previousTab,
      to_tab: value,
      tab_group: 'create_document_source',
      page_name: 'Create Document Dialog'
    });

    // Clear connector-related data when switching to upload tab
    if (value === "upload" && selectedConnectorDoc) {
      setSelectedConnectorDoc(null);
      setDocumentData(prevData => ({
        ...prevData,
        documentName: "",
        externalReference: "",
        documentCategory: "",
      }));
    }
  };
  //            disabled={!dataReady || isUploading || isCreating}

  // Determine if tabs should be shown based on connectors being enabled and tokens available
  const shouldShowTabs = connectorsEnabled && hasTokens && !isCheckingTokens;

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t("documents.createDocument")}</DialogTitle>
          <DialogDescription>
            {activeTab === "connector"
              ? t("connectors.selectDocumentToImport")
              : t("documents.fillInDetails")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" value={activeTab} onValueChange={handleTabChange} className="w-full pt-4">
          {shouldShowTabs && (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" data-testid="createDocumentDialog.uploadTab">
                <Upload className="h-4 w-4 mr-2" />
                {t("documents.upload")}
              </TabsTrigger>
              <TabsTrigger value="connector" data-testid="createDocumentDialog.connectorTab">
                <Plug className="h-4 w-4 mr-2" />
                {t("connectors.fromConnectors")}
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="upload" className="space-y-4 mt-4 min-h-[550px]">
            <div className="space-y-2">
              <Label htmlFor="name">{t("documents.documentName")} *</Label>
              <Input
                id="name"
                placeholder={t("documents.enterDocumentName")}
                value={documentData.documentName}
                onChange={(e) => {
                  const sanitisedValue = e.target.value.replace(fileNameRegExp, "")
                  setDocumentData({ ...documentData, documentName: sanitisedValue.slice(0, MAX_DOCUMENT_NAME_LENGTH) });
                }}
                required
                data-testid="createDocumentDialog.documentNameInput"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">{t("documents.externalReference")}</Label>
              <Input
                id="reference"
                placeholder={t('CreateNewDocumentDialog.eGSop_123')}
                value={documentData.externalReference}
                onChange={(e) => setDocumentData({ ...documentData, externalReference: e.target.value })}
                data-testid="createDocumentDialog.externalReferenceInput"
              />
            </div>

            <DocumentCategorySelector
              value={documentData.documentCategory}
              onValueChange={handleDocumentTypeChange}
              data-testid="createDocumentDialog.documentCategorySelect"
            />

            <div
              className={`border border-dashed rounded-md p-10 flex flex-col items-center justify-center min-h-[240px] h-[300px] ${isDragging ? 'bg-primary/5 border-primary' : ''} ${uploadError ? 'border-destructive' : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              data-testid="createDocumentDialog.dragDropArea"
            >
              {documentFile ? (
                <div className="text-center flex flex-col items-center justify-center h-[162px]">
                  <img src={WordIcon} alt={t('CreateNewDocumentDialog.wordDocument')} className="w-16 h-16 mb-4" />
                  <div className="flex items-center">
                    <p className="font-medium text-center">{documentFile.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      setDocumentFile(null);
                      setDocumentData(prevData => ({
                        ...prevData,
                        filename: "",
                        docObject: ""
                      }));
                    }}
                    className="mt-4"
                    aria-label={t("documents.remove")}
                    data-testid="createDocumentDialog.removeFileButton"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("documents.remove")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[162px]">
                  <img src={WordIcon} alt={t('CreateNewDocumentDialog.wordDocument')} className="w-16 h-16 mb-4" />
                  <p className="text-center text-muted-foreground mb-3">
                    { isDragging ? t("documents.dropYourDocumentHere") : t("documents.dragAndDropOrClickToBrowse") }
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    disabled={isUploading}
                    data-testid="createDocumentDialog.uploadDocumentButton"
                  >
                    {t("documents.uploadDocument")}
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    data-testid="createDocumentDialog.fileUploadInput"
                  />
                </div>
              )}

              {/* Progress indicator area - always reserves space */}
              <div className="w-full mt-4 h-[38px]">
                {isUploading ? (
                  <>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{uploadProgress === 100 ? "Processing..." : "Uploading..."}</span>
                      <span className="text-sm font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </>
                ) : null}
              </div>

              {/* Error message */}
              {uploadError && (
                <div className="mt-3 text-destructive text-sm">
                  {uploadError}
                </div>
              )}
            </div>
          </TabsContent>

          {shouldShowTabs && (
            <TabsContent value="connector" className="space-y-4 mt-4 min-h-[550px]">
              <CreateNewDocumentDialogConnector
                onDocumentSelect={handleConnectorDocumentSelect}
                selectedDocId={selectedConnectorDoc?.documentId || null}
                usedTokens={usedTokens}
                onDeselect={() => {
                  setSelectedConnectorDoc(null);
                  setDocumentData(prevData => ({
                    ...prevData,
                    documentName: "",
                    externalReference: "",
                    documentCategory: "",
                  }));
                }}
              />

              {selectedConnectorDoc && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name-connector">{t("documents.documentName")} *</Label>
                    <Input
                      id="name-connector"
                      placeholder={t("documents.enterDocumentName")}
                      value={documentData.documentName}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      data-testid="createDocumentDialog.documentNameInput"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference-connector">{t("documents.externalReference")}</Label>
                    <Input
                      id="reference-connector"
                      placeholder={t('CreateNewDocumentDialog.eGSop_123')}
                      value={documentData.externalReference}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      data-testid="createDocumentDialog.externalReferenceInput"
                    />
                  </div>

                  <DocumentCategorySelector
                    value={documentData.documentCategory}
                    onValueChange={handleDocumentTypeChange}
                    data-testid="createDocumentDialog.documentCategorySelect"
                  />
                </>
              )}
            </TabsContent>
          )}
        </Tabs>
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-muted-foreground">
            <Globe className="h-4 w-4 mr-1" />
            <span>Timezone: {getTimezoneName()} ({currentTime})</span>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 info-icon cursor-pointer hover:text-primary" data-testid="createDocumentDialog.timezoneTooltipTrigger" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px] p-3 z-[10002] text-sm">
                  {t('CreateNewDocumentDialog.documentTimezoneAllTimestampsInThisDocumentWillUseThisTimezoneRegardlessOfWhereUsersAreLocatedThisEnsuresAClearChronologicalRecordAndSimplerReviewProcessWithoutRequiringTimezoneConversionsOrClutteringTheDocumentWithExtraInformation')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

            


          <Button 
            onClick={ selectedConnectorDoc ? handleClaimDocument : handleCreateDocument} 
            disabled={!dataReady || isUploading || isCreating}
            data-testid="createDocumentDialog.createDocumentButton"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              t("documents.createDocument")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateNewDocumentDialog