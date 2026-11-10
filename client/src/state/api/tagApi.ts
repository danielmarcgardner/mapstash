import type { Tag, CreateTagPayload, UpdateTagPayload } from '../../types/tag';
import { baseApi } from './baseApi';

export const tagApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTags: builder.query<Tag[], void>({
            query: () => '/api/tags',
            providesTags: (result = []) => [
                { type: 'Tag', id: 'LIST' },
                ...result.map(({ id }) => ({ type: 'Tag' as const, id })),
            ],
        }),
        createTag: builder.mutation<Tag, CreateTagPayload>({
            query: (tag) => ({ url: '/api/tags', method: 'POST', body: { tag } }),
            invalidatesTags: [{ type: 'Tag', id: 'LIST' }],
        }),
        // Places embed tag name/color, so tag edits refetch places too.
        updateTag: builder.mutation<Tag, UpdateTagPayload & { id: number }>({
            query: ({ id, ...tag }) => ({ url: `/api/tags/${id}`, method: 'PATCH', body: { tag } }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Tag', id }, 'Place'],
        }),
        deleteTag: builder.mutation<void, number>({
            query: (id) => ({ url: `/api/tags/${id}`, method: 'DELETE' }),
            invalidatesTags: [{ type: 'Tag', id: 'LIST' }, 'Place'],
        }),
    }),
});

export const {
    useGetTagsQuery,
    useCreateTagMutation,
    useUpdateTagMutation,
    useDeleteTagMutation,
} = tagApi;
