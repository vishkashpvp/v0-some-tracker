import { type Task } from "@/types/task"

export const isTaskLocked = (task: Task): boolean => {
  if (task.status !== 'completed') {
    return false;
  }
  const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
  const updatedAtTime = new Date(task.updated_at).getTime();
  const currentTime = new Date().getTime();
  return (currentTime - updatedAtTime) > fifteenMinutes;
};
