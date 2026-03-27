'use client'

import { useRef, useState, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { TIMELINE_TOP_OFFSET } from './TimelineGrid'

const TOTAL_MINUTES = 24 * 60
const CLICK_DURATION_MINUTES = 30

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`
}

function snapToMinutes(m: number, snap = 30): number {
  return Math.round(m / snap) * snap
}

export function LoggingInteractionLayer() {
  const activeTaskTemplate = useAppStore((s) => s.activeTaskTemplate)
  const activeDate = useAppStore((s) => s.activeDate)
  const setActiveTaskTemplate = useAppStore((s) => s.setActiveTaskTemplate)
  const addTaskLog = useAppStore((s) => s.addTaskLog)
  const addHeatmapPoints = useAppStore((s) => s.addHeatmapPoints)
  const pendingDescription = useAppStore((s) => s.pendingDescription)

  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)

  // Convert mouse Y to timeline minutes, accounting for the top offset
  const getMinutes = useCallback((e: React.MouseEvent): number => {
    if (!layerRef.current) return 0
    const rect = layerRef.current.getBoundingClientRect()
    // relY is relative to the content div which starts at top-0 of the container.
    // Grid lines are at (h*60 + TIMELINE_TOP_OFFSET)px, so subtract the offset.
    const relY = e.clientY - rect.top - TIMELINE_TOP_OFFSET
    return snapToMinutes(Math.max(0, Math.min(TOTAL_MINUTES, relY)))
  }, [])

  async function submitLog(startMin: number, endMin: number) {
    if (!activeTaskTemplate) return
    const durationMinutes = endMin - startMin
    if (durationMinutes < 1) return

    const points = activeTaskTemplate.type === 'duration' && activeTaskTemplate.unit_minutes
      ? Math.floor((durationMinutes / activeTaskTemplate.unit_minutes) * activeTaskTemplate.points_per_unit)
      : activeTaskTemplate.points_per_unit

    try {
      const res = await fetch('/api/task-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_template_id: activeTaskTemplate.id,
          date: activeDate,
          start_time: minutesToTime(startMin),
          end_time: minutesToTime(endMin),
          duration_minutes: durationMinutes,
          points_earned: points,
          description: pendingDescription || null,
        }),
      })
      const newLog = await res.json()
      if (!res.ok) throw new Error(newLog.error)
      addTaskLog(newLog)
      if (activeTaskTemplate.domain) {
        addHeatmapPoints(activeDate, points, {
          domain_id: activeTaskTemplate.domain.id,
          domain_name: activeTaskTemplate.domain.name,
          domain_color: activeTaskTemplate.domain.color,
          total_points: points,
          total_minutes: durationMinutes,
        })
      }
      setActiveTaskTemplate(null)
    } catch (err) {
      console.error('Failed to log task:', err)
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!activeTaskTemplate) return
    e.preventDefault()
    const mins = getMinutes(e)
    setDragging(true); setDragStart(mins); setDragEnd(mins)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || dragStart === null) return
    e.preventDefault()
    setDragEnd(getMinutes(e))
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (!dragging || dragStart === null) return
    const rawEnd = getMinutes(e)
    const start = Math.min(dragStart, rawEnd)
    let end = Math.max(dragStart, rawEnd)
    if (end === start) end = start + CLICK_DURATION_MINUTES
    setDragging(false); setDragStart(null); setDragEnd(null)
    submitLog(start, end)
  }

  const showPreview = dragging && dragStart !== null && dragEnd !== null
  const rawStart = showPreview ? Math.min(dragStart!, dragEnd!) : 0
  const rawEnd = showPreview ? Math.max(dragStart!, dragEnd!) : 0
  const previewEnd = rawEnd === rawStart ? rawStart + CLICK_DURATION_MINUTES : rawEnd
  // Pixel position: 1 min = 1px, shifted by TIMELINE_TOP_OFFSET
  const previewTopPx = rawStart + TIMELINE_TOP_OFFSET
  const previewHeightPx = Math.max(previewEnd - rawStart, 2)
  const domainColor = activeTaskTemplate?.domain?.color ?? '#6366f1'

  return (
    <div
      ref={layerRef}
      className={`absolute inset-0 ${activeTaskTemplate ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {showPreview && (
        <div
          className="absolute left-0 right-0 mx-0.5 rounded-md pointer-events-none border-l-[3px]"
          style={{
            top: previewTopPx,
            height: previewHeightPx,
            backgroundColor: domainColor + '28',
            borderLeftColor: domainColor,
          }}
        />
      )}
    </div>
  )
}
