import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatDatetimeStringFromTimestamp } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";
import { BillingTransaction, PageCountType } from "./types";

interface BillingTableProps {
  data: BillingTransaction[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  setCurrentPage: (page: number | ((page: number) => number)) => void;
  setRowsPerPage: (value: number) => void;
  pageTypeIcons: Record<PageCountType, React.ReactNode>;
}

function BillingTable({
  data,
  isLoading,
  currentPage,
  totalPages,
  rowsPerPage,
  setCurrentPage,
  setRowsPerPage,
  pageTypeIcons
}: BillingTableProps) {
  const { t } = useTranslation();

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages, setCurrentPage]);

  // No need for running total calculation since we're removing that column

  return (
    <div className="overflow-hidden h-full flex flex-col">
      <div className="overflow-auto border rounded-md flex-1">
        <Table data-testid="billingTable.table">
          <TableHeader>
            <TableRow className="bg-table-header">
              <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[12%]">
                {t("billing.dateTime")}
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[20%]">
                {t("billing.documentName")}
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[12%]">
                {t("documents.documentNumber")}
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[12%]">
                {t('documentsTable.category')}
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[8%]">
                {t("billing.user")}
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[15%]">
                {t("billing.pageType")}
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-600 bg-table-header border-b z-10 w-[8%]">
                {t("billing.pageCount")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow data-testid="billingTable.loadingRow">
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("common.loading")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow data-testid="billingTable.emptyRow">
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("billing.noTransactions")}
                </TableCell>
              </TableRow>
            ) : (
              data.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-[#FAF9F4]" data-testid={`billingTable.transactionRow-${transaction.id}`}>
                  <TableCell className="text-sm font-normal text-gray-600">
                    {formatDatetimeStringFromTimestamp(transaction.timestamp, t)}
                  </TableCell>
                  <TableCell className="font-medium text-gray-700">
                    <div className="truncate max-w-[250px]" title={transaction.documentName}>
                      {transaction.documentName}
                    </div>
                    {transaction.documentId && (
                      <div className="text-xs text-muted-foreground truncate" title={transaction.documentId}>
                        {transaction.documentId}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-normal text-gray-600">
                    <div className="truncate max-w-[150px]" title={transaction.documentNumber || ''}>
                      {transaction.documentNumber || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-32">
                      <Badge variant="outline" className="text-muted-foreground px-1.5">
                        {transaction.documentCategory ? t(`selector.${transaction.documentCategory}`, transaction.documentCategory) : t("selector.notSpecified")}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-normal text-gray-600">
                    <div title={transaction.userEmail || ''}>
                      {transaction.userInitials || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {pageTypeIcons[transaction.pageCountType]}
                      <span className="text-sm">
                        {transaction.pageCountType === PageCountType.AUDIT_TRAIL 
                          ? t('billing.pageTypes.FinalPDF')
                          : t(`billing.pageTypes.${transaction.pageCountType}`)}
                      </span>
                    </div>
                    {transaction.pageCountType === PageCountType.AUDIT_TRAIL && (
                      <div className="text-xs text-muted-foreground">
                        {t('billing.pageTypes.AuditTrail')}
                      </div>
                    )}
                    {transaction.attachmentFilename && (
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={transaction.attachmentFilename}>
                        {transaction.attachmentFilename.includes('_Att_') 
                          ? transaction.attachmentFilename.substring(transaction.attachmentFilename.indexOf('_Att_') + 1)
                          : transaction.attachmentFilename
                        }
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-normal text-gray-600">
                    {transaction.incrementalPageCount}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 px-2" data-testid="billingTable.paginationControls">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("common.rowsPerPage")}
          </span>
          <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))} data-testid="billingTable.rowsPerPageSelect">
            <SelectTrigger id="rows-per-page" className="w-20 h-8" data-testid="billingTable.rowsPerPageSelectTrigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground" data-testid="billingTable.pageInfo">
            {t("common.pageXofY", { current: currentPage, total: totalPages })}
          </span>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              size="icon"
              variant="outline"
              className="h-8 w-8"
              data-testid="billingTable.previousPageButton"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
              size="icon"
              variant="outline"
              className="h-8 w-8"
              data-testid="billingTable.nextPageButton"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingTable;