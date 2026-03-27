import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('task_logs')
    .select(`
      date,
      points_earned,
      duration_minutes,
      task_template:task_templates (
        domain:domains ( id, name, color )
      )
    `)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate: date → { total, domains: { [id]: { name, color, points, minutes } } }
  const map: Record<string, {
    total: number
    domains: Record<string, { name: string; color: string; points: number; minutes: number }>
  }> = {}

  for (const row of data ?? []) {
    const domain = (row.task_template as any)?.domain
    if (!map[row.date]) map[row.date] = { total: 0, domains: {} }
    map[row.date].total += row.points_earned
    if (domain?.id) {
      if (!map[row.date].domains[domain.id]) {
        map[row.date].domains[domain.id] = { name: domain.name, color: domain.color, points: 0, minutes: 0 }
      }
      map[row.date].domains[domain.id].points += row.points_earned
      map[row.date].domains[domain.id].minutes += row.duration_minutes ?? 0
    }
  }

  // Serialize to final shape
  const result: Record<string, {
    total: number
    domains: Array<{ domain_id: string; domain_name: string; domain_color: string; total_points: number; total_minutes: number }>
  }> = {}

  for (const [date, val] of Object.entries(map)) {
    result[date] = {
      total: val.total,
      domains: Object.entries(val.domains).map(([id, d]) => ({
        domain_id: id,
        domain_name: d.name,
        domain_color: d.color,
        total_points: d.points,
        total_minutes: d.minutes,
      })),
    }
  }

  return NextResponse.json(result)
}
