import { fetchBaseQuery, type BaseQueryApi } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

const prepareHeaders = (headers: Headers, { getState }: Pick<BaseQueryApi, 'getState'>) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
}

const baseQuery = fetchBaseQuery({
    baseUrl: '',
    prepareHeaders,
});

export { prepareHeaders, baseQuery };
