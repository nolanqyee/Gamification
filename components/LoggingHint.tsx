'use client'

import { useAppStore } from '@/store/useAppStore'

export function LoggingHint() {
  const activeTaskTemplate = useAppStore((s) => s.activeTaskTemplate)
  const setActiveTaskTemplate = useAppStore((s) => s.setActiveTaskTemplate)
  const pendingDescription = useAppStore((s) => s.pendingDescription)
  const setPendingDescription = useAppStore((s) => s.setPendingDescription)

  if (!activeTaskTemplate) return null

  const color = activeTaskTemplate.domain?.color ?? '#6b7280'

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div
        className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-2xl shadow-lg px-4 py-3 w-80"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-zinc-800 flex-1">{activeTaskTemplate.name}</span>
          <span className="text-xs text-zinc-400">
            {activeTaskTemplate.type === 'completion' ? 'click or drag' : 'drag on timeline'}
          </span>
          <button
            onClick={() => setActiveTaskTemplate(null)}
            className="text-zinc-400 hover:text-zinc-600 text-xs leading-none ml-1 transition-colors"
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>
        <input
          value={pendingDescription}
          onChange={(e) => setPendingDescription(e.target.value)}
          placeholder="Add a note (optional)"
          className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 placeholder-zinc-400 outline-none focus:border-[#FF5149]/60 w-full"
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}
