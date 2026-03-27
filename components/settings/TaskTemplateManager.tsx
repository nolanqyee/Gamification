'use client'

import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { DomainIcon } from './DomainIcon'
import { useAppStore } from '@/store/useAppStore'
import type { TaskTemplate } from '@/lib/database.types'

export function TaskTemplateManager() {
  const domains = useAppStore((s) => s.domains)
  const taskTemplates = useAppStore((s) => s.taskTemplates)
  const setTaskTemplates = useAppStore((s) => s.setTaskTemplates)

  const [name, setName] = useState('')
  const [domainId, setDomainId] = useState('')
  const [type, setType] = useState<'completion' | 'duration'>('completion')
  const [pointsPerUnit, setPointsPerUnit] = useState('10')
  const [unitMinutes, setUnitMinutes] = useState('60')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!name.trim()) { setError('Name required'); return }
    if (!domainId) { setError('Domain required'); return }
    setSaving(true); setError('')
    const body: any = { name: name.trim(), domain_id: domainId, type, points_per_unit: parseInt(pointsPerUnit) || 1 }
    if (type === 'duration') { body.unit_minutes = parseInt(unitMinutes) || 60; body.default_duration_minutes = body.unit_minutes }
    const res = await fetch('/api/task-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data: TaskTemplate = await res.json()
    if (!res.ok) { setError((data as any).error ?? 'Error'); setSaving(false); return }
    setTaskTemplates([...taskTemplates, data])
    setName(''); setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/task-templates?id=${id}`, { method: 'DELETE' })
    if (res.ok) setTaskTemplates(taskTemplates.filter((t) => t.id !== id))
  }

  const grouped = taskTemplates.reduce<Record<string, TaskTemplate[]>>((acc, t) => {
    const key = t.domain?.name ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {Object.entries(grouped).map(([domainName, templates]) => {
          const domain = templates[0]?.domain
          return (
            <div key={domainName}>
              <div className="flex items-center gap-1.5 mb-1">
                {domain && <DomainIcon name={domain.icon} size={11} style={{ color: domain.color }} />}
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{domainName}</span>
              </div>
              {templates.map((t) => (
                <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 group">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.domain?.color ?? '#6b7280' }} />
                  <span className="flex-1 text-sm text-zinc-700">{t.name}</span>
                  <span className="text-[10px] text-zinc-400">
                    {t.type === 'completion' ? `${t.points_per_unit}pt` : `${t.points_per_unit}pt/${t.unit_minutes}m`}
                  </span>
                  <span className="text-[10px] text-zinc-300 capitalize">{t.type}</span>
                  <button onClick={() => handleDelete(t.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )
        })}
        {taskTemplates.length === 0 && <p className="text-xs text-zinc-400 px-2">No templates yet.</p>}
      </div>

      <div className="border-t border-zinc-100 pt-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Add Template</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Task name"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#FF5149]/60"
        />
        <select value={domainId} onChange={(e) => setDomainId(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:border-[#FF5149]/60"
        >
          <option value="">Select domain...</option>
          {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="flex rounded-lg overflow-hidden border border-zinc-200">
          {(['completion', 'duration'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors capitalize ${type === t ? 'text-white' : 'text-zinc-500 hover:text-zinc-700 bg-white'}`}
              style={type === t ? { backgroundColor: '#FF5149' } : undefined}
            >{t}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-zinc-400 block mb-1">{type === 'completion' ? 'Points' : 'Points per unit'}</label>
            <input type="number" value={pointsPerUnit} onChange={(e) => setPointsPerUnit(e.target.value)} min={1}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-[#FF5149]/60"
            />
          </div>
          {type === 'duration' && (
            <div className="flex-1">
              <label className="text-xs text-zinc-400 block mb-1">Unit (minutes)</label>
              <input type="number" value={unitMinutes} onChange={(e) => setUnitMinutes(e.target.value)} min={1}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-[#FF5149]/60"
              />
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={handleAdd} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-50 text-white text-sm rounded-lg transition-colors w-full justify-center" style={{ backgroundColor: '#FF5149' }}
        >
          <Plus size={13} /> Add Template
        </button>
      </div>
    </div>
  )
}
