import type { AssignmentFilter, AssignmentStats } from "../types";
const filters: {
  value: AssignmentFilter;
  label: string;
  count: keyof AssignmentStats;
}[] = [
  { value: "all", label: "Tất cả", count: "total" },
  { value: "incomplete", label: "Chưa hoàn thành", count: "incomplete" },
  { value: "overdue", label: "Quá hạn", count: "overdue" },
  { value: "completed", label: "Đã hoàn thành", count: "completed" },
];
interface Props {
  value: AssignmentFilter;
  stats: AssignmentStats;
  onChange: (value: AssignmentFilter) => void;
}
export function AssignmentFilters({ value, stats, onChange }: Props) {
  return (
    <div
      className="assignment-filters"
      role="group"
      aria-label="Lọc bài tập theo trạng thái"
    >
      {filters.map((filter) => (
        <button
          type="button"
          key={filter.value}
          aria-pressed={value === filter.value}
          aria-label={filter.label + ", " + stats[filter.count] + " bài tập"}
          aria-controls="assignment-results"
          className={
            "filter-button" + (value === filter.value ? " is-active" : "")
          }
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
          <span className="filter-count" aria-hidden="true">
            {stats[filter.count]}
          </span>
        </button>
      ))}
    </div>
  );
}
