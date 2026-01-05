import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, X, RefreshCw, Loader2 } from "lucide-react";
import { IconFileWord } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { SERVERURL } from "@/lib/server";
import { formatDatetimeString } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";

export interface ConnectorQueueDocument {
  documentId: string;
  documentName: string;
  externalReference: string;
  documentCategory: string;
  lastModified: number;
  connectorName: string;
  status: string;
  imported: boolean;
}

interface CreateNewDocumentDialogConnectorProps {
  onDocumentSelect: (doc: ConnectorQueueDocument) => void;
  selectedDocId: string | null;
  usedTokens: Array<{tokenName: string, connector: string}>;
  onDeselect: () => void;
}

interface QueueResponse {
  length: number,
  documents: ConnectorQueueDocument[]
}

const CreateNewDocumentDialogConnector: React.FC<CreateNewDocumentDialogConnectorProps> = ({
  onDocumentSelect,
  selectedDocId,
  usedTokens,
  onDeselect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [connectorFilter, setConnectorFilter] = useState<string>("all");
  const [columnWidths, setColumnWidths] = useState({
    name: 40,
    number: 25,
    received: 35,
  });
  const [resizing, setResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [queueDocuments, setQueueDocuments] = useState<ConnectorQueueDocument[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<ConnectorQueueDocument[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { t } = useTranslation()

  const getQueueDocuments = async () => {
    const url = SERVERURL + "connector/uploaded-documents"
    const res = await fetch(url, {
      method: "GET",
      credentials: "include"
    })
    if (res.ok) {
      const data: QueueResponse = await res.json()
      console.debug(JSON.stringify(data))
      return data.documents
    } else {
      return null
    }
  }
  // Format date for display
  // const formatDate = (timestamp: number) => {
  //   return formatDatetimeString(timestamp, t)
  //   // return date.toLocaleDateString("en-US", {
  //   //   year: "numeric",
  //   //   month: "short",
  //   //   day: "numeric",
  //   // });
  // };

  useEffect(() => {
    getQueueDocuments().then((queueDocs) => {
    if (queueDocs)
      setQueueDocuments(queueDocs)
    }).catch((err) => {
      if (err instanceof Error)
        console.warn("Error fetching Pending documents")
    })
  },[])
  // Mock queue data - replace with actual API call
  // const [queueDocuments] = useState<ConnectorQueueDocument[]>([
  //   {
  //     documentId: "q-001",
  //     documentName: "Dexketoprofeno Pensavital 25mg",
  //     externalReference: "BR-DXK-025",
  //     documentCategory: "Batch Record",
  //     submittedAt: "2025-10-26T10:30:00",
  //     connectorName: "SAP Manufacturing",
  //     status: "ready",
  //     imported: false,
  //   },
  //   {
  //     documentId: "q-002",
  //     documentName: "Ibuprofeno Pensavital 400mg",
  //     externalReference: "BR-IBU-400",
  //     documentCategory: "Batch Record",
  //     submittedAt: "2025-10-26T09:15:00",
  //     connectorName: "OpenText DMS",
  //     status: "ready",
  //     imported: false,
  //   },
  //   {
  //     documentId: "q-003",
  //     documentName: "Paracetamol Pensavital 650mg",
  //     externalReference: "BR-PAR-650",
  //     documentCategory: "Batch Record",
  //     submittedAt: "2025-10-25T14:20:00",
  //     connectorName: "SAP Manufacturing",
  //     status: "ready",
  //     imported: false,
  //   },
  //   {
  //     documentId: "q-004",
  //     documentName: "Omeprazol Pensavital 20mg",
  //     externalReference: "BR-OME-020",
  //     documentCategory: "Batch Record",
  //     submittedAt: "2025-10-24T11:45:00",
  //     connectorName: "OpenText DMS",
  //     status: "processing",
  //     imported: true,
  //   },
  //   {
  //     documentId: "q-005",
  //     documentName: "Pantoprazol Pensavital 20mg",
  //     externalReference: "BR-PAN-020",
  //     documentCategory: "Batch Record",
  //     submittedAt: "2025-10-24T08:30:00",
  //     connectorName: "SAP Manufacturing",
  //     status: "ready",
  //     imported: false,
  //   },
  //   {
  //     documentId: "q-006",
  //     documentName: "Paracetamol Pensavital 500mg",
  //     externalReference: "BR-PAR-500",
  //     documentCategory: "Batch Record",
  //     submittedAt: "2025-10-23T16:20:00",
  //     connectorName: "OpenText DMS",
  //     status: "ready",
  //     imported: true,
  //   },
  //   {
  //     documentId: "q-007",
  //     documentName: "Dioflav 500mg",
  //     externalReference: "BR-DIO-500",
  //     documentCategory: "Batch Record",
  //     submittedAt: "2025-10-23T13:15:00",
  //     connectorName: "SAP Manufacturing",
  //     status: "ready",
  //     imported: false,
  //   },
  //   {
  //     documentId: "q-008",
  //     documentName: "Paracetamol Pensavital 1g",
  //     externalReference: "BR-PAR-1000",
  //     documentCategory: "Batch Record",
  //     submittedAt: "2025-10-22T10:45:00",
  //     connectorName: "OpenText DMS",
  //     status: "ready",
  //     imported: false,
  //   },
  // ]);

  // Filter documents based on search, date, and connector
  useEffect(() => {
  const filteredDocs = queueDocuments.filter((doc) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (doc.documentName ?? '').toLowerCase().includes(searchLower) ||
      (doc.externalReference ?? '').toLowerCase().includes(searchLower) ||
      (doc.documentCategory ?? '').toLowerCase().includes(searchLower);

    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - doc.lastModified) / (1000 * 60 * 60 * 24));

    let matchesDate = true;
    if (dateFilter === "today") {
      matchesDate = daysDiff === 0;
    } else if (dateFilter === "week") {
      matchesDate = daysDiff <= 7;
    } else if (dateFilter === "month") {
      matchesDate = daysDiff <= 30;
    }

    const matchesConnector = connectorFilter === "all" || doc.connectorName === connectorFilter;

    return matchesSearch && matchesDate && matchesConnector;
  });
  setFilteredDocuments(filteredDocs)
  }, [queueDocuments, dateFilter, searchQuery, connectorFilter])


  const handleDocumentClick = (doc: ConnectorQueueDocument) => {
    // Prevent selection of already imported documents
    if (doc.imported) {
      return;
    }
    onDocumentSelect(doc);
    trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
      button_name: 'select_connector_document',
      button_location: 'connector_queue_table',
      page_name: 'Create Document Dialog'
    });
  };

  const handleDeselectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeselect();
    trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
      button_name: 'deselect_connector_document',
      button_location: 'connector_queue_table',
      page_name: 'Create Document Dialog'
    });
  };

  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    setResizing(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column as keyof typeof columnWidths]);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const diff = e.clientX - startX;
        const diffPercent = (diff / window.innerWidth) * 100;
        const newWidth = Math.max(10, Math.min(70, startWidth + diffPercent));

        setColumnWidths((prev) => ({
          ...prev,
          [resizing]: newWidth,
        }));
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, startX, startWidth]);

  return (
    <TooltipProvider>
      <div className={cn("space-y-4", resizing && "select-none")}>
        {/* Search and filters - hidden when document is selected */}
        {!selectedDocId && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("connectors.searchQueueDocuments")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    trackAmplitudeEvent(AMPLITUDE_EVENTS.SEARCH_PERFORMED, {
                      search_query: e.target.value,
                      search_type: 'connector_queue',
                      results_count: filteredDocuments.length,
                      page_name: 'Create Document Dialog'
                    });
                  }
                }}
                className="pl-9"
                data-testid="connectorDialog.searchInput"
              />
            </div>

            <div className="flex items-center gap-3">
              <Select
                value={dateFilter}
                onValueChange={(value) => {
                  const previousFilter = dateFilter;
                  setDateFilter(value);
                  trackAmplitudeEvent(AMPLITUDE_EVENTS.FILTER_APPLIED, {
                    filter_type: 'date_range',
                    filter_value: value,
                    previous_value: previousFilter,
                    page_name: 'Create Document Dialog'
                  });
                }}
              >
                <SelectTrigger className="w-[200px]" data-testid="connectorDialog.dateFilter">
                  <SelectValue placeholder={t("connectors.selectDateRange")} />
                </SelectTrigger>
                <SelectContent className="z-[10003]">
                  <SelectItem value="today" data-testid="connectorDialog.filter.today">
                    {t("connectors.today")}
                  </SelectItem>
                  <SelectItem value="week" data-testid="connectorDialog.filter.thisWeek">
                    {t("connectors.thisWeek")}
                  </SelectItem>
                  <SelectItem value="month" data-testid="connectorDialog.filter.thisMonth">
                    {t("connectors.thisMonth")}
                  </SelectItem>
                  <SelectItem value="all" data-testid="connectorDialog.filter.allTime">
                    {t("connectors.allTime")}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Connector filter dropdown - only show if multiple connectors have been used */}
              {usedTokens.length > 1 && (
                <Select
                  value={connectorFilter}
                  onValueChange={(value) => {
                    const previousFilter = connectorFilter;
                    setConnectorFilter(value);
                    trackAmplitudeEvent(AMPLITUDE_EVENTS.FILTER_APPLIED, {
                      filter_type: 'connector',
                      filter_value: value,
                      previous_value: previousFilter,
                      page_name: 'Create Document Dialog'
                    });
                  }}
                >
                  <SelectTrigger className="w-[200px]" data-testid="connectorDialog.connectorFilter">
                    <SelectValue placeholder={t("connectors.allConnectors")} />
                  </SelectTrigger>
                  <SelectContent className="z-[10003]">
                    <SelectItem value="all">{t("connectors.allConnectors")}</SelectItem>
                    {usedTokens.map(token => (
                      <SelectItem key={token.tokenName} value={token.tokenName}>
                        {token.tokenName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isRefreshing}
                    onClick={async () => {
                      setIsRefreshing(true);
                      try {
                        const queueDocs = await getQueueDocuments();
                        if (queueDocs) {
                          setQueueDocuments(queueDocs);
                          trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                            button_name: 'refresh_connector_queue',
                            button_location: 'connector_dialog',
                            page_name: 'Create Document Dialog'
                          });
                        }
                      } catch (err) {
                        if (err instanceof Error) {
                          console.warn("Error fetching Pending documents");
                          trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
                            error_type: 'connector_queue_refresh_failed',
                            error_code: 'FETCH_ERROR',
                            error_message: err.message,
                            error_source: 'connector_dialog',
                            page_name: 'Create Document Dialog',
                            action_attempted: 'refresh_connector_queue'
                          });
                        }
                      } finally {
                        setIsRefreshing(false);
                      }
                    }}
                    data-testid="connectorDialog.refreshButton"
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="z-[10003]">
                  <p>{t("connectors.refreshListTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </div>

          </div>
        )}

        {/* Queue list */}
        <div className={cn(selectedDocId ? "" : "max-h-[380px]", "overflow-auto border rounded-md")} data-testid="connectorDialog.queueTable">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead
                  className={cn(
                    "text-sm font-medium text-gray-600 bg-table-header border-b sticky top-0 relative",
                    resizing && "select-none"
                  )}
                  style={{ width: `${columnWidths.name}%` }}
                >
                  {t("connectors.documentName")}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/70 active:bg-primary"
                    onMouseDown={(e) => handleResizeStart(e, "name")}
                  >
                    <div className="absolute inset-y-0 -left-2 -right-2" />
                  </div>
                </TableHead>
                <TableHead
                  className={cn(
                    "text-sm font-medium text-gray-600 bg-table-header border-b sticky top-0 relative",
                    resizing && "select-none"
                  )}
                  style={{ width: `${columnWidths.number}%` }}
                >
                  {t("connectors.number")}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/70 active:bg-primary"
                    onMouseDown={(e) => handleResizeStart(e, "number")}
                  >
                    <div className="absolute inset-y-0 -left-2 -right-2" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-sm font-medium text-gray-600 bg-table-header border-b sticky top-0"
                  style={{ width: `${columnWidths.received}%` }}
                >
                  {t("connectors.received")}
                </TableHead>
                {selectedDocId && <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b sticky top-0 w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow key="only">
                  <TableCell colSpan={3} className="h-24 text-center">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <FileText className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-sm">{t("connectors.noDocumentsInQueue")}</p>
                      <p className="text-xs mt-1">
                        {t("connectors.documentsWillAppearHere")}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments
                  .filter((doc) => !selectedDocId || doc.documentId === selectedDocId)
                  .map((doc) => (
                    <TableRow
                      key={doc.documentId}
                      className={cn(
                        "h-10",
                        !doc.imported && "cursor-pointer hover:bg-[#FAF9F4]",
                        doc.imported && "cursor-not-allowed opacity-50 bg-gray-50",
                        selectedDocId === doc.documentId && "bg-[#FAF9F4] border-l-4 border-l-primary"
                      )}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <TableCell
                        className={cn("font-medium max-w-0", doc.imported ? "text-gray-400" : "text-gray-700")}
                        style={{ width: `${columnWidths.name}%` }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 min-w-0">
                              <IconFileWord className={cn("h-4 w-4 flex-shrink-0", doc.imported ? "text-gray-400" : "text-[#2B579A]")} />
                              <span className="truncate block">{doc.documentName}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{doc.documentName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell
                        className={cn("text-sm max-w-0", doc.imported ? "text-gray-400" : "text-gray-600")}
                        style={{ width: `${columnWidths.number}%` }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default truncate block">{doc.externalReference || "-"}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{doc.externalReference || "-"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell
                        className={cn("text-sm", doc.imported ? "text-gray-400" : "text-gray-600")}
                        style={{ width: `${columnWidths.received}%` }}
                      >
                        { formatDatetimeString(doc.lastModified, t) }
                      </TableCell>
                      {selectedDocId && selectedDocId === doc.documentId && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 bg-destructive/10 hover:bg-destructive/20"
                            onClick={handleDeselectClick}
                            data-testid="connectorDialog.deselectButton"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CreateNewDocumentDialogConnector;
