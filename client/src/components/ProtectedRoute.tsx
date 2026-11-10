import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { useGetCurrentUserQuery } from '../state/api/authApi';
import { loginSuccess } from '../state/slices/authSlice';
import type { RootState } from '../state/store';
import FullPageLoader from '../components/FullPageLoader';

export default function ProtectedRoute() {
    const token = useSelector((state: RootState) => state.auth.token);
    const dispatch = useDispatch();

    const {
        data: currentUser,
        isLoading,
        isSuccess,
        isError,
    } = useGetCurrentUserQuery(undefined, {
        skip: !token,
    });

    useEffect(() => {
        if (isSuccess && currentUser && token) {
            dispatch(loginSuccess({ user: currentUser, token }));
        }
    }, [isSuccess, currentUser, dispatch, token]);

    // A 401 already cleared the token in baseApi, so this redirect covers expired and revoked tokens.
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (isLoading) {
        return <FullPageLoader />;
    }

    // Any other failure (500, network) keeps the session; a refresh during an outage shouldn't log the user out.
    if (isError) {
        return <div role="alert" className="p-4 text-red-600">Something went wrong. Please try again later.</div>;
    }

    return <Outlet />;
}