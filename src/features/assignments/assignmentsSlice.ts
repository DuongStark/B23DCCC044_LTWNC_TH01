import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { loadAssignments } from './api';
import { readSavedAssignments } from './storage';
import { validateAssignment } from './validation';
import type { Assignment, AssignmentFilter, NewAssignment } from './types';

export interface AssignmentsState {
  items: Assignment[];
  filter: AssignmentFilter;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  storageWarning: string | null;
}
const initialState: AssignmentsState = { items: [], filter: 'all', status: 'idle', error: null, storageWarning: null };

export const fetchAssignments = createAsyncThunk<
  { items: Assignment[]; warning: string | null },
  void,
  { state: { assignments: AssignmentsState }; rejectValue: string }
>('assignments/fetch', async (_, { signal, rejectWithValue }) => {
  try {
    const samples = await loadAssignments(signal);
    const saved = readSavedAssignments();
    return { items: saved.items ?? samples, warning: saved.warning };
  } catch {
    return rejectWithValue('Không tải được danh sách bài tập. Kiểm tra kết nối rồi thử lại.');
  }
}, {
  condition: (_, { getState }) => {
    const status = getState().assignments.status;
    return status === 'idle' || status === 'failed';
  },
});

const slice = createSlice({
  name: 'assignments', initialState,
  reducers: {
    assignmentAdded: {
      prepare(input: NewAssignment) {
        return { payload: { ...input, subject: input.subject.trim(), title: input.title.trim(), id: crypto.randomUUID(), completed: false } };
      },
      reducer(state, action: PayloadAction<Assignment>) {
        if (state.status === 'succeeded' && Object.keys(validateAssignment(action.payload)).length === 0) state.items.push(action.payload);
      },
    },
    assignmentToggled(state, action: PayloadAction<string>) {
      const item = state.items.find(item => item.id === action.payload);
      if (state.status === 'succeeded' && item) item.completed = !item.completed;
    },
    assignmentRemoved(state, action: PayloadAction<string>) {
      if (state.status === 'succeeded') state.items = state.items.filter(item => item.id !== action.payload);
    },
    filterChanged(state, action: PayloadAction<AssignmentFilter>) { state.filter = action.payload; },
    storageWarningChanged(state, action: PayloadAction<string | null>) { state.storageWarning = action.payload; },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAssignments.pending, state => { state.status = 'loading'; state.error = null; })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.status = 'succeeded'; state.items = action.payload.items; state.storageWarning = action.payload.warning;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.status = 'failed'; state.error = action.payload ?? 'Không tải được dữ liệu. Vui lòng thử lại.';
      });
  },
});
export const { assignmentAdded, assignmentToggled, assignmentRemoved, filterChanged, storageWarningChanged } = slice.actions;
export default slice.reducer;
