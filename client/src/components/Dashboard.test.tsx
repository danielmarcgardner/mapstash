import { fireEvent, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';
import { jsonResponse, stubFetch } from '../test/fetchStub';
import { renderWithStore } from '../test/renderWithStore';
import { baseApi } from '../state/api/baseApi';

// jsdom can't run Google Maps, so the library is replaced with inspectable stand-ins.
const map = vi.hoisted(() => ({ fitBounds: vi.fn(), setCenter: vi.fn(), setZoom: vi.fn(), panTo: vi.fn() }));
vi.mock('@vis.gl/react-google-maps', () => ({
    APIProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    Map: ({ children }: { children: ReactNode }) => <div data-testid="map">{children}</div>,
    AdvancedMarker: ({ title, children, onClick }: { title: string; children: ReactNode; onClick?: () => void }) => (
        <button data-testid="marker" title={title} onClick={onClick}>{children}</button>
    ),
    Pin: ({ background }: { background?: string }) => <span data-testid="pin" data-background={background ?? ''} />,
    useMap: () => map,
    useMapsLibrary: () => placesLib,
}));

// A fake Places API (New): one prediction for "Sammy's", whose place resolves to canned fields.
const sammys = {
    id: 'gp-sammys', displayName: "Sammy's Sandwich Shop", formattedAddress: '1 Peachtree St NE, Atlanta, GA',
    location: { lat: () => 33.7537, lng: () => -84.3863 },
};
const placesLib = vi.hoisted(() => ({
    AutocompleteSessionToken: class {},
    AutocompleteSuggestion: { fetchAutocompleteSuggestions: vi.fn() },
}));

class FakeBounds {
    points: google.maps.LatLngLiteral[] = [];
    extend(point: google.maps.LatLngLiteral) { this.points.push(point); return this; }
}

const tag = { id: 1, name: 'Coffee', color: '#ff8800' };
const place = (id: number, extra: object = {}) => ({
    id, title: `Place ${id}`, address: 'x', lat: 30 + id, lng: -80 - id, tags: [], list_ids: [],
    description: null, image_url: null, location_name: null, link_url: null, visited: null, notes: null,
    google_place_id: null, created_at: '', updated_at: '', ...extra,
});

const lists = [
    { id: 7, title: 'Date night', description: null, places_count: 1, place_ids: [1] },
    { id: 8, title: 'Brunch', description: null, places_count: 0, place_ids: [] },
];

const renderDashboard = (places: unknown, placesRoute = () => places, extraRoutes: Parameters<typeof stubFetch>[0] = {}) => {
    const { calls, count } = stubFetch({
        'GET /api/places': placesRoute,
        'GET /api/tags': () => [],
        'GET /api/lists': () => lists,
        'GET /api/users/me': () => ({ id: 1, email: 'a@b.co', first_name: 'A', last_name: 'B' }),
        ...extraRoutes,
    });
    const store = renderWithStore(<Dashboard />);
    return { store, calls, count };
};

// Simulates a tag or list edit, which refetches places.
const refetchPlaces = async (store: ReturnType<typeof renderWithStore>, count: (m: string, p: string) => number) => {
    store.dispatch(baseApi.util.invalidateTags(['Place']));
    await vi.waitFor(() => expect(count('GET', '/api/places')).toBe(2));
};

const geolocation = { getCurrentPosition: vi.fn() };

beforeEach(() => {
    placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions.mockImplementation(async ({ input }: { input: string }) => ({
        suggestions: input.includes('Sammy') ? [{
            placePrediction: {
                placeId: sammys.id,
                text: { toString: () => "Sammy's Sandwich Shop, Atlanta, GA" },
                toPlace: () => ({ ...sammys, fetchFields: async () => ({}) }),
            },
        }] : [],
    }));
    vi.stubGlobal('google', { maps: { LatLngBounds: FakeBounds } });
    Object.defineProperty(navigator, 'geolocation', { value: geolocation, configurable: true });
});
afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('Dashboard map', () => {
    it('shows a marker per place and frames all of them', async () => {
        renderDashboard([1, 2, 3, 4, 5].map(id => place(id)));
        expect(await screen.findAllByTestId('marker')).toHaveLength(5);
        await vi.waitFor(() => expect(map.fitBounds).toHaveBeenCalledOnce());
        const [bounds] = map.fitBounds.mock.calls[0] as [FakeBounds];
        expect(bounds.points).toHaveLength(5);
        expect(bounds.points[0]).toEqual({ lat: 31, lng: -81 });
    });

    it("colors a marker by its first tag and leaves untagged ones default", async () => {
        renderDashboard([place(1, { tags: [tag, { ...tag, id: 2, color: '#000000' }] }), place(2)]);
        const pins = await screen.findAllByTestId('pin');
        expect(pins.map(p => p.dataset.background)).toEqual(['#ff8800', '']);
    });

    it("doesn't re-frame when a refetch changes only non-coordinate data, like a tag color", async () => {
        let call = 0;
        const { store, count } = renderDashboard(null, () =>
            [place(1, { tags: [{ ...tag, color: ++call === 1 ? '#ff8800' : '#0055ff' }] }), place(2)]);
        await vi.waitFor(() => expect(map.fitBounds).toHaveBeenCalledOnce());
        await refetchPlaces(store, count);
        await vi.waitFor(() => expect(screen.getAllByTestId('pin')[0].dataset.background).toBe('#0055ff'));
        expect(map.fitBounds).toHaveBeenCalledOnce();
    });

    it('re-frames when the coordinates change', async () => {
        let call = 0;
        const { store, count } = renderDashboard(null, () => (++call === 1 ? [place(1), place(2)] : [place(1), place(2), place(3)]));
        await vi.waitFor(() => expect(map.fitBounds).toHaveBeenCalledOnce());
        await refetchPlaces(store, count);
        await vi.waitFor(() => expect(map.fitBounds).toHaveBeenCalledTimes(2));
        expect((map.fitBounds.mock.calls[1][0] as FakeBounds).points).toHaveLength(3);
    });

    it('skips places without coordinates', async () => {
        renderDashboard([place(1), place(2), place(3, { lat: null, lng: null })]);
        expect(await screen.findAllByTestId('marker')).toHaveLength(2);
        await vi.waitFor(() => expect(map.fitBounds).toHaveBeenCalled());
        expect((map.fitBounds.mock.calls[0][0] as FakeBounds).points).toHaveLength(2);
    });

    it('centers and zooms on a single place instead of fitting bounds', async () => {
        renderDashboard([place(1)]);
        await vi.waitFor(() => expect(map.setCenter).toHaveBeenCalledWith({ lat: 31, lng: -81 }));
        expect(map.setZoom).toHaveBeenCalledWith(14);
        expect(map.fitBounds).not.toHaveBeenCalled();
    });

    it("shows the empty state and pans to the user's area when there are no places", async () => {
        geolocation.getCurrentPosition.mockImplementation((ok: PositionCallback) =>
            ok({ coords: { latitude: 40, longitude: -74 } } as GeolocationPosition));
        renderDashboard([]);
        expect(await screen.findByText('No places yet')).toBeInTheDocument();
        expect(screen.getByText('Add your first place to see it on the map.')).toBeInTheDocument();
        expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
        await vi.waitFor(() => expect(map.panTo).toHaveBeenCalledWith({ lat: 40, lng: -74 }));
    });

    it('stays on the default center when geolocation is denied', async () => {
        geolocation.getCurrentPosition.mockImplementation((_ok: PositionCallback, fail: PositionErrorCallback) =>
            fail({ code: 1 } as GeolocationPositionError));
        renderDashboard([]);
        expect(await screen.findByText('No places yet')).toBeInTheDocument();
        expect(geolocation.getCurrentPosition).toHaveBeenCalled();
        expect(map.panTo).not.toHaveBeenCalled();
    });

    it('shows a loading overlay while places load', () => {
        renderDashboard([]);
        expect(screen.getByText('Loading your places…')).toBeInTheDocument();
    });

    it('shows an error, not the empty state, when places fail to load', async () => {
        renderDashboard(null, () => jsonResponse(500));
        expect(await screen.findByText('Something went wrong. Please try again later.', { selector: 'p' })).toBeInTheDocument();
        expect(screen.queryByText('No places yet')).not.toBeInTheDocument();
    });
});

describe('Place details', () => {
    const detailed = place(1, {
        address: '123 Peachtree St', description: 'Great sandwiches', notes: 'Get the Cuban',
        link_url: 'https://www.instagram.com/reel/abc', tags: [tag], list_ids: [7],
    });

    const openMarker = async (title: string) => {
        const markers = await screen.findAllByTestId('marker');
        fireEvent.click(markers.find(m => m.title === title)!);
        return screen.findByRole('dialog');
    };

    it("opens a marker's details and pans the map to it", async () => {
        renderDashboard([detailed, place(2)]);
        const drawer = within(await openMarker('Place 1'));
        expect(drawer.getByText('Place 1')).toBeInTheDocument();
        expect(drawer.getByText('123 Peachtree St')).toBeInTheDocument();
        expect(drawer.getByText('Great sandwiches')).toBeInTheDocument();
        expect(drawer.getByText('Get the Cuban')).toBeInTheDocument();
        expect(drawer.getByText('Coffee')).toBeInTheDocument();
        expect(await drawer.findByText('Date night')).toBeInTheDocument();
        expect(drawer.queryByText('Brunch')).not.toBeInTheDocument();
        expect(map.panTo).toHaveBeenCalledWith({ lat: 31, lng: -81 });
    });

    it('keeps the place on screen while the drawer closes', async () => {
        renderDashboard([detailed]);
        fireEvent.keyDown(await openMarker('Place 1'), { key: 'Escape' });
        expect(screen.getByText('123 Peachtree St')).toBeInTheDocument(); // still animating out, not blank
        await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('opens the saved link in a new tab', async () => {
        renderDashboard([detailed]);
        const link = within(await openMarker('Place 1')).getByRole('link', { name: 'Open link' });
        expect(link).toHaveAttribute('href', 'https://www.instagram.com/reel/abc');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('hides Open link when the place has no link', async () => {
        renderDashboard([place(1)]);
        expect(within(await openMarker('Place 1')).queryByRole('link', { name: 'Open link' })).not.toBeInTheDocument();
    });

    it('deletes after confirming, removing the marker and closing the details', async () => {
        let deleted = false;
        const { count } = renderDashboard(null, () => (deleted ? [place(2)] : [detailed, place(2)]), {
            'DELETE /api/places/1': () => { deleted = true; return new Response(null, { status: 204 }); },
        });
        const drawer = within(await openMarker('Place 1'));
        fireEvent.click(drawer.getByRole('button', { name: 'Delete' }));
        expect(count('DELETE', '/api/places/1')).toBe(0);
        fireEvent.click(drawer.getByRole('button', { name: 'Delete this place?' }));
        await vi.waitFor(() => expect(screen.getAllByTestId('marker')).toHaveLength(1));
        expect(count('DELETE', '/api/places/1')).toBe(1);
        expect(count('GET', '/api/places')).toBe(2); // refetched, not reloaded
        await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it("doesn't delete when the confirm is cancelled", async () => {
        const { count } = renderDashboard([detailed]);
        const drawer = within(await openMarker('Place 1'));
        fireEvent.click(drawer.getByRole('button', { name: 'Delete' }));
        fireEvent.click(drawer.getByRole('button', { name: 'Cancel' }));
        expect(drawer.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(count('DELETE', '/api/places/1')).toBe(0);
    });

    it('shows an error and keeps the place when the delete fails', async () => {
        renderDashboard([detailed], undefined, { 'DELETE /api/places/1': () => jsonResponse(500) });
        const drawer = within(await openMarker('Place 1'));
        fireEvent.click(drawer.getByRole('button', { name: 'Delete' }));
        fireEvent.click(drawer.getByRole('button', { name: 'Delete this place?' }));
        expect(await drawer.findByRole('alert')).toHaveTextContent("Couldn't delete this place");
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByTestId('marker')).toHaveLength(1);
    });
});

describe('Place form', () => {
    const created = place(9, {
        title: "Sammy's Sandwich Shop", address: sammys.formattedAddress, location_name: sammys.displayName,
        lat: 33.7537, lng: -84.3863, google_place_id: sammys.id,
    });

    const searchFor = async (text: string, option: string) => {
        const input = screen.getByPlaceholderText('Search for a place');
        await vi.waitFor(() => expect(input).toHaveFocus()); // the modal focuses the search, which opens the dropdown
        fireEvent.change(input, { target: { value: text } });
        // jsdom has no layout, so Mantine's Popover thinks the input is detached and hides the dropdown.
        fireEvent.click(await screen.findByRole('option', { name: option, hidden: true }));
    };
    const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    it('adds a place from a location search and selects it on the map', async () => {
        let saved = false;
        const { calls } = renderDashboard(null, () => (saved ? [place(1), created] : [place(1)]), {
            'POST /api/places': () => { saved = true; return created; },
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Add place' }));
        await searchFor("Sammy's Sandwich Shop Atlanta", "Sammy's Sandwich Shop, Atlanta, GA");
        await vi.waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue("Sammy's Sandwich Shop"));
        expect(screen.getByText(sammys.formattedAddress)).toBeInTheDocument();
        save();

        await vi.waitFor(() => expect(screen.getAllByTestId('marker')).toHaveLength(2));
        expect(calls.find(c => c.method === 'POST')?.body).toEqual({
            place: expect.objectContaining({
                title: "Sammy's Sandwich Shop", address: sammys.formattedAddress, location_name: sammys.displayName,
                lat: 33.7537, lng: -84.3863, google_place_id: sammys.id,
            }),
        });
        expect(await screen.findByText('Place saved')).toBeInTheDocument();
        expect(within(await screen.findByRole('dialog', { name: "Sammy's Sandwich Shop" })).getByText(sammys.formattedAddress)).toBeInTheDocument();
        await vi.waitFor(() => expect(map.panTo).toHaveBeenCalledWith({ lat: 33.7537, lng: -84.3863 }));
    });

    it("edits a place's notes and shows them in its details", async () => {
        let notes = 'Old notes';
        // The serializer shows a placeholder for a missing address; an edit mustn't save it back.
        const { calls } = renderDashboard(null, () => [place(1, { notes, description: 'Old description', address: 'No address provided' })], {
            'PATCH /api/places/1': (body) => { notes = (body as { place: { notes: string } }).place.notes; return place(1, { notes }); },
        });
        fireEvent.click((await screen.findAllByTestId('marker'))[0]);
        fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
        const notesField = await screen.findByLabelText('Notes');
        expect(notesField).toHaveValue('Old notes');
        expect(screen.getByLabelText('Title')).toHaveValue('Place 1');
        fireEvent.change(notesField, { target: { value: 'Get the Cuban' } });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: '' } });
        save();

        // Only the changed fields, with a cleared one sent as null.
        await vi.waitFor(() => expect(calls.find(c => c.method === 'PATCH')?.body).toEqual({ place: { notes: 'Get the Cuban', description: null } }));
        expect(await within(await screen.findByRole('dialog', { name: 'Place 1' })).findByText('Get the Cuban')).toBeInTheDocument();
    });

    it('shows the API error in the form and stays open', async () => {
        renderDashboard([], undefined, {
            'POST /api/places': () => jsonResponse(422, { errors: ["Title can't be blank"] }),
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Add place' }));
        await searchFor("Sammy's", "Sammy's Sandwich Shop, Atlanta, GA");
        save();
        const form = within(screen.getByRole('dialog', { name: 'Add place' }));
        expect(await form.findByRole('alert')).toHaveTextContent("Title can't be blank");
    });

    it('requires a location and an http(s) link before saving', async () => {
        const { count } = renderDashboard([]);
        fireEvent.click(await screen.findByRole('button', { name: 'Add place' }));
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Somewhere' } });
        fireEvent.change(screen.getByLabelText('Link'), { target: { value: 'ftp://nope' } });
        save();
        expect(await screen.findByText('Pick a location from the search')).toBeInTheDocument();
        expect(screen.getByText('Enter an http(s) URL')).toBeInTheDocument();
        expect(count('POST', '/api/places')).toBe(0);
    });
});

describe('Place form location picks', () => {
    const prediction = (id: string, label: string, fetchFields: () => Promise<unknown>, fields: object) => ({
        placePrediction: { placeId: id, text: { toString: () => label }, toPlace: () => ({ id, ...fields, fetchFields }) },
    });
    const openAndSearch = async () => {
        renderDashboard([]);
        fireEvent.click(await screen.findByRole('button', { name: 'Add place' }));
        const input = screen.getByPlaceholderText('Search for a place');
        await vi.waitFor(() => expect(input).toHaveFocus());
        fireEvent.change(input, { target: { value: 'Sam' } });
        return input;
    };
    // jsdom has no layout, so Mantine's Popover hides the dropdown; see searchFor above.
    const pick = async (input: HTMLElement, name: string) => {
        fireEvent.click(input);
        fireEvent.click(await screen.findByRole('option', { name, hidden: true }));
    };

    it("tells the user when a place's details fail to load, and won't save it", async () => {
        placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions.mockResolvedValue({
            suggestions: [prediction('a', 'Broken place', () => Promise.reject(new Error('quota')), { displayName: 'Broken' })],
        });
        const input = await openAndSearch();
        await pick(input, 'Broken place');
        expect(await screen.findByText("Couldn't load that place. Try searching again.")).toBeInTheDocument();
        expect(screen.getByLabelText('Title')).toHaveValue('');
    });

    it('keeps the latest pick when an earlier one resolves last', async () => {
        let resolveSlow = () => {};
        placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions.mockResolvedValue({
            suggestions: [
                prediction('slow', 'Slow place', () => new Promise<void>(r => { resolveSlow = r; }),
                    { displayName: 'Slow', formattedAddress: 'Slow St', location: { lat: () => 1, lng: () => 1 } }),
                prediction('fast', 'Fast place', async () => ({}),
                    { displayName: 'Fast', formattedAddress: 'Fast St', location: { lat: () => 2, lng: () => 2 } }),
            ],
        });
        const input = await openAndSearch();
        await pick(input, 'Slow place');
        await pick(input, 'Fast place');
        await vi.waitFor(() => expect(screen.getByText('Fast St')).toBeInTheDocument());
        resolveSlow();
        await new Promise(r => setTimeout(r, 0));
        expect(screen.getByText('Fast St')).toBeInTheDocument();
        expect(screen.queryByText('Slow St')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Title')).toHaveValue('Fast');
    });
});

describe('Place form tags', () => {
    const tags = [
        { id: 1, name: 'Coffee', color: '#ff8800', places_count: 0 },
        { id: 2, name: 'Bar', color: '#000000', places_count: 0 },
    ];
    const addTag = (name: string) => {
        const input = screen.getByPlaceholderText('Add tags');
        fireEvent.change(input, { target: { value: name } });
        fireEvent.keyDown(input, { key: 'Enter' });
    };
    const openAddForm = async () => {
        fireEvent.click(await screen.findByRole('button', { name: 'Add place' }));
        await searchFor("Sammy's", "Sammy's Sandwich Shop, Atlanta, GA");
        await vi.waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue("Sammy's Sandwich Shop"));
    };
    // The location search helper from 'Place form', repeated here because it's scoped to that describe.
    const searchFor = async (text: string, option: string) => {
        const input = screen.getByPlaceholderText('Search for a place');
        await vi.waitFor(() => expect(input).toHaveFocus());
        fireEvent.change(input, { target: { value: text } });
        fireEvent.click(await screen.findByRole('option', { name: option, hidden: true }));
    };
    const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    it('creates a new tag and applies it with an existing one in one save', async () => {
        const { calls } = renderDashboard([], undefined, {
            'GET /api/tags': () => tags,
            'POST /api/tags': () => ({ id: 3, name: 'Brunch', color: '#c1d5f5', places_count: 0 }),
            'POST /api/places': () => place(9),
        });
        await openAddForm();
        addTag('Coffee');
        addTag('Brunch');
        save();

        await vi.waitFor(() => expect(calls.some(c => c.method === 'POST' && c.path === '/api/places')).toBe(true));
        const tagPost = calls.findIndex(c => c.method === 'POST' && c.path === '/api/tags');
        const placePost = calls.findIndex(c => c.method === 'POST' && c.path === '/api/places');
        expect(calls[tagPost].body).toEqual({ tag: { name: 'Brunch' } });
        expect(tagPost).toBeLessThan(placePost);
        expect(calls[placePost].body).toEqual({ place: expect.objectContaining({ tag_ids: [1, 3] }) });
    });

    it('reuses an existing tag typed in a different case', async () => {
        const { calls, count } = renderDashboard([], undefined, {
            'GET /api/tags': () => tags,
            'POST /api/places': () => place(9),
        });
        await openAddForm();
        addTag('coffee');
        save();

        await vi.waitFor(() => expect(count('POST', '/api/places')).toBe(1));
        expect(count('POST', '/api/tags')).toBe(0);
        expect(calls.find(c => c.method === 'POST')?.body).toEqual({ place: expect.objectContaining({ tag_ids: [1] }) });
    });

    it("removes a tag from a place and updates its chips", async () => {
        let placeTags = [tags[1], tags[0]].map(({ id, name, color }) => ({ id, name, color }));
        const { calls } = renderDashboard(null, () => [place(1, { tags: placeTags })], {
            'GET /api/tags': () => tags,
            'PATCH /api/places/1': () => { placeTags = placeTags.filter(t => t.id === 2); return place(1, { tags: placeTags }); },
        });
        fireEvent.click((await screen.findAllByTestId('marker'))[0]);
        fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
        const input = await screen.findByPlaceholderText('Add tags');
        fireEvent.keyDown(input, { key: 'Backspace' }); // removes the last tag, Coffee
        save();

        await vi.waitFor(() => expect(calls.find(c => c.method === 'PATCH')?.body).toEqual({ place: { tag_ids: [2] } }));
        const drawer = within(await screen.findByRole('dialog', { name: 'Place 1' }));
        await vi.waitFor(() => expect(drawer.queryByText('Coffee')).not.toBeInTheDocument());
        expect(drawer.getByText('Bar')).toBeInTheDocument();
    });

    it("knows the place's own tags even when the tags list fails to load", async () => {
        const { calls, count } = renderDashboard(null, () => [place(1, { tags: [{ id: 1, name: 'Coffee', color: '#ff8800' }] })], {
            'GET /api/tags': () => jsonResponse(500),
            'POST /api/tags': () => ({ id: 3, name: 'Brunch', color: '#c1d5f5', places_count: 0 }),
            'PATCH /api/places/1': () => place(1),
        });
        fireEvent.click((await screen.findAllByTestId('marker'))[0]);
        fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
        await screen.findByPlaceholderText('Add tags');
        addTag('Brunch');
        save();

        await vi.waitFor(() => expect(calls.find(c => c.method === 'PATCH')?.body).toEqual({ place: { tag_ids: [1, 3] } }));
        expect(count('POST', '/api/tags')).toBe(1);
        expect(calls.find(c => c.method === 'POST')?.body).toEqual({ tag: { name: 'Brunch' } });
    });

    it('reuses a tag it already created when retrying a failed save', async () => {
        let attempts = 0;
        const { calls, count } = renderDashboard([], undefined, {
            'GET /api/tags': () => tags,
            'POST /api/tags': () => ({ id: 3, name: 'Brunch', color: '#c1d5f5', places_count: 0 }),
            'POST /api/places': () => (++attempts === 1 ? jsonResponse(500) : place(9)),
        });
        await openAddForm();
        addTag('Brunch');
        save();
        expect(await within(screen.getByRole('dialog', { name: 'Add place' })).findByRole('alert')).toHaveTextContent("Couldn't save the place.");
        save();

        await vi.waitFor(() => expect(count('POST', '/api/places')).toBe(2));
        expect(count('POST', '/api/tags')).toBe(1);
        expect(calls.filter(c => c.path === '/api/places' && c.method === 'POST')[1].body).toEqual({ place: expect.objectContaining({ tag_ids: [3] }) });
    });

    it("shows a failed tag create and doesn't save the place", async () => {
        const { count } = renderDashboard([], undefined, {
            'GET /api/tags': () => tags,
            'POST /api/tags': () => jsonResponse(422, { errors: ['Name is too long'] }),
        });
        await openAddForm();
        addTag('Brunch');
        save();

        expect(await within(screen.getByRole('dialog', { name: 'Add place' })).findByRole('alert')).toHaveTextContent('Name is too long');
        expect(count('POST', '/api/places')).toBe(0);
    });
});
