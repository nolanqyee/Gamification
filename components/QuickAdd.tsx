'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Clock, Timer, Zap } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { TaskTemplate } from '@/lib/database.types'

// ─── Helpers ───────────────────────────────────────────────────────────────

function filterTemplates(query: string, templates: TaskTemplate[]): TaskTemplate[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return templates
    .filter((t) => t.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aS = a.name.toLowerCase().startsWith(q)
      const bS = b.name.toLowerCase().startsWith(q)
      if (aS && !bS) return -1
      if (!aS && bS) return 1
      return a.name.length - b.name.length
    })
}

/** Parse @time and $hours tokens from a free-text suffix. Everything else is description. */
function parseSuffix(raw: string): { timeStr: string; durationStr: string; description: string } {
  const tokens = raw.split(/\s+/).filter(Boolean)
  const descParts: string[] = []
  let timeStr = ''
  let durationStr = ''
  for (const token of tokens) {
    if (token.startsWith('@') && !timeStr) timeStr = token.slice(1)
    else if (token.startsWith('$') && !durationStr) durationStr = token.slice(1)
    else descParts.push(token)
  }
  return { timeStr, durationStr, description: descParts.join(' ') }
}

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null
  const lower = timeStr.toLowerCase()
  const hasPM = lower.includes('pm')
  const hasAM = lower.includes('am')
  const clean = lower.replace(/[apm\s]/g, '')
  const parts = clean.split(':')
  let hours = parseInt(parts[0])
  const minutes = parts[1] ? parseInt(parts[1]) : 0
  if (isNaN(hours)) return null

  if (hasPM && hours < 12) hours += 12
  else if (hasAM && hours === 12) hours = 0
  else if (!hasPM && !hasAM && hours < 12) {
    const now = new Date()
    const nowMins = now.getHours() * 60 + now.getMinutes()
    const amMins = hours * 60 + minutes
    const pmMins = (hours + 12) * 60 + minutes
    const distAM = Math.min(Math.abs(nowMins - amMins), 1440 - Math.abs(nowMins - amMins))
    const distPM = Math.min(Math.abs(nowMins - pmMins), 1440 - Math.abs(nowMins - pmMins))
    if (distPM < distAM) hours += 12
  }
  return { hours: Math.min(hours, 23), minutes: Math.min(minutes, 59) }
}

function fmt2(n: number) { return String(n).padStart(2, '0') }
function timeLabel(h: number, m: number) {
  const ampm = h >= 12 ? 'pm' : 'am'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}:${fmt2(m)}${ampm}`
}
function toTimeStr(h: number, m: number) { return `${fmt2(h)}:${fmt2(m)}:00` }

function calcPoints(t: TaskTemplate, durationMinutes: number) {
  return t.type === 'duration' && t.unit_minutes
    ? Math.floor((durationMinutes / t.unit_minutes) * t.points_per_unit)
    : t.points_per_unit
}

// ─── Component ─────────────────────────────────────────────────────────────

export function QuickAdd() {
  const [open, setOpen] = useState(false)
  // Pre-confirm: searching for a task
  const [taskSearch, setTaskSearch] = useState('')
  // Post-confirm: the locked-in template
  const [confirmedTemplate, setConfirmedTemplate] = useState<TaskTemplate | null>(null)
  // Post-confirm: @time $hours description typed after the chip
  const [suffixInput, setSuffixInput] = useState('')
  const [selIdx, setSelIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const taskTemplates = useAppStore((s) => s.taskTemplates)
  const activeDate = useAppStore((s) => s.activeDate)
  const addTaskLog = useAppStore((s) => s.addTaskLog)
  const addHeatmapPoints = useAppStore((s) => s.addHeatmapPoints)

  // CMD+/ to toggle
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey && e.code === 'KeyA') { e.preventDefault(); setOpen((o) => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setTaskSearch(''); setConfirmedTemplate(null); setSuffixInput(''); setSelIdx(0); setError('')
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Strip leading # for matching
  const queryForFilter = taskSearch.startsWith('#') ? taskSearch.slice(1) : taskSearch
  const filtered = useMemo(
    () => (confirmedTemplate ? [] : filterTemplates(queryForFilter, taskTemplates)),
    [confirmedTemplate, queryForFilter, taskTemplates]
  )

  // Parse suffix for time/duration/description
  const { timeStr, durationStr, description } = useMemo(() => parseSuffix(suffixInput), [suffixInput])
  const parsedTime = useMemo(() => parseTime(timeStr), [timeStr])
  const parsedDurationMins = durationStr ? Math.round(parseFloat(durationStr) * 60) : null

  const currentTemplate = confirmedTemplate ?? filtered[selIdx] ?? null
  const defaultDuration = currentTemplate?.type === 'duration' && currentTemplate.default_duration_minutes
    ? currentTemplate.default_duration_minutes : 30
  const durationToUse = parsedDurationMins ?? defaultDuration
  const previewPoints = currentTemplate ? calcPoints(currentTemplate, durationToUse) : 0
  const now = new Date()
  const previewTime = parsedTime ?? { hours: now.getHours(), minutes: now.getMinutes() }

  function selectTemplate(t: TaskTemplate) {
    setConfirmedTemplate(t)
    setTaskSearch('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function clearTemplate() {
    setConfirmedTemplate(null)
    setTaskSearch('')
    setSuffixInput('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function handleSubmit() {
    if (!currentTemplate || submitting) return
    setSubmitting(true); setError('')

    const startH = previewTime.hours
    const startM = previewTime.minutes
    const endTotalMins = startH * 60 + startM + durationToUse
    const endH = Math.floor(endTotalMins / 60) % 24
    const endM = endTotalMins % 60
    const points = calcPoints(currentTemplate, durationToUse)

    try {
      const res = await fetch('/api/task-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_template_id: currentTemplate.id,
          date: activeDate,
          start_time: toTimeStr(startH, startM),
          end_time: toTimeStr(endH, endM),
          duration_minutes: durationToUse,
          points_earned: points,
          description: description || null,
        }),
      })
      const newLog = await res.json()
      if (!res.ok) throw new Error(newLog.error ?? 'Failed to log')
      addTaskLog(newLog)
      if (currentTemplate.domain) {
        addHeatmapPoints(activeDate, points, {
          domain_id: currentTemplate.domain.id,
          domain_name: currentTemplate.domain.name,
          domain_color: currentTemplate.domain.color,
          total_points: points,
          total_minutes: durationToUse ?? 0,
        })
      }
      setOpen(false)
    } catch (err: any) {
      setError(err.message ?? 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!confirmedTemplate) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx((i) => Math.min(i + 1, filtered.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelIdx((i) => Math.max(i - 1, 0)) }
      else if ((e.key === 'Tab' || e.key === 'Enter') && filtered.length > 0) {
        e.preventDefault(); selectTemplate(filtered[selIdx])
      } else if (e.key === 'Escape') { setOpen(false) }
    } else {
      if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
      else if (e.key === 'Backspace' && suffixInput === '') { e.preventDefault(); clearTemplate() }
      else if (e.key === 'Escape') { setOpen(false) }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/10" onClick={() => setOpen(false)} />

      <div className="relative z-10 bg-white border border-zinc-200 rounded-2xl shadow-2xl w-[520px] overflow-hidden">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Search size={15} className="text-zinc-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {confirmedTemplate && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-white text-[11px] font-semibold flex-shrink-0 select-none"
                style={{ backgroundColor: confirmedTemplate.domain?.color ?? '#6b7280' }}
              >
                {confirmedTemplate.name}
                <button
                  onMouseDown={(e) => { e.preventDefault(); clearTemplate() }}
                  className="ml-0.5 opacity-60 hover:opacity-100 leading-none"
                >×</button>
              </span>
            )}
            <input
              ref={inputRef}
              value={confirmedTemplate ? suffixInput : taskSearch}
              onChange={(e) => confirmedTemplate ? setSuffixInput(e.target.value) : (setTaskSearch(e.target.value), setSelIdx(0))}
              onKeyDown={handleKeyDown}
              placeholder={confirmedTemplate ? '@time $hours note…' : '#task  or just type to search…'}
              className="flex-1 min-w-0 text-sm text-zinc-800 placeholder-zinc-400 outline-none bg-transparent"
            />
          </div>
          <kbd className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md font-mono flex-shrink-0">⌘/</kbd>
        </div>

        {/* Task dropdown */}
        {filtered.length > 0 && (
          <div className="border-t border-zinc-100">
            {filtered.slice(0, 7).map((t, i) => (
              <button
                key={t.id}
                onMouseDown={(e) => { e.preventDefault(); selectTemplate(t) }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${i === selIdx ? 'bg-zinc-50' : 'hover:bg-zinc-50'}`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.domain?.color }} />
                <span className="flex-1 text-sm font-medium text-zinc-700">{t.name}</span>
                <span className="text-xs text-zinc-400">{t.domain?.name}</span>
                {i === selIdx && <span className="text-[10px] text-zinc-300 ml-1">↵</span>}
              </button>
            ))}
          </div>
        )}

        {/* Preview (only when template is confirmed) */}
        {confirmedTemplate && (
          <div className="border-t border-zinc-100 px-4 py-2.5 space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-xs text-zinc-500 flex-1">
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-zinc-400" />
                  {timeLabel(previewTime.hours, previewTime.minutes)}
                </span>
                <span className="flex items-center gap-1">
                  <Timer size={11} className="text-zinc-400" />
                  {durationToUse >= 60
                    ? `${(durationToUse / 60).toFixed(durationToUse % 60 === 0 ? 0 : 1)}h`
                    : `${durationToUse}m`}
                </span>
                <span className="flex items-center gap-1 font-semibold" style={{ color: confirmedTemplate.domain?.color }}>
                  <Zap size={11} />
                  {previewPoints} pts
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-3 py-1 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#FF5149' }}
              >
                {submitting ? '…' : 'Log ↵'}
              </button>
            </div>
            {description && (
              <p className="text-xs text-zinc-400 italic">"{description}"</p>
            )}
            <p className="text-[10px] text-zinc-300">
              <code className="bg-zinc-100 px-1 rounded text-zinc-400">@8pm</code> time ·{' '}
              <code className="bg-zinc-100 px-1 rounded text-zinc-400">$1.5</code> hrs ·{' '}
              plain text = note · backspace to change task
            </p>
          </div>
        )}

        {/* Hint when nothing typed */}
        {!confirmedTemplate && !queryForFilter && (
          <div className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-400">
            Type to search tasks · <span className="font-medium">Enter</span> to select ·{' '}
            <span className="font-medium">@time</span> · <span className="font-medium">$hours</span> · plain text = note
          </div>
        )}
        {!confirmedTemplate && queryForFilter && filtered.length === 0 && (
          <div className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-400">
            No tasks matching "{queryForFilter}"
          </div>
        )}

        {error && (
          <div className="border-t border-zinc-100 px-4 py-2 text-xs text-red-500">{error}</div>
        )}
      </div>
    </div>
  )
}
