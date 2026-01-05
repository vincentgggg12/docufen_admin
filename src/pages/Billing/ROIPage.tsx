"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { useTranslation } from "react-i18next"
import { useUserStore } from "@/lib/stateManagement"
import { useShallow } from "zustand/shallow"
import { SERVERURL } from "@/lib/server"
import { toast } from "sonner"
import { Info } from "lucide-react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "../../components/ui/chart"
import type { ChartConfig } from "../../components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/ui/tooltip"
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude"
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events"

interface ROIPageProps {
  summaryData: {
    totalPages: number
    pagesByType: Record<string, number>
    transactionCount: number
  }
  selectedMonth: string
  monthOptions: { value: string; label: string }[]
  availableMonths: string[]
  onMonthChange: (value: string) => void
}

export default function ROIPage({ summaryData, selectedMonth, monthOptions, availableMonths, onMonthChange }: ROIPageProps) {
  const { t, i18n } = useTranslation()
  const { tenantName } = useUserStore(useShallow((state) => ({
    tenantName: state.tenantName
  })))
  
  // Define European language codes
  const EUROPEAN_LANGUAGE_CODES = ['es', 'pl', 'pl-PL'];
  
  // Currency conversion state
  const [exchangeRate, setExchangeRate] = React.useState<number>(0.86) // Default fallback rate (approx ECB rate)

  const [, setIsLoadingRate] = React.useState(false)
  const isEuropean = EUROPEAN_LANGUAGE_CODES.some(code => 
    i18n.language.startsWith(code.split('-')[0])
  )
  const currencySymbol = isEuropean ? '€' : '$'
  
  // Convert USD to EUR if European
  const convertCurrency = (usdAmount: number): number => {
    return isEuropean ? usdAmount * exchangeRate : usdAmount
  }
  
  // Format currency with proper locale
  const formatCurrency = (amount: number): string => {
    if (isEuropean) {
      // Use appropriate locale based on language
      const locale = i18n.language.startsWith('pl') ? 'pl-PL' : 
                     i18n.language.startsWith('es') ? 'es-ES' : 
                     'en-GB'; // Default European English locale
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: amount < 10 ? 2 : 0,
        maximumFractionDigits: amount < 10 ? 2 : 0
      }).format(amount)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: amount < 10 ? 2 : 0,
      maximumFractionDigits: amount < 10 ? 2 : 0
    }).format(amount)
  }

  // State for cost analysis
  const [paperCostPerPage, setPaperCostPerPage] = React.useState<string>("")
  const [investmentCost, setInvestmentCost] = React.useState<string>("")
  const [estimatedMonthlyPages, setEstimatedMonthlyPages] = React.useState<string>("")
  const [showCostModal, setShowCostModal] = React.useState(false)
  const [showInvestmentModal, setShowInvestmentModal] = React.useState(false)
  const [showEstimatedPagesModal, setShowEstimatedPagesModal] = React.useState(false)
  const [tempPaperCost, setTempPaperCost] = React.useState<string>("")
  const [tempInvestmentCost, setTempInvestmentCost] = React.useState<string>("")
  const [tempEstimatedPages, setTempEstimatedPages] = React.useState<string>("")

  // Docufen pricing tiers (in USD)
  const TIERS_USD: { limit: number; price: number }[] = [
    { limit: 1_000, price: 0.79 },
    { limit: 5_000, price: 0.59 },
    { limit: 10_000, price: 0.45 },
    { limit: 20_000, price: 0.35 },
    { limit: Infinity, price: 0.29 },
  ]
  
  // Get tiers in current currency
  const TIERS = TIERS_USD.map(tier => ({
    limit: tier.limit,
    price: convertCurrency(tier.price)
  }))

  // Calculate total cost for the given number of pages using tiered pricing
  const calculateTotalCost = (pages: number): number => {
    let remaining = pages
    let previous = 0
    let cost = 0

    for (const { limit, price } of TIERS) {
      const tierQty = Math.min(remaining, limit - previous)
      cost += tierQty * price
      remaining -= tierQty
      previous = limit
      if (!remaining) break
    }
    return cost
  }

  // Calculate average cost per page
  const calculateDigitalCostPerPage = (totalPages: number): number => {
    return totalPages ? calculateTotalCost(totalPages) / totalPages : 0
  }

  // Calculate savings and ROI
  const paperCost = parseFloat(paperCostPerPage) || 0
  const digitalCost = calculateDigitalCostPerPage(summaryData.totalPages)
  const savingsPerPage = paperCost - digitalCost
  const roi = digitalCost > 0 ? ((savingsPerPage / digitalCost) * 100) : 0
  const investment = parseFloat(investmentCost) || 0
  
  // Use estimated pages if provided, otherwise null (no default)
  const estimatedPages = parseFloat(estimatedMonthlyPages) || 0
  const estimatedDigitalCost = estimatedPages > 0 ? calculateDigitalCostPerPage(estimatedPages) : 0
  const estimatedSavingsPerPage = estimatedPages > 0 ? paperCost - estimatedDigitalCost : 0

  // Calculate monthly savings based on estimated pages
  const monthlySavings = estimatedSavingsPerPage * estimatedPages

  // Calculate time to break even in months
  const monthsToBreakEven = investment > 0 && monthlySavings > 0 ? investment / monthlySavings : 0
  const yearsToBreakEven = monthsToBreakEven / 12

  // Generate break-even chart data
  const generateBreakEvenData = () => {
    const data = []
    const maxMonths = Math.min(Math.ceil(monthsToBreakEven * 1.5), 60) // Show up to 5 years or 1.5x break-even
    
    for (let month = 0; month <= maxMonths; month++) {
      const cumulativeSavings = monthlySavings * month
      const netPosition = cumulativeSavings - investment
      
      data.push({
        month,
        cumulativeSavings: Math.round(cumulativeSavings),
        investment: investment,
        netPosition: Math.round(netPosition),
        label: month === 0 ? t("billing.costAnalysis.start") : month % 12 === 0 ? t("billing.costAnalysis.yearFormat", { year: month / 12 }) : t("billing.costAnalysis.monthFormat", { month })
      })
    }
    
    return data
  }

  const breakEvenData = generateBreakEvenData()

  // Track ROI calculation viewed when all values are present
  React.useEffect(() => {
    if (paperCost > 0 && investment > 0 && estimatedPages > 0) {
      trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_CALCULATION_VIEWED, {
        paper_cost_per_page: paperCost,
        investment_cost: investment,
        estimated_monthly_pages: estimatedPages,
        monthly_savings: monthlySavings,
        break_even_months: Math.ceil(monthsToBreakEven),
        three_year_roi: investment > 0 ? ((monthlySavings * 36 - investment) / investment * 100) : 0,
        currency: isEuropean ? 'EUR' : 'USD'
      })
    }
  }, [paperCost, investment, estimatedPages, monthlySavings, monthsToBreakEven, isEuropean])

  const chartConfig = {
    cumulativeSavings: {
      label: t("billing.costAnalysis.cumulativeSavings"),
      color: "#10b981", // Green
    },
    investment: {
      label: t("billing.costAnalysis.investmentCostChartLabel"),
      color: "#ef4444", // Red
    },
    netPosition: {
      label: t("billing.costAnalysis.netPositionChartLabel"),
      color: "#9C27B0", // Purple (Post-Approval color)
    },
  } satisfies ChartConfig

  // Fetch exchange rate for European users
  // Using frankfurter.app - free API based on ECB rates (no API key required)
  const EXCHANGE_RATE_KEY = "xrk-eur"
  React.useEffect(() => {
    if (isEuropean) {
      setIsLoadingRate(true)
      const cachedRate = sessionStorage.getItem(EXCHANGE_RATE_KEY)
      if (cachedRate) {
        const parsed = parseFloat(cachedRate)
        if (!isNaN(parsed)) {
          setExchangeRate(parsed)
          return
        }
      }
      fetch('https://api.frankfurter.app/latest?from=USD&to=EUR')
        .then(res => res.json())
        .then(data => {
          if (data.rates && data.rates.EUR) {
            setExchangeRate(data.rates.EUR)
            sessionStorage.setItem(EXCHANGE_RATE_KEY, data.rates.EUR)
          }
        })
        .catch(err => {
          console.error('Failed to fetch exchange rate:', err)
          // Keep default rate
        })
        .finally(() => setIsLoadingRate(false))
    }
  }, [isEuropean])
  
  // Fetch paper cost and investment cost on mount
  React.useEffect(() => {
    const fetchCosts = async () => {
      if (!tenantName) return
      
      try {
        const response = await fetch(`${SERVERURL}account/${tenantName}/costs`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.paperCostPerPage) {
            setPaperCostPerPage(data.paperCostPerPage.toString())
          }
          if (data.investmentCost) {
            setInvestmentCost(data.investmentCost.toString())
          }
          if (data.estimatedMonthlyPages) {
            setEstimatedMonthlyPages(data.estimatedMonthlyPages.toString())
          }
        }
      } catch (error) {
        console.error('Error fetching costs:', error)
      }
    }
    
    fetchCosts()
  }, [tenantName])

  // Save costs to backend
  const saveCosts = async (type: 'paper' | 'investment' | 'estimatedPages', value: string) => {
    if (!tenantName) return
    
    const numericValue = parseFloat(value)
    if (isNaN(numericValue) || numericValue < 0) {
      if (type === 'estimatedPages') {
        toast.error(t('billing.invalidEstimatedPages'))
      } else {
        toast.error(t(`billing.invalid${type === 'paper' ? 'Paper' : 'Investment'}Cost`))
      }
      return
    }
    
    try {
      const bodyData: any = {}
      if (type === 'paper') {
        bodyData.paperCostPerPage = numericValue
      } else if (type === 'investment') {
        bodyData.investmentCost = numericValue
      } else if (type === 'estimatedPages') {
        bodyData.estimatedMonthlyPages = Math.round(numericValue)
      }
      
      const response = await fetch(`${SERVERURL}account/${tenantName}/costs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(bodyData)
      })
      
      if (response.ok) {
        // Track the update event
        if (type === 'paper') {
          trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_PAPER_COST_UPDATED, {
            paper_cost_per_page: numericValue,
            currency: isEuropean ? 'EUR' : 'USD'
          })
        } else if (type === 'investment') {
          trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_INVESTMENT_COST_UPDATED, {
            investment_cost: numericValue,
            currency: isEuropean ? 'EUR' : 'USD'
          })
        } else if (type === 'estimatedPages') {
          trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_ESTIMATED_PAGES_UPDATED, {
            estimated_monthly_pages: Math.round(numericValue),
            previous_value: parseFloat(estimatedMonthlyPages) || undefined
          })
        }
        
        if (type === 'estimatedPages') {
          toast.success(t('billing.estimatedPagesSaved'))
        } else {
          toast.success(t(`billing.${type}CostSaved`))
        }
      } else {
        throw new Error(`Failed to save ${type}`)
      }
    } catch (error) {
      console.error(`Error saving ${type}:`, error)
      if (type === 'estimatedPages') {
        toast.error(t('billing.errorSavingEstimatedPages'))
      } else {
        toast.error(t(`billing.errorSaving${type === 'paper' ? 'Paper' : 'Investment'}Cost`))
      }
    }
  }

  // Get the selected month label for display
  const getSelectedMonthLabel = () => {
    if (selectedMonth === "current") {
      // For current month, return the current month name
      const currentDate = new Date()
      return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }
    return monthOptions.find(opt => opt.value === selectedMonth)?.label || ""
  }

  return (
    <>
      {/* Month Selector - Filter out "All Time" option for ROI */}
      {availableMonths.length > 0 && (
        <div className="mb-6 flex items-center gap-4">
          <Select 
            value={selectedMonth === "current" ? monthOptions[0]?.value || selectedMonth : selectedMonth} 
            onValueChange={(value) => {
              // Don't allow "current" (All Time) selection in ROI tab
              if (value !== "current") {
                onMonthChange(value)
              }
            }}
            data-testid="roiPage.monthSelect"
          >
            <SelectTrigger className="w-[180px]" data-testid="roiPage.monthSelectTrigger">
              <SelectValue placeholder={t("billing.selectMonth")} />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isEuropean && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
              <Info className="h-3.5 w-3.5" />
              <span>{t("billing.costAnalysis.pricesInEUR", { rate: exchangeRate.toFixed(2) })}</span>
            </div>
          )}
        </div>
      )}

      {/* Cost Analysis Cards - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card data-testid="roiPage.oldPaperCostCard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {t("billing.costAnalysis.oldPaperCost")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t("billing.costAnalysis.oldPaperCostTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">
                {t("billing.costAnalysis.yourCostPerPage")}
              </p>
              <div className="text-2xl font-bold text-black">
                {formatCurrency(paperCost)}
              </div>
            </div>
            <div className="pt-3 border-t space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("billing.costAnalysis.setRealTimeROI")}
              </p>
              <Button 
                variant={paperCost > 0 ? "outline" : "default"} 
                className={paperCost > 0 ? "w-full" : "w-full bg-primary hover:bg-primary/90"}
                size="sm"
                onClick={() => {
                  setTempPaperCost(paperCostPerPage)
                  setShowCostModal(true)
                  trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_MODAL_OPENED, {
                    modal_type: 'paper_cost',
                    trigger_source: paperCost > 0 ? 'edit_button' : 'enter_button'
                  })
                }}
                data-testid="roiPage.editPaperCostButton"
              >
                {paperCost > 0 ? t("billing.costAnalysis.editEstimate") : t("billing.costAnalysis.enterEstimate")}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="roiPage.investmentCostCard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {t("billing.costAnalysis.investmentCost")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t("billing.costAnalysis.investmentCostTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">
                {t("billing.costAnalysis.implementationCost")}
              </p>
              <div className="text-2xl font-bold text-black">
                {formatCurrency(investment)}
              </div>
            </div>
            <div className="pt-3 border-t space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("billing.costAnalysis.enterImplementationCosts")}
              </p>
              <Button 
                variant={investment > 0 ? "outline" : "default"} 
                className={investment > 0 ? "w-full" : "w-full bg-primary hover:bg-primary/90"}
                size="sm"
                onClick={() => {
                  setTempInvestmentCost(investmentCost)
                  setShowInvestmentModal(true)
                  trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_MODAL_OPENED, {
                    modal_type: 'investment_cost',
                    trigger_source: investment > 0 ? 'edit_button' : 'enter_button'
                  })
                }}
                data-testid="roiPage.editInvestmentCostButton"
              >
                {investment > 0 ? t("billing.costAnalysis.editInvestment") : t("billing.costAnalysis.enterInvestment")}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="roiPage.timeToBreakEvenCard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {t("billing.costAnalysis.timeToBreakEven")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t("billing.costAnalysis.timeToBreakEvenTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">
                {estimatedMonthlyPages ? t("billing.costAnalysis.basedOnEstimatedUsage") : t("billing.costAnalysis.enterEstimatedUsage")}
              </p>
              <div className={`text-2xl font-bold ${estimatedPages > 0 && yearsToBreakEven > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                {estimatedPages > 0 && yearsToBreakEven > 0 ? 
                  (yearsToBreakEven < 1 ? 
                    t("billing.costAnalysis.monthsFormat", { count: Math.ceil(monthsToBreakEven) }) : 
                    t("billing.costAnalysis.yearsFormat", { count: parseFloat(yearsToBreakEven.toFixed(1)) }))
                  : '--'}
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("billing.costAnalysis.pagesPerMonth")}</span>
                <span className="font-medium">{estimatedPages > 0 ? estimatedPages.toLocaleString() : '--'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("billing.costAnalysis.monthlySavings")}</span>
                <span className="font-medium">{estimatedPages > 0 ? formatCurrency(monthlySavings) : '--'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("billing.costAnalysis.investment")}</span>
                <span className="font-medium">{formatCurrency(investment)}</span>
              </div>
            </div>
            <div className="pt-3 border-t">
              <Button 
                variant={estimatedMonthlyPages ? "outline" : "default"}
                className={estimatedMonthlyPages ? "w-full" : "w-full bg-primary hover:bg-primary/90"}
                size="sm"
                onClick={() => {
                  setTempEstimatedPages(estimatedMonthlyPages || "")
                  setShowEstimatedPagesModal(true)
                  trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_MODAL_OPENED, {
                    modal_type: 'estimated_pages',
                    trigger_source: estimatedMonthlyPages ? 'edit_button' : 'enter_button'
                  })
                }}
                data-testid="roiPage.editEstimatedPagesButton"
              >
                {estimatedMonthlyPages ? t("billing.costAnalysis.editEstimatedUsage") : t("billing.costAnalysis.enterEstimatedUsage")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analysis Cards - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card data-testid="roiPage.newDigitalCostCard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {t("billing.costAnalysis.newDigitalCost")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t("billing.costAnalysis.newDigitalCostTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">
                {t("billing.costAnalysis.basedOnPagesInMonth", { pages: summaryData.totalPages.toLocaleString(), month: getSelectedMonthLabel() })}
              </p>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(digitalCost)}
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t">
              {/* Show current usage if below 1k */}
              {summaryData.totalPages > 0 && summaryData.totalPages < 1000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {t("billing.costAnalysis.pagesChip", { count: summaryData.totalPages })}:
                  </div>
                  <span className="font-medium text-green-600">{formatCurrency(digitalCost)}</span>
                </div>
              )}
              
              {/* Tier 1k */}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">{t("billing.costAnalysis.oneKPages")}</span>
                <span className="font-medium">{formatCurrency(TIERS[0].price)}</span>
              </div>
              
              {/* Show current usage if between 1k-5k (inclusive of 1k) */}
              {summaryData.totalPages >= 1000 && summaryData.totalPages < 5000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {(summaryData.totalPages / 1000).toFixed(1)}k {t("billing.costAnalysis.pagesLabel")}:
                  </div>
                  <span className="font-medium text-green-600">{formatCurrency(digitalCost)}</span>
                </div>
              )}
              
              {/* Tier 5k */}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">{t("billing.costAnalysis.fiveKPages")}</span>
                <span className="font-medium">{formatCurrency(calculateDigitalCostPerPage(5000))}</span>
              </div>
              
              {/* Show current usage if between 5k-10k (inclusive of 5k) */}
              {summaryData.totalPages >= 5000 && summaryData.totalPages < 10000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {(summaryData.totalPages / 1000).toFixed(1)}k {t("billing.costAnalysis.pagesLabel")}:
                  </div>
                  <span className="font-medium text-green-600">{formatCurrency(digitalCost)}</span>
                </div>
              )}
              
              {/* Tier 10k */}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">{t("billing.costAnalysis.tenKPages")}</span>
                <span className="font-medium">{formatCurrency(calculateDigitalCostPerPage(10000))}</span>
              </div>
              
              {/* Show current usage if between 10k-20k (inclusive of 10k) */}
              {summaryData.totalPages >= 10000 && summaryData.totalPages < 20000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {(summaryData.totalPages / 1000).toFixed(1)}k {t("billing.costAnalysis.pagesLabel")}:
                  </div>
                  <span className="font-medium text-green-600">{formatCurrency(digitalCost)}</span>
                </div>
              )}
              
              {/* Tier 20k */}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">{t("billing.costAnalysis.twentyKPages")}</span>
                <span className="font-medium">{formatCurrency(calculateDigitalCostPerPage(20000))}</span>
              </div>
              
              {/* Show current usage if between 20k-30k (inclusive of 20k) */}
              {summaryData.totalPages >= 20000 && summaryData.totalPages < 30000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {(summaryData.totalPages / 1000).toFixed(1)}k {t("billing.costAnalysis.pagesLabel")}:
                  </div>
                  <span className="font-medium text-green-600">{formatCurrency(digitalCost)}</span>
                </div>
              )}
              
              {/* Tier 30k */}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">{t("billing.costAnalysis.thirtyKPages")}</span>
                <span className="font-medium">{formatCurrency(calculateDigitalCostPerPage(30000))}</span>
              </div>
              
              {/* Show current usage if 30k or above (inclusive of 30k) */}
              {summaryData.totalPages >= 30000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {(summaryData.totalPages / 1000).toFixed(1)}k {t("billing.costAnalysis.pagesLabel")}:
                  </div>
                  <span className="font-medium text-green-600">{formatCurrency(digitalCost)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="roiPage.savingsPercentageCard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {t("billing.costAnalysis.savingsPercentage")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t("billing.costAnalysis.savingsPercentageTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">
                {t("billing.costAnalysis.yourCurrentSavings")}
              </p>
              <div className={`text-2xl font-bold ${roi > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {roi.toFixed(1)}%
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t">
              {/* Show current usage if below 1k */}
              {summaryData.totalPages > 0 && summaryData.totalPages < 1000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {t("billing.costAnalysis.pagesChip", { count: summaryData.totalPages })}:
                  </div>
                  <span className="font-medium text-green-600">{roi.toFixed(0)}%</span>
                </div>
              )}
              
              {/* Tier 1k */}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">{t("billing.costAnalysis.oneKPages")}</span>
                <span className={`font-medium ${paperCost > 0.79 ? 'text-green-600' : ''}`}>
                  {paperCost > 0 && 0.79 > 0 ? (((paperCost - 0.79) / 0.79) * 100).toFixed(0) : '0'}%
                </span>
              </div>
              
              {/* Show current usage if between 1k-5k (inclusive of 1k) */}
              {summaryData.totalPages >= 1000 && summaryData.totalPages < 5000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {(summaryData.totalPages / 1000).toFixed(1)}k {t("billing.costAnalysis.pagesLabel")}:
                  </div>
                  <span className="font-medium text-green-600">{roi.toFixed(0)}%</span>
                </div>
              )}
              
              {/* Tier 5k */}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">{t("billing.costAnalysis.fiveKPages")}</span>
                <span className={`font-medium ${paperCost > calculateDigitalCostPerPage(5000) ? 'text-green-600' : ''}`}>
                  {(() => {
                    const avgCost = calculateDigitalCostPerPage(5000)
                    return paperCost > 0 && avgCost > 0 ? (((paperCost - avgCost) / avgCost) * 100).toFixed(0) : '0'
                  })()}%
                </span>
              </div>
              
              {/* Show current usage if between 5k-10k (inclusive of 5k) */}
              {summaryData.totalPages >= 5000 && summaryData.totalPages < 10000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {(summaryData.totalPages / 1000).toFixed(1)}k {t("billing.costAnalysis.pagesLabel")}:
                  </div>
                  <span className="font-medium text-green-600">{roi.toFixed(0)}%</span>
                </div>
              )}
              
              {/* Tier 10k */}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">{t("billing.costAnalysis.tenKPages")}</span>
                <span className={`font-medium ${paperCost > calculateDigitalCostPerPage(10000) ? 'text-green-600' : ''}`}>
                  {(() => {
                    const avgCost = calculateDigitalCostPerPage(10000)
                    return paperCost > 0 && avgCost > 0 ? (((paperCost - avgCost) / avgCost) * 100).toFixed(0) : '0'
                  })()}%
                </span>
              </div>
              
              {/* Show current usage if between 10k-20k (inclusive of 10k) */}
              {summaryData.totalPages >= 10000 && summaryData.totalPages < 20000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {(summaryData.totalPages / 1000).toFixed(1)}k {t("billing.costAnalysis.pagesLabel")}:
                  </div>
                  <span className="font-medium text-green-600">{roi.toFixed(0)}%</span>
                </div>
              )}
              
              {/* Tier 20k */}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">{t("billing.costAnalysis.twentyKPages")}</span>
                <span className={`font-medium ${paperCost > calculateDigitalCostPerPage(20000) ? 'text-green-600' : ''}`}>
                  {(() => {
                    const avgCost = calculateDigitalCostPerPage(20000)
                    return paperCost > 0 && avgCost > 0 ? (((paperCost - avgCost) / avgCost) * 100).toFixed(0) : '0'
                  })()}%
                </span>
              </div>
              
              {/* Show current usage if between 20k-30k (inclusive of 20k) */}
              {summaryData.totalPages >= 20000 && summaryData.totalPages < 30000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {(summaryData.totalPages / 1000).toFixed(1)}k {t("billing.costAnalysis.pagesLabel")}:
                  </div>
                  <span className="font-medium text-green-600">{roi.toFixed(0)}%</span>
                </div>
              )}
              
              {/* Tier 30k */}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">{t("billing.costAnalysis.thirtyKPages")}</span>
                <span className={`font-medium ${paperCost > calculateDigitalCostPerPage(30000) ? 'text-green-600' : ''}`}>
                  {(() => {
                    const avgCost = calculateDigitalCostPerPage(30000)
                    return paperCost > 0 && avgCost > 0 ? (((paperCost - avgCost) / avgCost) * 100).toFixed(0) : '0'
                  })()}%
                </span>
              </div>
              
              {/* Show current usage if 30k or above (inclusive of 30k) */}
              {summaryData.totalPages >= 30000 && (
                <div className="flex justify-between text-xs items-center">
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {(summaryData.totalPages / 1000).toFixed(1)}k {t("billing.costAnalysis.pagesLabel")}:
                  </div>
                  <span className="font-medium text-green-600">{roi.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="roiPage.threeYearROICard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {t("billing.costAnalysis.threeYearROI")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t("billing.costAnalysis.threeYearROITooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">
                {t("billing.costAnalysis.returnOnInvestment")}
              </p>
              <div className={`text-2xl font-bold ${investment > 0 && monthlySavings > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {investment > 0 && estimatedPages > 0 ? (((monthlySavings * 36 - investment) / investment) * 100).toFixed(0) : '0'}%
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("billing.costAnalysis.totalInvestment")}</span>
                <span className="font-medium">{formatCurrency(investment)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("billing.costAnalysis.threeYearSavings")}</span>
                <span className="font-medium">{estimatedPages > 0 ? formatCurrency(monthlySavings * 36) : '--'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("billing.costAnalysis.netReturn")}</span>
                <span className={`font-medium ${estimatedPages > 0 && (monthlySavings * 36 - investment) > 0 ? 'text-green-600' : estimatedPages > 0 ? 'text-red-600' : ''}`}>
                  {estimatedPages > 0 ? formatCurrency((monthlySavings * 36) - investment) : '--'}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {t("billing.costAnalysis.roiFormula")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Break-Even Analysis Chart */}
      {investment > 0 && monthlySavings > 0 && estimatedPages > 0 && (
        <Card className="mb-6" data-testid="roiPage.breakEvenAnalysisCard">
          <CardHeader>
            <CardTitle>{t("billing.costAnalysis.breakEvenAnalysis")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={breakEvenData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => {
                          const amount = Number(value)
                          if (isEuropean) {
                            const locale = i18n.language.startsWith('pl') ? 'pl-PL' : 
                                         i18n.language.startsWith('es') ? 'es-ES' : 
                                         'en-GB';
                            return new Intl.NumberFormat(locale, {
                              style: 'currency',
                              currency: 'EUR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }).format(amount * exchangeRate)
                          }
                          return new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(amount)
                        }}
                      />
                    } 
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="investment" 
                    stroke="var(--color-investment)" 
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeSavings" 
                    stroke="var(--color-cumulativeSavings)" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netPosition" 
                    stroke="var(--color-netPosition)" 
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
            </ChartContainer>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span className="text-muted-foreground">{t("billing.costAnalysis.savingsAccumulateMonthly")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-600" style={{ borderTop: '2px dashed' }}></div>
                <span className="text-muted-foreground">{t("billing.costAnalysis.oneTimeInvestment")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-blue-600"></div>
                <span className="text-muted-foreground">{t("billing.costAnalysis.netPosition")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paper Cost Modal */}
      <Dialog open={showCostModal} onOpenChange={setShowCostModal}>
        <DialogContent className="sm:max-w-[425px]" data-testid="roiPage.paperCostModal">
          <DialogHeader>
            <DialogTitle>{t("billing.costAnalysis.calculateYourPaperCost")}</DialogTitle>
            <DialogDescription>
              {t("billing.costAnalysis.calculatePaperCostDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modal-paper-cost">{t("billing.costAnalysis.estimatedCostPerPaperPage")}</Label>
              <Input
                id="modal-paper-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={tempPaperCost}
                onChange={(e) => setTempPaperCost(e.target.value)}
                className="w-full"
                data-testid="roiPage.paperCostInput"
              />
              <p className="text-xs text-muted-foreground">
                {t("billing.costAnalysis.includeCostsHint")}
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="default"
              className="sm:mr-auto bg-black text-white hover:bg-black/90"
              onClick={() => {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_EXTERNAL_CALCULATOR_CLICKED, {
                  source: 'paper_cost_modal',
                  destination_url: 'https://www.docufen.com/#pricing'
                })
                window.open('https://www.docufen.com/#pricing', '_blank')
              }}
              data-testid="roiPage.calculateYourCostButton"
            >
              {t("billing.costAnalysis.calculateYourCostButton")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_MODAL_CLOSED, {
                  modal_type: 'paper_cost',
                  close_method: 'cancel',
                  value_changed: false
                })
                setTempPaperCost("")
                setShowCostModal(false)
              }}
              data-testid="roiPage.paperCostCancelButton"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={async () => {
                const hasChanged = tempPaperCost !== paperCostPerPage
                trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_MODAL_CLOSED, {
                  modal_type: 'paper_cost',
                  close_method: 'save',
                  value_changed: hasChanged
                })
                setPaperCostPerPage(tempPaperCost)
                setShowCostModal(false)
                await saveCosts('paper', tempPaperCost)
              }}
              data-testid="roiPage.paperCostApplyButton"
            >
              {t("common.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Investment Cost Modal */}
      <Dialog open={showInvestmentModal} onOpenChange={setShowInvestmentModal}>
        <DialogContent className="sm:max-w-[425px]" data-testid="roiPage.investmentCostModal">
          <DialogHeader>
            <DialogTitle>{t("billing.costAnalysis.enterImplementationInvestmentTitle")}</DialogTitle>
            <DialogDescription>
              {t("billing.costAnalysis.enterImplementationInvestmentDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modal-investment-cost">{t("billing.costAnalysis.totalImplementationInvestment")}</Label>
              <Input
                id="modal-investment-cost"
                type="number"
                step="100"
                min="0"
                placeholder="0"
                value={tempInvestmentCost}
                onChange={(e) => setTempInvestmentCost(e.target.value)}
                className="w-full"
                data-testid="roiPage.investmentCostInput"
              />
              <p className="text-xs text-muted-foreground">
                {t("billing.costAnalysis.includeInvestmentHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_MODAL_CLOSED, {
                  modal_type: 'investment_cost',
                  close_method: 'cancel',
                  value_changed: false
                })
                setTempInvestmentCost("")
                setShowInvestmentModal(false)
              }}
              data-testid="roiPage.investmentCostCancelButton"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={async () => {
                const hasChanged = tempInvestmentCost !== investmentCost
                trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_MODAL_CLOSED, {
                  modal_type: 'investment_cost',
                  close_method: 'save',
                  value_changed: hasChanged
                })
                setInvestmentCost(tempInvestmentCost)
                setShowInvestmentModal(false)
                await saveCosts('investment', tempInvestmentCost)
              }}
              data-testid="roiPage.investmentCostApplyButton"
            >
              {t("common.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Estimated Monthly Pages Modal */}
      <Dialog open={showEstimatedPagesModal} onOpenChange={setShowEstimatedPagesModal}>
        <DialogContent className="sm:max-w-[425px]" data-testid="roiPage.estimatedPagesModal">
          <DialogHeader>
            <DialogTitle>{t("billing.costAnalysis.enterEstimatedMonthlyUsageTitle")}</DialogTitle>
            <DialogDescription>
              {t("billing.costAnalysis.enterEstimatedMonthlyUsageDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modal-estimated-pages">{t("billing.costAnalysis.estimatedPagesPerMonth")}</Label>
              <Input
                id="modal-estimated-pages"
                type="number"
                step="100"
                min="0"
                placeholder={summaryData.totalPages.toString()}
                value={tempEstimatedPages}
                onChange={(e) => setTempEstimatedPages(e.target.value)}
                className="w-full"
                data-testid="roiPage.estimatedPagesInput"
              />
              <p className="text-xs text-muted-foreground">
                {t("billing.costAnalysis.currentUsageFormat", { pages: summaryData.totalPages.toLocaleString() })}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_MODAL_CLOSED, {
                  modal_type: 'estimated_pages',
                  close_method: 'cancel',
                  value_changed: false
                })
                setTempEstimatedPages("")
                setShowEstimatedPagesModal(false)
              }}
              data-testid="roiPage.estimatedPagesCancelButton"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={async () => {
                const hasChanged = tempEstimatedPages !== estimatedMonthlyPages
                trackAmplitudeEvent(AMPLITUDE_EVENTS.ROI_MODAL_CLOSED, {
                  modal_type: 'estimated_pages',
                  close_method: 'save',
                  value_changed: hasChanged
                })
                setEstimatedMonthlyPages(tempEstimatedPages)
                setShowEstimatedPagesModal(false)
                await saveCosts('estimatedPages', tempEstimatedPages)
              }}
              data-testid="roiPage.estimatedPagesApplyButton"
            >
              {t("common.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}