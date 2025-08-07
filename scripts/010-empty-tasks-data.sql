-- Delete all existing tasks
DELETE FROM tasks;

-- Reset the sequence to start from 1
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;
