import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { authApi } from './api/authApi';
import { placeApi } from './api/placeApi';
import { listApi } from './api/listApi';
import { tagApi } from './api/tagApi';
import placeReducer from './slices/placeSlice';
import listReducer from './slices/listSlice';
import tagReducer from './slices/tagSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        place: placeReducer,
        list: listReducer,
        tag: tagReducer,
        [authApi.reducerPath]: authApi.reducer,
        [placeApi.reducerPath]: placeApi.reducer,
        [listApi.reducerPath]: listApi.reducer,
        [tagApi.reducerPath]: tagApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, placeApi.middleware, listApi.middleware, tagApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;