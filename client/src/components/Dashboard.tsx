import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell, Loader, Paper, Text } from "@mantine/core";
import { AdvancedMarker, APIProvider, Map as GoogleMap, Pin, useMap } from "@vis.gl/react-google-maps";
import AppShellComponent from "./AppShell";
import SideBar from "./SideBar";
import PlaceDetail from "./PlaceDetail";
import { useGetPlacesQuery } from "../state/api/placeApi";
import type { Place } from "../types/place";

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

const MapOverlay = ({ children, alert = false }: { children: React.ReactNode; alert?: boolean }) => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Paper shadow="md" p="md" radius="md" className="pointer-events-auto text-center" role={alert ? "alert" : undefined}>
            {children}
        </Paper>
    </div>
);

const Dashboard = () => {
    const { data: places, isLoading, isError, isSuccess } = useGetPlacesQuery();
    const mappable = useMemo(
        () => (places ?? []).filter((p): p is MappablePlace => p.lat !== null && p.lng !== null),
        [places],
    );
    const [selectedId, setSelectedId] = useState<number | null>(null);
    // Derived from query data, so a deleted place deselects itself after the refetch.
    const selectedPlace = mappable.find(p => p.id === selectedId);

    return (
        <AppShellComponent>
            <SideBar />

            <AppShell.Main className="p-0">
                <div className="relative w-full h-[calc(100vh-60px)]">
                    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                        <GoogleMap mapId={MAP_ID} defaultCenter={DEFAULT_CENTER} defaultZoom={12} gestureHandling="greedy">
                            {mappable.map(place => {
                                const color = place.tags[0]?.color;
                                return (
                                    <AdvancedMarker key={place.id} position={{ lat: place.lat, lng: place.lng }} title={place.title}
                                        onClick={() => setSelectedId(place.id)}>
                                        <Pin background={color} borderColor={color} glyphColor={color && "#ffffff"} />
                                    </AdvancedMarker>
                                );
                            })}
                        </GoogleMap>
                        {isSuccess && <FitToPlaces places={mappable} />}
                        <PanToPlace place={selectedPlace} />
                    </APIProvider>

                    <PlaceDetail place={selectedPlace} onClose={() => setSelectedId(null)} />

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
                    {isSuccess && mappable.length === 0 && (
                        <MapOverlay>
                            <Text fw={600}>No places yet</Text>
                            <Text size="sm" c="dimmed">Add your first place to see it on the map.</Text>
                        </MapOverlay>
                    )}
                </div>
            </AppShell.Main>
        </AppShellComponent>
    );
};

export default Dashboard;
