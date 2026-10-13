import { describe, it, expect, vi } from "vitest";
import { isValidDate, daysUntil } from "../src/shared/date";
import { isAssignmentList } from "../src/features/assignments/guards";
import {
  filterAssignments,
  getAssignmentStats,
} from "../src/features/assignments/selectors";
import { validateAssignment } from "../src/features/assignments/validation";
import {
  readSavedAssignments,
  saveAssignments,
  STORAGE_KEY,
} from "../src/features/assignments/storage";
import { fetchJson } from "../src/features/assignments/api";
import type { Assignment } from "../src/features/assignments/types";

const item: Assignment = {
  id: "a",
  subject: "Lập trình Web",
  title: "Bài thực hành 01",
  dueDate: "2026-10-13",
  priority: "high",
  completed: false,
};
const items: Assignment[] = [
  item,
  { ...item, id: "b", dueDate: "2026-10-12" },
  { ...item, id: "c", dueDate: "2026-10-11", completed: true },
  { ...item, id: "d", dueDate: "2026-10-16" },
];

describe("calendar days", () => {
  it.each([
    ["2024-02-29", true],
    ["2026-02-29", false],
    ["2026-02-30", false],
    ["2026-13-01", false],
    ["2026-1-01", false],
    ["0000-01-01", false],
    ["2026-10-13", true],
  ])("validates %s", (date, valid) => expect(isValidDate(date)).toBe(valid));
  it.each([
    ["2026-10-13", 0],
    ["2026-10-16", 3],
    ["2026-10-11", -2],
    ["2026-11-01", 19],
  ])("counts %s by calendar day", (date, days) =>
    expect(daysUntil(date, "2026-10-13")).toBe(days),
  );
  it("counts consecutive local dates across a DST boundary", () =>
    expect(daysUntil("2026-03-09", "2026-03-08")).toBe(1));
});

describe("filters and statistics", () => {
  it("overdue excludes completed and today", () =>
    expect(
      filterAssignments(items, "overdue", "2026-10-13").map((x) => x.id),
    ).toEqual(["b"]));
  it("incomplete includes overdue work", () =>
    expect(
      filterAssignments(items, "incomplete", "2026-10-13").map((x) => x.id),
    ).toEqual(["b", "a", "d"]));
  it("completed retains completed past work", () =>
    expect(
      filterAssignments(items, "completed", "2026-10-13").map((x) => x.id),
    ).toEqual(["c"]));
  it("does not mutate the original order", () => {
    filterAssignments(items, "all", "2026-10-13");
    expect(items.map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
  });
  it("counts completion, overdue and due today independently", () =>
    expect(getAssignmentStats(items, "2026-10-13")).toEqual({
      total: 4,
      incomplete: 3,
      completed: 1,
      overdue: 1,
      today: 1,
    }));
});

describe("external input boundaries", () => {
  it("accepts the API fixture and a legitimately empty array", () => {
    expect(isAssignmentList([item])).toBe(true);
    expect(isAssignmentList([])).toBe(true);
  });
  it.each([
    null,
    {},
    [{ ...item, completed: "false" }],
    [{ ...item, priority: "urgent" }],
    [{ ...item, dueDate: "2026-02-30" }],
    [item, item],
    [{ ...item, title: " " }],
    [{ ...item, subject: "x".repeat(81) }],
  ])("rejects malformed data %#", (value) =>
    expect(isAssignmentList(value)).toBe(false),
  );
  it("rejects whitespace fields and invalid form dates", () => {
    const errors = validateAssignment({
      subject: " ",
      title: " ",
      dueDate: "2026-02-30",
      priority: "medium",
    });
    expect(Object.keys(errors).sort()).toEqual(["dueDate", "subject", "title"]);
  });
  it("accepts past dates for entering unfinished work", () =>
    expect(
      validateAssignment({
        subject: "Web",
        title: "Bài cũ",
        dueDate: "2020-01-01",
        priority: "low",
      }),
    ).toEqual({}));
  it("validates a generic API envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ data: [item] }), { status: 200 }),
      ),
    );
    const result = await fetchJson("/api", isAssignmentList);
    expect(result.data).toEqual([item]);
    vi.unstubAllGlobals();
  });
  it("rejects HTTP failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503 })),
    );
    await expect(fetchJson("/api", isAssignmentList)).rejects.toThrow();
    vi.unstubAllGlobals();
  });
  it("rejects malformed successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ data: [{ ...item, priority: "wrong" }] }),
            { status: 200 },
          ),
      ),
    );
    await expect(fetchJson("/api", isAssignmentList)).rejects.toThrow();
    vi.unstubAllGlobals();
  });
});

describe("browser storage", () => {
  it("restores an empty list without falling back to samples", () => {
    saveAssignments([]);
    expect(readSavedAssignments().items).toEqual([]);
  });
  it("round trips actual assignments", () => {
    expect(saveAssignments([item])).toBeNull();
    expect(readSavedAssignments().items).toEqual([item]);
  });
  it("treats corrupt storage as recoverable", () => {
    localStorage.setItem(STORAGE_KEY, "{invalid");
    expect(readSavedAssignments().items).toBeNull();
    expect(readSavedAssignments().warning).toBeTruthy();
  });
  it("rejects unsupported storage versions and duplicate IDs", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, data: [item] }),
    );
    expect(readSavedAssignments().items).toBeNull();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, data: [item, item] }),
    );
    expect(readSavedAssignments().items).toBeNull();
  });
  it("reports blocked storage without throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    expect(saveAssignments([item])).toBeTruthy();
  });
});
