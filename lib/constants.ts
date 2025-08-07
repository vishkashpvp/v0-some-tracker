export const statusConfig = {
  todo: { label: "To Do", color: "bg-gray-500", icon: "Circle" },
  "in-progress": { label: "In Progress", color: "bg-blue-500", icon: "Circle" },
  review: { label: "Review", color: "bg-yellow-500", icon: "AlertCircle" },
  completed: { label: "Completed", color: "bg-green-500", icon: "CheckCircle2" },
} as const; // Use as const for type inference

export const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  high: { label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
} as const;

export const categoryConfig = {
  "ui-design": { label: "UI Design", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  components: { label: "Components", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  features: { label: "Features", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  testing: { label: "Testing", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  optimization: { label: "Optimization", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  "bug-fix": { label: "Bug Fix", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
} as const;
