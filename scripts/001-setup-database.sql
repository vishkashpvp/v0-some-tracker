-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- This will now store the actual password (or hash)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role VARCHAR(20) DEFAULT 'user'
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo',
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(50) NOT NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approval_status VARCHAR(20) DEFAULT 'approved',
  requested_by VARCHAR(100),
  approved_by VARCHAR(100),
  approved_at TIMESTAMP
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

-- Insert admin users with actual passwords (for initial setup)
-- In a real application, these passwords should be securely hashed.
INSERT INTO admin_users (username, password_hash, role) VALUES
('vishkash', 'Happine$$', 'admin'),
('veeru', 'p@$$woRRR9', 'user')
ON CONFLICT (username) DO NOTHING;

-- Insert system settings including delete PIN
INSERT INTO system_settings (setting_key, setting_value) VALUES
('delete_all_pin', '80085')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Insert sample tasks (without estimated_hours and actual_hours)
INSERT INTO tasks (title, description, status, priority, category, due_date, approval_status, requested_by, approved_by, approved_at) VALUES
('Design landing page hero section', 'Create responsive hero section with call-to-action buttons', 'completed', 'high', 'ui-design', '2024-01-15', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Implement user authentication flow', 'Build login, signup, and password reset components', 'in-progress', 'urgent', 'features', '2024-01-20', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Create reusable button components', 'Design system buttons with variants and states', 'review', 'medium', 'components', '2024-01-18', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Optimize bundle size', 'Analyze and reduce JavaScript bundle size', 'todo', 'low', 'optimization', '2024-01-25', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Fix mobile navigation bug', 'Resolve hamburger menu not closing on mobile', 'in-progress', 'high', 'bug-fix', '2024-01-17', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Write unit tests for form validation', 'Add comprehensive tests for all form components', 'todo', 'medium', 'testing', '2024-01-22', 'approved', 'System', 'System', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
