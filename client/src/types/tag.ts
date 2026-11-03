type Tag = {
    id: string;
    name: string;
    color: string;
};
type CreateTagPayload = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateTagPayload = Partial<Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>>;
type TagState = {
    isLoading: boolean;
    isError: boolean;
    tags: Tag[];
    error: string | null;
};
export type { Tag, CreateTagPayload, UpdateTagPayload, TagState };