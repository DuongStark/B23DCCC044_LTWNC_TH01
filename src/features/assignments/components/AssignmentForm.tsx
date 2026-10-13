import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { validateAssignment } from "../validation";
import type { AssignmentErrors, NewAssignment, Priority } from "../types";

const initialValues: NewAssignment = {
  subject: "",
  title: "",
  dueDate: "",
  priority: "medium",
};
const priorities: { value: Priority; label: string }[] = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
];
interface Props {
  onAdd: (input: NewAssignment) => void;
  disabled: boolean;
}

export function AssignmentForm({ onAdd, disabled }: Props) {
  const [values, setValues] = useState<NewAssignment>(initialValues);
  const [errors, setErrors] = useState<AssignmentErrors>({});
  const [feedback, setFeedback] = useState("");
  const subjectRef = useRef<HTMLInputElement>(null);

  function updateField<K extends keyof NewAssignment>(
    field: K,
    value: NewAssignment[K],
  ) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFeedback("");
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const nextErrors = validateAssignment(values);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      setFeedback("Vui lòng kiểm tra các trường được đánh dấu.");
      document.getElementById("assignment-" + firstError)?.focus();
      return;
    }
    onAdd(values);
    setValues(initialValues);
    setFeedback("Đã thêm bài tập.");
    subjectRef.current?.focus();
  }
  return (
    <section className="form-panel" aria-labelledby="form-title">
      <div className="panel-heading">
        <span className="heading-icon">
          <Plus size={20} aria-hidden="true" />
        </span>
        <h2 id="form-title">Thêm bài tập</h2>
      </div>
      <form noValidate onSubmit={handleSubmit}>
        <fieldset className="form-fields" disabled={disabled}>
          <div className="field">
            <label htmlFor="assignment-subject">Môn học</label>
            <input
              ref={subjectRef}
              id="assignment-subject"
              name="subject"
              required
              maxLength={80}
              autoComplete="off"
              placeholder="Ví dụ: Lập trình Web nâng cao"
              value={values.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? "subject-error" : undefined}
            />
            {errors.subject && (
              <p className="field-error" id="subject-error">
                {errors.subject}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="assignment-title">Tên bài tập</label>
            <textarea
              id="assignment-title"
              name="title"
              required
              maxLength={160}
              rows={3}
              placeholder="Bạn cần hoàn thành bài tập gì?"
              value={values.title}
              onChange={(event) => updateField("title", event.target.value)}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p className="field-error" id="title-error">
                {errors.title}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="assignment-dueDate">Hạn nộp</label>
            <input
              type="date"
              id="assignment-dueDate"
              name="dueDate"
              required
              min="1000-01-01"
              max="9999-12-31"
              value={values.dueDate}
              onChange={(event) => updateField("dueDate", event.target.value)}
              aria-invalid={!!errors.dueDate}
              aria-describedby={errors.dueDate ? "date-error" : "date-hint"}
            />
            {errors.dueDate ? (
              <p className="field-error" id="date-error">
                {errors.dueDate}
              </p>
            ) : (
              <p className="field-hint" id="date-hint">
                Hạn nộp được tính đến cuối ngày.
              </p>
            )}
          </div>
          <fieldset className="priority-field">
            <legend>Độ ưu tiên</legend>
            <div className="priority-options">
              {priorities.map((priority) => (
                <label
                  key={priority.value}
                  className={
                    "priority-option " +
                    (values.priority === priority.value ? "is-selected" : "")
                  }
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={values.priority === priority.value}
                    onChange={() => updateField("priority", priority.value)}
                  />
                  <span>{priority.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>
        <button type="submit" className="primary-button" disabled={disabled}>
          Thêm bài tập
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <p
          className={
            "form-feedback " +
            (Object.keys(errors).some(
              (key) => errors[key as keyof AssignmentErrors],
            )
              ? "is-error"
              : "")
          }
          role="status"
        >
          {feedback}
        </p>
      </form>
      <p className="form-note">Dữ liệu được lưu trên trình duyệt này.</p>
    </section>
  );
}
