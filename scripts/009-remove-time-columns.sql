-- Remove estimated_hours column from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS estimated_hours;

-- Remove actual_hours column from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS actual_hours;
