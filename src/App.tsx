import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  TriangleAlert,
} from "lucide-react";
import { useAssignments } from "./features/assignments/hooks/useAssignments";
import { AssignmentForm } from "./features/assignments/components/AssignmentForm";
import { AssignmentList } from "./features/assignments/components/AssignmentList";
import { AssignmentStats } from "./features/assignments/components/AssignmentStats";

export default function App() {
  const assignments = useAssignments();
  const { stats, status, today, storageWarning, announcement, setFilter } =
    assignments;
  const ready = status === "succeeded";
  const progress =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const dateLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(today + "T12:00:00"));
  return (
    <>
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#main-content"
            aria-label="Student Deadline Tracker — trang chính"
          >
            <span className="brand-mark">
              <BookOpenCheck size={25} aria-hidden="true" />
            </span>
            <span>
              <strong>Deadline Tracker</strong>
              <small>Quản lý bài tập cá nhân</small>
            </span>
          </a>
          <span className="header-date">
            <CalendarDays size={17} aria-hidden="true" />
            {dateLabel}
          </span>
        </div>
      </header>
      <main id="main-content" className="page-shell" tabIndex={-1}>
        <section className="page-intro" aria-labelledby="page-title">
          <h1 id="page-title">Quản lý bài tập</h1>
          <div className="progress-panel">
            <div className="progress-label">
              <span>Tiến độ hoàn thành</span>
              <strong>{ready ? progress + "%" : "—"}</strong>
            </div>
            <progress
              aria-label="Tiến độ hoàn thành bài tập"
              value={progress}
              max={100}
            />
            <p>
              {ready
                ? stats.completed +
                  " / " +
                  stats.total +
                  " bài tập đã hoàn thành"
                : "Đang tải dữ liệu"}
            </p>
          </div>
        </section>
        <AssignmentStats stats={stats} ready={ready} />
        {ready && (stats.today > 0 || stats.overdue > 0) && (
          <div className="attention-banner">
            <div>
              <TriangleAlert size={18} aria-hidden="true" />
              <p>
                {stats.overdue > 0 ? (
                  <>
                    <strong>{stats.overdue} bài tập đang quá hạn.</strong> Chưa
                    được đánh dấu hoàn thành.
                  </>
                ) : (
                  <>
                    <strong>{stats.today} bài tập đến hạn hôm nay.</strong> Kiểm
                    tra các bài cần nộp.
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFilter(stats.overdue > 0 ? "overdue" : "incomplete")
              }
            >
              {stats.overdue > 0 ? "Xem bài quá hạn" : "Xem bài cần làm"}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        )}
        {storageWarning && (
          <p className="storage-warning" role="status">
            <TriangleAlert size={17} aria-hidden="true" />
            {storageWarning}
          </p>
        )}
        <div className="workspace-grid">
          <aside className="form-column">
            <AssignmentForm
              onAdd={assignments.addAssignment}
              disabled={!ready}
            />
            <div className="study-note">
              <span className="note-rule" />
              <h3>Cách tính quá hạn</h3>
              <p>
                Bài đến hạn hôm nay chưa tính là quá hạn. Bài đã hoàn thành được
                loại khỏi mục Quá hạn.
              </p>
            </div>
          </aside>
          <AssignmentList {...assignments} />
        </div>
        <footer className="site-footer">
          <span>Student Deadline Tracker</span>
          <span>Lưu dữ liệu trên trình duyệt</span>
        </footer>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </main>
    </>
  );
}
