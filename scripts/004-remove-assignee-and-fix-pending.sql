-- Remove assignee column from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee;

-- Update existing tasks to remove assignee references
UPDATE tasks SET assignee = NULL WHERE assignee IS NOT NULL;

-- Remove assignee from deletion requests table as well
ALTER TABLE task_deletion_requests DROP COLUMN IF EXISTS assignee;

-- Ensure all existing tasks are marked as approved (for migration)
UPDATE tasks SET approval_status = 'approved' WHERE approval_status IS NULL;

-- This script was intended to remove the assignee column.
-- It's superseded by 006-final-assignee-removal.sql, but included for historical context.
-- No changes needed here, as the final removal is handled by 006.
