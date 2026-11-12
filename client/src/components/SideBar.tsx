import { useState } from "react";
import { ActionIcon, AppShell, Button, Group, ScrollArea, Title } from "@mantine/core";
import { IconPencil, IconPlus } from "@tabler/icons-react";
import ListEditor from "./ListEditor";
import TagEditor from "./TagEditor";
import type { List } from "../types/list";
import type { Tag } from "../types/tag";
import { useGetListsQuery } from "../state/api/listApi";
import { useGetTagsQuery } from "../state/api/tagApi";

const LOAD_ERROR = 'Something went wrong. Please try again later.';

type Props = {
    tagFilter: number[];
    onTagFilterChange: (ids: number[]) => void;
    listFilter: number | null;
    onListFilterChange: (id: number | null) => void;
};

const SideBar = ({ tagFilter, onTagFilterChange, listFilter, onListFilterChange }: Props) => {
    const [editing, setEditing] = useState<Tag | null>(null);
    const [editingList, setEditingList] = useState<List | "new" | null>(null);
    const toggle = (id: number) =>
        onTagFilterChange(tagFilter.includes(id) ? tagFilter.filter(t => t !== id) : [...tagFilter, id]);

    const { data: lists = [], isLoading: listsLoading, isError: listsError } = useGetListsQuery();
    const { data: tags = [], isLoading: tagsLoading, isError: tagsError } = useGetTagsQuery();

    return (
        <AppShell.Navbar p="xs">
            <ScrollArea className="h-full">
                <Group justify="space-between" mb="xs">
                    <Title order={5}>Your Lists</Title>
                    <ActionIcon size="sm" variant="subtle" color="gray" aria-label="New list" onClick={() => setEditingList("new")}>
                        <IconPlus size={14} />
                    </ActionIcon>
                </Group>
                <ul className="mb-4 space-y-1">
                    {listsLoading && <li className="text-sm text-gray-500">Loading…</li>}
                    {listsError && <li role="alert" className="text-sm text-red-600">{LOAD_ERROR}</li>}
                    {!listsLoading && !listsError && lists.length === 0 && <li className="text-sm text-gray-500">No lists yet</li>}
                    {lists.map(list => {
                        const selected = listFilter === list.id;
                        return (
                            <li key={list.id} className="flex items-center justify-between gap-1">
                                <button type="button" aria-pressed={selected} onClick={() => onListFilterChange(selected ? null : list.id)}
                                    className={`flex-1 text-left text-sm cursor-pointer rounded px-1 ${selected ? "font-semibold text-black bg-gray-100" : "text-gray-700 hover:text-black"}`}>
                                    {list.title} <span className="opacity-70">{list.places_count}</span>
                                </button>
                                <ActionIcon size="xs" variant="subtle" color="gray" aria-label={`Edit ${list.title}`} onClick={() => setEditingList(list)}>
                                    <IconPencil size={12} />
                                </ActionIcon>
                            </li>
                        );
                    })}
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
            {editingList && (
                <ListEditor
                    key={editingList === "new" ? "new" : editingList.id}
                    list={editingList === "new" ? undefined : editingList}
                    onClose={() => setEditingList(null)}
                    onDeleted={id => { if (listFilter === id) onListFilterChange(null); }}
                />
            )}
        </AppShell.Navbar>
    );
};

export default SideBar;
