'use client'

import React from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatHour(h: number): string {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

// Width of the time label column — must match left-10 (40px)
export const TIME_LABEL_WIDTH = 40
// Top offset so the 12am label isn't clipped — hour lines are at (h*60 + TOP_OFFSET)px
export const TIMELINE_TOP_OFFSET = 12
// Total pixel height of the timeline grid
export const TIMELINE_HEIGHT = 24 * 60 + TIMELINE_TOP_OFFSET

interface Props {
  children?: React.ReactNode
}

export function TimelineGrid({ children }: Props) {
  return (
    // pt-3 ensures the 12am label has room above the top line and doesn't clip
    <div className="relative pt-3" style={{ height: `${24 * 60 + 12}px` }}>
      {HOURS.map((h) => (
        <div
          key={h}
          className="absolute w-full flex items-start"
          style={{ top: `${h * 60 + 12}px`, height: 60 }}
        >
          <span className="text-[9px] text-zinc-400 font-medium leading-none"
            style={{ width: TIME_LABEL_WIDTH, textAlign: 'right', paddingRight: 6, marginTop: -5 }}
          >
            {formatHour(h)}
          </span>
          <div className="flex-1 border-t border-zinc-200" />
        </div>
      ))}
      {/* Content area for blocks — positioned inside the label column */}
      <div className="absolute top-0 bottom-0 right-0" style={{ left: TIME_LABEL_WIDTH }}>
        {children}
      </div>
    </div>
  )
}
