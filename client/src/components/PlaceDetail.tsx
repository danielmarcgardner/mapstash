import { useState } from "react";
import { Alert, Badge, Button, Drawer, Group, Popover, Stack, Text } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import dayjs from "dayjs";
import { useClearVisitedMutation, useDeletePlaceMutation, useMarkVisitedMutation } from "../state/api/placeApi";
import { useGetListsQuery } from "../state/api/listApi";
import { useIsPhone } from "../hooks/useIsPhone";
import type { Place } from "../types/place";

// dayjs reads YYYY-MM-DD as a local date; new Date("2026-03-04") is UTC midnight and shows Mar 3 west of UTC.
const formatVisit = (visitedOn: string) => {
    const date = dayjs(visitedOn);
    return date.toDate().toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: date.isSame(dayjs(), 'year') ? undefined : 'numeric',
    });
};

type Props = { place: Place | undefined; onClose: () => void; onEdit: () => void };

const PlaceDetail = ({ place, onClose, onEdit }: Props) => {
    const { data: lists = [] } = useGetListsQuery();
    const isPhone = useIsPhone();
    const [deletePlace, { isLoading: deleting }] = useDeletePlaceMutation();
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(false);
    const [markVisited, { isLoading: marking }] = useMarkVisitedMutation();
    const [clearVisited, { isLoading: clearing }] = useClearVisitedMutation();
    const [visitError, setVisitError] = useState(false);
    const [pickingDate, setPickingDate] = useState(false);
    const [shownId, setShownId] = useState(place?.id);
    const [lastPlace, setLastPlace] = useState(place);

    // Reset the confirm step and error when a different place is selected (or the drawer closes).
    if (shownId !== place?.id) {
        setShownId(place?.id);
        setConfirming(false);
        setError(false);
        setVisitError(false);
        setPickingDate(false);
    }
    // Keep the last place on screen so the drawer doesn't slide out blank while it closes.
    if (place && place !== lastPlace) setLastPlace(place);
    const shown = place ?? lastPlace;

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

    // The client sends its own local date, so "today" is the user's today, not the server's UTC one.
    const today = dayjs().format('YYYY-MM-DD');
    const updateVisit = async (call: () => Promise<unknown>) => {
        setVisitError(false);
        setPickingDate(false);
        try {
            await call();
        } catch {
            setVisitError(true);
        }
    };
    const visitOn = (date: string) => place && updateVisit(() => markVisited({ id: place.id, visited_on: date }).unwrap());
    const unvisit = () => place && updateVisit(() => clearVisited(place.id).unwrap());

    const placeLists = lists.filter(list => shown?.list_ids.includes(list.id));

    return (
        <Drawer opened={!!place} onClose={onClose} position="right" size={isPhone ? "100%" : undefined} title={<Text fw={600}>{shown?.title}</Text>}>
            {shown && (
                <Stack gap="sm">
                    {shown.visited_on && <Badge color="green" w="fit-content">Visited {formatVisit(shown.visited_on)}</Badge>}
                    <Text size="sm" c="dimmed">{shown.address}</Text>
                    {shown.description && <Text size="sm">{shown.description}</Text>}
                    {shown.notes && (
                        <div>
                            <Text size="xs" fw={600} c="dimmed">Notes</Text>
                            <Text size="sm">{shown.notes}</Text>
                        </div>
                    )}
                    {shown.tags.length > 0 && (
                        <Group gap={4}>
                            {shown.tags.map(tag => (
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
                    {shown.link_url && (
                        <Button component="a" href={shown.link_url} target="_blank" rel="noopener noreferrer" variant="light">
                            Open link
                        </Button>
                    )}

                    <Group grow>
                        <Button variant="default" onClick={onEdit}>Edit</Button>
                        {shown.visited_on ? (
                            <Popover opened={pickingDate} onChange={setPickingDate} position="bottom-end" shadow="md">
                                <Popover.Target>
                                    <Button color="green" variant="light" onClick={() => setPickingDate(o => !o)} loading={marking || clearing}>
                                        Visited
                                    </Button>
                                </Popover.Target>
                                <Popover.Dropdown>
                                    <Stack gap="xs">
                                        <DatePicker
                                            value={shown.visited_on}
                                            defaultDate={shown.visited_on}
                                            maxDate={today}
                                            onChange={date => date && visitOn(date)}
                                            ariaLabels={{ previousMonth: 'Previous month', nextMonth: 'Next month' }}
                                        />
                                        <Button variant="subtle" color="gray" onClick={unvisit}>Mark not visited</Button>
                                    </Stack>
                                </Popover.Dropdown>
                            </Popover>
                        ) : (
                            <Button color="green" variant="light" onClick={() => visitOn(today)} loading={marking}>Mark visited</Button>
                        )}
                    </Group>
                    {visitError && <Alert color="red" role="alert">Couldn't update the visit. Please try again.</Alert>}
                    {error && <Alert color="red" role="alert">Couldn't delete this place. Please try again.</Alert>}
                    {confirming ? (
                        <Group grow>
                            <Button variant="default" onClick={() => setConfirming(false)} disabled={deleting}>Cancel</Button>
                            <Button color="red" onClick={handleDelete} loading={deleting}>
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
