import { createApi } from '@reduxjs/toolkit/query/react';
import { type Place, type CreatePlacePayload, type UpdatePlacePayload } from '../../types/place';
import { baseQuery } from './commonApi';

export const placeApi = createApi({
    reducerPath: 'placeApi',
    baseQuery,
    endpoints: (builder) => ({
        getPlaces: builder.query<Place[], void>({
            query: () => '/api/places'
        }),
        createPlace: builder.mutation<Place, CreatePlacePayload>({
            query: (newPlace) => ({
                url: '/api/places',
                method: 'POST',
                body: newPlace
            })
        }),
        updatePlace: builder.mutation<Place, UpdatePlacePayload & { id: string }>({
            query: ({ id, ...patch }) => ({
                url: `/api/places/${id}`,
                method: 'PATCH',
                body: patch
            })
        }),
        deletePlace: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/api/places/${id}`,
                method: 'DELETE'
            })
        })
    })
});
export const {
    useGetPlacesQuery,
    useCreatePlaceMutation,
    useUpdatePlaceMutation,
    useDeletePlaceMutation
} = placeApi;
