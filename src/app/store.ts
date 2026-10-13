import { configureStore } from "@reduxjs/toolkit";
import assignmentsReducer, {
  storageWarningChanged,
} from "../features/assignments/assignmentsSlice";
import { saveAssignments } from "../features/assignments/storage";

export function createAppStore() {
  const store = configureStore({
    reducer: { assignments: assignmentsReducer },
  });
  let previousItems = store.getState().assignments.items;
  let previousSaveFailed = false;
  store.subscribe(() => {
    const state = store.getState().assignments;
    if (state.status !== "succeeded" || previousItems === state.items) return;
    previousItems = state.items;
    const warning = saveAssignments(state.items);
    const recovered = previousSaveFailed && !warning;
    previousSaveFailed = warning !== null;
    if (warning && warning !== state.storageWarning)
      store.dispatch(storageWarningChanged(warning));
    else if (recovered) store.dispatch(storageWarningChanged(null));
  });
  return store;
}
export const store = createAppStore();
export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
