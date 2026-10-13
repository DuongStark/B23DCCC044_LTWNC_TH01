import { describe, it, expect, vi } from "vitest";
import { createAppStore } from "../src/app/store";
import {
  fetchAssignments,
  assignmentAdded,
  assignmentToggled,
  assignmentRemoved,
} from "../src/features/assignments/assignmentsSlice";
import {
  readSavedAssignments,
  saveAssignments,
} from "../src/features/assignments/storage";
import type { Assignment } from "../src/features/assignments/types";

const item: Assignment = {
  id: "sample",
  subject: "Web",
  title: "Bài mẫu",
  dueDate: "2026-10-16",
  priority: "medium",
  completed: false,
};
function validAPI() {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [item] }), { status: 200 }),
    ),
  );
}

describe("Redux assignment flow", () => {
  it("loads samples from the actual API reader and persists them", async () => {
    validAPI();
    const store = createAppStore();
    await store.dispatch(fetchAssignments());
    expect(store.getState().assignments.status).toBe("succeeded");
    expect(store.getState().assignments.items).toEqual([item]);
    expect(readSavedAssignments().items).toEqual([item]);
  });
  it("adds a normalized assignment with generated identity", async () => {
    validAPI();
    const store = createAppStore();
    await store.dispatch(fetchAssignments());
    store.dispatch(
      assignmentAdded({
        subject: "  Toán  ",
        title: "  Bài 2  ",
        dueDate: "2026-10-20",
        priority: "high",
      }),
    );
    expect(store.getState().assignments.items[1]).toMatchObject({
      subject: "Toán",
      title: "Bài 2",
      completed: false,
    });
    expect(store.getState().assignments.items[1].id).toBeTruthy();
  });
  it("does not allow malformed new assignments", async () => {
    validAPI();
    const store = createAppStore();
    await store.dispatch(fetchAssignments());
    store.dispatch(
      assignmentAdded({
        subject: " ",
        title: "Bài 2",
        dueDate: "2026-02-30",
        priority: "high",
      }),
    );
    expect(store.getState().assignments.items).toHaveLength(1);
  });
  it("toggles twice and persists completion changes", async () => {
    validAPI();
    const store = createAppStore();
    await store.dispatch(fetchAssignments());
    store.dispatch(assignmentToggled("sample"));
    expect(readSavedAssignments().items?.[0].completed).toBe(true);
    store.dispatch(assignmentToggled("sample"));
    expect(store.getState().assignments.items[0].completed).toBe(false);
  });
  it("deletes the last assignment and preserves the empty list on startup", async () => {
    validAPI();
    const store = createAppStore();
    await store.dispatch(fetchAssignments());
    store.dispatch(assignmentRemoved("sample"));
    expect(readSavedAssignments().items).toEqual([]);
    const reopened = createAppStore();
    await reopened.dispatch(fetchAssignments());
    expect(reopened.getState().assignments.items).toEqual([]);
  });
  it("fetches on startup even with an existing saved list", async () => {
    saveAssignments([{ ...item, id: "mine", title: "Bài cá nhân" }]);
    validAPI();
    const store = createAppStore();
    await store.dispatch(fetchAssignments());
    expect(store.getState().assignments.items[0].id).toBe("mine");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("blocks duplicate initialization while pending and after success", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );
    const store = createAppStore();
    const request = store.dispatch(fetchAssignments());
    expect(store.getState().assignments.status).toBe("loading");
    await store.dispatch(fetchAssignments());
    expect(fetch).toHaveBeenCalledTimes(1);
    resolveFetch(
      new Response(JSON.stringify({ data: [item] }), { status: 200 }),
    );
    await request;
    await store.dispatch(fetchAssignments());
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("retains saved data through API failure and supports retry", async () => {
    saveAssignments([{ ...item, id: "mine" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );
    const store = createAppStore();
    await store.dispatch(fetchAssignments());
    expect(store.getState().assignments.status).toBe("failed");
    expect(store.getState().assignments.error).toBeTruthy();
    expect(readSavedAssignments().items?.[0].id).toBe("mine");
    validAPI();
    await store.dispatch(fetchAssignments());
    expect(store.getState().assignments.status).toBe("succeeded");
    expect(store.getState().assignments.items[0].id).toBe("mine");
  });
  it("falls back to samples when cache is malformed and exposes a warning", async () => {
    localStorage.setItem("student-deadline-tracker:v1", "oops");
    validAPI();
    const store = createAppStore();
    await store.dispatch(fetchAssignments());
    expect(store.getState().assignments.items).toEqual([item]);
    expect(store.getState().assignments.storageWarning).toBeTruthy();
  });
  it("keeps editing usable when browser saving is blocked", async () => {
    validAPI();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const store = createAppStore();
    await store.dispatch(fetchAssignments());
    store.dispatch(assignmentToggled("sample"));
    expect(store.getState().assignments.items[0].completed).toBe(true);
    expect(store.getState().assignments.storageWarning).toBeTruthy();
  });
});

it("clears a save-failure warning after storage becomes writable again", async () => {
  validAPI();
  const blocked = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("blocked");
    });
  const store = createAppStore();
  await store.dispatch(fetchAssignments());
  expect(store.getState().assignments.storageWarning).toBeTruthy();
  blocked.mockRestore();
  store.dispatch(assignmentToggled("sample"));
  expect(readSavedAssignments().items?.[0].completed).toBe(true);
  expect(store.getState().assignments.storageWarning).toBeNull();
});
