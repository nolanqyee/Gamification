import { create } from 'zustand'
import type { Domain, TaskTemplate, TaskLog, HeatmapDayData, DomainPoints } from '@/lib/database.types'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

interface AppState {
  activeDate: string
  hoveredDate: string | null
  activeTaskTemplate: TaskTemplate | null
  pendingDescription: string
  domains: Domain[]
  taskTemplates: TaskTemplate[]
  taskLogsForActiveDay: TaskLog[]
  // date → { total, domains[] }
  heatmapData: Record<string, HeatmapDayData>

  setActiveDate: (date: string) => void
  setHoveredDate: (date: string | null) => void
  setActiveTaskTemplate: (template: TaskTemplate | null) => void
  setPendingDescription: (desc: string) => void
  setDomains: (domains: Domain[]) => void
  updateDomain: (domain: Domain) => void
  setTaskTemplates: (templates: TaskTemplate[]) => void
  updateTaskTemplate: (template: TaskTemplate) => void
  removeTaskTemplate: (id: string) => void
  setTaskLogsForActiveDay: (logs: TaskLog[]) => void
  addTaskLog: (log: TaskLog) => void
  updateTaskLog: (log: TaskLog) => void
  setHeatmapData: (data: Record<string, HeatmapDayData>) => void
  addHeatmapPoints: (date: string, points: number, domainPoints: DomainPoints) => void
  refreshHeatmap: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  activeDate: todayStr(),
  hoveredDate: null,
  activeTaskTemplate: null,
  pendingDescription: '',
  domains: [],
  taskTemplates: [],
  taskLogsForActiveDay: [],
  heatmapData: {},

  setActiveDate: (date) => set({ activeDate: date }),
  setHoveredDate: (date) => set({ hoveredDate: date }),
  setActiveTaskTemplate: (template) => set({ activeTaskTemplate: template, pendingDescription: '' }),
  setPendingDescription: (desc) => set({ pendingDescription: desc }),
  setDomains: (domains) => set({ domains }),
  updateDomain: (domain) =>
    set((state) => ({ domains: state.domains.map((d) => (d.id === domain.id ? domain : d)) })),
  setTaskTemplates: (templates) => set({ taskTemplates: templates }),
  updateTaskTemplate: (template) =>
    set((state) => ({ taskTemplates: state.taskTemplates.map((t) => (t.id === template.id ? template : t)) })),
  removeTaskTemplate: (id) =>
    set((state) => ({ taskTemplates: state.taskTemplates.filter((t) => t.id !== id) })),
  setTaskLogsForActiveDay: (logs) => set({ taskLogsForActiveDay: logs }),
  addTaskLog: (log) =>
    set((state) => ({ taskLogsForActiveDay: [...state.taskLogsForActiveDay, log] })),
  updateTaskLog: (log) =>
    set((state) => ({
      taskLogsForActiveDay: state.taskLogsForActiveDay.map((l) => (l.id === log.id ? log : l)),
    })),
  setHeatmapData: (data) => set({ heatmapData: data }),

  addHeatmapPoints: (date, points, domainPoint) =>
    set((state) => {
      const existing = state.heatmapData[date] ?? { total: 0, domains: [] }
      const domainIdx = existing.domains.findIndex((d) => d.domain_id === domainPoint.domain_id)
      const updatedDomains = [...existing.domains]
      if (domainIdx >= 0) {
        updatedDomains[domainIdx] = {
          ...updatedDomains[domainIdx],
          total_points: updatedDomains[domainIdx].total_points + points,
          total_minutes: updatedDomains[domainIdx].total_minutes + (domainPoint.total_minutes ?? 0),
        }
      } else {
        updatedDomains.push({ ...domainPoint, total_points: points })
      }
      return {
        heatmapData: {
          ...state.heatmapData,
          [date]: { total: existing.total + points, domains: updatedDomains },
        },
      }
    }),

  refreshHeatmap: async () => {
    const res = await fetch('/api/heatmap')
    const data = await res.json()
    set({ heatmapData: data })
  },
}))
