import { isAssignmentList, isRecord } from "./guards";
import type { Assignment } from "./types";

export const STORAGE_KEY = "student-deadline-tracker:v1";

export function readSavedAssignments(): {
  items: Assignment[] | null;
  warning: string | null;
} {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { items: null, warning: null };
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      value.version !== 1 ||
      !isAssignmentList(value.data)
    ) {
      return {
        items: null,
        warning: "Bản lưu không hợp lệ. Danh sách mẫu đã được khôi phục.",
      };
    }
    return { items: value.data, warning: null };
  } catch {
    return {
      items: null,
      warning: "Không đọc được bản lưu. Danh sách mẫu được dùng cho phiên này.",
    };
  }
}

export function saveAssignments(items: Assignment[]): string | null {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, data: items }),
    );
    return null;
  } catch {
    return "Trình duyệt chưa lưu được thay đổi. Hãy giữ tab này mở để tiếp tục sử dụng.";
  }
}
