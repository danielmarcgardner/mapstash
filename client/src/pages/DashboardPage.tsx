import {useEffect} from "react";
import { useSelector, useDispatch } from 'react-redux';
import { useGetPlacesQuery } from "../state/api/placeApi";
import { fetchPlacesStart, fetchPlacesSuccess, fetchPlacesFailure } from "../state/slices/placeSlice";
import { fetchTagsStart, fetchTagsFailure, fetchTagsSuccess } from "../state/slices/tagSlice";
import { fetchListsStart, fetchListsSuccess, fetchListsFailure } from "../state/slices/listSlice";
import type { RootState } from '../state/store';
import { useGetListsQuery } from "../state/api/listApi";
import { useGetTagsQuery } from "../state/api/tagApi";
import Dashboard from "../components/Dashboard";

const DashboardPage = () => {
    const places =useSelector((state: RootState) => state.place.places);
    const lists = useSelector((state: RootState) => state.list.lists);
    const tags = useSelector((state: RootState) => state.tag.tags);
    const dispatch = useDispatch();

    const { data: placesData, isLoading: isPlacesLoading,isSuccess: isSuccessPlaces, isError: isErrorPlaces } = useGetPlacesQuery();
    const { data: listsData, isLoading: isListsLoading, isSuccess: isSuccessLists, isError: isErrorLists } = useGetListsQuery();
    const { data: tagsData, isLoading: isTagsLoading, isSuccess: isSuccessTags, isError: isErrorTags } = useGetTagsQuery();

    useEffect(() => { 
        if (places.length === 0 && !isPlacesLoading) {
            dispatch(fetchPlacesStart());
        }
        if (isSuccessPlaces && placesData) {
            dispatch(fetchPlacesSuccess(placesData));
        } else if (isErrorPlaces) {
            dispatch(fetchPlacesFailure('Failed to fetch places'));
        }
    }, [places.length, placesData, isPlacesLoading, isSuccessPlaces, isErrorPlaces, dispatch]);
    useEffect(() => { 
        if (lists.length === 0 && !isListsLoading) {
            dispatch(fetchListsStart());
        }
        if (isSuccessLists && listsData) {
            dispatch(fetchListsSuccess(listsData));
        } else if (isErrorLists) {
            dispatch(fetchListsFailure('Failed to fetch lists'));
        }
    }, [lists.length, listsData, isListsLoading, isSuccessLists, isErrorLists, dispatch]);
    useEffect(() => { 
        if (tags.length === 0 && !isTagsLoading) {
            dispatch(fetchTagsStart());
        }
        if (isSuccessTags && tagsData) {
            dispatch(fetchTagsSuccess(tagsData));
        } else if (isErrorTags) {
            dispatch(fetchTagsFailure('Failed to fetch tags'));
        }
    }, [tags.length, tagsData, isTagsLoading, isSuccessTags, isErrorTags, dispatch]);

    return (
        <div>
            <Dashboard />
        </div>
    );
}
export default DashboardPage;