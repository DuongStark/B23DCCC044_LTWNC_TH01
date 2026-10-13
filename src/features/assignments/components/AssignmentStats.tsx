import { AlarmClock, CheckCheck, ClipboardList, Clock3 } from "lucide-react";
import type { AssignmentStats as Stats } from "../types";
interface Props {
  stats: Stats;
  ready: boolean;
}
export function AssignmentStats({ stats, ready }: Props) {
  const cards = [
    {
      label: "Tổng bài tập",
      value: stats.total,
      icon: ClipboardList,
      tone: "neutral",
      note: "Trong danh sách",
    },
    {
      label: "Chưa hoàn thành",
      value: stats.incomplete,
      icon: Clock3,
      tone: "pending",
      note: "Bao gồm bài quá hạn",
    },
    {
      label: "Đang quá hạn",
      value: stats.overdue,
      icon: AlarmClock,
      tone: "late",
      note: "Đã qua ngày hạn nộp",
    },
    {
      label: "Đã hoàn thành",
      value: stats.completed,
      icon: CheckCheck,
      tone: "done",
      note: "Đã đánh dấu hoàn thành",
    },
  ];
  return (
    <section className="stats-grid" aria-label="Tổng quan bài tập">
      {cards.map((card) => (
        <div key={card.label} className={"stat-card stat-" + card.tone}>
          <div className="stat-heading">
            <span>{card.label}</span>
            <card.icon size={19} aria-hidden="true" />
          </div>
          <strong className="stat-value">{ready ? card.value : "—"}</strong>
          <span className="stat-note">{card.note}</span>
        </div>
      ))}
    </section>
  );
}
