'use client'

import { useState, useEffect } from 'react'
import { Settings, X } from 'lucide-react'
import { DomainManager } from './DomainManager'
import { TaskTemplateManager } from './TaskTemplateManager'
import { useAppStore } from '@/store/useAppStore'
import type { Domain, TaskTemplate } from '@/lib/database.types'

type Tab = 'domains' | 'templates'

export function SettingsModal() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('domains')
  const setDomains = useAppStore((s) => s.setDomains)
  const setTaskTemplates = useAppStore((s) => s.setTaskTemplates)

  useEffect(() => {
    if (!open) return
    fetch('/api/domains').then(r => r.json()).then((d: Domain[]) => setDomains(d)).catch(console.error)
    fetch('/api/task-templates').then(r => r.json()).then((d: TaskTemplate[]) => setTaskTemplates(d)).catch(console.error)
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setDomains, setTaskTemplates])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        title="Settings"
      >
        <Settings size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <div className="relative z-10 bg-white border border-zinc-200 rounded-2xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-800">Settings</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex px-5 pt-3 border-b border-zinc-100">
              {([['domains', 'Domains'], ['templates', 'Task Templates']] as [Tab, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === key
                      ? 'border-[#FF5149] text-[#FF5149]'
                      : 'border-transparent text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === 'domains' ? <DomainManager /> : <TaskTemplateManager />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
