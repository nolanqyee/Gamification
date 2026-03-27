'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { TimelineGrid, TIME_LABEL_WIDTH, TIMELINE_TOP_OFFSET } from './TimelineGrid'
import { TaskBlock } from './TaskBlock'
import { LoggingInteractionLayer } from './LoggingInteractionLayer'
import { computePositions } from './overlap'
import { useAppStore } from '@/store/useAppStore'
import type { TaskLog } from '@/lib/database.types'

const TOTAL_MINUTES = 24 * 60

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`
}

export function DayTimeline() {
  const activeDate = useAppStore((s) => s.activeDate)
  const taskLogs = useAppStore((s) => s.taskLogsForActiveDay)
  const setTaskLogsForActiveDay = useAppStore((s) => s.setTaskLogsForActiveDay)
  const updateTaskLog = useAppStore((s) => s.updateTaskLog)
  const heatmapData = useAppStore((s) => s.heatmapData)
  const refreshHeatmap = useAppStore((s) => s.refreshHeatmap)

  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const totalPoints = heatmapData[activeDate]?.total ?? 0

  const formattedDate = new Date(activeDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    fetch(`/api/task-logs?date=${activeDate}`)
      .then((r) => r.json())
      .then((data: TaskLog[]) => setTaskLogsForActiveDay(data))
      .catch(console.error)
  }, [activeDate, setTaskLogsForActiveDay])

  // Scroll to current hour
  useEffect(() => {
    if (!scrollRef.current) return
    const now = new Date()
    const mins = now.getHours() * 60 + now.getMinutes()
    scrollRef.current.scrollTop = Math.max(0, (mins / TOTAL_MINUTES) * 24 * 60 - 150)
  }, [activeDate])

  async function handleDelete(id: string) {
    await fetch(`/api/task-logs?id=${id}`, { method: 'DELETE' })
    setTaskLogsForActiveDay(taskLogs.filter((l) => l.id !== id))
    refreshHeatmap()
  }

  async function handleUpdate(id: string, newStartMin: number, newEndMin: number) {
    const durationMinutes = newEndMin - newStartMin
    const startTime = minutesToTime(newStartMin)
    const endTime = minutesToTime(newEndMin)

    const existing = taskLogs.find((l) => l.id === id)
    const template = existing?.task_template
    const pointsEarned = template?.type === 'duration' && template.unit_minutes
      ? Math.floor((durationMinutes / template.unit_minutes) * template.points_per_unit)
      : existing?.points_earned ?? 0

    // Optimistic update
    if (existing) {
      updateTaskLog({ ...existing, start_time: startTime, end_time: endTime, duration_minutes: durationMinutes, points_earned: pointsEarned })
    }

    const res = await fetch(`/api/task-logs?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_time: startTime, end_time: endTime, duration_minutes: durationMinutes, points_earned: pointsEarned }),
    })
    const updated = await res.json()
    if (res.ok) updateTaskLog(updated)
  }

  // Memoize overlap computation so it only re-runs when logs actually change
  const positions = useMemo(() => computePositions(taskLogs), [taskLogs])
  const PADDING = 4

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Timeline</p>
          <p className="text-sm font-semibold text-zinc-800 mt-0.5">{formattedDate}</p>
        </div>
        {totalPoints > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <span className="text-sm font-bold text-green-600">{totalPoints} pts</span>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div ref={containerRef} className="relative">
          <TimelineGrid>
            {positions.map(({ log, startMin, endMin, column, totalColumns }) => {
              const contentWidth = Math.max(0, containerWidth - TIME_LABEL_WIDTH)
              const colWidth = contentWidth > 0 ? (contentWidth - 2 * PADDING) / totalColumns : 100
              return (
                <TaskBlock
                  key={log.id}
                  log={log}
                  startMin={startMin}
                  endMin={endMin}
                  left={PADDING + column * colWidth}
                  width={colWidth - 3}
                  totalWidth={contentWidth}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              )
            })}
            <LoggingInteractionLayer />
            <CurrentTimeIndicator activeDate={activeDate} />
          </TimelineGrid>
        </div>
      </div>
    </div>
  )
}

function CurrentTimeIndicator({ activeDate }: { activeDate: string }) {
  const todayStr = new Date().toISOString().slice(0, 10)
  if (activeDate !== todayStr) return null
  const now = new Date()
  const topPx = now.getHours() * 60 + now.getMinutes() + TIMELINE_TOP_OFFSET
  return (
    <div className="absolute left-0 right-0 pointer-events-none z-10 flex items-center" style={{ top: topPx }}>
      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
      <div className="flex-1 h-px bg-red-400 opacity-50" />
    </div>
  )
}
