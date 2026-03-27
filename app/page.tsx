'use client'

import dynamic from 'next/dynamic'

const CalendarPanel = dynamic(() => import('@/components/calendar/CalendarPanel').then(m => m.CalendarPanel), { ssr: false })
const TaskListPanel = dynamic(() => import('@/components/tasks/TaskListPanel').then(m => m.TaskListPanel), { ssr: false })
const DayTimeline = dynamic(() => import('@/components/timeline/DayTimeline').then(m => m.DayTimeline), { ssr: false })
const QuickAdd = dynamic(() => import('@/components/QuickAdd').then(m => m.QuickAdd), { ssr: false })
const LoggingHint = dynamic(() => import('@/components/LoggingHint').then(m => m.LoggingHint), { ssr: false })

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7]">
      {/* Calendar Panel — fixed width */}
      <aside className="w-[320px] flex-shrink-0 border-r border-zinc-200 p-5 overflow-y-auto flex flex-col bg-white">
        <CalendarPanel />
      </aside>

      {/* Task List Panel — widest */}
      <aside className="flex-1 min-w-0 border-r border-zinc-200 p-5 overflow-hidden flex flex-col bg-white">
        <TaskListPanel />
      </aside>

      {/* Day Timeline Panel — fixed width */}
      <main className="w-[360px] flex-shrink-0 overflow-hidden flex flex-col p-5 bg-[#f5f5f7]">
        <DayTimeline />
      </main>

      {/* Global overlays */}
      <QuickAdd />
      <LoggingHint />
    </div>
  )
}
