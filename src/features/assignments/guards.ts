import { isValidDate } from "../../shared/date";
import type { Assignment, Priority } from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "medium" || value === "high";
}

export function isAssignment(value: unknown): value is Assignment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    value.id.length <= 100 &&
    typeof value.subject === "string" &&
    value.subject.trim().length > 0 &&
    value.subject.length <= 80 &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    value.title.length <= 160 &&
    typeof value.dueDate === "string" &&
    isValidDate(value.dueDate) &&
    isPriority(value.priority) &&
    typeof value.completed === "boolean"
  );
}

export function isAssignmentList(value: unknown): value is Assignment[] {
  if (!Array.isArray(value) || !value.every(isAssignment)) return false;
  return new Set(value.map((item) => item.id)).size === value.length;
}
