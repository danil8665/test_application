import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import IssuesType from '../components/Home'

interface IssuesState {
    value: typeof IssuesType[];
}

const initialState = {
  value: [] 
} as IssuesState

const issuesSlice = createSlice({
  name: "issues",
  initialState: initialState,
  reducers: {
    issues: (state, action: PayloadAction<typeof IssuesType[]>) => {
      state.value = action.payload;
    }
  },
});

export const { issues } = issuesSlice.actions;
export default issuesSlice;