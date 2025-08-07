-- Delete all existing tasks
DELETE FROM tasks;

-- Reset the sequence to start from 1
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;

-- Insert fresh sample data, including approval-related fields
INSERT INTO tasks (title, description, status, priority, category, estimated_hours, actual_hours, due_date, approval_status, requested_by, approved_by, approved_at) VALUES
('Setup project structure', 'Initialize Next.js project with TypeScript and Tailwind', 'completed', 'high', 'features', 4, 3, '2024-02-01', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Create component library', 'Build reusable UI components with shadcn/ui', 'in-progress', 'medium', 'components', 12, 8, '2024-02-05', 'approved', 'System', 'System', CURRENT_TIMESTAMP),
('Implement responsive design', 'Ensure all pages work on mobile and desktop', 'todo', 'high', 'ui-design', 8, 0, '2024-02-10', 'approved', 'System', 'System', CURRENT_TIMESTAMP);
