type PlaceTag = {
    id: number;
    name: string;
    color: string;
}

type Place = {
    id: number;
    title: string;
    description: string | null;
    address: string;
    lat: number | null;
    lng: number | null;
    image_url: string | null;
    location_name: string | null;
    link_url: string | null;
    visited: boolean | null;
    notes: string | null;
    google_place_id: string | null;
    tags: PlaceTag[];
    list_ids: number[];
    created_at: string;
    updated_at: string;
}

type CreatePlacePayload = Partial<Omit<Place, 'id' | 'title' | 'lat' | 'lng' | 'tags' | 'list_ids' | 'created_at' | 'updated_at'>> & {
    title: string;
    lat: number;
    lng: number;
    tag_ids?: number[];
    list_ids?: number[];
};

type UpdatePlacePayload = Partial<CreatePlacePayload>;

export type { Place, PlaceTag, CreatePlacePayload, UpdatePlacePayload };
