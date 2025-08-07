-- Add is_deleted column to tasks table for soft deletion
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add deleted_at column to tasks table to record when a task was deleted
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ensure existing tasks are not marked as deleted by default
UPDATE tasks SET is_deleted = FALSE WHERE is_deleted IS NULL;
