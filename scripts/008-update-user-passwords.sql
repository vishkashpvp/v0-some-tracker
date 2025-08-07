-- Update password_hash for existing users based on previous in-memory values
-- In a real application, these passwords should be securely hashed (e.g., using bcrypt).
UPDATE admin_users SET password_hash = 'p@$$woRRR9' WHERE username = 'vishkash';
UPDATE admin_users SET password_hash = 'p@$$woRRR9' WHERE username = 'veeru';

-- Ensure password_hash column is NOT NULL if it's not already
ALTER TABLE admin_users ALTER COLUMN password_hash SET NOT NULL;
