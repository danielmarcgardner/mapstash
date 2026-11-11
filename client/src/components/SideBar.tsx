import { useState } from "react";
import { ActionIcon, AppShell, Button, Group, ScrollArea, Title } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import TagEditor from "./TagEditor";
import type { Tag } from "../types/tag";
import { useGetListsQuery } from "../state/api/listApi";
import { useGetTagsQuery } from "../state/api/tagApi";

const LOAD_ERROR = 'Something went wrong. Please try again later.';

type Props = { tagFilter: number[]; onTagFilterChange: (ids: number[]) => void };

const SideBar = ({ tagFilter, onTagFilterChange }: Props) => {
    const [editing, setEditing] = useState<Tag | null>(null);
    const toggle = (id: number) =>
        onTagFilterChange(tagFilter.includes(id) ? tagFilter.filter(t => t !== id) : [...tagFilter, id]);

    const { data: lists = [], isLoading: listsLoading, isError: listsError } = useGetListsQuery();
    const { data: tags = [], isLoading: tagsLoading, isError: tagsError } = useGetTagsQuery();

    return (
        <AppShell.Navbar p="xs">
            <ScrollArea className="h-full">
                <Title order={5} mb="xs">
                    Your Lists
                </Title>
                <ul className="mb-4 space-y-2">
                    {listsLoading && <li className="text-sm text-gray-500">Loading…</li>}
                    {listsError && <li role="alert" className="text-sm text-red-600">{LOAD_ERROR}</li>}
                    {!listsLoading && !listsError && lists.length === 0 && <li className="text-sm text-gray-500">No lists yet</li>}
                    {lists.map(list => (
                        <li key={list.id} className="text-sm text-gray-700 hover:text-black cursor-pointer">{list.title}</li>
                    ))}
                </ul>

                <Group justify="space-between" mb="xs">
                    <Title order={5}>Tags</Title>
                    {tagFilter.length > 0 && (
                        <Button size="compact-xs" variant="subtle" onClick={() => onTagFilterChange([])}>Clear filter</Button>
                    )}
                </Group>
                <div className="flex flex-wrap gap-1">
                    {tagsLoading && <span className="text-sm text-gray-500">Loading…</span>}
                    {tagsError && <span role="alert" className="text-sm text-red-600">{LOAD_ERROR}</span>}
                    {!tagsLoading && !tagsError && tags.length === 0 && <span className="text-sm text-gray-500">No tags yet</span>}
                    {tags.map(tag => {
                        const selected = tagFilter.includes(tag.id);
                        return (
                            <span key={tag.id} className={`inline-flex items-center rounded text-xs ${selected ? "ring-2 ring-offset-1 ring-gray-800" : ""}`}
                                style={{ backgroundColor: tag.color }}>
                                <button type="button" aria-pressed={selected} onClick={() => toggle(tag.id)} className="px-2 py-1 cursor-pointer">
                                    {tag.name} <span className="opacity-70">{tag.places_count}</span>
                                </button>
                                <ActionIcon size="xs" variant="transparent" color="dark" aria-label={`Edit ${tag.name}`} onClick={() => setEditing(tag)}>
                                    <IconPencil size={12} />
                                </ActionIcon>
                            </span>
                        );
                    })}
                </div>
            </ScrollArea>
            {editing && (
                <TagEditor
                    key={editing.id}
                    tag={editing}
                    onClose={() => setEditing(null)}
                    onDeleted={id => onTagFilterChange(tagFilter.filter(t => t !== id))}
                />
            )}
        </AppShell.Navbar>
    );
};

export default SideBar;
