'use client'

import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { DomainIcon } from './DomainIcon'
import { useAppStore } from '@/store/useAppStore'
import type { Domain } from '@/lib/database.types'

const PRESET_COLORS = [
  '#D40001', '#E67C73', '#F4511E', '#F6BF27', '#34B679',
  '#0A8043', '#039BE5', '#3F51B5', '#7986CB', '#8E24AA', '#616161',
]

export function DomainManager() {
  const domains = useAppStore((s) => s.domains)
  const setDomains = useAppStore((s) => s.setDomains)

  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon, setIcon] = useState('star')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!name.trim()) { setError('Name required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), color, icon }),
    })
    const data: Domain = await res.json()
    if (!res.ok) { setError((data as any).error ?? 'Error'); setSaving(false); return }
    setDomains([...domains, data])
    setName('')
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/domains?id=${id}`, { method: 'DELETE' })
    if (res.ok) setDomains(domains.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {domains.map((d) => (
          <div key={d.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-zinc-50 group">
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: d.color + '22' }}>
              <DomainIcon name={d.icon} size={12} style={{ color: d.color }} />
            </div>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="flex-1 text-sm text-zinc-700">{d.name}</span>
            <button onClick={() => handleDelete(d.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {domains.length === 0 && <p className="text-xs text-zinc-400 px-2">No domains yet.</p>}
      </div>

      <div className="border-t border-zinc-100 pt-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Add Domain</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Domain name"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#FF5149]/60"
        />
        <div>
          <p className="text-xs text-zinc-400 mb-1.5">Color</p>
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125' : 'hover:scale-110'}`}
                style={{ backgroundColor: c, ...(color === c ? { outline: `2px solid #FF5149`, outlineOffset: 2 } : {}) }}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-1.5">Icon</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '22' }}>
              <DomainIcon name={icon} size={15} style={{ color }} />
            </div>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value.toLowerCase().trim())}
              placeholder="e.g. dumbbell, brain, code-2"
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#FF5149]/60"
            />
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5">Any <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer" className="underline">Lucide icon</a> name in kebab-case</p>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={handleAdd} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-50 text-white text-sm rounded-lg transition-colors w-full justify-center" style={{ backgroundColor: '#FF5149' }}
        >
          <Plus size={13} /> Add Domain
        </button>
      </div>
    </div>
  )
}
