import { createApi,  } from '@reduxjs/toolkit/query/react';
import type { Tag, CreateTagPayload } from '../../types/tag';
import { baseQuery } from './commonApi';

export const tagApi = createApi({
    reducerPath: 'tagApi',
    baseQuery,
    endpoints: (builder) => ({
        getTags: builder.query<Tag[], void>({
            query: () => '/api/tags',
        }),
        createTag: builder.mutation<Tag, CreateTagPayload>({
            query: (newTag) => ({
                url: '/api/tags',
                method: 'POST',
                body: newTag,
            }),
        }),
        updateTag: builder.mutation<Tag, Partial<Tag> & { id: string }>({
            query: ({ id, ...patch }) => ({
                url: `/api/tags/${id}`,
                method: 'PATCH',
                body: patch,
            }),
        }),
        deleteTag: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/api/tags/${id}`,
                method: 'DELETE',
            }),
        }),
    }),
});
export const {
    useGetTagsQuery,
    useCreateTagMutation,
    useUpdateTagMutation,
    useDeleteTagMutation,
} = tagApi;