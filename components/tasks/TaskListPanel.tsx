'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, X, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { DomainIcon } from '@/components/settings/DomainIcon'
import { SettingsModal } from '@/components/settings/SettingsModal'
import type { Domain, TaskTemplate } from '@/lib/database.types'

// ─── Board state ─────────────────────────────────────────────────────────────
// columns: ordered array of domain IDs per column

const LS_KEY = 'board-v2'
type BoardState = { columns: string[][] }

function loadBoard(): BoardState {
  if (typeof window === 'undefined') return { columns: [[], []] }
  try { const r = localStorage.getItem(LS_KEY); if (r) return JSON.parse(r) } catch {}
  return { columns: [[], []] }
}
function saveBoard(s: BoardState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch {}
}

// ─── Preset colors ───────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#D40001','#E67C73','#F4511E','#F6BF27','#34B679',
  '#0A8043','#039BE5','#3F51B5','#7986CB','#8E24AA','#616161',
]

// ─── Drop indicator ───────────────────────────────────────────────────────────

function DropLine({ color }: { color: string }) {
  return <div className="h-0.5 rounded-full mx-1 flex-shrink-0" style={{ backgroundColor: color }} />
}

// ─── Add Domain form ─────────────────────────────────────────────────────────

function AddDomainForm({ onAdded, onCancel }: { onAdded: (d: Domain) => void; onCancel: () => void }) {
  const domains = useAppStore((s) => s.domains)
  const setDomains = useAppStore((s) => s.setDomains)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon, setIcon] = useState('star')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim() || saving) return
    setSaving(true)
    const res = await fetch('/api/domains', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), color, icon }),
    })
    const data: Domain = await res.json()
    if (res.ok) { setDomains([...domains, data]); onAdded(data) }
    setSaving(false)
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2.5">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Domain name"
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel() }}
        className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#FF5149]/60"
        autoFocus
      />
      <div className="flex gap-1.5 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-4 h-4 rounded-full flex-shrink-0 transition-transform ${color === c ? 'scale-125 ring-2 ring-[#FF5149] ring-offset-1' : 'hover:scale-110'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <DomainIcon name={icon} size={13} style={{ color }} />
        <input value={icon} onChange={(e) => setIcon(e.target.value.toLowerCase())}
          placeholder="icon name (e.g. star)"
          className="flex-1 text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#FF5149]/60"
        />
      </div>
      <div className="flex gap-2 pt-0.5">
        <button onClick={submit} disabled={saving || !name.trim()}
          className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
          style={{ backgroundColor: '#FF5149' }}>
          {saving ? '…' : 'Add Domain'}
        </button>
        <button onClick={onCancel} className="px-3 text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
      </div>
    </div>
  )
}

// ─── Add Template form ────────────────────────────────────────────────────────

function AddTemplateForm({ domainId, domainColor, onDone }: {
  domainId: string; domainColor: string; onDone: () => void
}) {
  const taskTemplates = useAppStore((s) => s.taskTemplates)
  const setTaskTemplates = useAppStore((s) => s.setTaskTemplates)
  const [name, setName] = useState('')
  const [type, setType] = useState<'completion' | 'duration'>('completion')
  const [points, setPoints] = useState('10')
  const [unitMins, setUnitMins] = useState('60')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim() || saving) return
    setSaving(true)
    const body: Record<string, unknown> = {
      name: name.trim(), domain_id: domainId, type,
      points_per_unit: parseInt(points) || 10,
    }
    if (type === 'duration') {
      body.unit_minutes = parseInt(unitMins) || 60
      body.default_duration_minutes = body.unit_minutes
    }
    const res = await fetch('/api/task-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data: TaskTemplate = await res.json()
    if (res.ok) { setTaskTemplates([...taskTemplates, data]); onDone() }
    setSaving(false)
  }

  return (
    <div className="mt-1 mb-2 bg-zinc-50 rounded-lg border border-zinc-200 p-2.5 space-y-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Task name"
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onDone() }}
        className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 outline-none focus:border-[#FF5149]/60"
        autoFocus
      />
      {/* Type toggle */}
      <div className="flex rounded-md overflow-hidden border border-zinc-200 text-[10px] bg-white">
        {(['completion', 'duration'] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} className={`flex-1 py-1 capitalize font-medium transition-colors ${type === t ? 'text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
            style={type === t ? { backgroundColor: domainColor } : undefined}>
            {t}
          </button>
        ))}
      </div>
      {/* Points / unit */}
      <div className="flex gap-1.5 items-center">
        <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-md px-2 py-1 flex-1">
          <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} min={1}
            className="w-10 text-xs outline-none text-zinc-800 bg-transparent" />
          <span className="text-[10px] text-zinc-400">pts</span>
        </div>
        {type === 'duration' && (
          <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-md px-2 py-1 flex-1">
            <input type="number" value={unitMins} onChange={(e) => setUnitMins(e.target.value)} min={1}
              className="w-10 text-xs outline-none text-zinc-800 bg-transparent" />
            <span className="text-[10px] text-zinc-400">min</span>
          </div>
        )}
        <button onClick={submit} disabled={saving || !name.trim()}
          className="px-3 py-1.5 text-xs font-semibold text-white rounded-md disabled:opacity-50 flex-shrink-0"
          style={{ backgroundColor: domainColor }}>
          {saving ? '…' : 'Add'}
        </button>
      </div>
    </div>
  )
}

// ─── Domain Card ──────────────────────────────────────────────────────────────

interface CardProps {
  domain: Domain
  templates: TaskTemplate[]
  isDragging: boolean
  cardRef: React.RefCallback<HTMLDivElement>
  onDragStart: (e: React.MouseEvent, domainId: string, cardRect: DOMRect) => void
  activeTemplateId: string | null
  onActivate: (t: TaskTemplate) => void
  onUpdateName: (id: string, name: string) => void
  onUpdateIcon: (id: string, icon: string) => void
  onEditColor: (id: string, rect: DOMRect) => void
}

function DomainCard({
  domain, templates, isDragging, cardRef,
  onDragStart, activeTemplateId, onActivate,
  onUpdateName, onUpdateIcon, onEditColor,
}: CardProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const iconRef = useRef<HTMLInputElement>(null)
  const updateTaskTemplate = useAppStore((s) => s.updateTaskTemplate)
  const removeTaskTemplate = useAppStore((s) => s.removeTaskTemplate)

  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(domain.name)
  const [editingIcon, setEditingIcon] = useState(false)
  const [iconVal, setIconVal] = useState(domain.icon ?? 'star')
  const [addingTemplate, setAddingTemplate] = useState(false)

  // Template edit state
  type EditTemplateState = { id: string; name: string; type: 'completion' | 'duration'; points: string; unitMins: string; saving: boolean }
  const [editingTemplate, setEditingTemplate] = useState<EditTemplateState | null>(null)

  useEffect(() => { if (!editingName) setNameVal(domain.name) }, [domain.name, editingName])
  useEffect(() => { if (!editingIcon) setIconVal(domain.icon ?? 'star') }, [domain.icon, editingIcon])

  async function handleDeleteTemplate(id: string) {
    removeTaskTemplate(id)
    await fetch(`/api/task-templates?id=${id}`, { method: 'DELETE' })
  }

  function startEditTemplate(t: { id: string; name: string; type: 'completion' | 'duration'; points_per_unit: number; unit_minutes: number | null }) {
    setEditingTemplate({ id: t.id, name: t.name, type: t.type, points: String(t.points_per_unit), unitMins: String(t.unit_minutes ?? 60), saving: false })
  }

  async function commitEditTemplate() {
    if (!editingTemplate || editingTemplate.saving) return
    setEditingTemplate((e) => e ? { ...e, saving: true } : null)
    const body: Record<string, unknown> = {
      name: editingTemplate.name.trim() || editingTemplate.name,
      type: editingTemplate.type,
      points_per_unit: parseInt(editingTemplate.points) || 10,
      unit_minutes: editingTemplate.type === 'duration' ? (parseInt(editingTemplate.unitMins) || 60) : null,
      default_duration_minutes: editingTemplate.type === 'duration' ? (parseInt(editingTemplate.unitMins) || 60) : null,
    }
    const res = await fetch(`/api/task-templates?id=${editingTemplate.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) updateTaskTemplate(await res.json())
    setEditingTemplate(null)
  }

  function commitName() {
    setEditingName(false)
    const v = nameVal.trim()
    if (v && v !== domain.name) onUpdateName(domain.id, v)
    else setNameVal(domain.name)
  }
  function commitIcon() {
    setEditingIcon(false)
    const v = iconVal.trim() || 'star'
    if (v !== (domain.icon ?? 'star')) onUpdateIcon(domain.id, v)
  }

  return (
    <div
      ref={(el) => {
        (outerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
        cardRef(el)
      }}
      className={`rounded-xl border border-zinc-100 bg-white overflow-hidden transition-opacity ${isDragging ? 'opacity-20' : ''}`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 select-none"
        style={{ cursor: 'grab' }}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest('button, input')) return
          if (outerRef.current) onDragStart(e, domain.id, outerRef.current.getBoundingClientRect())
        }}
      >
        {/* Icon */}
        {editingIcon ? (
          <div className="flex items-center gap-1.5 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
            <DomainIcon name={iconVal} size={12} style={{ color: domain.color }} />
            <input ref={iconRef} value={iconVal} onChange={(e) => setIconVal(e.target.value.toLowerCase())}
              onBlur={commitIcon}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitIcon() }
                if (e.key === 'Escape') { setEditingIcon(false); setIconVal(domain.icon ?? 'star') }
              }}
              className="w-20 text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5 outline-none focus:border-[#FF5149]/60"
              placeholder="icon name"
            />
          </div>
        ) : (
          <button
            className="p-0.5 rounded hover:bg-zinc-100 transition-colors flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); setEditingIcon(true); setTimeout(() => iconRef.current?.focus(), 0) }}
            title="Edit icon"
          >
            <DomainIcon name={domain.icon} size={13} style={{ color: domain.color }} />
          </button>
        )}

        {/* Name */}
        {editingName ? (
          <input ref={nameRef} value={nameVal} onChange={(e) => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitName() }
              if (e.key === 'Escape') { setEditingName(false); setNameVal(domain.name) }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 text-sm font-semibold bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5 outline-none focus:border-[#FF5149]/60"
          />
        ) : (
          <span
            className="flex-1 min-w-0 text-sm font-semibold text-zinc-800 truncate cursor-text hover:text-zinc-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setEditingName(true)
              setTimeout(() => { nameRef.current?.focus(); nameRef.current?.select() }, 0)
            }}
          >
            {domain.name}
          </span>
        )}

        <button
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 hover:scale-150 transition-transform"
          style={{ backgroundColor: domain.color }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEditColor(domain.id, e.currentTarget.getBoundingClientRect()) }}
          title="Edit color"
        />
      </div>

      {/* Templates */}
      {(templates.length > 0 || addingTemplate) && (
        <div className="px-2.5 pb-0.5">
          {templates.map((t) => {
            const isActive = activeTemplateId === t.id
            if (editingTemplate?.id === t.id) {
              const et = editingTemplate
              return (
                <div key={t.id} className="mb-1 bg-zinc-50 rounded-lg border border-zinc-200 p-2 space-y-1.5">
                  <input value={et.name} onChange={(e) => setEditingTemplate({ ...et, name: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitEditTemplate(); if (e.key === 'Escape') setEditingTemplate(null) }}
                    className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2 py-1 outline-none focus:border-[#FF5149]/60"
                    autoFocus
                  />
                  <div className="flex rounded-md overflow-hidden border border-zinc-200 text-[10px] bg-white">
                    {(['completion', 'duration'] as const).map((tp) => (
                      <button key={tp} onClick={() => setEditingTemplate({ ...et, type: tp })}
                        className={`flex-1 py-0.5 capitalize font-medium transition-colors ${et.type === tp ? 'text-white' : 'text-zinc-400'}`}
                        style={et.type === tp ? { backgroundColor: domain.color } : undefined}>
                        {tp}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 items-center">
                    <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-md px-1.5 py-0.5 flex-1">
                      <input type="number" value={et.points} onChange={(e) => setEditingTemplate({ ...et, points: e.target.value })} min={1}
                        className="w-8 text-xs outline-none bg-transparent" />
                      <span className="text-[10px] text-zinc-400">pts</span>
                    </div>
                    {et.type === 'duration' && (
                      <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-md px-1.5 py-0.5 flex-1">
                        <input type="number" value={et.unitMins} onChange={(e) => setEditingTemplate({ ...et, unitMins: e.target.value })} min={1}
                          className="w-8 text-xs outline-none bg-transparent" />
                        <span className="text-[10px] text-zinc-400">min</span>
                      </div>
                    )}
                    <button onClick={commitEditTemplate} disabled={et.saving}
                      className="px-2 py-1 text-[10px] font-semibold text-white rounded-md disabled:opacity-50 flex-shrink-0"
                      style={{ backgroundColor: domain.color }}>
                      {et.saving ? '…' : 'Save'}
                    </button>
                    <button onClick={() => setEditingTemplate(null)} className="px-1.5 py-1 text-[10px] text-zinc-400 hover:text-zinc-600">✕</button>
                  </div>
                </div>
              )
            }
            return (
              <div key={t.id}
                className={`group/t w-full flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-colors ${isActive ? 'text-white' : 'text-zinc-700 hover:bg-zinc-50'}`}
                style={isActive ? { backgroundColor: domain.color } : undefined}
              >
                <button className="flex-1 text-left min-w-0 py-1" onClick={() => onActivate(t)}>
                  <span className="block text-[11px] font-medium truncate">{t.name}</span>
                </button>
                <div className="relative flex-shrink-0 flex items-center justify-end" style={{ minWidth: 36 }}>
                  <span className="text-[10px] font-semibold" style={{ opacity: isActive ? 0.7 : 0.5 }}>
                    {t.type === 'completion' ? `${t.points_per_unit}pt` : `${t.points_per_unit}pt/${t.unit_minutes}m`}
                  </span>
                  <div className={`absolute inset-0 flex items-center justify-end gap-0.5 rounded bg-zinc-50 transition-opacity ${isActive ? 'opacity-0' : 'opacity-0 group-hover/t:opacity-100'}`}>
                    <button onClick={(e) => { e.stopPropagation(); startEditTemplate(t) }}
                      className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors">
                      <Pencil size={11} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id) }}
                      className="p-1 rounded hover:bg-red-100 text-zinc-400 hover:text-red-500 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {addingTemplate && (
            <AddTemplateForm domainId={domain.id} domainColor={domain.color} onDone={() => setAddingTemplate(false)} />
          )}
        </div>
      )}

      {/* Add task */}
      {!addingTemplate && (
        <div className="px-3 pb-2.5">
          <button onClick={() => setAddingTemplate(true)}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Plus size={10} /> Add task
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Board ────────────────────────────────────────────────────────────────────

export function TaskListPanel() {
  const domains = useAppStore((s) => s.domains)
  const taskTemplates = useAppStore((s) => s.taskTemplates)
  const setDomains = useAppStore((s) => s.setDomains)
  const setTaskTemplates = useAppStore((s) => s.setTaskTemplates)
  const updateDomain = useAppStore((s) => s.updateDomain)
  const activeTaskTemplate = useAppStore((s) => s.activeTaskTemplate)
  const setActiveTaskTemplate = useAppStore((s) => s.setActiveTaskTemplate)

  // columns[i] = ordered list of domain IDs in column i
  const [columns, setColumns] = useState<string[][]>([[], []])
  const [loaded, setLoaded] = useState(false)
  const [addingInCol, setAddingInCol] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/domains').then(r => r.json()).then((d: Domain[]) => setDomains(d)).catch(console.error)
    fetch('/api/task-templates').then(r => r.json()).then((d: TaskTemplate[]) => setTaskTemplates(d)).catch(console.error)
    const saved = loadBoard()
    setColumns(saved.columns.length ? saved.columns : [[], []])
    setLoaded(true)
  }, [setDomains, setTaskTemplates])

  // Auto-assign new domains (not yet in any column) to the least-populated column
  const seenIds = useRef(new Set<string>())
  useEffect(() => {
    if (!loaded) return
    const unassigned = domains.filter(
      (d) => !seenIds.current.has(d.id) && !columns.some((col) => col.includes(d.id))
    )
    if (unassigned.length === 0) {
      domains.forEach((d) => seenIds.current.add(d.id))
      return
    }
    setColumns((prev) => {
      const next = prev.map((c) => [...c])
      for (const d of unassigned) {
        const minIdx = next.reduce((mi, col, i) => col.length < next[mi].length ? i : mi, 0)
        next[minIdx].push(d.id)
        seenIds.current.add(d.id)
      }
      saveBoard({ columns: next })
      return next
    })
  }, [domains, loaded])

  // ─── Drag ──────────────────────────────────────────────────────────────────

  type DragInfo = {
    domainId: string
    x: number; y: number
    offsetX: number; offsetY: number
    width: number
  }
  const [dragging, setDragging] = useState<DragInfo | null>(null)
  const draggingRef = useRef<DragInfo | null>(null)
  draggingRef.current = dragging

  const [dropCol, setDropCol] = useState<number | null>(null)
  const [dropPos, setDropPos] = useState<number>(0)
  const dropColRef = useRef<number | null>(null)
  const dropPosRef = useRef<number>(0)
  dropColRef.current = dropCol
  dropPosRef.current = dropPos

  const colRefs = useRef<(HTMLDivElement | null)[]>([])
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!dragging) return

    function computeDropPos(colIdx: number, mouseY: number): number {
      const col = columns[colIdx] ?? []
      for (let i = 0; i < col.length; i++) {
        if (col[i] === dragging!.domainId) continue // skip the dragging card's slot
        const el = cardRefs.current[col[i]]
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (mouseY < r.top + r.height / 2) return i
      }
      return col.length
    }

    function onMove(e: MouseEvent) {
      setDragging((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : null))
      for (let i = 0; i < colRefs.current.length; i++) {
        const el = colRefs.current[i]
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (e.clientX >= r.left && e.clientX <= r.right) {
          setDropCol(i)
          setDropPos(computeDropPos(i, e.clientY))
          return
        }
      }
      setDropCol(null)
    }

    function onUp() {
      const d = draggingRef.current
      const col = dropColRef.current
      const pos = dropPosRef.current
      if (d && col !== null) {
        setColumns((prev) => {
          // Remove from all columns
          const next = prev.map((c) => c.filter((id) => id !== d.domainId))
          // Adjust pos if same column and item was before the drop target
          const srcCol = prev.findIndex((c) => c.includes(d.domainId))
          let adjPos = pos
          if (srcCol === col) {
            const srcIdx = prev[srcCol].indexOf(d.domainId)
            if (srcIdx < pos) adjPos = Math.max(0, pos - 1)
          }
          next[col] = [...next[col].slice(0, adjPos), d.domainId, ...next[col].slice(adjPos)]
          saveBoard({ columns: next })
          return next
        })
      }
      setDragging(null); setDropCol(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!dragging])

  function startDrag(e: React.MouseEvent, domainId: string, rect: DOMRect) {
    e.preventDefault()
    setDragging({ domainId, x: e.clientX, y: e.clientY, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, width: rect.width })
  }

  // ─── Column management ─────────────────────────────────────────────────────

  function addColumn() {
    setColumns((prev) => { const next = [...prev, []]; saveBoard({ columns: next }); return next })
  }

  function removeColumn(colIdx: number) {
    setColumns((prev) => {
      if (prev.length <= 1) return prev
      const domainsToMove = prev[colIdx]
      const next = prev.filter((_, i) => i !== colIdx)
      // Move orphaned domains to the closest remaining column
      const targetCol = Math.max(0, colIdx - 1) < next.length ? Math.max(0, colIdx - 1) : 0
      if (domainsToMove.length > 0) next[targetCol] = [...next[targetCol], ...domainsToMove]
      saveBoard({ columns: next })
      return next
    })
  }

  // ─── Domain updates ────────────────────────────────────────────────────────

  async function handleUpdateName(id: string, name: string) {
    const existing = domains.find((d) => d.id === id)
    if (existing) updateDomain({ ...existing, name })
    const res = await fetch(`/api/domains?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    if (res.ok) updateDomain(await res.json())
  }

  async function handleUpdateIcon(id: string, icon: string) {
    const existing = domains.find((d) => d.id === id)
    if (existing) updateDomain({ ...existing, icon })
    const res = await fetch(`/api/domains?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ icon }) })
    if (res.ok) updateDomain(await res.json())
  }

  // ─── Color picker ──────────────────────────────────────────────────────────

  type ColorEdit = { domainId: string; x: number; y: number }
  const [colorEdit, setColorEdit] = useState<ColorEdit | null>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const openColorEdit = useCallback((id: string, rect: DOMRect) => {
    setColorEdit({ domainId: id, x: rect.left + rect.width / 2, y: rect.bottom + 6 })
  }, [])

  useEffect(() => {
    if (!colorEdit) return
    function onDown(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorEdit(null)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [!!colorEdit])

  async function handleUpdateColor(id: string, color: string) {
    const existing = domains.find((d) => d.id === id)
    if (existing) updateDomain({ ...existing, color })
    setColorEdit(null)
    const res = await fetch(`/api/domains?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color }) })
    if (res.ok) updateDomain(await res.json())
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const draggingDomain = dragging ? domains.find((d) => d.id === dragging.domainId) : null

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ userSelect: dragging ? 'none' : undefined }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Board</p>
        <div className="flex items-center gap-1">
          <button onClick={addColumn}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors"
          >
            <Plus size={12} /> Column
          </button>
          <SettingsModal />
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <div className="flex gap-3 items-start min-h-full pb-4" style={{ minWidth: columns.length * 180 }}>
          {columns.map((colIds, colIdx) => {
            const colDomains = colIds.map((id) => domains.find((d) => d.id === id)).filter(Boolean) as Domain[]
            const isDropTarget = dropCol === colIdx && !!dragging

            return (
              <div key={colIdx} className="flex-1 min-w-[180px] flex flex-col group/col">
                {/* Column remove button */}
                <div className="flex justify-end h-5 mb-1">
                  {columns.length > 1 && (
                    <button
                      onClick={() => removeColumn(colIdx)}
                      className="opacity-0 group-hover/col:opacity-100 text-zinc-300 hover:text-red-400 transition-all"
                      title="Remove column"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div
                  ref={(el) => { colRefs.current[colIdx] = el }}
                  className={`flex flex-col gap-2 rounded-xl p-1.5 flex-1 transition-colors ${isDropTarget ? 'bg-zinc-100/70' : ''}`}
                >
                  {colDomains.map((domain, domIdx) => {
                    const showDropBefore = isDropTarget && dropPos === domIdx
                    const accentColor = draggingDomain?.color ?? '#FF5149'
                    return (
                      <div key={domain.id}>
                        {showDropBefore && <DropLine color={accentColor} />}
                        <DomainCard
                          domain={domain}
                          templates={taskTemplates.filter((t) => t.domain_id === domain.id)}
                          isDragging={dragging?.domainId === domain.id}
                          cardRef={(el) => { cardRefs.current[domain.id] = el }}
                          onDragStart={startDrag}
                          activeTemplateId={activeTaskTemplate?.id ?? null}
                          onActivate={(t) => setActiveTaskTemplate(activeTaskTemplate?.id === t.id ? null : t)}
                          onUpdateName={handleUpdateName}
                          onUpdateIcon={handleUpdateIcon}
                          onEditColor={openColorEdit}
                        />
                      </div>
                    )
                  })}

                  {/* Drop line at end of column */}
                  {isDropTarget && dropPos === colDomains.length && (
                    <DropLine color={draggingDomain?.color ?? '#FF5149'} />
                  )}

                  {/* Add domain */}
                  {addingInCol === colIdx ? (
                    <AddDomainForm
                      onAdded={(d) => {
                        setColumns((prev) => {
                          const next = prev.map((c) => [...c])
                          next[colIdx] = [...next[colIdx], d.id]
                          saveBoard({ columns: next })
                          return next
                        })
                        setAddingInCol(null)
                      }}
                      onCancel={() => setAddingInCol(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setAddingInCol(colIdx)}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-zinc-200 text-[11px] text-zinc-400 hover:border-zinc-300 hover:text-zinc-500 transition-colors"
                    >
                      <Plus size={11} /> Add domain
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating color picker */}
      {colorEdit && (
        <div
          ref={colorPickerRef}
          className="fixed z-50 bg-white border border-zinc-200 rounded-xl shadow-xl p-2.5"
          style={{ left: colorEdit.x, top: colorEdit.y, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1.5 flex-wrap" style={{ width: 132 }}>
            {PRESET_COLORS.map((c) => {
              const domain = domains.find((d) => d.id === colorEdit.domainId)
              const isSelected = domain?.color === c
              return (
                <button
                  key={c}
                  onClick={() => handleUpdateColor(colorEdit.domainId, c)}
                  className={`w-5 h-5 rounded-full flex-shrink-0 transition-transform ${isSelected ? 'scale-125 ring-2 ring-[#FF5149] ring-offset-1' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Floating ghost */}
      {dragging && draggingDomain && (
        <div
          className="fixed pointer-events-none z-50 rounded-xl border border-zinc-200 bg-white shadow-2xl"
          style={{
            left: dragging.x - dragging.offsetX,
            top: dragging.y - dragging.offsetY,
            width: dragging.width,
            transform: 'rotate(2deg) scale(1.02)',
            opacity: 0.95,
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2.5">
            <DomainIcon name={draggingDomain.icon} size={13} style={{ color: draggingDomain.color }} />
            <span className="text-sm font-semibold text-zinc-800 flex-1 truncate">{draggingDomain.name}</span>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: draggingDomain.color }} />
          </div>
        </div>
      )}
    </div>
  )
}
