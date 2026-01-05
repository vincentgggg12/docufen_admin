import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Edit, ClipboardPen, FileCheck, ExternalLink, BanIcon, Loader2, Trash2 } from "lucide-react";
import { IconSignature } from "@tabler/icons-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Stage } from "@/components/editor/lib/lifecycle";
import { formatDateFromTimestamp, formatDatetimeStringFromTimestamp } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { refreshAllDocumentsLists } from "@/hooks/AccountData";
import { useUserStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import { removeDeletedDocumentFromList } from "./DocumentsPage";
import { Participant, ParticipantGroup, deleteDocument, cleanupDocumentStorage, GroupTitles, DocumentDescription } from "@/lib/apiUtils";
import DocumentTypeIcon from "@/pages/Documents/DocumentTypeIcon";
import { Badge } from "../../components/ui/badge";
import { UserType } from "@/lib/authorisation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";
import { stageToDocumentStage } from "@/components/editor/lib/utils";
import { encodeUrlFilename } from "@/lib/utils";

// Import your PDF icon or create it here
import pdfIconSvg from "@/assets/pdf_icon.svg";

const FinalPDFIcon = () => (
  <img src={pdfIconSvg} alt="PDF" className="h-5 w-5" />
);


interface DocumentsTableProps {
  documents: DocumentDescription[];
  expandedRows: Record<string, boolean>;
  toggleRow: (docId: string) => void;
  handleDocumentClick: (e: React.MouseEvent, doc: DocumentDescription) => void;
  handleOpenDocInfoDialog: (doc: DocumentDescription) => void;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  setCurrentPage: (page: number | ((page: number) => number)) => void;
  setRowsPerPage: (value: number) => void;
  emptyMessage: string;
}

function DocumentsTable({
  documents,
  expandedRows,
  toggleRow,
  handleDocumentClick,
  handleOpenDocInfoDialog,
  currentPage,
  totalPages,
  rowsPerPage,
  setCurrentPage,
  setRowsPerPage,
  emptyMessage
}: DocumentsTableProps) {
  const { t, i18n } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentDescription | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationChecked, setDeleteConfirmationChecked] = useState(false);
  const { tenantName, userType, participant } = useUserStore(useShallow((state) => ({ 
    tenantName: state.tenantName,
    userType: state.userType,
    participant: state.participant
  })));
  
  // Function to check if current user is an owner of a specific document
  const isDocumentOwner = (doc: DocumentDescription): boolean => {
    if (!participant) return false;
    
    let owners: Participant[] | undefined = [];
    if (doc.deleted && doc.owners) {
      owners = doc.owners;
    } else if (doc.participantGroups == null) {
      owners = doc.owners || [];
    } else {
      owners = doc.participantGroups.find((group: ParticipantGroup) => group.title === GroupTitles.OWNERS)?.participants;
    }
    
    if (!owners || owners.length === 0) return false;
    
    return owners.some(owner => 
      (owner.id && participant.id && owner.id === participant.id) ||
      (owner.email && participant.email && owner.email === participant.email)
    );
  };
  
  const handleDeleteClick = (e: React.MouseEvent, doc: DocumentDescription) => {
    e.stopPropagation();
    e.preventDefault();
    setDocumentToDelete(doc);
    setDeleteConfirmationChecked(false);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteDocument(documentToDelete.id, i18n.language);
      
      if (result.success) {
        // Track document deleted
        trackAmplitudeEvent(AMPLITUDE_EVENTS.DOCUMENT_DELETED, {
          document_id: documentToDelete.id,
          document_name: documentToDelete.documentName,
          document_stage: stageToDocumentStage(documentToDelete.stage),
          deletion_source: 'documents_table',
          page_name: 'Documents'
        });
        
        setDeleteDialogOpen(false);
        toast.success(t("notifications.documentDeleted"));
        
        // Immediately remove from client-side list
        removeDeletedDocumentFromList(documentToDelete.id);
        
        // Clean up any document data in localStorage
        cleanupDocumentStorage(documentToDelete.id);
        
        // Refresh all document lists
        await refreshAllDocumentsLists(tenantName);
      } else {
        if (result.code === 403) {
          toast.error(t("errors.documentHasContent"));
        } else {
          toast.error(result.error || t("errors.somethingWentWrong"));
        }
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(t("errors.somethingWentWrong"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden h-full flex flex-col">
        <div className="overflow-auto border rounded-md" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-10"></TableHead>
                <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[15%]">{t("documents.documentNumber")}</TableHead>
                <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 max-w-[300px] w-[35%]">{t("documents.name")}</TableHead>
                <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[10%]">{t('documentsTable.category')}</TableHead>
                <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[15%]">{t("documents.owner")}</TableHead>
                <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[15%]">{t("documents.lastModified")}</TableHead>
                <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[20%]">{t("documents.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                let owners: Participant[] | undefined = [];
                if (doc.deleted && doc.owners) {
                  // For deleted documents, use the preserved owners array
                  owners = doc.owners;
                } else if (doc.participantGroups == null) {
                  owners = doc.owners || [{ id: uuid(), name: t('participants.unknownOwner'), email: "" }];  // Fallback to old style documentDescription
                 } else {
                  owners = doc.participantGroups.find((group: ParticipantGroup) => group.title === GroupTitles.OWNERS)?.participants;
                }
                return (
                <React.Fragment key={doc.id}>
                  <TableRow 
                    className={`cursor-pointer h-12 hover:bg-[#FAF9F4] ${expandedRows[doc.id] ? 'bg-[#FAF9F4]' : ''}`}
                    onClick={() => toggleRow(doc.id)}
                    data-testid="documentsTable.documentRow"
                  >
                    <TableCell>
                      {expandedRows[doc.id] ? (
                        <ChevronUp className="h-4 w-4" data-testid="documentsTable.expandRowButton" />
                      ) : (
                        <ChevronDown className="h-4 w-4" data-testid="documentsTable.expandRowButton" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-normal text-gray-600">{doc.externalReference}</TableCell>
                    <TableCell className="font-medium text-gray-700 max-w-[300px]">
                      {doc.deleted ? (
                        <div className="flex items-center gap-2 opacity-50">
                          <DocumentTypeIcon document={doc} className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate line-through">{doc.documentName}</span>
                        </div>
                      ) : (
                        <Link
                          to={`/document/${doc.id}`}
                          className="hover:underline cursor-pointer block truncate flex items-center gap-2"
                          onClick={(e) => handleDocumentClick(e, doc)}
                          title={doc.documentName}
                          data-testid="documentsTable.documentLink"
                        >
                          <DocumentTypeIcon document={doc} className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{doc.documentName}</span>
                        </Link>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="w-32">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-muted-foreground px-1.5 max-w-full truncate">
                                {doc.documentCategory ? t(`selector.${doc.documentCategory}`, doc.documentCategory) : t("selector.notSpecified") }
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] text-xs" side="top">
                              <p>{doc.documentCategory ? t(`selector.${doc.documentCategory}`, doc.documentCategory) : t("selector.notSpecified")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-normal text-gray-600">
                      {owners && owners.length > 0 ? owners[0].name : t('participants.unknownOwner')}
                    </TableCell>
                    <TableCell className="text-sm font-normal text-gray-600">{formatDateFromTimestamp(doc.lastModified, t)}</TableCell>
                    <TableCell className="text-sm font-normal text-gray-600">
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
                        ) : doc.stage === Stage.Finalised ? (
                          <>
                            <a
                              href={doc.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:opacity-80 focus:outline-none flex items-center space-x-1 text-inherit no-underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Let the default link behavior handle opening in new tab
                              }}
                              title={t("documents.viewFinalPdf")}
                              data-testid="documentsTable.finalPdfButton"
                            >
                              <FinalPDFIcon />
                              <span>{t("documents.finalPdf")}</span>
                            </a>
                          </>
                        ) : doc.stage === Stage.Closed ? (
                          <>
                            <FileCheck className="h-3.5 w-3.5 text-[#0E7C3F]" />
                            <span>{t("documents.completed")}</span>
                          </>
                        ) : doc.stage === Stage.Voided ? (
                          <>
                            {doc.deleted ? (
                              <>
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                <span>{t("documents.deleted")}</span>
                              </>
                            ) : (
                              <>
                                <BanIcon className="h-3.5 w-3.5 text-red-500" />
                                <span>{t("documents.voided")}</span>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <FileCheck className="h-3.5 w-3.5 text-[#0E7C3F]" />
                            <span>{t("documents.completed")}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows[doc.id] && (
                    <TableRow className="bg-[#FAF9F4]">
                      <TableCell colSpan={7} className="p-0">
                        <div className="grid grid-cols-1 gap-6 p-6">
                          {/* Document Information Card */}
                          <div className="space-y-4">
                            <div className="border rounded-md p-4 bg-white h-full w-full">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-600">{t("documents.documentInformation")}</h3>
                                {/* Only show edit button for document owners (excluding COLLABORATOR and SITE_ADMINISTRATOR roles) */}
                                {userType !== UserType.COLLABORATOR && 
                                 userType !== UserType.SITE_ADMINISTRATOR && 
                                 isDocumentOwner(doc) && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleOpenDocInfoDialog(doc)}
                                    data-testid="documentsTable.editDocumentButton"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                    <span className="sr-only">{t("documents.edit")}</span>
                                  </Button>
                                )}
                              </div>
                              <div className="space-y-4 mt-4">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{t("documents.docufenDocumentId")}</Label>
                                  <p className="text-sm font-medium text-gray-600">
                                    {doc.id || t("documents.notAssigned")}
                                  </p>
                                </div>
                                {doc.parentDocument && (
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{t("documents.parentDocumentId")}</Label>
                                  <p className="text-sm font-medium text-gray-600">
                                    <a 
                                      href={doc.parentDocument.url} 
                                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {doc.parentDocument.documentId || t("documents.notAssigned")}
                                    </a>
                                  </p>
                                </div>
                                )}
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{t("documents.documentType")}</Label>
                                  <p className="text-sm font-medium text-gray-600">
                                    {doc.documentCategory ? t(`selector.${doc.documentCategory}`, doc.documentCategory) : t("selector.notSpecified")}
                                  </p>
                                </div>
                                
                                {/* Show deletion metadata if document is deleted */}
                                {doc.deleted && doc.deletionMetadata && (
                                  <div className="space-y-2 pt-2 border-t">
                                    <div className="space-y-1">
                                      <Label className="text-xs text-red-600 font-semibold">{t("documents.deletionInfo.title")}</Label>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">{t("documents.deletionInfo.deletedBy")}</Label>
                                      <p className="text-sm font-medium text-gray-600">
                                        {doc.deletionMetadata.deletedByName || t("common.unknown")}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">{t("documents.deletionInfo.deletedOn")}</Label>
                                      <p className="text-sm font-medium text-gray-600">
                                        {formatDatetimeStringFromTimestamp(doc.deletionMetadata.deletedAt, t, true)}
                                      </p>
                                    </div>
                                    {doc.deletionMetadata.finalizedBy && (
                                      <>
                                        <div className="space-y-1">
                                          <Label className="text-xs text-muted-foreground">{t("documents.deletionInfo.finalizedBy")}</Label>
                                          <p className="text-sm font-medium text-gray-600">
                                            {doc.deletionMetadata.finalizedBy}
                                          </p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs text-muted-foreground">{t("documents.deletionInfo.finalizedOn")}</Label>
                                          <p className="text-sm font-medium text-gray-600">
                                            {formatDatetimeStringFromTimestamp(doc.deletionMetadata.finalizedAt || 0, t, true)}
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex justify-between mt-4">
                                  {doc.pdfUrl && typeof doc.pdfUrl === 'string' && doc.pdfUrl.trim() !== '' && (
                                    <a
                                      href={encodeUrlFilename(doc.pdfUrl)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-300 bg-background hover:bg-accent hover:text-accent-foreground hover:border-gray-400 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Let the default link behavior handle opening in new tab
                                      }}
                                      data-testid="documentsTable.viewFinalPdfButton"
                                    >
                                      <FinalPDFIcon />
                                      <span>{t("documents.viewFinalPdf")}</span>
                                      <ExternalLink className="h-3.5 w-3.5 ml-1" />
                                    </a>
                                  )}
                                  {/* Only show delete button for admins and only enable for finalized documents */}
                                  {userType !== UserType.USER_MANAGER && 
                                   userType !== UserType.CREATOR && 
                                   userType !== UserType.COLLABORATOR && 
                                   !doc.deleted && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>
                                            <Button 
                                              variant="destructive" 
                                              size="sm"
                                              onClick={(e) => handleDeleteClick(e, doc)}
                                              className="flex items-center gap-1"
                                              disabled={doc.stage !== Stage.Finalised}
                                              data-testid="documentsTable.deleteDocumentButton"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                              <span>{t("documents.delete")}</span>
                                            </Button>
                                          </span>
                                        </TooltipTrigger>
                                        {doc.stage !== Stage.Finalised && (
                                          <TooltipContent className="max-w-[300px] p-3 text-xs" side="top">
                                            <p>{t("documents.deletionTooltip.mustBeFinalizedFirst")}</p>
                                            <p className="mt-2">{t("documents.deletionTooltip.requestOwnerToFinalize")}</p>
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
              })}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-xs">{t("documents.pagination.rowsPerPage")}</Label>
            <Select value={String(rowsPerPage)} onValueChange={(value) => setRowsPerPage(Number(value))} data-testid="documentsTable.rowsPerPageSelect">
              <SelectTrigger className="h-8 w-[70px]" data-testid="documentsTable.rowsPerPageSelectTrigger">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              data-testid="documentsTable.previousPageButton"
            >
              <ChevronUp className="h-4 w-4 -rotate-90" />
            </Button>
            <div className="text-sm">
              {t("documents.pagination.page")} {currentPage} {t("documents.pagination.of")} {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              data-testid="documentsTable.nextPageButton"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setDeleteConfirmationChecked(false);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              {t("actions.delete")}
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>{t("confirmations.confirmDelete")}</p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm font-semibold text-red-800 mb-1">⚠️ {t("common.warning")}</p>
                <p className="text-sm text-red-700">
                  {t("documents.deleteDialog.criminalOffenseWarning")}
                </p>
              </div>
              <label className="flex items-start gap-2 pt-2">
                <input 
                  type="checkbox" 
                  className="mt-0.5"
                  checked={deleteConfirmationChecked}
                  onChange={(e) => setDeleteConfirmationChecked(e.target.checked)}
                  data-testid="documentsTable.deleteConfirmationCheckbox"
                />
                <span className="text-sm">{t("documents.deleteDialog.confirmationCheckbox")}</span>
              </label>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmationChecked(false);
              }}
              disabled={isDeleting}
              data-testid="documentsTable.deleteCancelButton"
            >
              {t("actions.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting || !deleteConfirmationChecked}
              data-testid="documentsTable.deleteConfirmButton"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  {t("states.deleting")}
                </>
              ) : (
                t("actions.delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default DocumentsTable;