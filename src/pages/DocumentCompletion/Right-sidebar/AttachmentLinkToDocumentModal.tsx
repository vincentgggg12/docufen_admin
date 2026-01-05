import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ClipboardPen, FileCheck, BanIcon } from "lucide-react";
import { IconSignature } from "@tabler/icons-react";
import { useUserStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import { DocumentDescription, fetchDocumentsList } from "@/lib/apiUtils";
import { Badge } from "@/components/ui/badge";
import { Stage } from "@/components/editor/lib/lifecycle";
import DocumentTypeIcon from "@/pages/Documents/DocumentTypeIcon";

interface AttachmentLinkToDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (document: { id: string, name: string, url: string }) => void;
}

export function AttachmentLinkToDocumentModal({
  isOpen,
  onClose,
  onSelectDocument
}: AttachmentLinkToDocumentModalProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Get tenant name from user store
  const { tenantName } = useUserStore(useShallow((state) => ({ 
    tenantName: state.tenantName
  })));

  useEffect(() => {
    if (isOpen && tenantName) {
      fetchDocuments();
    }
  }, [isOpen, tenantName]);

  const fetchDocuments = async () => {
    if (!tenantName) {
      setError(t("errors.noTenantName", "No tenant name available"));
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Use fetchDocumentsList function from apiUtils which handles API calls correctly
      const result = await fetchDocumentsList(tenantName, "all", 1, 50, true);
      
      if (result && result.documents) {
        console.log("Documents loaded:", result.documents.length);
        setDocuments(result.documents);
      } else {
        throw new Error(t("errors.failedToLoadDocuments"));
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(typeof err === 'string' ? err : t("errors.failedToLoadDocuments"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredDocuments = documents.filter(doc => 
    doc.documentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.externalReference && doc.externalReference.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectDocument = (document: DocumentDescription) => {
    const hostname = window.location.origin
    onSelectDocument({
      id: document.id,
      name: document.documentName,
      url: `${hostname}/document/${document.id}`
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} data-testid="attachmentLinkToDocumentModal.dialog">
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]" style={{ zIndex: 11000 }} data-testid="attachmentLinkToDocumentModal.content">
        <DialogHeader data-testid="attachmentLinkToDocumentModal.header">
          <DialogTitle data-testid="attachmentLinkToDocumentModal.title">{t("att.linkToDocument", "Link to Document")}</DialogTitle>
          <DialogDescription data-testid="attachmentLinkToDocumentModal.description">
            {t("att.linkToDocumentDesc", "Select an existing document to link to")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-2" data-testid="attachmentLinkToDocumentModal.searchContainer">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('documents.search')}
            value={searchQuery}
            onChange={handleSearch}
            className="flex-1"
            data-testid="attachmentLinkToDocumentModal.searchInput"
          />
        </div>
        
        {error && (
          <div className="text-sm text-red-500 py-2" data-testid="attachmentLinkToDocumentModal.errorMessage">{error}</div>
        )}
        
        {loading ? (
          <div className="py-8 text-center text-muted-foreground" data-testid="attachmentLinkToDocumentModal.loadingState">
            {t("states.loading", "Loading...")}
          </div>
        ) : (
          <div className="h-[400px] overflow-y-auto border rounded-md" data-testid="attachmentLinkToDocumentModal.documentsList">
            {filteredDocuments.length > 0 ? (
              <div className="p-1">
                {/* Header row for columns */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 font-medium text-sm border-b" data-testid="attachmentLinkToDocumentModal.documentsHeader">
                  <div className="col-span-2">{t("documents.documentNumber")}</div>
                  <div className="col-span-4">{t("documents.name")}</div>
                  <div className="col-span-3">{t('documentsTable.category')}</div>
                  <div className="col-span-3">{t("documents.status")}</div>
                </div>
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-muted rounded-md cursor-pointer transition-colors border-b border-gray-100"
                    onClick={() => handleSelectDocument(doc)}
                    data-testid={`attachmentLinkToDocumentModal.documentRow.${doc.id}`}
                  >
                    <div className="col-span-2 text-sm text-gray-600" data-testid={`attachmentLinkToDocumentModal.documentNumber.${doc.id}`}>
                      {doc.externalReference || '-'}
                    </div>
                    <div className="col-span-4" data-testid={`attachmentLinkToDocumentModal.documentName.${doc.id}`}>
                      <div className="font-medium flex items-center gap-1">
                        <DocumentTypeIcon document={doc} className="h-3.5 w-3.5 text-gray-500" />
                        <span>{doc.documentName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        ID: {doc.id.slice(0, 8)}...{doc.id.slice(-8)}
                      </div>
                    </div>
                    <div className="col-span-3" data-testid={`attachmentLinkToDocumentModal.documentCategory.${doc.id}`}>
                      <Badge variant="outline" className="text-muted-foreground px-1.5">
                        {doc.documentCategory ? t(`selector.${doc.documentCategory}`, doc.documentCategory) : t("selector.notSpecified") }
                      </Badge>
                    </div>
                    <div className="col-span-3 text-sm font-normal text-gray-600" data-testid={`attachmentLinkToDocumentModal.documentStatus.${doc.id}`}>
                      <div className="flex items-center space-x-1">
                        {doc.stage === Stage.Execute ? (
                          <>
                            <ClipboardPen className="h-3.5 w-3.5 text-[#6366F1]" />
                            <span>{t("documents.execution")}</span>
                          </>
                        ) : doc.stage === Stage.PreApprove ? (
                          <>
                            <IconSignature size={14} color="#FFA100" />
                            <span>{t("documents.preApproval")}</span>
                          </>
                        ) : doc.stage === Stage.PostApprove ? (
                          <>
                            <IconSignature size={14} color="#9C27B0" />
                            <span>{t("documents.postApproval")}</span>
                          </>
                        ) : doc.stage === Stage.Closed ? (
                          <>
                            <FileCheck className="h-3.5 w-3.5 text-[#0E7C3F]" />
                            <span>{t("documents.completed")}</span>
                          </>
                        ) : doc.stage === Stage.Voided ? (
                          <>
                            <BanIcon className="h-3.5 w-3.5 text-red-500" />
                            <span>{t("documents.voided")}</span>
                          </>
                        ) : (
                          <>
                            <FileCheck className="h-3.5 w-3.5 text-[#0E7C3F]" />
                            <span>{t("documents.completed")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground" data-testid="attachmentLinkToDocumentModal.emptyState">
                {searchQuery 
                  ? t("att.noDocumentsMatchingYourSearch")
                  : t("att.noDocumentsAvailable", "No documents available")}
              </div>
            )}
          </div>
        )}
        
        <DialogFooter data-testid="attachmentLinkToDocumentModal.footer">
          <Button variant="outline" onClick={onClose} data-testid="attachmentLinkToDocumentModal.cancelButton">
            {t("actions.cancel", "Cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AttachmentLinkToDocumentModal;
