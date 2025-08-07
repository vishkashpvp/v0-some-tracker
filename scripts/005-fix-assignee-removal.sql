-- This script was intended to fix assignee removal.
-- It's superseded by 006-final-assignee-removal.sql, but included for historical context.
-- No changes needed here, as the final removal is handled by 006.

-- First, update existing tasks to have a default value for assignee
UPDATE tasks SET assignee = 'System' WHERE assignee IS NULL;

-- Now we can safely drop the NOT NULL constraint
ALTER TABLE tasks ALTER COLUMN assignee DROP NOT NULL;

-- Then drop the column entirely
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee;

-- Also clean up the task_deletion_requests table
UPDATE task_deletion_requests SET assignee = NULL WHERE assignee IS NOT NULL;
ALTER TABLE task_deletion_requests DROP COLUMN IF EXISTS assignee;

-- Make sure all existing tasks are properly set up
UPDATE tasks SET 
  approval_status = COALESCE(approval_status, 'approved'),
  requested_by = COALESCE(requested_by, 'System')
WHERE approval_status IS NULL OR requested_by IS NULL;
