'use client'

import { useAppStore } from '@/store/useAppStore'
import type { TaskTemplate } from '@/lib/database.types'

interface Props {
  template: TaskTemplate
}

export function TaskButton({ template }: Props) {
  const activeTaskTemplate = useAppStore((s) => s.activeTaskTemplate)
  const setActiveTaskTemplate = useAppStore((s) => s.setActiveTaskTemplate)

  const isActive = activeTaskTemplate?.id === template.id
  const domainColor = template.domain?.color ?? '#6b7280'

  return (
    <button
      onClick={() => setActiveTaskTemplate(isActive ? null : template)}
      className={`
        w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100
        flex items-center gap-2 group
        ${isActive ? 'text-zinc-900' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'}
      `}
      style={
        isActive
          ? { backgroundColor: domainColor + '18', borderLeft: `3px solid ${domainColor}` }
          : { borderLeft: '3px solid transparent' }
      }
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: domainColor }} />
      <span className="flex-1 truncate">{template.name}</span>
      <span className="text-[10px] text-zinc-400 flex-shrink-0">
        {template.type === 'completion'
          ? `${template.points_per_unit}pt`
          : template.unit_minutes === 60
            ? `${template.points_per_unit}pt/hr`
            : `${template.points_per_unit}pt/${template.unit_minutes}m`}
      </span>
    </button>
  )
}
