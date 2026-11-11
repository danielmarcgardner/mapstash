import { useState } from "react";
import { Alert, Badge, Button, Drawer, Group, Stack, Text } from "@mantine/core";
import { useDeletePlaceMutation } from "../state/api/placeApi";
import { useGetListsQuery } from "../state/api/listApi";
import type { Place } from "../types/place";

type Props = { place: Place | undefined; onClose: () => void };

const PlaceDetail = ({ place, onClose }: Props) => {
    const { data: lists = [] } = useGetListsQuery();
    const [deletePlace, { isLoading: deleting }] = useDeletePlaceMutation();
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(false);
    const [shownId, setShownId] = useState(place?.id);

    // Reset the confirm step and error when a different place is selected.
    if (shownId !== place?.id) {
        setShownId(place?.id);
        setConfirming(false);
        setError(false);
    }

    const handleDelete = async () => {
        if (!place) return;
        setError(false);
        try {
            await deletePlace(place.id).unwrap();
            onClose();
        } catch {
            setError(true);
        }
    };

    const placeLists = lists.filter(list => place?.list_ids.includes(list.id));

    return (
        <Drawer opened={!!place} onClose={onClose} position="right" title={<Text fw={600}>{place?.title}</Text>}>
            {place && (
                <Stack gap="sm">
                    <Text size="sm" c="dimmed">{place.address}</Text>
                    {place.description && <Text size="sm">{place.description}</Text>}
                    {place.notes && (
                        <div>
                            <Text size="xs" fw={600} c="dimmed">Notes</Text>
                            <Text size="sm">{place.notes}</Text>
                        </div>
                    )}
                    {place.tags.length > 0 && (
                        <Group gap={4}>
                            {place.tags.map(tag => (
                                <Badge key={tag.id} color={tag.color} autoContrast>{tag.name}</Badge>
                            ))}
                        </Group>
                    )}
                    {placeLists.length > 0 && (
                        <div>
                            <Text size="xs" fw={600} c="dimmed">Lists</Text>
                            {placeLists.map(list => <Text key={list.id} size="sm">{list.title}</Text>)}
                        </div>
                    )}
                    {place.link_url && (
                        <Button component="a" href={place.link_url} target="_blank" rel="noopener noreferrer" variant="light">
                            Open link
                        </Button>
                    )}

                    {error && <Alert color="red" role="alert">Couldn't delete this place. Please try again.</Alert>}
                    {confirming ? (
                        <Group grow>
                            <Button variant="default" onClick={() => setConfirming(false)} disabled={deleting}>Cancel</Button>
                            <Button color="red" onClick={handleDelete} loading={deleting} aria-label="Confirm delete">
                                Delete this place?
                            </Button>
                        </Group>
                    ) : (
                        <Button color="red" variant="subtle" onClick={() => setConfirming(true)}>Delete</Button>
                    )}
                </Stack>
            )}
        </Drawer>
    );
};

export default PlaceDetail;
