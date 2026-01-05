import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserIcon } from "lucide-react";
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
import { getTimezoneName } from "@/lib/dateUtils";
import { useAppStore, useDocumentsStore, useUserStore, useDocumentStore } from "@/lib/stateManagement";
import { useNavigate } from "react-router-dom";
import { DocumentDescription, GroupTitles, NewDocument, ParticipantGroup, registerDocument } from "@/lib/apiUtils";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Stage } from "@/components/editor/lib/lifecycle";
import { cn } from "@/lib/utils";
import { convertDocxFileToDfn } from "@/lib/documentUtils";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";

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

interface CreateDemoDocumentDialogProps {
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
}

export function CreateDemoDocumentDialog({
  createDialogOpen,
  setCreateDialogOpen,
}: CreateDemoDocumentDialogProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { tenantName } = useUserStore(useShallow((state) => ({
    tenantName: state.tenantName,
  })));
  const { setWorking, setWorkingTitle, setWorkingMessage } = useAppStore(useShallow((state) => ({
    setWorking: state.setWorking,
    setWorkingTitle: state.setWorkingTitle,
    setWorkingMessage: state.setWorkingMessage,
  })));
  
  const { addNewDocument } = useDocumentsStore(useShallow((state) => ({
    addNewDocument: state.addNewDocument,
  })))
  
  // Get user participant for document owner
  const { participant, logout } = useUserStore(useShallow((state) => ({
    participant: state.participant,
    logout: state.logout,
  })));
  
  // Get resetParticipantGroups from documentStore
  const { resetParticipantGroups } = useDocumentStore(
    useShallow((state) => ({
      resetParticipantGroups: state.resetParticipantGroups,
    }))
  );

  const [isCreating, setIsCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  if (participant == null) return null;

  // Reset form and state when dialog opens/closes
  React.useEffect(() => {
    if (!createDialogOpen) {
      setIsCreating(false);
      setUploadProgress(0);
      setIsUploading(false);
      resetParticipantGroups();
    }
  }, [createDialogOpen, resetParticipantGroups]);

  const handleCreateDemoDocument = async () => {
    setIsCreating(true);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Fetch the demo document file from public folder
      const response = await fetch('/Docufen Testing Document v0._EN.docx');
      if (!response.ok) {
        throw new Error('Failed to fetch demo document');
      }
      
      const blob = await response.blob();
      const file = new File([blob], 'Docufen Testing Document v0._EN.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      // Convert the file to DFN format
      const formData = new FormData();
      formData.append('file', file);
      
      setWorkingTitle(t("documents.processingDemoDocument"));
      setWorkingMessage(t("documents.convertingDocument"));
      setWorking(true);
      
      const docObject = await convertDocxFileToDfn(formData, setUploadProgress, setIsUploading);
      
      // Prepare document data
      const documentData: NewDocument = {
        filename: "Docufen Testing Document v0._EN.docx",
        documentName: "Docufen Practice Document",
        externalReference: "PD-001",
        documentCategory: "validation",
        stage: Stage.PreApprove,
        timezone: getTimezoneName(),
        tenantName,
        locale: i18n.language,
        docObject: docObject,
      };
      const documentId = uuid()
      
      setWorkingMessage(t("documents.registeringDocument"));
      
      const registerResult = await registerDocument(documentId, documentData);
      
      switch (registerResult) {
        case 0:
          console.log("Successfully registered demo document: " + documentId);
          
          // Track demo document created
          trackAmplitudeEvent(AMPLITUDE_EVENTS.DEMO_DOCUMENT_CREATED, {
            demo_type: 'testing_document',
            document_name: documentData.documentName
          });
          
          const participantGroups: ParticipantGroup[] = [{ 
            title: GroupTitles.OWNERS, 
            participants: [participant], 
            icon: React.createElement(UserIcon, { className: "h-4 w-4 text-gray-500" }) 
          }];
          
          // Create a new document object to add to the documents list
          const newDocument: DocumentDescription = {
            id: documentId,
            documentName: documentData.documentName,
            externalReference: documentData.externalReference,
            documentCategory: documentData.documentCategory,
            stage: Stage.PreApprove,
            participantGroups,
            lastModified: new Date().getTime(),
            filename: documentData.filename,
            timezone: getTimezoneName(),
            locale: i18n.language,
            companyName: "",
            tenantName: "",
            documentFolder: "",
            created_at: 0
          };
          
          // Add the new document to the documents list and update recents
          addNewDocument(newDocument);
          console.log("Demo document added to context:", newDocument);
          
          // Reset participantGroups to avoid persisting workflow data from previous document
          resetParticipantGroups();
          
          // Navigate to the new document
          const documentUrl = `/document/${documentId}`;
          setCreateDialogOpen(false);
          sessionStorage.removeItem("navigationId");
          navigate(documentUrl);
          
          // Force a page reload after a short delay to ensure everything is reset properly
          setTimeout(() => {
            window.location.href = documentUrl;
          }, 100);
          break;
        case 1:
          console.log("Failed to register demo document: " + documentId);
          break;
        case 2:
          console.log("Demo document already exists: " + documentId);
          break;
        case 403:
          console.log("Unauthorized to register demo document: " + documentId);
          logout()
          break;
        case 401:
          console.log("Unauthorized to register demo document: " + documentId);
          logout()
          break;
        default:
          console.log("Unknown error registering demo document: " + documentId);
          break;
      }
    } catch (error) {
      console.error("Error creating demo document:", error);
    } finally {
      setIsCreating(false);
      setIsUploading(false);
      setWorking(false);
      setWorkingTitle("");
      setWorkingMessage("");
    }
  };

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t("documents.createDemoDocument")}</DialogTitle>
          <DialogDescription>
            {t("documents.createDemoDocumentDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="font-medium text-green-900 mb-2">{t("documents.demoDocumentDetails")}</h4>
            <div className="space-y-1 text-sm text-green-800">
              <p><strong>{t("documents.name")}:</strong> Docufen Demo Doc</p>
              <p><strong>{t("documents.externalReference")}:</strong> DDD-001</p>
              <p><strong>{t("documents.documentType")}:</strong> {t("selector.validation")}</p>
              <p><strong>{t("documents.filename")}:</strong> Docufen Testing Document v0._EN.docx</p>
            </div>
          </div>
          
          {isCreating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isUploading ? t("documents.processing") : t("documents.creating")}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setCreateDialogOpen(false)}
            disabled={isCreating}
          >
            {t("common.cancel")}
          </Button>
          <Button 
            onClick={handleCreateDemoDocument} 
            disabled={isCreating}
            data-testid="createDemoDocumentDialog.createButton"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("documents.creating")}...
              </>
            ) : (
              t("documents.createDemoDocument")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateDemoDocumentDialog; 