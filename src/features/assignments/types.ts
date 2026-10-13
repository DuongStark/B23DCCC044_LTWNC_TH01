export type Priority = "low" | "medium" | "high";
export type AssignmentFilter = "all" | "incomplete" | "overdue" | "completed";
export interface Assignment {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  priority: Priority;
  completed: boolean;
}
export type NewAssignment = Omit<Assignment, "id" | "completed">;
export type AssignmentErrors = Partial<Record<keyof NewAssignment, string>>;
export interface ApiResponse<T> {
  data: T;
}
export interface AssignmentStats {
  total: number;
  incomplete: number;
  completed: number;
  overdue: number;
  today: number;
}
