import React from 'react'
import { TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useMonthlyPageMetrics } from '@/hooks/useMonthlyPageMetrics'

// Custom label component to show total of stacked bars
const CustomLabel = (props: any) => {
  const { x, y, width, value, tenants, data, index } = props

  // Calculate total for this data point
  const dataPoint = data[index]
  const total = tenants.reduce((sum: number, tenant: any) => {
    return sum + (Number(dataPoint[tenant.tenantName]) || 0)
  }, 0)

  if (total === 0) return null

  return (
    <text
      x={x + width / 2}
      y={y - 12}
      fill="currentColor"
      textAnchor="middle"
      fontSize={12}
      className="fill-foreground"
    >
      {total.toLocaleString()}
    </text>
  )
}

export function MonthlyPagesChart() {
  const { data, tenants, loading, error } = useMonthlyPageMetrics()

  // Build chart config from tenants - must be before any early returns
  const chartConfig: ChartConfig = React.useMemo(() => {
    // Define color palette using proper var(--chart-N) format
    const colorPalette = [
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
      'var(--chart-4)',
      'var(--chart-5)',
    ]

    return tenants.reduce((config, tenant, index) => {
      config[tenant.tenantName] = {
        label: tenant.displayName,
        color: colorPalette[index % colorPalette.length],
      }
      return config
    }, {} as ChartConfig)
  }, [tenants])

  // Calculate total pages across all months - must be before any early returns
  const totalPages = React.useMemo(() => {
    return data.reduce((total, monthData) => {
      return total + tenants.reduce((monthTotal, tenant) => {
        return monthTotal + (Number(monthData[tenant.tenantName]) || 0)
      }, 0)
    }, 0)
  }, [data, tenants])

  // Calculate average monthly pages - must be before any early returns
  const avgMonthlyPages = React.useMemo(() => {
    return data.length > 0 ? Math.round(totalPages / data.length) : 0
  }, [data.length, totalPages])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Page Consumption</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Page Consumption</CardTitle>
          <CardDescription className="text-destructive">
            Error: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Page Consumption</CardTitle>
        <CardDescription>
          Stacked view showing page consumption by customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}K`
                }
                return value.toString()
              }}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            {tenants.map((tenant, index) => {
              const isFirst = index === 0
              const isLast = index === tenants.length - 1

              // Bottom bar has rounded bottom corners, top bar has rounded top corners
              const radius = isFirst ? [0, 0, 4, 4] : isLast ? [4, 4, 0, 0] : [0, 0, 0, 0]

              return (
                <Bar
                  key={tenant.tenantName}
                  dataKey={tenant.tenantName}
                  stackId="a"
                  fill={`var(--color-${tenant.tenantName})`}
                  radius={radius}
                >
                  {isLast && (
                    <LabelList
                      content={(props) => <CustomLabel {...props} tenants={tenants} data={data} />}
                    />
                  )}
                </Bar>
              )
            })}
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Total pages: {totalPages.toLocaleString()} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Average {avgMonthlyPages.toLocaleString()} pages per month
        </div>
      </CardFooter>
    </Card>
  )
}
