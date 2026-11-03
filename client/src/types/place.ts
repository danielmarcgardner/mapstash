type Place = {
    id: string;
    title: string;
    description: string;
    address: string;
    lat: number;
    lng: number;
    image_url?: string; 
    location_name?: string;
    link_url?: string;
    visited?: boolean;
    notes?: string;
}

type CreatePlacePayload = Omit<Place, 'id'>;

type UpdatePlacePayload = Partial<Omit<Place, 'id'>>;

type PlaceState = {
    isLoading: boolean;
    isError: boolean;
    places: Place[];
    error: string | null;
}

export type { Place, CreatePlacePayload, UpdatePlacePayload, PlaceState };