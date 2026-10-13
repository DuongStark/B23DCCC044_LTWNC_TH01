import { daysUntil } from "../../shared/date";
import type {
  Assignment,
  AssignmentFilter,
  AssignmentStats,
  Priority,
} from "./types";

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function filterAssignments(
  items: Assignment[],
  filter: AssignmentFilter,
  today: string,
): Assignment[] {
  return items
    .filter((item) => {
      switch (filter) {
        case "incomplete":
          return !item.completed;
        case "completed":
          return item.completed;
        case "overdue":
          return !item.completed && daysUntil(item.dueDate, today) < 0;
        default:
          return true;
      }
    })
    .sort(
      (a, b) =>
        Number(a.completed) - Number(b.completed) ||
        a.dueDate.localeCompare(b.dueDate) ||
        priorityOrder[a.priority] - priorityOrder[b.priority],
    );
}

export function getAssignmentStats(
  items: Assignment[],
  today: string,
): AssignmentStats {
  return items.reduce<AssignmentStats>(
    (stats, item) => {
      stats.total++;
      if (item.completed) stats.completed++;
      else {
        stats.incomplete++;
        const days = daysUntil(item.dueDate, today);
        if (days < 0) stats.overdue++;
        if (days === 0) stats.today++;
      }
      return stats;
    },
    { total: 0, incomplete: 0, completed: 0, overdue: 0, today: 0 },
  );
}
