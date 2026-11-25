import { type Place, type CreatePlacePayload, type UpdatePlacePayload } from '../../types/place';
import { baseApi } from './baseApi';

// Saving a place changes tag places_count and list place_ids, so those refetch too.
const placeChanged = ['Place', 'Tag', 'List'] as const;

export const placeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // With tag_ids, returns places that have any of those tags; with list_id, only that list's places. Both combine.
        getPlaces: builder.query<Place[], { tag_ids?: number[]; list_id?: number } | void>({
            // Built by hand: RTK's params would send tag_ids=1,2, which Rails reads as one id, not an array.
            query: (filter) => {
                const params = (filter?.tag_ids ?? []).map(id => `tag_ids[]=${id}`);
                if (filter?.list_id) params.push(`list_id=${filter.list_id}`);
                return params.length ? `/api/places?${params.join('&')}` : '/api/places';
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
        markVisited: builder.mutation<Place, { id: number; visited_on?: string }>({
            query: ({ id, visited_on }) => ({ url: `/api/places/${id}/visit`, method: 'POST', body: { visited_on } }),
            onQueryStarted: (_arg, api) => writeVisitedPlace(api),
        }),
        clearVisited: builder.mutation<Place, number>({
            query: (id) => ({ url: `/api/places/${id}/visit`, method: 'DELETE' }),
            onQueryStarted: (_arg, api) => writeVisitedPlace(api),
        }),
        deletePlace: builder.mutation<void, number>({
            query: (id) => ({ url: `/api/places/${id}`, method: 'DELETE' }),
            invalidatesTags: [...placeChanged],
        }),
    }),
});

// A visit returns the updated place, so it's written into every cached place list instead of refetching them all.
// shortcut: assumes a visit never changes which lists a place is in; once getPlaces filters on visited (story 33), refetch those.
async function writeVisitedPlace({ dispatch, getState, queryFulfilled }: {
    dispatch: (action: unknown) => unknown; getState: () => unknown; queryFulfilled: Promise<{ data: Place }>;
}) {
    const { data } = await queryFulfilled.catch(() => ({ data: null }));
    if (!data) return; // the component shows the error
    const state = getState() as Parameters<typeof placeApi.util.selectInvalidatedBy>[0];
    for (const { endpointName, originalArgs } of placeApi.util.selectInvalidatedBy(state, [{ type: 'Place', id: data.id }])) {
        if (endpointName !== 'getPlaces') continue;
        dispatch(placeApi.util.updateQueryData('getPlaces', originalArgs, places => {
            const i = places.findIndex(p => p.id === data.id);
            if (i >= 0) places[i] = data;
        }));
    }
}

export const {
    useGetPlacesQuery,
    useCreatePlaceMutation,
    useUpdatePlaceMutation,
    useDeletePlaceMutation,
    useMarkVisitedMutation,
    useClearVisitedMutation,
} = placeApi;
