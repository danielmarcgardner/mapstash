import { useEffect, useRef, useState } from "react";
import { Alert, Button, Group, Modal, Select, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useCreatePlaceMutation, useUpdatePlaceMutation } from "../state/api/placeApi";
import type { Place } from "../types/place";
import type { AuthError } from "../types/user";

type Props = { place?: Place; onClose: () => void; onSaved: (place: Place) => void };

const isHttpUrl = (value: string) => {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

const PlaceForm = ({ place, onClose, onSaved }: Props) => {
    const placesLib = useMapsLibrary("places");
    const [createPlace, createStatus] = useCreatePlaceMutation();
    const [updatePlace, updateStatus] = useUpdatePlaceMutation();
    const [submitError, setSubmitError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebouncedValue(search, 300);
    const [predictions, setPredictions] = useState<google.maps.places.PlacePrediction[]>([]);
    const [pickedLabel, setPickedLabel] = useState<string | null>(null);
    const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

    const form = useForm({
        initialValues: {
            title: place?.title ?? "",
            link_url: place?.link_url ?? "",
            description: place?.description ?? "",
            notes: place?.notes ?? "",
            location_name: place?.location_name ?? "",
            address: place?.address ?? "",
            lat: place?.lat ?? null as number | null,
            lng: place?.lng ?? null as number | null,
            google_place_id: place?.google_place_id ?? "",
        },
        validate: {
            title: (value) => (value.trim() ? null : "Title is required"),
            lat: (value) => (value === null ? "Pick a location from the search" : null),
            link_url: (value) => (!value || isHttpUrl(value) ? null : "Enter an http(s) URL"),
        },
    });

    useEffect(() => {
        // Selecting an option writes its label into the search box; don't search for it again.
        if (!placesLib || !debouncedSearch.trim() || debouncedSearch === pickedLabel) return;
        let current = true;
        sessionToken.current ??= new placesLib.AutocompleteSessionToken();
        placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: debouncedSearch, sessionToken: sessionToken.current })
            .then(({ suggestions }) => {
                if (current) setPredictions(suggestions.flatMap(s => (s.placePrediction ? [s.placePrediction] : [])));
            })
            .catch(() => current && setPredictions([]));
        return () => { current = false; };
    }, [placesLib, debouncedSearch, pickedLabel]);

    const pickLocation = async (placeId: string | null) => {
        const prediction = predictions.find(p => p.placeId === placeId);
        if (!prediction) return;
        setPickedLabel(prediction.text.toString());
        const picked = prediction.toPlace();
        await picked.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
        sessionToken.current = null; // a session ends once a place's details are fetched
        const name = picked.displayName ?? "";
        form.setValues({
            location_name: name,
            address: picked.formattedAddress ?? "",
            lat: picked.location?.lat() ?? null,
            lng: picked.location?.lng() ?? null,
            google_place_id: picked.id,
            ...(form.values.title.trim() ? {} : { title: name }),
        });
    };

    const handleSubmit = async (values: typeof form.values) => {
        setSubmitError(null);
        const payload = { ...values, lat: values.lat!, lng: values.lng! }; // validation guarantees both
        try {
            const saved = place
                ? await updatePlace({ id: place.id, ...payload }).unwrap()
                : await createPlace(payload).unwrap();
            notifications.show({ message: "Place saved", color: "green" });
            onSaved(saved);
        } catch (err) {
            setSubmitError((err as { data?: AuthError })?.data?.errors?.join(" ") || "Couldn't save the place.");
        }
    };

    return (
        <Modal opened onClose={onClose} title={place ? "Edit place" : "Add place"}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="sm">
                    <Select
                        label="Location"
                        placeholder="Search for a place"
                        searchable
                        data-autofocus
                        searchValue={search}
                        onSearchChange={setSearch}
                        data={predictions.map(p => ({ value: p.placeId, label: p.text.toString() }))}
                        filter={({ options }) => options} // Google already filtered them
                        onChange={pickLocation}
                        nothingFoundMessage={debouncedSearch.trim() ? "No matches" : undefined}
                        description={form.values.address || undefined}
                        error={form.errors.lat}
                    />
                    <TextInput label="Title" {...form.getInputProps("title")} />
                    <TextInput label="Link" placeholder="https://www.instagram.com/reel/…" {...form.getInputProps("link_url")} />
                    <Textarea label="Description" autosize minRows={2} {...form.getInputProps("description")} />
                    <Textarea label="Notes" autosize minRows={2} {...form.getInputProps("notes")} />

                    {submitError && <Alert color="red" role="alert">{submitError}</Alert>}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={onClose}>Cancel</Button>
                        <Button type="submit" loading={createStatus.isLoading || updateStatus.isLoading}>Save</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default PlaceForm;
