import { isValidDate } from "../../shared/date";
import { isPriority } from "./guards";
import type { AssignmentErrors, NewAssignment } from "./types";

export function validateAssignment(input: NewAssignment): AssignmentErrors {
  const errors: AssignmentErrors = {};
  if (!input.subject.trim()) errors.subject = "Vui lòng nhập môn học.";
  else if (input.subject.trim().length > 80)
    errors.subject = "Tên môn học tối đa 80 ký tự.";
  if (!input.title.trim()) errors.title = "Vui lòng nhập tên bài tập.";
  else if (input.title.trim().length > 160)
    errors.title = "Tên bài tập tối đa 160 ký tự.";
  if (!isValidDate(input.dueDate))
    errors.dueDate = "Vui lòng chọn ngày hợp lệ.";
  if (!isPriority(input.priority))
    errors.priority = "Vui lòng chọn độ ưu tiên hợp lệ.";
  return errors;
}
