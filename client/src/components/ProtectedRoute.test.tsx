import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { makeStore } from '../state/store';
import { loginSuccess } from '../state/slices/authSlice';
import { useGetTagsQuery } from '../state/api/tagApi';
import { jsonResponse, stubFetch } from '../test/fetchStub';
import { renderWithStore } from '../test/renderWithStore';

const user = { id: 1, email: 'a@b.co', first_name: 'A', last_name: 'B' };

const TagsChild = () => {
    const { data } = useGetTagsQuery();
    return <div>Dashboard {data?.length ?? 0}</div>;
};

const renderProtected = (child = <div>Dashboard</div>, token: string | null = 'abc') => {
    const store = makeStore();
    if (token) store.dispatch(loginSuccess({ user, token }));
    return renderWithStore(
        <Routes>
            <Route element={<ProtectedRoute />}>
                <Route index element={child} />
            </Route>
        </Routes>,
        store,
    );
};

afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe('ProtectedRoute', () => {
    it('keeps a user with a valid stored token on the dashboard', async () => {
        stubFetch({ 'GET /api/users/me': () => user });
        renderProtected();
        expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    });

    it('sends the user to /login when /api/users/me rejects the token', async () => {
        stubFetch({ 'GET /api/users/me': () => jsonResponse(401, { errors: ['revoked token'] }) });
        renderProtected();
        expect(await screen.findByText('Login page')).toBeInTheDocument();
    });

    it('sends the user to /login when a later request gets a 401', async () => {
        stubFetch({
            'GET /api/users/me': () => user,
            'GET /api/tags': () => jsonResponse(401, { errors: ['Signature has expired'] }),
        });
        const store = renderProtected(<TagsChild />);
        expect(await screen.findByText('Login page')).toBeInTheDocument();
        expect(store.getState().auth.token).toBeNull();
    });

    it('keeps the session and shows an error when /api/users/me fails for another reason', async () => {
        stubFetch({ 'GET /api/users/me': () => jsonResponse(500) });
        const store = renderProtected();
        expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
        expect(screen.queryByText('Login page')).not.toBeInTheDocument();
        expect(store.getState().auth.token).toBe('abc');
    });

    it('redirects without calling the API when there is no token', async () => {
        const { count } = stubFetch({});
        renderProtected(<div>Dashboard</div>, null);
        expect(await screen.findByText('Login page')).toBeInTheDocument();
        expect(count('GET', '/api/users/me')).toBe(0);
    });
});
