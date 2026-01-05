"use client"

import * as React from "react"
import { SidebarLeft } from "../../components/left-sidebar/sidebar-left"
import { Separator } from "../../components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "../../components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Search,
  Download,
  FileText,
  Paperclip,
  FileCheck,
  ClipboardPen,
  CheckSquare,
} from "lucide-react"
import { IconSignature } from "@tabler/icons-react"
import { DatePicker } from "../../components/date-picker"
import { useTranslation } from "react-i18next"
import { useAppStore, useUserStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { SERVERURL } from "@/lib/server"
// Add this import for debouncing
import { useCallback, useRef } from "react"
import BillingTable from "./BillingTable"
import { PageCountType, BillingTransaction } from "./types"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es, pl, zhCN } from "date-fns/locale"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import ROIPage from "./ROIPage"
import { BillingChart } from "./BillingChart"
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude"
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events"

// Page type icons matching the billing types
const PageTypeIcons: Record<PageCountType, React.ReactNode> = {
  [PageCountType.PRE_APPROVAL]: <IconSignature size={14} color="#FFA100" />,
  [PageCountType.EXECUTION]: <ClipboardPen className="h-3.5 w-3.5 text-[#6366F1]" />,
  [PageCountType.POST_APPROVAL]: <IconSignature size={14} color="#9C27B0" />,
  [PageCountType.CLOSED]: <FileCheck className="h-3.5 w-3.5 text-[#0E7C3F]" />,
  [PageCountType.FINAL_PDF]: <FileText className="h-3.5 w-3.5 text-gray-600" />,
  [PageCountType.AUDIT_TRAIL]: <ClipboardPen className="h-3.5 w-3.5 text-gray-500" />,
  [PageCountType.ATTACHMENT_IMAGE]: <Paperclip className="h-3.5 w-3.5 text-blue-500" />,
  [PageCountType.ATTACHMENT_PDF]: <FileText className="h-3.5 w-3.5 text-red-500" />,
  [PageCountType.ATTACHMENT_VIDEO]: <Paperclip className="h-3.5 w-3.5 text-purple-500" />,
  [PageCountType.CONTROLLED_COPY]: <CheckSquare className="h-3.5 w-3.5 text-indigo-500" />,
}

export default function BillingPage() {
  const { t, i18n } = useTranslation()
  const { tenantName } = useUserStore(useShallow((state) => ({
    tenantName: state.tenantName
  })))
  const { sidebarOpen, setSidebarOpen } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })))

  // State for filters
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)
  const [selectedMonth, setSelectedMonth] = React.useState<string>("current")
  
  // For ROI tab, use current month if "current" is selected
  const [activeTab, setActiveTab] = React.useState<string>("metrics")
  
  // State for billing data
  const [billingData, setBillingData] = React.useState<BillingTransaction[]>([])
  const [allTransactions, setAllTransactions] = React.useState<BillingTransaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalPages, setTotalPages] = React.useState(1)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [rowsPerPage, setRowsPerPage] = React.useState(50)
  const [availableMonths, setAvailableMonths] = React.useState<string[]>([])
  
  // State for summary data
  const [summaryData, setSummaryData] = React.useState<{
    totalPages: number
    pagesByType: Record<PageCountType, number>
    transactionCount: number
  }>({
    totalPages: 0,
    pagesByType: {} as Record<PageCountType, number>,
    transactionCount: 0
  })

  // Track page view on mount
  React.useEffect(() => {
    trackAmplitudeEvent(AMPLITUDE_EVENTS.PAGE_VIEWED, {
      page_name: 'Analytics',
      page_path: '/billing',
      referrer: document.referrer
    })
  }, [])

  // Fetch available months on mount
  React.useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const response = await fetch(`${SERVERURL}billing/available-months`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setAvailableMonths(data.availableMonths || [])
        }
      } catch (error) {
        console.error('Error fetching available months:', error)
      }
    }
    
    fetchAvailableMonths()
  }, [])

  // Get the correct date-fns locale based on current language
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'es': return es
      case 'pl': return pl
      case 'zh': return zhCN
      default: return undefined // English is default
    }
  }

  // Generate month options based on available months
  const monthOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = []
    const locale = getDateLocale()
    
    // Only show months that have data
    availableMonths.forEach(yearMonth => {
      const [year, month] = yearMonth.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      const label = format(date, 'MMMM yyyy', { locale })
      options.push({ value: yearMonth, label })
    })
    
    return options
  }, [availableMonths, i18n.language])

  // Update date range when month is selected
  React.useEffect(() => {
    if (selectedMonth === "current") {
      // Don't set dates for "All Time"
      setStartDate(undefined)
      setEndDate(undefined)
    } else {
      // Parse the selected month and set date range
      const [year, month] = selectedMonth.split('-').map(Number)
      const monthStart = startOfMonth(new Date(year, month - 1))
      const monthEnd = endOfMonth(new Date(year, month - 1))
      setStartDate(monthStart)
      setEndDate(monthEnd)
    }
  }, [selectedMonth])

  // Fetch all transactions for chart (no pagination)
  const fetchAllTransactionsForChart = React.useCallback(async () => {
    try {
      // Fetch last 90 days of data for the chart
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 90)
      
      const params = new URLSearchParams({
        page: '1',
        limit: '9999', // Get all transactions for chart
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      const response = await fetch(`${SERVERURL}billing?${params}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAllTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }, [])

  // Add debounce ref
  const debounceRef = useRef<NodeJS.Timeout>(null)

  // Fetch billing data with debounce
  const fetchBillingData = useCallback(async () => {
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new timeout for debouncing
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: rowsPerPage.toString(),
          ...(searchTerm && { search: searchTerm }),
          ...(startDate && { startDate: startDate.toISOString() }),
          ...(endDate && { endDate: endDate.toISOString() })
        })

        const response = await fetch(`${SERVERURL}billing?${params}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error(t('billing.errors.fetchFailed'))
        }

        const data = await response.json()
        console.log('Billing data received:', data) // Debug log
        setBillingData(data.transactions || [])
        setTotalPages(data.totalPages || 1)
        setSummaryData({
          totalPages: data.summary?.totalPages || 0,
          pagesByType: data.summary?.pagesByType || {},
          transactionCount: data.summary?.transactionCount || 0
        })
        setCurrentPage(data.pagination?.currentPage || 1)
        setTotalPages(data.pagination?.totalPages || 1)
        setRowsPerPage(data.pagination?.limit || 50)
      } catch (error) {
        console.error('Error fetching billing data:', error)
        toast.error(t('billing.errorFetchingData'))
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce delay
  }, [currentPage, rowsPerPage, searchTerm, startDate, endDate, t])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Fetch data on mount and when filters change
  React.useEffect(() => {
    fetchBillingData()
  }, [fetchBillingData])

  // Fetch chart data on mount
  React.useEffect(() => {
    fetchAllTransactionsForChart()
  }, [fetchAllTransactionsForChart])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, startDate, endDate])

  // Handle CSV export
  const handleExportCSV = async () => {
    // Track export initiated
    trackAmplitudeEvent(AMPLITUDE_EVENTS.REPORT_EXPORTED, {
      report_type: 'billing_transactions',
      export_format: 'csv',
      date_range: startDate && endDate ? 'custom' : 'all_time'
    });
    
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() })
      })
      const response = await fetch(`${SERVERURL}billing/export?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(t('billing.errors.exportFailed'))
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `billing_${tenantName}_${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(t('billing.exportSuccess'))
    } catch (error) {
      console.error('Error exporting billing data:', error)
      
      // Track export error
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
        error_type: 'billing_export_failed',
        error_code: 'EXPORT_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_source: 'BillingPage',
        page_name: 'Analytics',
        action_attempted: 'export_billing_csv'
      });
      
      toast.error(t('billing.exportError'))
    }
  }

  return (
    <SidebarProvider 
      open={sidebarOpen} 
      onOpenChange={setSidebarOpen}
      defaultOpen={true}
    >
      <SidebarLeft />
      <SidebarInset style={{ border: 'none' }} className="flex flex-col h-screen">
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background z-20">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger data-testid="billingPage.sidebarTrigger" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-lg font-medium text-gray-700" data-testid="billingPage.breadcrumb">
                    {t("nav.analytics")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col overflow-hidden p-6">
          <Tabs 
            defaultValue="metrics" 
            value={activeTab}
            onValueChange={(value) => {
              // Track tab switch
              trackAmplitudeEvent(AMPLITUDE_EVENTS.TAB_SWITCHED, {
                from_tab: activeTab,
                to_tab: value,
                tab_group: 'analytics_tabs',
                page_name: 'Analytics'
              });
              
              setActiveTab(value)
              
              // Track specific tab views
              if (value === 'metrics') {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.BILLING_METRICS_VIEWED, {
                  time_period: selectedMonth === 'current' ? 'all_time' : selectedMonth,
                  total_pages: summaryData.totalPages
                })
              } else if (value === 'transactions') {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.BILLING_TRANSACTIONS_VIEWED, {
                  month_selected: selectedMonth === 'current' ? 'all_time' : selectedMonth,
                  transaction_count: summaryData.transactionCount
                })
              } else if (value === 'roi') {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.BILLING_ROI_VIEWED, {
                  month_selected: selectedMonth === 'current' ? monthOptions[0]?.value || 'current' : selectedMonth,
                  roi_percentage: 0, // Will be calculated in ROIPage
                  savings_amount: 0
                })
              }
              
              // When switching to ROI tab, if "current" (All Time) is selected, switch to the most recent month
              if (value === "roi" && selectedMonth === "current" && monthOptions.length > 0) {
                setSelectedMonth(monthOptions[0].value)
              }
            }}
            className="w-full flex flex-col h-full"
          >
            <TabsList className="grid w-full grid-cols-3 max-w-[660px]" data-testid="billingPage.tabsList">
              <TabsTrigger value="metrics" data-testid="billingPage.metricsTab">{t("billing.tabs.pageMetrics")}</TabsTrigger>
              <TabsTrigger value="transactions" data-testid="billingPage.transactionsTab">{t("billing.tabs.transactions")}</TabsTrigger>
              <TabsTrigger value="roi" data-testid="billingPage.roiTab">{t("billing.tabs.roiAnalytics")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="mt-6 flex flex-col flex-1 min-h-0">
              {/* Month Selector */}
              {availableMonths.length > 0 && (
                <div className="mb-6">
                  <Select 
                    value={selectedMonth} 
                    onValueChange={(value) => {
                      // Track month filter change
                      trackAmplitudeEvent(AMPLITUDE_EVENTS.FILTER_APPLIED, {
                        filter_type: 'month_selection',
                        filter_value: value,
                        previous_value: selectedMonth,
                        page_name: 'Analytics',
                        tab_name: activeTab
                      });
                      setSelectedMonth(value);
                    }}
                    data-testid="billingPage.monthSelectTransactions"
                  >
                    <SelectTrigger className="w-[180px]" data-testid="billingPage.monthSelectTransactionsTrigger">
                      <SelectValue placeholder={t("billing.selectMonth")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">{t("billing.allTime")}</SelectItem>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t("billing.searchPlaceholder")}
                  className="w-full bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    if (e.target.value.length > 2 || e.target.value.length === 0) {
                      trackAmplitudeEvent(AMPLITUDE_EVENTS.SEARCH_PERFORMED, {
                        search_query: e.target.value,
                        search_type: 'documents',
                        results_count: 0, // Will be updated when results come back
                        page_name: 'Analytics'
                      })
                    }
                  }}
                  data-testid="billingPage.searchInput"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{t("billing.startDate")}</span>
                  <DatePicker
                    date={startDate}
                    onDateChange={(date) => {
                      trackAmplitudeEvent(AMPLITUDE_EVENTS.FILTER_APPLIED, {
                        filter_type: 'start_date',
                        filter_value: date?.toISOString() || 'cleared',
                        previous_value: startDate?.toISOString() || 'none',
                        page_name: 'Analytics',
                        tab_name: 'transactions'
                      })
                      setStartDate(date)
                    }}
                    placeholder={t("billing.selectStartDate")}
                    data-testid="billingPage.startDatePicker"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{t("billing.endDate")}</span>
                  <DatePicker
                    date={endDate}
                    onDateChange={(date) => {
                      trackAmplitudeEvent(AMPLITUDE_EVENTS.FILTER_APPLIED, {
                        filter_type: 'end_date',
                        filter_value: date?.toISOString() || 'cleared',
                        previous_value: endDate?.toISOString() || 'none',
                        page_name: 'Analytics',
                        tab_name: 'transactions'
                      })
                      setEndDate(date)
                    }}
                    placeholder={t("billing.selectEndDate")}
                    data-testid="billingPage.endDatePicker"
                  />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleExportCSV}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="billingPage.exportButton"
            >
              <Download className="h-4 w-4" />
              {t("billing.exportCSV")}
            </Button>
          </div>

          {/* Billing Table */}
          <div className="flex-1 overflow-hidden">
            <BillingTable
              data={billingData}
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              setCurrentPage={setCurrentPage}
              setRowsPerPage={setRowsPerPage}
              pageTypeIcons={PageTypeIcons}
            />
          </div>
            </TabsContent>
            
            <TabsContent value="metrics" className="mt-6 overflow-auto">
              {/* Month Selector */}
              {availableMonths.length > 0 && (
                <div className="mb-6">
                  <Select 
                    value={selectedMonth} 
                    onValueChange={(value) => {
                      // Track month filter change
                      trackAmplitudeEvent(AMPLITUDE_EVENTS.FILTER_APPLIED, {
                        filter_type: 'month_selection',
                        filter_value: value,
                        previous_value: selectedMonth,
                        page_name: 'Analytics',
                        tab_name: activeTab
                      });
                      setSelectedMonth(value);
                    }}
                    data-testid="billingPage.monthSelectMetrics"
                  >
                    <SelectTrigger className="w-[180px]" data-testid="billingPage.monthSelectMetricsTrigger">
                      <SelectValue placeholder={t("billing.selectMonth")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">{t("billing.allTime")}</SelectItem>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card data-testid="billingPage.totalPagesCard">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("billing.totalPages")}
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryData.totalPages.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedMonth === "current" ? t("billing.allTime") : monthOptions.find(opt => opt.value === selectedMonth)?.label || ""}
                    </p>
                  </CardContent>
                </Card>
                
                <Card data-testid="billingPage.documentPagesCard">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("billing.documentPages")}
                    </CardTitle>
                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(
                        (summaryData.pagesByType[PageCountType.PRE_APPROVAL] || 0) +
                        (summaryData.pagesByType[PageCountType.EXECUTION] || 0) +
                        (summaryData.pagesByType[PageCountType.POST_APPROVAL] || 0) +
                        (summaryData.pagesByType[PageCountType.CLOSED] || 0) +
                        (summaryData.pagesByType[PageCountType.CONTROLLED_COPY] || 0) +
                        (summaryData.pagesByType[PageCountType.FINAL_PDF] || 0)
                      ).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("billing.mainDocumentPages")}
                    </p>
                  </CardContent>
                </Card>
                
                <Card data-testid="billingPage.attachmentPagesCard">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("billing.attachmentPages")}
                    </CardTitle>
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(
                        (summaryData.pagesByType[PageCountType.ATTACHMENT_IMAGE] || 0) +
                        (summaryData.pagesByType[PageCountType.ATTACHMENT_PDF] || 0) +
                        (summaryData.pagesByType[PageCountType.ATTACHMENT_VIDEO] || 0)
                      ).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("billing.attachmentsTotal")}
                    </p>
                  </CardContent>
                </Card>
                
                <Card data-testid="billingPage.auditTrailPagesCard">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("billing.auditTrailPages")}
                    </CardTitle>
                    <ClipboardPen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(summaryData.pagesByType[PageCountType.AUDIT_TRAIL] || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("billing.generatedPages")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Billing Chart */}
              <div className="mb-6" data-testid="billingPage.chartContainer">
                <BillingChart 
                  transactions={allTransactions} 
                  isLoading={isLoading} 
                  data-testid="billingPage.billingChart"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="roi" className="mt-6 overflow-auto">
              <ROIPage 
                summaryData={summaryData} 
                selectedMonth={selectedMonth}
                monthOptions={monthOptions}
                availableMonths={availableMonths}
                onMonthChange={setSelectedMonth}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}