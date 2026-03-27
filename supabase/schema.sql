-- Productivity Gamification App Schema

-- Domains (life categories)
create table if not exists domains (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null,
  icon text
);

-- Task Templates
create table if not exists task_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain_id uuid not null references domains(id) on delete cascade,
  type text not null check (type in ('duration', 'completion')),
  points_per_unit integer not null default 1,
  unit_minutes integer,
  default_duration_minutes integer,
  color text
);

-- Task Logs
create table if not exists task_logs (
  id uuid primary key default gen_random_uuid(),
  task_template_id uuid not null references task_templates(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time,
  duration_minutes integer,
  points_earned integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index for fast calendar queries
create index if not exists task_logs_date_idx on task_logs(date);

-- Seed Data: Domains
insert into domains (name, color, icon) values
  ('Fitness',  '#22c55e', 'dumbbell'),
  ('Coding',   '#3b82f6', 'code-2'),
  ('Music',    '#a855f7', 'music'),
  ('Career',   '#f59e0b', 'briefcase'),
  ('Social',   '#ec4899', 'users')
on conflict (name) do nothing;

-- Seed Data: Task Templates
-- Duration tasks: unit_minutes = 60 (points per hour)

insert into task_templates (name, domain_id, type, points_per_unit, unit_minutes, default_duration_minutes)
select 'Gym', id, 'duration', 12, 60, 60
from domains where name = 'Fitness'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit, unit_minutes, default_duration_minutes)
select 'Run', id, 'duration', 12, 60, 30
from domains where name = 'Fitness'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit)
select 'Workout Complete', id, 'completion', 15
from domains where name = 'Fitness'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit)
select 'Leetcode', id, 'completion', 10
from domains where name = 'Coding'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit, unit_minutes, default_duration_minutes)
select 'Deep Work', id, 'duration', 24, 60, 90
from domains where name = 'Coding'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit)
select 'Code Review', id, 'completion', 5
from domains where name = 'Coding'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit, unit_minutes, default_duration_minutes)
select 'Songwriting', id, 'duration', 12, 60, 60
from domains where name = 'Music'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit, unit_minutes, default_duration_minutes)
select 'Practice', id, 'duration', 12, 60, 60
from domains where name = 'Music'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit)
select 'Networking', id, 'completion', 8
from domains where name = 'Career'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit, unit_minutes, default_duration_minutes)
select 'Reading', id, 'duration', 12, 60, 30
from domains where name = 'Career'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit)
select 'Catch Up', id, 'completion', 5
from domains where name = 'Social'
on conflict do nothing;

insert into task_templates (name, domain_id, type, points_per_unit, unit_minutes, default_duration_minutes)
select 'Hang Out', id, 'duration', 6, 60, 60
from domains where name = 'Social'
on conflict do nothing;
