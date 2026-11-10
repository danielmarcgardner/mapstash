import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';
import { jsonResponse, stubFetch } from '../test/fetchStub';
import { renderWithStore } from '../test/renderWithStore';

// jsdom can't run Google Maps, so the library is replaced with inspectable stand-ins.
const map = vi.hoisted(() => ({ fitBounds: vi.fn(), setCenter: vi.fn(), setZoom: vi.fn(), panTo: vi.fn() }));
vi.mock('@vis.gl/react-google-maps', () => ({
    APIProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    Map: ({ children }: { children: ReactNode }) => <div data-testid="map">{children}</div>,
    AdvancedMarker: ({ title, children }: { title: string; children: ReactNode }) => (
        <div data-testid="marker" title={title}>{children}</div>
    ),
    Pin: ({ background }: { background?: string }) => <span data-testid="pin" data-background={background ?? ''} />,
    useMap: () => map,
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

const renderDashboard = (places: unknown, placesRoute = () => places) => {
    stubFetch({
        'GET /api/places': placesRoute,
        'GET /api/tags': () => [],
        'GET /api/lists': () => [],
        'GET /api/users/me': () => ({ id: 1, email: 'a@b.co', first_name: 'A', last_name: 'B' }),
    });
    renderWithStore(<Dashboard />);
};

const geolocation = { getCurrentPosition: vi.fn() };

beforeEach(() => {
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
