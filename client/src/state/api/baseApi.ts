import type { Dispatch } from '@reduxjs/toolkit';
import { createApi, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './commonApi';
import { logout } from '../slices/authSlice';
import type { RootState } from '../store';

// Clears the token and every cached response, so the next user starts clean.
export const endSession = (dispatch: Dispatch) => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
};

// A 401 on a request that carried a token means it expired or was revoked; ProtectedRoute then redirects.
const baseQueryWithLogout: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);
    if (result.error?.status === 401 && (api.getState() as RootState).auth.token) endSession(api.dispatch);
    return result;
};

// One API slice so every endpoint shares a cache and can invalidate each other's data.
export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithLogout,
    tagTypes: ['Place', 'Tag', 'List', 'User'],
    endpoints: () => ({}),
});
