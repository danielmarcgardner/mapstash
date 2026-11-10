import type { List, CreateListPayload, UpdateListPayload } from '../../types/list';
import { baseApi } from './baseApi';

export const listApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getLists: builder.query<List[], void>({
            query: () => '/api/lists',
            providesTags: (result = []) => [
                { type: 'List', id: 'LIST' },
                ...result.map(({ id }) => ({ type: 'List' as const, id })),
            ],
        }),
        createList: builder.mutation<List, CreateListPayload>({
            query: (list) => ({ url: '/api/lists', method: 'POST', body: { list } }),
            invalidatesTags: [{ type: 'List', id: 'LIST' }],
        }),
        updateList: builder.mutation<List, UpdateListPayload & { id: number }>({
            query: ({ id, ...list }) => ({ url: `/api/lists/${id}`, method: 'PATCH', body: { list } }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'List', id }],
        }),
        // Places carry list_ids, so deleting a list refetches places.
        deleteList: builder.mutation<void, number>({
            query: (id) => ({ url: `/api/lists/${id}`, method: 'DELETE' }),
            invalidatesTags: [{ type: 'List', id: 'LIST' }, 'Place'],
        }),
    }),
});

export const {
    useGetListsQuery,
    useCreateListMutation,
    useUpdateListMutation,
    useDeleteListMutation,
} = listApi;
