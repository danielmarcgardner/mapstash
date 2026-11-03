import { createSlice } from '@reduxjs/toolkit';
import { type PlaceState } from '../../types/place';

const initialState: PlaceState = {
    isLoading: false,
    isError: false,
    places: [],
    error: null,
};
const placeSlice = createSlice({
    name: 'place',
    initialState,
    reducers: {
        fetchPlacesStart(state) {
            state.isLoading = true;
            state.isError = false;
        },
        fetchPlacesSuccess(state, action) {
            state.isLoading = false;
            state.places = action.payload;
            state.isError = false;
        },
        fetchPlacesFailure(state, action) {
            state.isLoading = false;
            state.isError = true;
            state.error = action.payload;
        },
        createPlaceStart(state) {
            state.isLoading = true;
            state.isError = false;
        },
        createPlaceSuccess(state, action) {
            state.isLoading = false;
            state.places.push(action.payload);
            state.isError = false;
        },
        createPlaceFailure(state, action) {
            state.isLoading = false;
            state.isError = true;
            state.error = action.payload;
        },
        updatePlaceStart(state) {
            state.isLoading = true;
            state.isError = false;
        },
        updatePlaceSuccess(state, action) {
            state.isLoading = false;
            const index = state.places.findIndex(place => place.id === action.payload.id);
            if (index !== -1) {
                state.places[index] = action.payload;
            }
            state.isError = false;
        },
        updatePlaceFailure(state, action) {
            state.isLoading = false;
            state.isError = true;
            state.error = action.payload;
        },
        deletePlaceStart(state) {
            state.isLoading = true;
            state.isError = false;
        },
        deletePlaceSuccess(state, action) {
            state.isLoading = false;
            state.places = state.places.filter(place => place.id !== action.payload);
            state.isError = false;
        },
        deletePlaceFailure(state, action) {
            state.isLoading = false;
            state.isError = true;
            state.error = action.payload;
        }
    }
});
export const {
    fetchPlacesStart,
    fetchPlacesSuccess,
    fetchPlacesFailure,
    createPlaceStart,
    createPlaceSuccess,
    createPlaceFailure,
    updatePlaceStart,
    updatePlaceSuccess,
    updatePlaceFailure,
    deletePlaceStart,
    deletePlaceSuccess,
    deletePlaceFailure
} = placeSlice.actions;
export default placeSlice.reducer;