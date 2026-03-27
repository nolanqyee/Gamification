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
      *,
      task_template:task_templates (
        *,
        domain:domains (*)
      )
    `)
    .eq('date', date)
    .order('start_time', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const body = await request.json()
  const { task_template_id, date, start_time, end_time, duration_minutes, points_earned, description } = body

  const { data, error } = await supabase
    .from('task_logs')
    .insert({ task_template_id, date, start_time, end_time, duration_minutes, points_earned, description: description ?? null })
    .select(`
      *,
      task_template:task_templates (
        *,
        domain:domains (*)
      )
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const body = await request.json()
  const { start_time, end_time, duration_minutes, points_earned } = body

  const update: Record<string, unknown> = { start_time, end_time, duration_minutes }
  if (points_earned !== undefined) update.points_earned = points_earned

  const { data, error } = await supabase
    .from('task_logs')
    .update(update)
    .eq('id', id)
    .select(`
      *,
      task_template:task_templates (
        *,
        domain:domains (*)
      )
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase.from('task_logs').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
