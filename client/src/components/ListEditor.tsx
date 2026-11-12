import { useState } from "react";
import { Alert, Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useCreateListMutation, useDeleteListMutation, useUpdateListMutation } from "../state/api/listApi";
import { errorMessage } from "../state/api/errorMessage";
import type { List } from "../types/list";

// Creates a list when `list` is missing; otherwise renames or deletes it.
type Props = { list?: List; onClose: () => void; onDeleted: (id: number) => void };

const ListEditor = ({ list, onClose, onDeleted }: Props) => {
    const [createList, { isLoading: creating }] = useCreateListMutation();
    const [updateList, { isLoading: updating }] = useUpdateListMutation();
    const [deleteList, { isLoading: deleting }] = useDeleteListMutation();
    const [title, setTitle] = useState(list?.title ?? "");
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!title.trim()) return setError("Title is required");
        setError(null);
        try {
            await (list ? updateList({ id: list.id, title: title.trim() }) : createList({ title: title.trim() })).unwrap();
            onClose();
        } catch (err) {
            setError(errorMessage(err, "Couldn't save the list."));
        }
    };

    const remove = async () => {
        if (!list) return;
        setError(null);
        try {
            await deleteList(list.id).unwrap();
            onDeleted(list.id);
            onClose();
        } catch (err) {
            setError(errorMessage(err, "Couldn't delete the list."));
        }
    };

    return (
        <Modal opened onClose={onClose} title={list ? "Edit list" : "New list"}>
            <form onSubmit={save}>
                <Stack gap="sm">
                    <TextInput label="Title" value={title} onChange={e => setTitle(e.currentTarget.value)} data-autofocus />
                    {error && <Alert color="red" role="alert">{error}</Alert>}
                    <Group justify={list ? "space-between" : "flex-end"}>
                        {list && (confirming ? (
                            <Group gap="xs">
                                <Button variant="default" onClick={() => setConfirming(false)} disabled={deleting}>Cancel</Button>
                                <Button color="red" onClick={remove} loading={deleting}>Delete this list?</Button>
                            </Group>
                        ) : (
                            <Button color="red" variant="subtle" onClick={() => setConfirming(true)}>Delete</Button>
                        ))}
                        <Button type="submit" loading={creating || updating} disabled={deleting}>Save</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default ListEditor;
