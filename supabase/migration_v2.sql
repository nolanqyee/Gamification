-- Migration V2: Add icon to domains, update unit_minutes to hour-based units

-- 1. Add icon column to domains
alter table domains
  add column if not exists icon text;

-- 2. Update existing domain seed data with icons
update domains set icon = 'dumbbell'  where name = 'Fitness';
update domains set icon = 'code-2'    where name = 'Coding';
update domains set icon = 'music'     where name = 'Music';
update domains set icon = 'briefcase' where name = 'Career';
update domains set icon = 'users'     where name = 'Social';

-- 3. Update duration task templates to use hour-based unit_minutes (60 min = 1 hr)
--    Points are now earned per hour rather than per 5 minutes.
--    Old: 1pt / 5min  →  New: 12pt / 60min  (equivalent)
--    Or simpler: 1pt / 60min (1pt per hour) for clarity

-- Gym: 1pt per 5min → update to 1pt per 60min (1pt/hr) ... or keep fine-grained
-- We'll set unit_minutes = 60 and adjust points_per_unit accordingly for whole-hour billing:
--   Gym: was 1pt/5min = 12pt/hr → set to 12pt / 60min
--   Run: was 1pt/5min = 12pt/hr → 12pt / 60min
--   Deep Work: was 2pt/5min = 24pt/hr → 24pt / 60min
--   Songwriting: 1pt/5min = 12pt/hr → 12pt / 60min
--   Practice: 1pt/5min = 12pt/hr → 12pt / 60min
--   Reading: 1pt/5min = 12pt/hr → 12pt / 60min
--   Hang Out: was 1pt/10min = 6pt/hr → 6pt / 60min

update task_templates set unit_minutes = 60, points_per_unit = 12
where name = 'Gym';

update task_templates set unit_minutes = 60, points_per_unit = 12
where name = 'Run';

update task_templates set unit_minutes = 60, points_per_unit = 24
where name = 'Deep Work';

update task_templates set unit_minutes = 60, points_per_unit = 12
where name = 'Songwriting';

update task_templates set unit_minutes = 60, points_per_unit = 12
where name = 'Practice';

update task_templates set unit_minutes = 60, points_per_unit = 12
where name = 'Reading';

update task_templates set unit_minutes = 60, points_per_unit = 6
where name = 'Hang Out';

-- 4. (Optional) Re-seed domains with icons if starting fresh
-- Uncomment below if you prefer to truncate and re-seed:
-- truncate task_templates, domains restart identity cascade;
-- (then re-run schema.sql with icon values included)
