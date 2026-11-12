import { useState } from "react";
import { Alert, Button, ColorInput, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useDeleteTagMutation, useUpdateTagMutation } from "../state/api/tagApi";
import { errorMessage } from "../state/api/errorMessage";
import type { Tag } from "../types/tag";

type Props = { tag: Tag; onClose: () => void; onDeleted: (id: number) => void };

const TagEditor = ({ tag, onClose, onDeleted }: Props) => {
    const [updateTag, { isLoading: saving }] = useUpdateTagMutation();
    const [deleteTag, { isLoading: deleting }] = useDeleteTagMutation();
    const [name, setName] = useState(tag.name);
    const [color, setColor] = useState(tag.color);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim()) return setError("Name is required");
        setError(null);
        try {
            await updateTag({ id: tag.id, name: name.trim(), color }).unwrap();
            onClose();
        } catch (err) {
            setError(errorMessage(err, "Couldn't save the tag."));
        }
    };

    const remove = async () => {
        setError(null);
        try {
            await deleteTag(tag.id).unwrap();
            onDeleted(tag.id);
            onClose();
        } catch (err) {
            setError(errorMessage(err, "Couldn't delete the tag."));
        }
    };

    return (
        <Modal opened onClose={onClose} title="Edit tag">
            <form onSubmit={save}>
                <Stack gap="sm">
                    <TextInput label="Name" value={name} onChange={e => setName(e.currentTarget.value)} data-autofocus />
                    <ColorInput label="Color" format="hex" value={color} onChange={setColor} />
                    {error && <Alert color="red" role="alert">{error}</Alert>}
                    <Group justify="space-between">
                        {confirming ? (
                            <Group gap="xs">
                                <Button variant="default" onClick={() => setConfirming(false)} disabled={deleting}>Cancel</Button>
                                <Button color="red" onClick={remove} loading={deleting}>Delete this tag?</Button>
                            </Group>
                        ) : (
                            <Button color="red" variant="subtle" onClick={() => setConfirming(true)}>Delete</Button>
                        )}
                        <Button type="submit" loading={saving}>Save</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default TagEditor;
