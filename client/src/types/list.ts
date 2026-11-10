type List = {
    id: number;
    title: string;
    description?: string;
    places_count: number;
    place_ids: number[];
}

type CreateListPayload = {
    title: string;
    description?: string;
}

type UpdateListPayload = Partial<CreateListPayload>;

export type { List, CreateListPayload, UpdateListPayload };
