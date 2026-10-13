import { StrictMode } from "react";
import { Provider } from "react-redux";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { readFileSync } from 'node:fs';
import { createAppStore } from "../src/app/store";
import type { Assignment } from "../src/features/assignments/types";

const fixtures: Assignment[] = [
  {
    id: "late",
    subject: "Web",
    title: "Bài quá hạn",
    dueDate: "2000-01-01",
    priority: "high",
    completed: false,
  },
  {
    id: "future",
    subject: "Toán",
    title: "Bài tương lai",
    dueDate: "2099-12-31",
    priority: "low",
    completed: false,
  },
  {
    id: "done",
    subject: "Mạng",
    title: "Bài đã làm",
    dueDate: "2000-01-01",
    priority: "medium",
    completed: true,
  },
];
function openApp() {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ data: fixtures }), { status: 200 }),
    ),
  );
  const store = createAppStore();
  render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  );
  return store;
}

describe("assignment interface", () => {
  it("initializes only once under StrictMode and shows the complete card data", async () => {
    openApp();
    await screen.findByRole("heading", { name: "Bài quá hạn" });
    const card = screen.getByRole("article", { name: "Bài quá hạn" });
    expect(within(card).getByText("Web")).toBeTruthy();
    expect(within(card).getByText("Cao")).toBeTruthy();
    expect(within(card).getByText(/Quá hạn \d+ ngày/)).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("creates an assignment from the form and resets it", async () => {
    const store = openApp();
    await screen.findByRole("heading", { name: "Bài tương lai" });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Môn học"), "Lập trình");
    await user.type(screen.getByLabelText("Tên bài tập"), "Bài cá nhân");
    await user.type(screen.getByLabelText("Hạn nộp"), "2026-12-20");
    await user.click(screen.getByRole("button", { name: "Thêm bài tập" }));
    await screen.findByRole("heading", { name: "Bài cá nhân" });
    expect(store.getState().assignments.items).toHaveLength(4);
    expect(
      (screen.getByLabelText("Tên bài tập") as HTMLTextAreaElement).value,
    ).toBe("");
  });
  it("shows field errors and retains values on invalid submit", async () => {
    openApp();
    await screen.findByRole("heading", { name: "Bài quá hạn" });
    await userEvent.click(screen.getByRole("button", { name: "Thêm bài tập" }));
    expect(screen.getByText("Vui lòng nhập môn học.")).toBeTruthy();
    expect(screen.getByText("Vui lòng nhập tên bài tập.")).toBeTruthy();
    expect(screen.getByText("Vui lòng chọn ngày hợp lệ.")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("Môn học"));
  });
  it("filters overdue work and lets the user toggle and restore completion", async () => {
    openApp();
    await screen.findByRole("heading", { name: "Bài quá hạn" });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Quá hạn,/ }));
    expect(screen.queryByRole("heading", { name: "Bài đã làm" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Bài tương lai" })).toBeNull();
    await user.click(
      screen.getByRole("checkbox", {
        name: "Đánh dấu hoàn thành: Bài quá hạn",
      }),
    );
    expect(screen.queryByRole("heading", { name: "Bài quá hạn" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Đã hoàn thành,/ }));
    await user.click(
      screen.getByRole("checkbox", {
        name: "Bỏ đánh dấu hoàn thành: Bài quá hạn",
      }),
    );
    expect(screen.queryByRole("heading", { name: "Bài quá hạn" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Chưa hoàn thành,/ }));
    expect(screen.getByRole("heading", { name: "Bài quá hạn" })).toBeTruthy();
  });
  it("deletes an assignment from its accessible action", async () => {
    const store = openApp();
    await screen.findByRole("heading", { name: "Bài tương lai" });
    await userEvent.click(
      screen.getByRole("button", { name: "Xoá bài tập: Bài tương lai" }),
    );
    expect(screen.queryByRole("heading", { name: "Bài tương lai" })).toBeNull();
    expect(store.getState().assignments.items).toHaveLength(2);
  });
  it("shows loading and an API error with a working retry action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );
    const store = createAppStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
    await screen.findByRole("button", { name: "Thử lại" });
    expect(
      screen
        .getByRole("button", { name: "Thêm bài tập" })
        .hasAttribute("disabled"),
    ).toBe(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ data: fixtures }), { status: 200 }),
      ),
    );
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Bài quá hạn" })).toBeTruthy(),
    );
  });
});

it("aligns the attention banner with the overdue filter when today and overdue coexist", async () => {
  const now = new Date();
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: [fixtures[0], { ...fixtures[1], dueDate: localDate }],
          }),
          { status: 200 },
        ),
    ),
  );
  const store = createAppStore();
  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
  await screen.findByRole("heading", { name: "Bài quá hạn" });
  expect(screen.getByText("1 bài tập đang quá hạn.")).toBeTruthy();
  await userEvent.click(
    screen.getByRole("button", { name: "Xem bài quá hạn" }),
  );
  expect(screen.queryByRole("heading", { name: "Bài tương lai" })).toBeNull();
  expect(
    screen
      .getByRole("button", { name: /^Quá hạn,/ })
      .getAttribute("aria-pressed"),
  ).toBe("true");
});

it("keeps the brown focus ring on controls and off the main container", async () => {
  openApp();
  await screen.findByRole("heading", { name: "Bài quá hạn" });
  const styles = readFileSync('src/index.css', 'utf8');
  const selectors = [
    ...styles.matchAll(/([^{}]+)\{\s*outline:\s*3px solid var\(--primary\);/g),
  ].map((match) => match[1].trim());
  expect(selectors.length).toBeGreaterThan(0);
  const main = screen.getByRole("main");
  main.focus();
  expect(document.activeElement).toBe(main);
  expect(selectors.some((selector) => main.matches(selector.replaceAll(":focus-visible", ":focus")))).toBe(false);
  const button = screen.getByRole("button", { name: "Thêm bài tập" });
  button.focus();
  expect(selectors.some((selector) => button.matches(selector.replaceAll(":focus-visible", ":focus")))).toBe(true);
  const input = screen.getByLabelText("Môn học");
  input.focus();
  expect(selectors.some((selector) => input.matches(selector.replaceAll(":focus-visible", ":focus")))).toBe(true);
});
