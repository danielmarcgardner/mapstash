import { createSlice } from '@reduxjs/toolkit';
import { type TagState } from '../../types/tag';

const initialState: TagState = {
    isLoading: false,
    isError: false,
    tags: [],
    error: null,
};
const tagSlice = createSlice({
    name: 'tag',
    initialState,
    reducers: {
        fetchTagsStart(state) {
            state.isLoading = true;
            state.isError = false;
        },
        fetchTagsSuccess(state, action) {
            state.isLoading = false;
            state.tags = action.payload;
            state.isError = false;
        },
        fetchTagsFailure(state, action) {
            state.isLoading = false;
            state.isError = true;
            state.error = action.payload;
        },
        createTagStart(state) {
            state.isLoading = true;
            state.isError = false;
        },
        createTagSuccess(state, action) {
            state.isLoading = false;
            state.tags.push(action.payload);
            state.isError = false;
        },
        createTagFailure(state, action) {
            state.isLoading = false;
            state.isError = true;
            state.error = action.payload;
        },
        updateTagStart(state) {
            state.isLoading = true;
            state.isError = false;
        },
        updateTagSuccess(state, action) {
            state.isLoading = false;
            const index = state.tags.findIndex(tag => tag.id === action.payload.id);
            if (index !== -1) {
                state.tags[index] = action.payload;
            }
            state.isError = false;
        },
        updateTagFailure(state, action) {
            state.isLoading = false;
            state.isError = true;
            state.error = action.payload;
        },
        deleteTagStart(state) {
            state.isLoading = true;
            state.isError = false;
        },
        deleteTagSuccess(state, action) {
            state.isLoading = false;
            state.tags = state.tags.filter(tag => tag.id !== action.payload.id);
            state.isError = false;
        },
        deleteTagFailure(state, action) {
            state.isLoading = false;
            state.isError = true;
            state.error = action.payload;
        },
    },
});
export const {
    fetchTagsStart,
    fetchTagsSuccess,
    fetchTagsFailure,
    createTagStart,
    createTagSuccess,
    createTagFailure,
    updateTagStart,
    updateTagSuccess,
    updateTagFailure,
    deleteTagStart,
    deleteTagSuccess,
    deleteTagFailure,
} = tagSlice.actions;
export default tagSlice.reducer;