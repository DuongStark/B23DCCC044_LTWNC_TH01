import { createContext, useContext, useId, useMemo } from "react";
import type { ReactNode } from "react";
import { CalendarDays, Clock3, Flag, Trash2 } from "lucide-react";
import { daysUntil, formatDate, getDeadlineLabel } from "../../../shared/date";
import type { Assignment, Priority } from "../types";

interface CardContextValue {
  assignment: Assignment;
  today: string;
  titleId: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}
const CardContext = createContext<CardContextValue | null>(null);
function useCard() {
  const context = useContext(CardContext);
  if (!context)
    throw new Error(
      "AssignmentCard subcomponents must be inside AssignmentCard.",
    );
  return context;
}
interface Props extends Omit<CardContextValue, "titleId"> {
  children: ReactNode;
}
function Root({ assignment, today, onToggle, onDelete, children }: Props) {
  const titleId = useId();
  const context = useMemo(
    () => ({ assignment, today, onToggle, onDelete, titleId }),
    [assignment, today, onToggle, onDelete, titleId],
  );
  const overdue =
    !assignment.completed && daysUntil(assignment.dueDate, today) < 0;
  return (
    <CardContext.Provider value={context}>
      <article
        className={
          "assignment-card" +
          (assignment.completed ? " is-completed" : "") +
          (overdue ? " is-overdue" : "")
        }
        aria-labelledby={titleId}
      >
        {children}
      </article>
    </CardContext.Provider>
  );
}
const priorityLabels: Record<Priority, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};
function Header() {
  const { assignment, titleId } = useCard();
  return (
    <>
      <div className="card-topline">
        <span className="subject-chip">{assignment.subject}</span>
        <span className={"priority-badge priority-" + assignment.priority}>
          <Flag size={13} aria-hidden="true" />
          {priorityLabels[assignment.priority]}
        </span>
      </div>
      <h3 id={titleId} className="assignment-title">
        {assignment.title}
      </h3>
    </>
  );
}
function Deadline() {
  const { assignment, today } = useCard();
  const days = daysUntil(assignment.dueDate, today);
  const tone = assignment.completed
    ? "finished"
    : days < 0
      ? "late"
      : days === 0
        ? "today"
        : "upcoming";
  return (
    <div className="card-metadata">
      <span className="due-date">
        <CalendarDays size={15} aria-hidden="true" />
        <time dateTime={assignment.dueDate}>
          {formatDate(assignment.dueDate)}
        </time>
      </span>
      <span className={"deadline-text deadline-" + tone}>
        <Clock3 size={15} aria-hidden="true" />
        {!assignment.completed && days === 0 && "Hôm nay · "}
        {getDeadlineLabel(assignment.dueDate, today)}
      </span>
      <span
        className={"completion-label " + (assignment.completed ? "done" : "")}
      >
        {assignment.completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
      </span>
    </div>
  );
}
function Actions() {
  const { assignment, onToggle, onDelete } = useCard();
  const label =
    (assignment.completed
      ? "Bỏ đánh dấu hoàn thành: "
      : "Đánh dấu hoàn thành: ") + assignment.title;
  return (
    <>
      <label className="completion-toggle" title={label}>
        <input
          type="checkbox"
          checked={assignment.completed}
          onChange={() => onToggle(assignment.id)}
          aria-label={label}
        />
      </label>
      <button
        type="button"
        className="delete-button"
        aria-label={"Xoá bài tập: " + assignment.title}
        title="Xoá bài tập"
        onClick={() => onDelete(assignment.id)}
      >
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </>
  );
}

export const AssignmentCard = Object.assign(Root, {
  Header,
  Deadline,
  Actions,
});
