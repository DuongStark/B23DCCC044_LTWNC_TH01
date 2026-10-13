import {
  ArrowUpDown,
  Inbox,
  LoaderCircle,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { AssignmentCard } from "./AssignmentCard";
import { AssignmentFilters } from "./AssignmentFilters";
import type { useAssignments } from "../hooks/useAssignments";

type Props = ReturnType<typeof useAssignments>;
export function AssignmentList({
  visibleItems,
  stats,
  filter,
  status,
  error,
  today,
  setFilter,
  toggleAssignment,
  removeAssignment,
  retry,
}: Props) {
  return (
    <section className="list-panel" aria-labelledby="list-title">
      <div className="list-heading">
        <div>
          <h2 id="list-title">Danh sách bài tập</h2>
          {status === "succeeded" && <p>{visibleItems.length} bài tập</p>}
        </div>
        <span className="sort-note">
          <ArrowUpDown size={14} aria-hidden="true" />
          Hạn gần nhất trước
        </span>
      </div>
      <AssignmentFilters value={filter} stats={stats} onChange={setFilter} />
      <div
        id="assignment-results"
        aria-busy={status === "idle" || status === "loading"}
      >
        {(status === "idle" || status === "loading") && (
          <div className="list-state" role="status">
            <LoaderCircle className="spin" size={30} aria-hidden="true" />
            <h3>Đang tải bài tập</h3>
          </div>
        )}
        {status === "failed" && (
          <div className="list-state error-state" role="alert">
            <WifiOff size={30} aria-hidden="true" />
            <h3>Chưa tải được danh sách</h3>
            <p>{error}</p>
            <button type="button" className="secondary-button" onClick={retry}>
              <RefreshCw size={16} aria-hidden="true" />
              Thử lại
            </button>
          </div>
        )}
        {status === "succeeded" && visibleItems.length === 0 && (
          <div className="list-state">
            <Inbox size={34} aria-hidden="true" />
            <h3>
              {stats.total === 0
                ? "Chưa có bài tập"
                : "Không có bài tập trong mục này"}
            </h3>
            <p>
              {stats.total === 0
                ? "Dùng form Thêm bài tập để tạo bài tập mới."
                : filter === "overdue"
                  ? "Bạn không có bài tập chưa hoàn thành bị quá hạn."
                  : "Thử chọn một trạng thái khác để xem bài tập."}
            </p>
            {stats.total > 0 && filter !== "all" && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setFilter("all")}
              >
                Xem tất cả bài tập
              </button>
            )}
          </div>
        )}
        {status === "succeeded" && visibleItems.length > 0 && (
          <div className="assignment-list">
            {visibleItems.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                today={today}
                onToggle={toggleAssignment}
                onDelete={removeAssignment}
              >
                <div className="card-content">
                  <AssignmentCard.Header />
                  <AssignmentCard.Deadline />
                </div>
                <AssignmentCard.Actions />
              </AssignmentCard>
            ))}
          </div>
        )}
      </div>
      <p className="list-footnote">
        Đánh dấu vào ô bên trái khi bạn đã hoàn thành bài tập.
      </p>
    </section>
  );
}
