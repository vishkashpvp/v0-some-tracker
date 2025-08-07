DO $$
BEGIN
    -- Check if the 'assignee' column exists in the 'tasks' table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assignee') THEN
        -- If it exists, first try to drop the NOT NULL constraint if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assignee' AND is_nullable = 'NO') THEN
            ALTER TABLE tasks ALTER COLUMN assignee DROP NOT NULL;
        END IF;
        -- Then drop the column
        ALTER TABLE tasks DROP COLUMN assignee;
    END IF;

    -- Do the same for 'task_deletion_requests' if 'assignee' column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_deletion_requests' AND column_name='assignee') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_deletion_requests' AND column_name='assignee' AND is_nullable = 'NO') THEN
            ALTER TABLE task_deletion_requests ALTER COLUMN assignee DROP NOT NULL;
        END IF;
        ALTER TABLE task_deletion_requests DROP COLUMN assignee;
    END IF;
END $$;

-- Ensure all existing tasks have a default for requested_by and approval_status
UPDATE tasks SET 
  approval_status = COALESCE(approval_status, 'approved'),
  requested_by = COALESCE(requested_by, 'System')
WHERE approval_status IS NULL OR requested_by IS NULL;
