type PlaceTag = {
    id: number;
    name: string;
    color: string;
}

type Place = {
    id: number;
    title: string;
    description?: string;
    address: string;
    lat: number;
    lng: number;
    image_url?: string;
    location_name?: string;
    link_url?: string;
    visited?: boolean;
    notes?: string;
    google_place_id?: string;
    tags: PlaceTag[];
    list_ids: number[];
    created_at: string;
    updated_at: string;
}

type CreatePlacePayload = Omit<Place, 'id' | 'tags' | 'list_ids' | 'created_at' | 'updated_at'> & {
    tag_ids?: number[];
    list_ids?: number[];
};

type UpdatePlacePayload = Partial<CreatePlacePayload>;

export type { Place, PlaceTag, CreatePlacePayload, UpdatePlacePayload };
