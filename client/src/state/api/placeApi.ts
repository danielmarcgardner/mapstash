import { type Place, type CreatePlacePayload, type UpdatePlacePayload } from '../../types/place';
import { baseApi } from './baseApi';

// Saving a place changes tag places_count and list place_ids, so those refetch too.
const placeChanged = ['Place', 'Tag', 'List'] as const;

export const placeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getPlaces: builder.query<Place[], void>({
            query: () => '/api/places',
            providesTags: (result = []) => [
                { type: 'Place', id: 'LIST' },
                ...result.map(({ id }) => ({ type: 'Place' as const, id })),
            ],
        }),
        createPlace: builder.mutation<Place, CreatePlacePayload>({
            query: (place) => ({ url: '/api/places', method: 'POST', body: { place } }),
            invalidatesTags: [...placeChanged],
        }),
        updatePlace: builder.mutation<Place, UpdatePlacePayload & { id: number }>({
            query: ({ id, ...place }) => ({ url: `/api/places/${id}`, method: 'PATCH', body: { place } }),
            invalidatesTags: [...placeChanged],
        }),
        deletePlace: builder.mutation<void, number>({
            query: (id) => ({ url: `/api/places/${id}`, method: 'DELETE' }),
            invalidatesTags: [...placeChanged],
        }),
    }),
});

export const {
    useGetPlacesQuery,
    useCreatePlaceMutation,
    useUpdatePlaceMutation,
    useDeletePlaceMutation,
} = placeApi;
