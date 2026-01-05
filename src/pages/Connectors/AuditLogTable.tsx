import { ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { formatDatetimeStringFromTimestamp } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude";
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events";

export interface AuditLogDocument {
  documentId: string;
  documentNumber: string;
  documentName: string;
  documentOwner: string;
  action: string;
  uploadedAt?: number;
  claimedAt?: number;
  stage: number;
}

interface AuditLogTableProps {
  documents: AuditLogDocument[];
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  setCurrentPage: (page: number | ((page: number) => number)) => void;
  setRowsPerPage: (value: number) => void;
  emptyMessage?: string;
}

interface ColumnWidths {
  number: number;
  name: number;
  owner: number;
  action: number;
  uploadedAt: number;
  claimedAt: number;
}

function AuditLogTable({
  documents,
  currentPage,
  totalPages,
  rowsPerPage,
  setCurrentPage,
  setRowsPerPage,
  emptyMessage = "No audit logs found"
}: AuditLogTableProps) {
  const { t } = useTranslation();

  // Initialize column widths with reasonable defaults (in pixels)
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    number: 150,
    name: 300,
    owner: 200,
    action: 120,
    uploadedAt: 180,
    claimedAt: 180
  });

  const [resizingColumn, setResizingColumn] = useState<keyof ColumnWidths | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, column: keyof ColumnWidths) => {
    e.preventDefault();
    setResizingColumn(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column]);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn) {
        const diff = e.clientX - startX;
        const newWidth = Math.max(80, startWidth + diff); // Minimum width of 80px
        setColumnWidths(prev => ({
          ...prev,
          [resizingColumn]: newWidth
        }));
      }
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, startX, startWidth]);

  const ResizeHandle = ({ column }: { column: keyof ColumnWidths }) => (
    <div
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 group"
      onMouseDown={(e) => handleMouseDown(e, column)}
      style={{ zIndex: 10 }}
    >
      <div className="h-full w-1 group-hover:w-1.5 transition-all" />
    </div>
  );

  return (
    <div className="w-full">
      <div
        ref={tableRef}
        className="rounded-md border overflow-auto"
        style={{ maxHeight: 'calc(100vh - 250px)' }}
      >
        <Table style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: `${columnWidths.number}px` }} />
            <col style={{ width: `${columnWidths.name}px` }} />
            <col style={{ width: `${columnWidths.owner}px` }} />
            <col style={{ width: `${columnWidths.action}px` }} />
            <col style={{ width: `${columnWidths.uploadedAt}px` }} />
            <col style={{ width: `${columnWidths.claimedAt}px` }} />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="relative">
                {t("connectors.number")}
                <ResizeHandle column="number" />
              </TableHead>
              <TableHead className="relative">
                {t("connectors.documentName")}
                <ResizeHandle column="name" />
              </TableHead>
              <TableHead className="relative">
                {t("documents.owner")}
                <ResizeHandle column="owner" />
              </TableHead>
              <TableHead className="relative">
                {t("connectors.action")}
                <ResizeHandle column="action" />
              </TableHead>
              <TableHead className="relative">
                {t("connectors.uploadedAt")}
                <ResizeHandle column="uploadedAt" />
              </TableHead>
              <TableHead className="relative">
                {t("connectors.claimedAt")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.documentId} className="cursor-default">
                  <TableCell className="font-mono text-sm truncate overflow-hidden" title={doc.documentNumber}>
                    {doc.documentNumber}
                  </TableCell>
                  <TableCell className="font-medium truncate overflow-hidden" title={doc.documentName}>
                    {doc.documentName}
                  </TableCell>
                  <TableCell className="truncate overflow-hidden" title={doc.documentOwner}>
                    {doc.documentOwner}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      doc.action === 'uploaded'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {t(`connectors.${doc.action}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate overflow-hidden" title={doc.uploadedAt ? formatDatetimeStringFromTimestamp(doc.uploadedAt, t) : undefined}>
                    {doc.uploadedAt ? formatDatetimeStringFromTimestamp(doc.uploadedAt, t) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate overflow-hidden" title={doc.claimedAt ? formatDatetimeStringFromTimestamp(doc.claimedAt, t) : undefined}>
                    {doc.claimedAt ? formatDatetimeStringFromTimestamp(doc.claimedAt, t) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="rows-per-page" className="text-xs">{t("documents.pagination.rowsPerPage")}</Label>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(value) => {
              setRowsPerPage(Number(value));
              trackAmplitudeEvent(AMPLITUDE_EVENTS.DROPDOWN_SELECTED, {
                dropdown_name: 'audit_log_rows_per_page',
                selected_value: value,
                page_name: 'Connector Audit Log'
              });
            }}
          >
            <SelectTrigger className="h-8 w-[70px]" data-testid="auditLogTable.rowsPerPageSelect">
              <SelectValue placeholder={rowsPerPage} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5" data-testid="auditLogTable.rowsPerPage.5">5</SelectItem>
              <SelectItem value="10" data-testid="auditLogTable.rowsPerPage.10">10</SelectItem>
              <SelectItem value="20" data-testid="auditLogTable.rowsPerPage.20">20</SelectItem>
              <SelectItem value="50" data-testid="auditLogTable.rowsPerPage.50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setCurrentPage(page => Math.max(1, page - 1));
              trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                button_name: 'previous_page',
                button_location: 'audit_log_pagination',
                page_name: 'Connector Audit Log'
              });
            }}
            disabled={currentPage === 1}
            data-testid="auditLogTable.previousPageButton"
          >
            <ChevronUp className="h-4 w-4 -rotate-90" />
          </Button>
          <div className="text-sm" data-testid="auditLogTable.pageInfo">
            {t("documents.pagination.page")} {currentPage} {t("documents.pagination.of")} {totalPages}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setCurrentPage(page => Math.min(totalPages, page + 1));
              trackAmplitudeEvent(AMPLITUDE_EVENTS.BUTTON_CLICKED, {
                button_name: 'next_page',
                button_location: 'audit_log_pagination',
                page_name: 'Connector Audit Log'
              });
            }}
            disabled={currentPage === totalPages}
            data-testid="auditLogTable.nextPageButton"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AuditLogTable;
