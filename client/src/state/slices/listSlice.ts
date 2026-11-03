import { createSlice } from '@reduxjs/toolkit';
import { type ListState } from '../../types/list';

const initialState: ListState = {
    isLoading: false,
    isError: false,
    lists: [],
    error: null,
};

const listSlice = createSlice({
    name: 'list',
    initialState,
    reducers: {
        fetchListsStart(state) {
            state.isLoading = true;
            state.isError = false;
        },
        fetchListsSuccess(state, action) {
            state.isLoading = false;
            state.lists = action.payload;
            state.isError = false;
        },
        fetchListsFailure(state, action) {
            state.isLoading = false;
            state.isError = true;
            state.error = action.payload;
        },
        createListStart(state) {
            state.isLoading = true;
            state.isError = false;
        },
        createListSuccess(state, action) {
            state.isLoading = false;
            state.lists.push(action.payload);
            state.isError = false;
        },
        createListFailure(state, action) {
            state.isLoading = false;
            state.isError = true;
            state.error = action.payload;
        },
        updateListStart(state) {
            state.isLoading = true;
            state.isError = false;
        }
    }
});

export const {
    fetchListsStart,
    fetchListsSuccess,
    fetchListsFailure,
    createListStart,
    createListSuccess,
    createListFailure,
    updateListStart
} = listSlice.actions;
export default listSlice.reducer;