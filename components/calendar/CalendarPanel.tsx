'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayCell } from './DayCell'
import { useAppStore } from '@/store/useAppStore'
import type { DomainPoints } from '@/lib/database.types'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function CalendarPanel() {
  const heatmapData = useAppStore((s) => s.heatmapData)
  const setHeatmapData = useAppStore((s) => s.setHeatmapData)
  const activeDate = useAppStore((s) => s.activeDate)

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  useEffect(() => {
    fetch('/api/heatmap')
      .then((r) => r.json())
      .then((data) => setHeatmapData(data))
      .catch(console.error)
  }, [setHeatmapData])

  const todayStr = getDateStr(today)

  const { weeks, monthLabel, monthStats } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const days: Array<{ date: string; dayNumber: number; isCurrentMonth: boolean }> = []

    for (let i = firstDay.getDay() - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth, -i)
      days.push({ date: getDateStr(d), dayNumber: d.getDate(), isCurrentMonth: false })
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(viewYear, viewMonth, d)
      days.push({ date: getDateStr(date), dayNumber: d, isCurrentMonth: true })
    }
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(viewYear, viewMonth + 1, i)
        days.push({ date: getDateStr(d), dayNumber: d.getDate(), isCurrentMonth: false })
      }
    }

    const weeks: typeof days[] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

    // Monthly stats: aggregate heatmap data for current view month
    const monthPrefix = `${String(viewYear)}-${String(viewMonth + 1).padStart(2, '0')}`
    let monthTotal = 0
    let activeDays = 0
    const domainMap: Record<string, { name: string; color: string; points: number; minutes: number }> = {}

    for (const [date, dayData] of Object.entries(heatmapData)) {
      if (!date.startsWith(monthPrefix)) continue
      if (dayData.total > 0) {
        monthTotal += dayData.total
        activeDays++
        for (const d of dayData.domains) {
          if (!domainMap[d.domain_id]) domainMap[d.domain_id] = { name: d.domain_name, color: d.domain_color, points: 0, minutes: 0 }
          domainMap[d.domain_id].points += d.total_points
          domainMap[d.domain_id].minutes += d.total_minutes ?? 0
        }
      }
    }

    const avgPerActiveDay = activeDays > 0 ? Math.round(monthTotal / activeDays) : 0
    const domainBreakdown: DomainPoints[] = Object.entries(domainMap)
      .map(([id, v]) => ({ domain_id: id, domain_name: v.name, domain_color: v.color, total_points: v.points, total_minutes: v.minutes }))
      .sort((a, b) => b.total_points - a.total_points)

    return { weeks, monthLabel, monthStats: { total: monthTotal, activeDays, avgPerActiveDay, domains: domainBreakdown } }
  }, [viewYear, viewMonth, heatmapData])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-700">{monthLabel}</h2>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
            className="text-xs font-medium px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors"
            style={{ color: '#FF5149' }}
          >
            Today
          </button>
          <button onClick={prevMonth} className="p-1 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
            <ChevronLeft size={13} />
          </button>
          <button onClick={nextMonth} className="p-1 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-zinc-400 uppercase py-0.5">
            {label}
          </div>
        ))}
      </div>

      {/* Fixed-size grid — no flex-1 stretching */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell) => (
              <DayCell
                key={cell.date}
                date={cell.date}
                dayNumber={cell.dayNumber}
                points={heatmapData[cell.date]?.total ?? 0}
                isToday={cell.date === todayStr}
                isActive={cell.date === activeDate}
                isCurrentMonth={cell.isCurrentMonth}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-1 text-[10px] text-zinc-400">
        <span>Less</span>
        {['#ebebed', '#ffe8e7', '#ffc5c2', '#ff9d99', '#ff7470', '#ff5149'].map((c) => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>

      {/* Monthly stats */}
      <div className="mt-4 border-t border-zinc-100 pt-4 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Month Total</p>
            <p className="text-2xl font-bold text-zinc-800 leading-none mt-0.5">{monthStats.total}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">pts</p>
          </div>
          {monthStats.activeDays > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Avg / day</p>
              <p className="text-xl font-bold text-zinc-600 leading-none mt-0.5">{monthStats.avgPerActiveDay}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{monthStats.activeDays} active days</p>
            </div>
          )}
        </div>

        {monthStats.domains.length > 0 && (
          <div className="space-y-1.5">
            {monthStats.domains.map((d) => {
              const pct = monthStats.total > 0 ? (d.total_points / monthStats.total) * 100 : 0
              const hours = d.total_minutes > 0 ? (d.total_minutes / 60).toFixed(1) : null
              return (
                <div key={d.domain_id}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.domain_color }} />
                      <span className="text-xs text-zinc-600">{d.domain_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hours && <span className="text-[10px] text-zinc-400">{hours}h</span>}
                      <span className="text-xs text-zinc-500 font-medium">{d.total_points}pt</span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: d.domain_color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {monthStats.total === 0 && (
          <p className="text-xs text-zinc-400">No activity this month.</p>
        )}
      </div>
    </div>
  )
}
