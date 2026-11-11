type Tag = {
    id: number;
    name: string;
    color: string;
    places_count: number;
};
type CreateTagPayload = Pick<Tag, 'name'> & { color?: string }; // the server defaults the color
type UpdateTagPayload = Partial<CreateTagPayload>;
export type { Tag, CreateTagPayload, UpdateTagPayload };
