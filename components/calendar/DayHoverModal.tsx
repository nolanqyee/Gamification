'use client'

import { useAppStore } from '@/store/useAppStore'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface Props {
  date: string
  dayNumber: number
  anchorRect: DOMRect
}

export function DayHoverModal({ date, dayNumber, anchorRect }: Props) {
  // Read directly from store — no fetch, instant
  const heatmapData = useAppStore((s) => s.heatmapData)
  const dayData = heatmapData[date]
  const total = dayData?.total ?? 0
  const breakdown = dayData?.domains ?? []

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const modalWidth = 210
  let left = anchorRect.right + 6
  if (left + modalWidth > viewportWidth - 8) left = anchorRect.left - modalWidth - 6
  const top = Math.min(anchorRect.top, (typeof window !== 'undefined' ? window.innerHeight : 800) - 260)

  const formatted = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  return (
    <div
      className="fixed z-50 bg-white border border-zinc-200 rounded-xl shadow-xl p-4 pointer-events-none"
      style={{ left, top, width: modalWidth }}
    >
      <p className="text-xs text-zinc-400 font-medium mb-0.5">{formatted}</p>
      <p className="text-lg font-bold text-zinc-900 leading-none">
        {total > 0 ? `${total} pts` : 'No activity'}
      </p>

      {breakdown.length > 0 && (
        <>
          <div className="h-24 my-2 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="total_points"
                  nameKey="domain_name"
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={40}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {breakdown.map((entry) => (
                    <Cell key={entry.domain_id} fill={entry.domain_color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1">
            {breakdown.map((d) => (
              <div key={d.domain_id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.domain_color }} />
                  <span className="text-zinc-600">{d.domain_name}</span>
                </div>
                <span className="text-zinc-400 font-medium">{d.total_points}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
