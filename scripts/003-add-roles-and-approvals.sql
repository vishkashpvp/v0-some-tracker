-- Add role column to admin_users table
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Update vishkash to be admin, everyone else is user
UPDATE admin_users SET role = 'admin' WHERE username = 'vishkash';
UPDATE admin_users SET role = 'user' WHERE username != 'vishkash';

-- Add approval-related columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requested_by VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Create task_deletion_requests table
CREATE TABLE IF NOT EXISTS task_deletion_requests (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  requested_by VARCHAR(100) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update existing tasks to be approved and set requested_by to a default if null
UPDATE tasks SET 
  approval_status = COALESCE(approval_status, 'approved'),
  requested_by = COALESCE(requested_by, 'System'),
  approved_by = COALESCE(approved_by, 'System'),
  approved_at = COALESCE(approved_at, CURRENT_TIMESTAMP)
WHERE approval_status IS NULL OR requested_by IS NULL OR approved_by IS NULL OR approved_at IS NULL;
