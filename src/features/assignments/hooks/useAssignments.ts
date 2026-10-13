import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  assignmentAdded,
  assignmentRemoved,
  assignmentToggled,
  fetchAssignments,
  filterChanged,
} from "../assignmentsSlice";
import { filterAssignments, getAssignmentStats } from "../selectors";
import type { AssignmentFilter, NewAssignment } from "../types";
import { useToday } from "./useToday";

export function useAssignments() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.assignments);
  const today = useToday();
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    void dispatch(fetchAssignments());
  }, [dispatch]);
  const visibleItems = useMemo(
    () => filterAssignments(state.items, state.filter, today),
    [state.items, state.filter, today],
  );
  const stats = useMemo(
    () => getAssignmentStats(state.items, today),
    [state.items, today],
  );
  const addAssignment = useCallback(
    (input: NewAssignment) => {
      dispatch(assignmentAdded(input));
      dispatch(filterChanged("all"));
      setAnnouncement("Đã thêm bài tập “" + input.title.trim() + "”.");
    },
    [dispatch],
  );
  const toggleAssignment = useCallback(
    (id: string) => {
      const item = state.items.find((item) => item.id === id);
      if (!item) return;
      dispatch(assignmentToggled(id));
      setAnnouncement(
        (item.completed
          ? "Đã bỏ đánh dấu hoàn thành: "
          : "Đã đánh dấu hoàn thành: ") + item.title,
      );
    },
    [dispatch, state.items],
  );
  const removeAssignment = useCallback(
    (id: string) => {
      const item = state.items.find((item) => item.id === id);
      if (!item) return;
      dispatch(assignmentRemoved(id));
      setAnnouncement("Đã xoá bài tập: " + item.title);
    },
    [dispatch, state.items],
  );
  const setFilter = useCallback(
    (filter: AssignmentFilter) => {
      dispatch(filterChanged(filter));
    },
    [dispatch],
  );
  const retry = useCallback(() => {
    void dispatch(fetchAssignments());
  }, [dispatch]);
  return {
    ...state,
    today,
    visibleItems,
    stats,
    announcement,
    addAssignment,
    toggleAssignment,
    removeAssignment,
    setFilter,
    retry,
  };
}
