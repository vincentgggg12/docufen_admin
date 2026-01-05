import { useState, useEffect } from 'react'
import { SERVERURL } from '@/lib/server'

export interface MonthlyPageData {
  month: string
  [tenantName: string]: number | string
}

export interface TenantInfo {
  tenantName: string
  displayName: string
}

interface ApiResponse {
  chartData: MonthlyPageData[]
  tenants: TenantInfo[]
}

export function useMonthlyPageMetrics() {
  const [data, setData] = useState<MonthlyPageData[]>([])
  const [tenants, setTenants] = useState<TenantInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${SERVERURL}admin/metrics/monthly-pages`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result: ApiResponse = await response.json()
        setData(result.chartData)
        setTenants(result.tenants)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
        console.error('Error fetching monthly page metrics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, tenants, loading, error }
}
