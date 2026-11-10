import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './commonApi';

// One API slice so every endpoint shares a cache and can invalidate each other's data.
export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery,
    tagTypes: ['Place', 'Tag', 'List', 'User'],
    endpoints: () => ({}),
});
