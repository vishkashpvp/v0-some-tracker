-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role VARCHAR(20) DEFAULT 'user' -- Added role column
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo',
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(50) NOT NULL,
  estimated_hours INTEGER DEFAULT 0,
  actual_hours INTEGER DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approval_status VARCHAR(20) DEFAULT 'approved', -- Added for approval workflow
  requested_by VARCHAR(100), -- Added for approval workflow
  approved_by VARCHAR(100), -- Added for approval workflow
  approved_at TIMESTAMP -- Added for approval workflow
);

-- Create system settings table for storing PIN and other settings
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Insert admin users (passwords will be verified in code)
INSERT INTO admin_users (username, password_hash, role) VALUES
('vishkash', 'hash_placeholder_1', 'admin'),
('veeru', 'hash_placeholder_2', 'user')
ON CONFLICT (username) DO NOTHING;

-- Insert system settings including delete PIN
INSERT INTO system_settings (setting_key, setting_value) VALUES
('delete_all_pin', '80085')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority, category, estimated_hours, actual_hours, due_date, approval_status, requested_by, approved_by, approved_at) VALUES
('Design landing page hero section', 'Create responsive hero section with call-to-action buttons', 'completed', 'high', 'ui-design', 8, 6, '2024-01-15', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Implement user authentication flow', 'Build login, signup, and password reset components', 'in-progress', 'urgent', 'features', 16, 12, '2024-01-20', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Create reusable button components', 'Design system buttons with variants and states', 'review', 'medium', 'components', 4, 5, '2024-01-18', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Optimize bundle size', 'Analyze and reduce JavaScript bundle size', 'todo', 'low', 'optimization', 6, 0, '2024-01-25', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Fix mobile navigation bug', 'Resolve hamburger menu not closing on mobile', 'in-progress', 'high', 'bug-fix', 2, 1, '2024-01-17', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Write unit tests for form validation', 'Add comprehensive tests for all form components', 'todo', 'medium', 'testing', 8, 0, '2024-01-22', 'approved', 'System', 'System', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
