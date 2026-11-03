import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const prepareHeaders = (headers: Headers, { getState }: { getState: () => any }) => {
    const token = (getState() as any).auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
}

const baseQuery = fetchBaseQuery({
    baseUrl: '',
    prepareHeaders,
});

export { prepareHeaders, baseQuery };