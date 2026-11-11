import { type Place, type CreatePlacePayload, type UpdatePlacePayload } from '../../types/place';
import { baseApi } from './baseApi';

// Saving a place changes tag places_count and list place_ids, so those refetch too.
const placeChanged = ['Place', 'Tag', 'List'] as const;

export const placeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // With tag_ids, returns places that have any of those tags.
        getPlaces: builder.query<Place[], { tag_ids?: number[] } | void>({
            // Built by hand: RTK's params would send tag_ids=1,2, which Rails reads as one id, not an array.
            query: (filter) => {
                const ids = filter?.tag_ids ?? [];
                return ids.length ? `/api/places?${ids.map(id => `tag_ids[]=${id}`).join('&')}` : '/api/places';
            },
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
