import type { TaskLog } from '@/lib/database.types'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export interface PositionedLog {
  log: TaskLog
  startMin: number
  endMin: number
  column: number
  totalColumns: number
}

/**
 * Assigns column positions to overlapping task logs.
 * Uses a greedy interval-graph coloring approach.
 */
export function computePositions(logs: TaskLog[]): PositionedLog[] {
  if (logs.length === 0) return []

  const items = logs.map((log) => {
    const startMin = timeToMinutes(log.start_time)
    const endMin = log.end_time
      ? timeToMinutes(log.end_time)
      : startMin + (log.duration_minutes ?? 15)
    return { log, startMin, endMin }
  })

  // Sort by start time
  items.sort((a, b) => a.startMin - b.startMin)

  // Assign columns greedily
  const columns: number[] = [] // tracks end minute of last item in each column
  const assigned: Array<typeof items[0] & { column: number }> = []

  for (const item of items) {
    let placed = false
    for (let col = 0; col < columns.length; col++) {
      if (columns[col] <= item.startMin) {
        columns[col] = item.endMin
        assigned.push({ ...item, column: col })
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push(item.endMin)
      assigned.push({ ...item, column: columns.length - 1 })
    }
  }

  // Determine totalColumns for each item based on overlapping group
  const result: PositionedLog[] = assigned.map((item) => {
    // Find max column among all items that overlap with this item
    const maxCol = assigned
      .filter((other) => other.startMin < item.endMin && other.endMin > item.startMin)
      .reduce((max, other) => Math.max(max, other.column), 0)

    return {
      log: item.log,
      startMin: item.startMin,
      endMin: item.endMin,
      column: item.column,
      totalColumns: maxCol + 1,
    }
  })

  return result
}
