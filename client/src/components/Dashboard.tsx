import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell, Loader, Paper, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AdvancedMarker, APIProvider, Map as GoogleMap, Pin, useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import AppShellComponent from "./AppShell";
import SideBar from "./SideBar";
import PlaceDetail from "./PlaceDetail";
import PlaceForm from "./PlaceForm";
import { useGetPlacesQuery } from "../state/api/placeApi";
import type { Place } from "../types/place";
import { darken } from "../tagColors";

const DEFAULT_CENTER = { lat: 33.7501, lng: -84.3885 }; // Atlanta
const SINGLE_PLACE_ZOOM = 14;
// Advanced Markers need a Map ID; Google's demo ID works for development.
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

type MappablePlace = Place & { lat: number; lng: number };

// Frames the map around the places, or the user's area when there are none.
const FitToPlaces = ({ places }: { places: MappablePlace[] }) => {
    const map = useMap();
    const framedFor = useRef<string | null>(null);

    useEffect(() => {
        if (!map) return;
        // Tag and list edits refetch places; only re-frame when the coordinates change, so the user's zoom survives.
        const coordinates = places.map(({ lat, lng }) => `${lat},${lng}`).join("|");
        if (framedFor.current === coordinates) return;
        framedFor.current = coordinates;
        if (places.length === 0) {
            navigator.geolocation?.getCurrentPosition(
                ({ coords }) => map.panTo({ lat: coords.latitude, lng: coords.longitude }),
                () => {}, // denied or unavailable: stay on the default center
            );
        } else if (places.length === 1) {
            map.setCenter({ lat: places[0].lat, lng: places[0].lng });
            map.setZoom(SINGLE_PLACE_ZOOM); // fitBounds on one point zooms all the way in
        } else {
            const bounds = new google.maps.LatLngBounds();
            places.forEach(({ lat, lng }) => bounds.extend({ lat, lng }));
            map.fitBounds(bounds, 48);
        }
    }, [map, places]);

    return null;
};

// Pans to the selected place; keyed on id so refetches of the same place don't re-pan.
const PanToPlace = ({ place }: { place: MappablePlace | undefined }) => {
    const map = useMap();
    const id = place?.id;

    useEffect(() => {
        if (map && place) map.panTo({ lat: place.lat, lng: place.lng });
    }, [map, id]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
};

// Groups overlapping markers; clicking a cluster zooms to its bounds (the library default) until its places separate.
const useClusterer = () => {
    const map = useMap();
    const clusterer = useMemo(() => (map ? new MarkerClusterer({}) : null), [map]);
    // Attached here, not in useMemo, so StrictMode's cleanup-then-rerun re-attaches it.
    useEffect(() => {
        if (!map || !clusterer) return;
        clusterer.setMap(map);
        return () => clusterer.setMap(null);
    }, [map, clusterer]);
    return clusterer;
};

type MarkerElement = google.maps.marker.AdvancedMarkerElement;
type MarkersById = Map<number, MarkerElement>;

// A selected pin folded into a cluster (e.g. a place just saved next to others) is hidden;
// zoom in one level per redraw until the clusterer shows it on its own. Keyed on the id, like PanToPlace.
const useRevealSelected = (clusterer: MarkerClusterer | null, markers: MarkersById, selectedId: number | null) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !clusterer || selectedId === null) return;
        const reveal = () => {
            const marker = markers.get(selectedId);
            // Not drawn yet, or still off screen while the pan runs (the clusterer skips those too): wait.
            if (!marker?.position || !map.getBounds()?.contains(marker.position)) return false;
            if (marker.map) return true; // the clusterer shows it on its own
            map.setZoom((map.getZoom() ?? 0) + 1);
            return false;
        };
        if (reveal()) return;
        // Removed once the pin shows, so a later zoom-out by the user is left alone.
        const listener = clusterer.addListener("clusteringend", () => { if (reveal()) listener.remove(); });
        return () => listener.remove();
    }, [map, clusterer, markers, selectedId]);
};

const PlaceMarker = ({ place, clusterer, markers, onSelect }: {
    place: MappablePlace; clusterer: MarkerClusterer | null; markers: MarkersById; onSelect: (id: number) => void;
}) => {
    const { id } = place;
    // Stable per clusterer, so re-renders don't remove and re-add the marker.
    const register = useCallback((marker: MarkerElement | null) => {
        if (!marker || !clusterer) return;
        clusterer.addMarker(marker);
        markers.set(id, marker);
        return () => { clusterer.removeMarker(marker); markers.delete(id); };
    }, [clusterer, markers, id]);
    const color = place.tags[0]?.color;
    return (
        <AdvancedMarker ref={register} position={{ lat: place.lat, lng: place.lng }} title={place.title} onClick={() => onSelect(place.id)}>
            {/* A darker border keeps light tag colors visible against the map. */}
            <Pin background={color} borderColor={color && darken(color)} glyphColor={color && "#ffffff"} />
        </AdvancedMarker>
    );
};

const ClusteredMarkers = ({ places, selectedId, onSelect }: { places: MappablePlace[]; selectedId: number | null; onSelect: (id: number) => void }) => {
    const clusterer = useClusterer();
    const [markers] = useState<MarkersById>(() => new Map());
    useRevealSelected(clusterer, markers, selectedId);
    return places.map(place => <PlaceMarker key={place.id} place={place} clusterer={clusterer} markers={markers} onSelect={onSelect} />);
};

const MapOverlay = ({ children, alert = false }: { children: React.ReactNode; alert?: boolean }) => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Paper shadow="md" p="md" radius="md" className="pointer-events-auto text-center" role={alert ? "alert" : undefined}>
            {children}
        </Paper>
    </div>
);

const Dashboard = () => {
    const [tagFilter, setTagFilter] = useState<number[]>([]);
    const [listFilter, setListFilter] = useState<number | null>(null);
    const filtered = tagFilter.length > 0 || listFilter !== null;
    const { data: places, isLoading, isFetching, isError, isSuccess } = useGetPlacesQuery(
        filtered ? { tag_ids: tagFilter, list_id: listFilter ?? undefined } : undefined,
    );
    const mappable = useMemo(
        () => (places ?? []).filter((p): p is MappablePlace => p.lat !== null && p.lng !== null),
        [places],
    );
    const [selectedId, setSelectedId] = useState<number | null>(null);
    // Derived from query data, so a deleted place deselects itself after the refetch.
    const selectedPlace = mappable.find(p => p.id === selectedId);
    const [formPlace, setFormPlace] = useState<Place | "new" | null>(null);
    // On a phone the navbar covers the map, so close it once a choice should show on the map.
    const [navOpened, nav] = useDisclosure();

    return (
        <AppShellComponent onAddPlace={() => setFormPlace("new")} navOpened={navOpened} onToggleNav={nav.toggle}>
            <SideBar tagFilter={tagFilter} onTagFilterChange={setTagFilter} listFilter={listFilter} onListFilterChange={id => { setListFilter(id); nav.close(); }} />

            <AppShell.Main className="p-0">
                <div className="relative w-full h-[calc(100vh-60px)]">
                    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                        <GoogleMap mapId={MAP_ID} defaultCenter={DEFAULT_CENTER} defaultZoom={12} gestureHandling="greedy">
                            <ClusteredMarkers places={mappable} selectedId={selectedId} onSelect={setSelectedId} />
                        </GoogleMap>
                        {isSuccess && <FitToPlaces places={mappable} />}
                        <PanToPlace place={selectedPlace} />
                        {formPlace && (
                            <PlaceForm
                                key={formPlace === "new" ? "new" : formPlace.id}
                                place={formPlace === "new" ? undefined : formPlace}
                                onClose={() => setFormPlace(null)}
                                onSaved={saved => { setFormPlace(null); setSelectedId(saved.id); nav.close(); }}
                            />
                        )}
                    </APIProvider>

                    <PlaceDetail place={selectedPlace} onClose={() => setSelectedId(null)} onEdit={() => setFormPlace(selectedPlace ?? null)} />

                    {isLoading && (
                        <MapOverlay>
                            <Loader size="sm" mb="xs" />
                            <Text size="sm">Loading your places…</Text>
                        </MapOverlay>
                    )}
                    {isError && (
                        <MapOverlay alert>
                            <Text size="sm" c="red">Something went wrong. Please try again later.</Text>
                        </MapOverlay>
                    )}
                    {/* While a new filter loads, data is still the previous result, so wait before calling it empty. */}
                    {isSuccess && !isFetching && mappable.length === 0 && (
                        <MapOverlay>
                            {filtered ? (
                                <Text fw={600}>No places match this filter</Text>
                            ) : (
                                <>
                                    <Text fw={600}>No places yet</Text>
                                    <Text size="sm" c="dimmed">Add your first place to see it on the map.</Text>
                                </>
                            )}
                        </MapOverlay>
                    )}
                </div>
            </AppShell.Main>
        </AppShellComponent>
    );
};

export default Dashboard;
