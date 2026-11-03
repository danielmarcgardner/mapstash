import {createApi } from '@reduxjs/toolkit/query/react';
import type { List, CreateListPayload} from '../../types/list';
import { baseQuery } from './commonApi';

export const listApi = createApi({
    reducerPath: 'listApi',
    baseQuery,
    endpoints: (builder) => ({
        getLists: builder.query<List[], void>({
            query: () => '/api/lists'
        }),
        createList: builder.mutation<List, Partial<List>>({
            query: (newList: CreateListPayload) => ({
                url: '/api/lists',
                method: 'POST',
                body: newList
            })
        }),
        updateList: builder.mutation<List, Partial<List> & { id: string }>({
            query: ({id, ...patch}) => ({
                url: `/api/lists/${id}`,
                method: 'PATCH',
                body: patch
            })
        }),
        deleteList: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/api/lists/${id}`,
                method: 'DELETE'
            })
        })
    })
});
export const {
    useGetListsQuery,
    useCreateListMutation,
    useUpdateListMutation,
    useDeleteListMutation
} = listApi;
