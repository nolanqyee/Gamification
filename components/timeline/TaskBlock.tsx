'use client'

import { useState, useEffect, useRef } from 'react'
import type { TaskLog } from '@/lib/database.types'
import { TIMELINE_TOP_OFFSET } from './TimelineGrid'

const TOTAL_MINUTES = 24 * 60
const SNAP = 15

function snapMin(m: number): number {
  return Math.round(m / SNAP) * SNAP
}

function timeStr(t: string): string {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${m}${ampm}`
}

interface DragState {
  mode: 'move' | 'resize'
  startY: number
  origStartMin: number
  origEndMin: number
  liveStartMin: number
  liveEndMin: number
}

interface Props {
  log: TaskLog
  startMin: number
  endMin: number
  left: number
  width: number
  totalWidth: number
  onDelete: (id: string) => void
  onUpdate: (id: string, startMin: number, endMin: number) => Promise<void>
}

export function TaskBlock({ log, startMin, endMin, left, width, onDelete, onUpdate }: Props) {
  const template = log.task_template
  const domainColor = template?.domain?.color ?? '#6b7280'
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  dragStateRef.current = dragState

  const displayStartMin = dragState ? dragState.liveStartMin : startMin
  const displayEndMin = dragState ? dragState.liveEndMin : endMin
  // 1 minute = 1 pixel; top offset aligns with grid lines
  const topPx = displayStartMin + TIMELINE_TOP_OFFSET
  const heightPx = Math.max(displayEndMin - displayStartMin, 22)
  const isShort = (displayEndMin - displayStartMin) < 40

  useEffect(() => {
    if (!dragState) return

    function onMouseMove(e: MouseEvent) {
      const ds = dragStateRef.current
      if (!ds) return
      // 1px delta = 1 minute delta (no conversion needed)
      const deltaMins = snapMin(e.clientY - ds.startY)

      if (ds.mode === 'move') {
        const dur = ds.origEndMin - ds.origStartMin
        const newStart = Math.max(0, Math.min(TOTAL_MINUTES - dur, ds.origStartMin + deltaMins))
        setDragState({ ...ds, liveStartMin: newStart, liveEndMin: newStart + dur })
      } else {
        const newEnd = Math.max(ds.origStartMin + SNAP, Math.min(TOTAL_MINUTES, ds.origEndMin + deltaMins))
        setDragState({ ...ds, liveEndMin: newEnd })
      }
    }

    function onMouseUp() {
      const ds = dragStateRef.current
      if (!ds) return
      onUpdate(log.id, ds.liveStartMin, ds.liveEndMin)
      setDragState(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!dragState])

  function handleBodyMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    setDragState({ mode: 'move', startY: e.clientY, origStartMin: startMin, origEndMin: endMin, liveStartMin: startMin, liveEndMin: endMin })
  }

  function handleResizeMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    setDragState({ mode: 'resize', startY: e.clientY, origStartMin: startMin, origEndMin: endMin, liveStartMin: startMin, liveEndMin: endMin })
  }

  const isDragging = !!dragState

  return (
    <div
      className={`absolute rounded-md overflow-hidden border-l-[3px] group ${isDragging ? 'opacity-80 z-20' : 'hover:opacity-80'}`}
      style={{
        top: topPx,
        height: heightPx,
        left,
        width,
        backgroundColor: domainColor + '22',
        borderLeftColor: domainColor,
        userSelect: 'none',
        cursor: isDragging ? (dragState!.mode === 'move' ? 'grabbing' : 'ns-resize') : 'grab',
      }}
      title={`${template?.name ?? 'Task'} — ${log.points_earned} pts`}
      onMouseDown={handleBodyMouseDown}
    >
      <div className="px-1.5 py-1 h-full flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-1 flex-shrink-0">
          <span className="text-[11px] font-semibold leading-tight truncate" style={{ color: domainColor }}>
            {template?.name ?? 'Task'}
          </span>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(log.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-400 text-[10px] leading-none flex-shrink-0 mt-0.5"
          >
            ✕
          </button>
        </div>
        {!isShort && log.description && (
          <div className="flex-1 min-h-0 overflow-hidden mt-0.5">
            <p
              className="text-[10px] text-zinc-400 leading-tight italic"
              style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 20, overflow: 'hidden' } as React.CSSProperties}
            >
              {log.description}
            </p>
          </div>
        )}
        {!isShort && (
          <span className="text-[10px] text-zinc-500 leading-tight flex-shrink-0 mt-0.5">
            {log.duration_minutes ? `${log.duration_minutes}m` : timeStr(log.start_time)}
            {' · '}
            <span style={{ color: domainColor }}>{log.points_earned}pt</span>
          </span>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  )
}
