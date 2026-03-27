import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('task_logs')
    .select(`
      points_earned,
      task_template:task_templates (
        domain:domains (
          id,
          name,
          color
        )
      )
    `)
    .eq('date', date)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate by domain
  const domainMap: Record<string, { name: string; color: string; points: number }> = {}

  for (const row of data ?? []) {
    const template = row.task_template as any
    const domain = template?.domain
    if (!domain) continue
    if (!domainMap[domain.id]) {
      domainMap[domain.id] = { name: domain.name, color: domain.color, points: 0 }
    }
    domainMap[domain.id].points += row.points_earned
  }

  const breakdown = Object.entries(domainMap).map(([id, val]) => ({
    domain_id: id,
    domain_name: val.name,
    domain_color: val.color,
    total_points: val.points,
  }))

  const total = breakdown.reduce((sum, d) => sum + d.total_points, 0)

  return NextResponse.json({ total, breakdown })
}
