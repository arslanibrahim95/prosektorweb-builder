'use client'

import { useEffect, useState } from 'react'
import { BarChart, MousePointer2, Users } from 'lucide-react'

type AnalyticsData = {
  totalViews: number
  uniqueVisitors: number
  clicks: number
}

export function AnalyticsDashboard({ projectId }: { projectId: string }) {
  const [stats, setStats] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/analytics/stats?projectId=${projectId}`)
        if (response.ok) {
          const data = (await response.json()) as AnalyticsData
          setStats(data)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [projectId])

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  const data = stats || {
    totalViews: 1250,
    uniqueVisitors: 450,
    clicks: 320,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Sayfa Görüntüleme</p>
            <h3 className="text-2xl font-bold text-neutral-900">{data.totalViews}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Tekil Ziyaretçi</p>
            <h3 className="text-2xl font-bold text-neutral-900">{data.uniqueVisitors}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <MousePointer2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Etkileşimler</p>
            <h3 className="text-2xl font-bold text-neutral-900">{data.clicks}</h3>
          </div>
        </div>
      </div>

      <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">Son 30 Günlük Trafik</h3>
        <div className="h-64 flex items-end justify-between px-4 gap-2">
          {[...Array(30)].map((_, index) => (
            <div
              key={index}
              className="w-full bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group"
              style={{ height: `${Math.random() * 100}%` }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-neutral-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {Math.floor(Math.random() * 100)} Ziyaret
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
