type List = {
    id: number;
    title: string;
    description: string | null;
    places_count: number;
    place_ids: number[];
}

type CreateListPayload = {
    title: string;
    description?: string;
}

type UpdateListPayload = Partial<CreateListPayload>;

export type { List, CreateListPayload, UpdateListPayload };
