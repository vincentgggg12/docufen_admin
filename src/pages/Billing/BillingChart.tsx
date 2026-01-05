"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useTranslation } from "react-i18next"
import { trackAmplitudeEvent } from "@/lib/analytics/amplitude"
import { AMPLITUDE_EVENTS } from "@/lib/analytics/events"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { BillingTransaction, PageCountType } from "./types"

interface BillingChartProps {
  transactions: BillingTransaction[]
  isLoading: boolean
}

export function BillingChart({ transactions, isLoading }: BillingChartProps) {
  const { t } = useTranslation()
  
  const chartConfig = {
    pages: {
      label: t("billing.chart.pages"),
    },
    document: {
      label: t("billing.chart.documentPages"),
      color: "#22c55e", // Light green (Tailwind green-500)
    },
    attachment: {
      label: t("billing.chart.attachmentPages"), 
      color: "#0E7C3F", // Darkest green (Primary color)
    },
    auditTrail: {
      label: t("billing.chart.auditTrailPages"),
      color: "#16a34a", // Medium green (Tailwind green-600)
    },
  } satisfies ChartConfig
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Process transactions to create chart data
  const chartData = React.useMemo(() => {
    if (!transactions.length) return []

    // Group transactions by date
    const dataByDate = new Map<string, { document: number; attachment: number; auditTrail: number }>()

    transactions.forEach((transaction) => {
      const date = new Date(transaction.timestamp).toISOString().split('T')[0]
      
      if (!dataByDate.has(date)) {
        dataByDate.set(date, { document: 0, attachment: 0, auditTrail: 0 })
      }

      const dayData = dataByDate.get(date)!
      
      // Group page types into categories
      if ([PageCountType.PRE_APPROVAL, PageCountType.EXECUTION, PageCountType.POST_APPROVAL, PageCountType.CLOSED].includes(transaction.pageCountType)) {
        dayData.document += transaction.incrementalPageCount
      } else if ([PageCountType.ATTACHMENT_IMAGE, PageCountType.ATTACHMENT_PDF, PageCountType.ATTACHMENT_VIDEO].includes(transaction.pageCountType)) {
        dayData.attachment += transaction.incrementalPageCount
      } else if (transaction.pageCountType === PageCountType.AUDIT_TRAIL) {
        dayData.auditTrail += transaction.incrementalPageCount
      }
    })

    // Convert to array and sort by date
    return Array.from(dataByDate.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [transactions])

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    if (!chartData.length) return []

    const now = new Date()
    const cutoffDate = new Date()
    
    switch (timeRange) {
      case "7d":
        cutoffDate.setDate(now.getDate() - 7)
        break
      case "30d":
        cutoffDate.setDate(now.getDate() - 30)
        break
      case "90d":
        cutoffDate.setDate(now.getDate() - 90)
        break
    }

    return chartData.filter(item => new Date(item.date) >= cutoffDate)
  }, [chartData, timeRange])

  if (isLoading) {
    return (
      <Card className="@container/chart" data-testid="billingChart.loadingCard">
        <CardHeader>
          <CardTitle>{t("billing.usageOverTime")}</CardTitle>
          <CardDescription>{t("billing.pageCountByType")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <div className="text-muted-foreground">{t("common.loading")}</div>
        </CardContent>
      </Card>
    )
  }

  if (!filteredData || !filteredData.length) {
    return (
      <Card className="@container/chart" data-testid="billingChart.noDataCard">
        <CardHeader>
          <CardTitle>{t("billing.usageOverTime")}</CardTitle>
          <CardDescription>{t("billing.pageCountByType")}</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => {
              if (value) {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.BILLING_TIME_RANGE_CHANGED, {
                  from_range: timeRange,
                  to_range: value,
                  tab_name: 'metrics'
                })
                setTimeRange(value)
              }
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/chart:flex"
            data-testid="billingChart.timeRangeToggleGroup"
          >
            <ToggleGroupItem value="7d" data-testid="billingChart.timeRange7d">{t("billing.last7Days")}</ToggleGroupItem>
            <ToggleGroupItem value="30d" data-testid="billingChart.timeRange30d">{t("billing.last30Days")}</ToggleGroupItem>
            <ToggleGroupItem value="90d" data-testid="billingChart.timeRange90d">{t("billing.last90Days")}</ToggleGroupItem>
          </ToggleGroup>
          <Select 
            value={timeRange} 
            onValueChange={(value) => {
              trackAmplitudeEvent(AMPLITUDE_EVENTS.BILLING_TIME_RANGE_CHANGED, {
                from_range: timeRange,
                to_range: value,
                tab_name: 'metrics'
              })
              setTimeRange(value)
            }} 
            data-testid="billingChart.timeRangeSelect"
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/chart:hidden"
              size="sm"
              aria-label="Select time range"
              data-testid="billingChart.timeRangeSelectTrigger"
            >
              <SelectValue placeholder={t("billing.last30Days")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">
                {t("billing.last7Days")}
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                {t("billing.last30Days")}
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                {t("billing.last90Days")}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <div className="text-muted-foreground">{t("billing.noDataAvailable")}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/chart" data-testid="billingChart.chartCard">
      <CardHeader>
        <CardTitle>{t("billing.usageOverTime")}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/chart:block">
            {t("billing.pageCountByType")}
          </span>
          <span className="@[540px]/chart:hidden">{t("billing.pageCount")}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => {
              if (value) {
                trackAmplitudeEvent(AMPLITUDE_EVENTS.BILLING_TIME_RANGE_CHANGED, {
                  from_range: timeRange,
                  to_range: value,
                  tab_name: 'metrics'
                })
                setTimeRange(value)
              }
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/chart:flex"
            data-testid="billingChart.timeRangeToggleGroup"
          >
            <ToggleGroupItem value="7d" data-testid="billingChart.timeRange7d">{t("billing.last7Days")}</ToggleGroupItem>
            <ToggleGroupItem value="30d" data-testid="billingChart.timeRange30d">{t("billing.last30Days")}</ToggleGroupItem>
            <ToggleGroupItem value="90d" data-testid="billingChart.timeRange90d">{t("billing.last90Days")}</ToggleGroupItem>
          </ToggleGroup>
          <Select 
            value={timeRange} 
            onValueChange={(value) => {
              trackAmplitudeEvent(AMPLITUDE_EVENTS.BILLING_TIME_RANGE_CHANGED, {
                from_range: timeRange,
                to_range: value,
                tab_name: 'metrics'
              })
              setTimeRange(value)
            }} 
            data-testid="billingChart.timeRangeSelect"
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/chart:hidden"
              size="sm"
              aria-label="Select time range"
              data-testid="billingChart.timeRangeSelectTrigger"
            >
              <SelectValue placeholder={t("billing.last30Days")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">
                {t("billing.last7Days")}
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                {t("billing.last30Days")}
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                {t("billing.last90Days")}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
          data-testid="billingChart.chartContainer"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDocument" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-document)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-document)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAttachment" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-attachment)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-attachment)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAuditTrail" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-auditTrail)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-auditTrail)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-GB", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="document"
              type="natural"
              fill="url(#fillDocument)"
              stroke="var(--color-document)"
              stackId="a"
            />
            <Area
              dataKey="attachment"
              type="natural"
              fill="url(#fillAttachment)"
              stroke="var(--color-attachment)"
              stackId="a"
            />
            <Area
              dataKey="auditTrail"
              type="natural"
              fill="url(#fillAuditTrail)"
              stroke="var(--color-auditTrail)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}