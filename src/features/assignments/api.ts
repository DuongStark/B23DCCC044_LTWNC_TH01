import { isAssignmentList, isRecord } from "./guards";
import type { Assignment, ApiResponse } from "./types";

export async function fetchJson<T>(
  url: string,
  guard: (value: unknown) => value is T,
  signal?: AbortSignal,
): Promise<ApiResponse<T>> {
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error("Không tải được danh sách bài tập. Vui lòng thử lại.");
  const value: unknown = await response.json();
  if (!isRecord(value) || !guard(value.data))
    throw new Error("Dữ liệu bài tập không hợp lệ. Vui lòng kiểm tra API mẫu.");
  return { data: value.data };
}

export async function loadAssignments(
  signal?: AbortSignal,
): Promise<Assignment[]> {
  const timeout = AbortSignal.timeout(10_000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const response = await fetchJson<Assignment[]>(
    import.meta.env.BASE_URL + "api/assignments.json",
    isAssignmentList,
    requestSignal,
  );
  return response.data;
}
