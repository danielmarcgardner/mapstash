import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { useGetCurrentUserQuery } from '../state/api/authApi';
import { loginSuccess, logout } from '../state/slices/authSlice';
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
        } else if (isError) {
            dispatch(logout());
        }
    }, [isSuccess, isError, currentUser, dispatch, token]);

    if (!token || isError) {
        return <Navigate to="/login" replace />;
    }

    if (isLoading) {
        return <FullPageLoader />;
    }

    return <Outlet />;
}