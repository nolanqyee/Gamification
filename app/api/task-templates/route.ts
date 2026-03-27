import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('task_templates')
    .select(`*, domain:domains (*)`)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, domain_id, type, points_per_unit, unit_minutes, default_duration_minutes } = body

  const { data, error } = await supabase
    .from('task_templates')
    .insert({ name, domain_id, type, points_per_unit, unit_minutes: unit_minutes ?? null, default_duration_minutes: default_duration_minutes ?? null })
    .select(`*, domain:domains (*)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.type !== undefined) updates.type = body.type
  if (body.points_per_unit !== undefined) updates.points_per_unit = body.points_per_unit
  if (body.unit_minutes !== undefined) updates.unit_minutes = body.unit_minutes
  if (body.default_duration_minutes !== undefined) updates.default_duration_minutes = body.default_duration_minutes

  const { data, error } = await supabase
    .from('task_templates')
    .update(updates)
    .eq('id', id)
    .select(`*, domain:domains (*)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('task_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
