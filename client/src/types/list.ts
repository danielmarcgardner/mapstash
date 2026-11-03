import {type Place } from './place';

type List = {
    id: string;
    title: string;
    description?: string;
    places: Place[];
}
type ListState = {
    lists: List[];
    isLoading: boolean;
    isError: boolean;
    error: string | null;
    isSuccess: boolean;
}

type CreateListPayload = {
    title: string;
    description?: string;
}

export type { List, ListState, CreateListPayload };