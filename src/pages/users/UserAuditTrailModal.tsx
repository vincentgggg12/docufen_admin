import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/lib/stateManagement";
import { useShallow } from "zustand/shallow";
import React from "react";
import { formatDatetimeString } from "@/lib/dateUtils";
import { AccountAuditLogItem, AuditLogEntry, fetchUserAuditLogs, UserFilter, UserLogsResponse } from "@/lib/apiUtils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

// Extract Audit Logs Table to be reused across tabs
function AuditLogsTable({
  logs
}: {
  logs: AuditLogEntry[];
}) {
  const { t } = useTranslation();
  
  return (
    <div className="overflow-y-auto w-full">
      <Table>
        <TableHeader className="bg-muted/50 sticky top-0 z-10">
          <TableRow>
            <TableHead className="text-sm font-medium text-gray-600">{t("users.timestamp")}</TableHead>
            <TableHead className="text-sm font-medium text-gray-600">{t("users.name")}</TableHead>
            <TableHead className="text-sm font-medium text-gray-600">{t("users.action")}</TableHead>
            <TableHead className="text-sm font-medium text-gray-600">{t("users.details")}</TableHead>
            <TableHead className="text-sm font-medium text-gray-600">{t("users.performedBy")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length > 0 ? (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm font-normal text-gray-600">{formatDatetimeString(log.timestamp, t)}</TableCell>
                <TableCell className="text-sm font-normal text-gray-600">{log.name}</TableCell>
                <TableCell className="text-sm font-normal text-gray-600">{log.action}</TableCell>
                <TableCell className="text-sm font-normal text-gray-600">{log.details}</TableCell>
                <TableCell className="text-sm font-normal text-gray-600">{log.performedBy}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-sm font-normal text-gray-600">
                {t("users.noAuditLogsFound")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
interface UserAuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// User Audit Trail Modal
export function UserAuditTrailModal({ isOpen, onClose }: UserAuditTrailModalProps) {
  const { user, tenantName } = useUserStore(useShallow(state => ({
    user: state.user,
    tenantName: state.tenantName,
  })));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<UserFilter>("all");
  const { t } = useTranslation();

  // Calculate total pages based on total items and page size
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  React.useEffect(() => {
    if (user == null || !tenantName) return;
    if (!isOpen) return;
    
    setIsLoading(true);
    fetchUserAuditLogs(tenantName, page, pageSize, activeTab)
      .then((response: UserLogsResponse) => {
        setTotalItems(response.numberOfItems || 0);
        
        if (response.numberOfItems === 0) {
          setAuditLogs([]);
          return;
        }
        
        setAuditLogs(response.systemLog.map((rawLog: AccountAuditLogItem) => {
          return {
            id: rawLog.id,
            timestamp: rawLog.timestamp,
            performedBy: rawLog.actor,
            action: t(rawLog.action),
            details: t(rawLog.detailsKey, rawLog.detailsData),
            name: rawLog.target ?? "?"
          } as AuditLogEntry;
        }));
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error("Error fetching audit logs:", error.message);
        } else {
          console.error("Error fetching audit logs:", error);
        } 
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user, isOpen, tenantName, page, pageSize, activeTab, t]);

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1); // Reset to first page when changing page size
  };

  const callSetActiveTab = (value: string) => {
    setActiveTab(value as UserFilter);
    setPage(1); // Reset to first page when changing tabs
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent 
        className="sm:max-w-[1500px] p-0 overflow-hidden max-h-[90vh] flex flex-col"
        aria-describedby="audit-trail-description"
      >
        <div id="audit-trail-description" className="sr-only">
          {t('auditTrailDescription')}
        </div>
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-gray-600">{t("users.auditTrail")}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="px-6 pt-4 flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={callSetActiveTab} className="w-full flex-1 flex flex-col" data-testid="userAuditTrailModal.tabs">
            <TabsList className="grid grid-cols-2 mb-2" data-testid="userAuditTrailModal.tabsList">
              <TabsTrigger value="all" className="text-sm" data-testid="userAuditTrailModal.allTab">{t("users.auditTrailTabs.all")}</TabsTrigger>
              <TabsTrigger value="created" className="text-sm" data-testid="userAuditTrailModal.createdTab">{t("users.auditTrailTabs.created")}</TabsTrigger>
              {/* <TabsTrigger value="status" className="text-sm">{t("users.auditTrailTabs.status")}</TabsTrigger>
              <TabsTrigger value="e-signature" className="text-sm">{t("users.auditTrailTabs.eSignature")}</TabsTrigger> */}
            </TabsList>

            {/* Set each tab content to be scrollable and take remaining height */}
            <TabsContent value="all" className="mt-0 flex-1 overflow-auto">
              <AuditLogsTable logs={auditLogs} />
            </TabsContent>

            <TabsContent value="created" className="mt-0 flex-1 overflow-auto">
              <AuditLogsTable logs={auditLogs} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Pagination controls */}
        <div className="px-6 py-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('users.pagination.rowsPerPage')}</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange} data-testid="userAuditTrailModal.pageSizeSelect">
              <SelectTrigger className="h-8 w-[70px]" data-testid="userAuditTrailModal.pageSizeSelectTrigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
              onClick={() => handlePageChange(1)}
              disabled={page === 1 || isLoading}
              data-testid="userAuditTrailModal.firstPageButton"
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">{t('first-page')}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isLoading}
              data-testid="userAuditTrailModal.previousPageButton"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{t('previous-page')}</span>
            </Button>
            
            <span className="text-sm mx-2">
              {isLoading ? "Loading..." : t('page-page-of-totalpages', { page, totalPages })}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              data-testid="userAuditTrailModal.nextPageButton"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">{t('next-page')}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(totalPages)}
              disabled={page >= totalPages || isLoading}
              data-testid="userAuditTrailModal.lastPageButton"
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">{t('last-page')}</span>
            </Button>
          </div>

          <Button onClick={onClose} data-testid="userAuditTrailModal.closeButton">{t("common.close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}