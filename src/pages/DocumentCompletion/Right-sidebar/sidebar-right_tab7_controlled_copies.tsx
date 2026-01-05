import React, { useState, useRef, useEffect } from "react";
import { 
  FileStack,
  ExternalLink,
  Loader2,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { callCreateControlledCopy, getDocumentState } from "@/lib/apiUtils";
import { ControlledCopyItem as BaseControlledCopyItem } from "@/components/editor/lib/AuditLogItem";
import { refreshRecentDocuments } from "@/hooks/AccountData";
import { useUserStore, useDocumentStore, useAppStore } from "@/lib/stateManagement";
import { UserType } from "@/lib/authorisation";
import { useShallow } from "zustand/shallow";

// Augment the ControlledCopyItem to include documentId
interface ControlledCopyItem extends BaseControlledCopyItem {
  documentId?: string;
}

// Define the controlled copy interface
interface ControlledCopy {
  id: string;
  number: number;
  title: string;
  description: string;
  status: "open" | "closed";
  createdAt: Date;
  updatedAt: Date;
  url?: string;
}

// Status chip component that matches the compliance page styling
const StatusChip = ({ status }: { status: "open" | "closed" }) => {
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5 min-w-16 flex justify-center">
      {status === "closed" ? (
        <>
          <IconCircleCheckFilled className="fill-primary dark:fill-primary" />
          <span>closed</span>
        </>
      ) : (
        <>
          <IconLoader />
          <span>open</span>
        </>
      )}
    </Badge>
  );
};

interface ControlledCopiesTabProps {
  documentId: string;
  activeChildren?: ControlledCopyItem[];
  isAddModalOpen?: boolean;
  setIsAddModalOpen?: (isOpen: boolean) => void;
}

export function ControlledCopiesTab({ 
  documentId, 
  activeChildren = [],
  isAddModalOpen = false,
  setIsAddModalOpen = () => {}
}: ControlledCopiesTabProps) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const justCreatedRef = useRef(false);
  const [isCopy, setIsCopy] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState(t('cc.noControlledCopiesYet'));
  const { parentDocument, nChildren, setNChildren, setEditTime } = useDocumentStore(useShallow((state) => ({
    setEditTime: state.setEditTime,
    parentDocument: state.parentDocument,
    nChildren: state.nChildren,
    setNChildren: state.setNChildren,
  })));

  React.useEffect(() => {
    console.log("Parent document: ", JSON.stringify(parentDocument));
    if (parentDocument && parentDocument.documentId) {
      setIsCopy(true);
      setEmptyMessage(t("cc.noCopiesOfCopies"))
    } else {
      setIsCopy(false);
      setEmptyMessage(t('cc.noControlledCopiesYet'))
    }
  }, [parentDocument]);
  
  // Get current user's role from UserStore
  const { userType } = useUserStore(useShallow((state) => ({
    userType: state.userType,
  })));
  
  // Check if current user is COLLABORATOR or SITE_ADMINISTRATOR
  const shouldHideCreateButton = userType === UserType.COLLABORATOR || userType === UserType.SITE_ADMINISTRATOR || isCopy;
  
  // Transform server controlled copy items to UI format
  const transformToUiFormat = (serverItems: ControlledCopyItem[] = []): ControlledCopy[] => {
    console.log("Transforming items:", serverItems);
    return serverItems.map((item) => {
      // Cast to any to handle the mixed type situation
      const serverItem = item as any;
      const number = parseInt(serverItem.name.split("#").pop()?.trim(), 10);
      return {
        id: serverItem.documentId,
        number,
        title: item.name,
        description: t('cc.controlled-copy-of-document'),
        status: "open", // Default to open, can be enhanced with actual status later
        createdAt: item.date ? new Date(item.date) : new Date(),
        updatedAt: item.date ? new Date(item.date) : new Date(),
        url: serverItem.documentId ? `/document/${serverItem.documentId}` : item.url || "#"
      };
    });
  };
  
  // Controlled copies data
  const [controlledCopies, setControlledCopies] = useState<ControlledCopy[]>(() => {
    console.log("Initial activeChildren:", activeChildren);
    return transformToUiFormat(activeChildren);
  });
  
  // Update copies when activeChildren props change
  useEffect(() => {
    console.log("activeChildren changed:", activeChildren);
    if (activeChildren && activeChildren.length > 0) {
      setControlledCopies(transformToUiFormat(activeChildren));
    }
  }, [activeChildren]);

  // Fetch controlled copies from server when component mounts or documentId changes
  useEffect(() => {
    // Don't fetch if no document ID or if we just created a copy
    if (!documentId || justCreatedRef.current) {
      justCreatedRef.current = false;
      return;
    }
    
    const fetchControlledCopies = async () => {
      console.log("Fetching controlled copies from server...");
      setIsLoading(true);
      try {
        // Get the full document state from the server
        const documentState = await getDocumentState(documentId);
        console.log("Document state received:", documentState);
        
        // Check if document state includes activeChildren
        if (documentState && 
            documentState.code === 200 && 
            documentState.documentDescription && 
            documentState.documentDescription.activeChildren) {
          
          const serverActiveChildren = documentState.documentDescription.activeChildren;
          console.log("Server activeChildren:", serverActiveChildren);
          
          if (serverActiveChildren && serverActiveChildren.length > 0) {
            // Transform and set the controlled copies
            const transformedCopies = transformToUiFormat(serverActiveChildren);
            console.log("Setting controlled copies:", transformedCopies);
            setControlledCopies(transformedCopies);
          } else {
            console.log("No controlled copies found on server");
          }
          
          // Also update the document store to ensure data consistency
          const { updateDocumentState } = useDocumentStore.getState();
          if (documentState.lastAuditItem && updateDocumentState) {
            updateDocumentState(documentState.lastAuditItem, t);
          }
        } else if (documentState && documentState.code === 410) {
          // Document has been deleted
          console.error("Document has been deleted:", documentId);
          toast.error(t('notifications.documentDeletedError', 'This document has been deleted and is no longer available.'));
        } else {
          console.log("No valid document state or activeChildren received");
        }
      } catch (error) {
        console.error("Error fetching controlled copies:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchControlledCopies();
  }, [documentId, t]);
  
  // Function to open the link directly in a new tab when a copy is clicked
  const handleCopyClick = (copy: ControlledCopy) => {
    if (copy.url) {
      window.open(copy.url, '_blank');
    }
  };

  // Event handler to open the add modal from the parent component
  useEffect(() => {
    const currentContainer = containerRef.current;
    
    const openAddModalHandler = () => {
      useAppStore.getState().hideInsertIntoCellDialog()
      setIsAddModalOpen(true);
    };
    
    if (currentContainer) {
      currentContainer.addEventListener('openAddModal', openAddModalHandler);
    }
    
    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('openAddModal', openAddModalHandler);
      }
    };
  }, [setIsAddModalOpen]);
  
  // Function to add a new controlled copy
  const handleAddControlledCopy = async () => {
    if (!documentId) {
      toast.error(t('cc.document-id-is-required-to-create'));
      setIsAddModalOpen(false);
      return;
    }
    
    setIsCreating(true);
    console.log("Creating controlled copy...");
    
    try {
      const result = await callCreateControlledCopy(documentId, i18n.language);
      console.log("Create controlled copy result:", result);
      const { tenantName, logout } = useUserStore.getState();
      
      if (result.controlledCopyItem) {
        // Flag that we just created a copy to prevent the useEffect from
        // immediately refetching and potentially overriding our new copy
        justCreatedRef.current = true;
        
        // Cast to any to handle the mixed type situation
        const serverItem = result.controlledCopyItem as any;
        console.log("New controlled copy item:", serverItem);
        
        // Convert the server response to our UI format
        const newControlledCopy: ControlledCopy = {
          id: serverItem.documentId || `copy-${Date.now()}`,
          number: nChildren + 1,
          title: result.controlledCopyItem.name,
          description: t('cc.un-executed-version-with'),
          status: "open",
          createdAt: new Date(result.controlledCopyItem.timestamp || Date.now()),
          updatedAt: new Date(result.controlledCopyItem.timestamp || Date.now()),
          url: serverItem.documentId ? `/document/${serverItem.documentId}` : result.controlledCopyItem.url || "#"
        };
        if (result.controlledCopyItem.timestamp)
          setEditTime(result.controlledCopyItem.timestamp)
        setNChildren(nChildren + 1);
        console.log("Adding new controlled copy to list:", newControlledCopy);
        const updatedCopies = [newControlledCopy, ...controlledCopies];
        setControlledCopies(updatedCopies);
        console.log("Updated controlled copies list:", updatedCopies);
        
        toast.success(t('cc.controlledCopyCreatedSuccessfully'));
        
        // Update the recent documents list to include the new controlled copy
        if (tenantName) {
          refreshRecentDocuments(tenantName);
        }
        
        // DO NOT refresh document state here - we'll let the normal polling 
        // mechanism update it later to avoid race conditions
      } else {
        // Handle different error codes
        if (result.errorCode === 401) {
          logout()
          toast.error(t('cc.youNeedToBeLoggedInToCreateAControlledCopy'));
        } else if (result.errorCode === 403) {
          logout()
          toast.error(t('cc.youDonTHavePermissionToCreateAControlledCopy'));
        } else if (result.errorCode === 409) {
          toast.error(t('cc.cannotCreateAControlledCopyFromADocumentThatIsAlreadyAControlledCopy'));
        } else if (result.errorCode === 412) {
          toast.error(t('cc.documentLocked'));
        } else {
          toast.error(t('cc.failedToCreateControlledCopy'));
        }
      }
    } catch (error) {
      console.error("Error creating controlled copy:", error);
      toast.error(t('toast.anErrorOccurredWhileCreatingTheControlledCopy'));
    } finally {
      setIsCreating(false);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="h-full bg-background" 
      style={{ backgroundColor: "#F5F2EE" }}
      data-controlled-copies-tab="true"
      data-testid="docExecutionPage.rsb.controlledCopies.container"
    >
      {/* Header with title and button - hide for COLLABORATOR and SITE_ADMINISTRATOR users */}
      <div className="flex items-center justify-between mb-4" data-testid="docExecutionPage.rsb.controlledCopies.header">
        <h2 className="text-base font-medium" data-testid="docExecutionPage.rsb.controlledCopies.title">{t('cc.controlledCopies')}</h2>
        {!shouldHideCreateButton && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 flex items-center"
            onClick={() => {
              useAppStore.getState().hideInsertIntoCellDialog()
              setIsAddModalOpen(true);
            }}
            data-testid="docExecutionPage.rsb.controlledCopies.createButton"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{t('cc.create')}</span>
          </Button>
        )}
      </div>
      
      <div className="space-y-2" data-testid="docExecutionPage.rsb.controlledCopies.list">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-500" data-testid="docExecutionPage.rsb.controlledCopies.loadingState">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>{t('cc.loadingControlledCopies')}</span>
          </div>
        ) : controlledCopies.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm" data-testid="docExecutionPage.rsb.controlledCopies.emptyState">
            {emptyMessage}
          </div>
        ) : (
          controlledCopies.map((copy) => (
            <div 
              key={copy.id} 
              className="flex items-center gap-3 p-2 bg-[#FAF9F5] rounded hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => handleCopyClick(copy)}
              data-testid={`docExecutionPage.rsb.controlledCopies.item${copy.id}`}
            >
              <div className="flex items-center justify-center w-6 min-w-6 text-xs font-medium text-gray-500" data-testid={`docExecutionPage.rsb.controlledCopies.itemNumber${copy.id}`}>
                {String(copy.number).padStart(2, '0')}
              </div>
              <FileStack className="h-5 w-5 text-gray-500" />
              <div className="flex-grow truncate" data-testid={`docExecutionPage.rsb.controlledCopies.itemDate${copy.id}`}>
                <span className="text-sm">
                  {copy.createdAt.getDate().toString().padStart(2, '0')}-
                  {copy.createdAt.toLocaleString('default', { month: 'short' })}-
                  {copy.createdAt.getFullYear()}
                </span>
              </div>
              <StatusChip status={copy.status} />
              <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
          ))
        )}
      </div>

      {/* Add Controlled Copy Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="docExecutionPage.rsb.controlledCopies.createDialog">
          <DialogHeader data-testid="docExecutionPage.rsb.controlledCopies.createDialogHeader">
            <DialogTitle data-testid="docExecutionPage.rsb.controlledCopies.createDialogTitle">{t('cc.createAControlledCopy')}</DialogTitle>
          </DialogHeader>
          <div className="py-4" data-testid="docExecutionPage.rsb.controlledCopies.createDialogBody">
            <p className="text-sm text-gray-600">
              {t('cc.generateANewUnExecutedVersionOfThisDocumentWithTheSamePreApprovedContent')}
            </p>
          </div>
          <DialogFooter className="sm:justify-end" data-testid="docExecutionPage.rsb.controlledCopies.createDialogFooter">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
              }}
              disabled={isCreating}
              data-testid="docExecutionPage.rsb.controlledCopies.createDialogCancelButton"
            >
              {t('buttonTitle.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleAddControlledCopy}
              disabled={isCreating}
              data-testid="docExecutionPage.rsb.controlledCopies.createDialogConfirmButton"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("creating...")}
                </>
              ) : t('cc.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
