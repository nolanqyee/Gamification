-- Migration v3: Add description to task_logs
ALTER TABLE task_logs ADD COLUMN IF NOT EXISTS description text;
