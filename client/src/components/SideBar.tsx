import {AppShell, ScrollArea, Title} from "@mantine/core";
import { useGetListsQuery } from "../state/api/listApi";
import { useGetTagsQuery } from "../state/api/tagApi";

const LOAD_ERROR = 'Something went wrong. Please try again later.';

const SideBar = () => {
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

                <Title order={5} mb="xs">
                    Tags
                </Title>
                <div className="flex flex-wrap gap-1">
                    {tagsLoading && <span className="text-sm text-gray-500">Loading…</span>}
                    {tagsError && <span role="alert" className="text-sm text-red-600">{LOAD_ERROR}</span>}
                    {!tagsLoading && !tagsError && tags.length === 0 && <span className="text-sm text-gray-500">No tags yet</span>}
                    {tags.map(tag => (
                        <span key={tag.id} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: tag.color }}>
                            {tag.name}
                        </span>
                    ))}
                </div>
            </ScrollArea>
        </AppShell.Navbar>
    );
};

export default SideBar;
