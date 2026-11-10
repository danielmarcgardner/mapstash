import { AppShell } from '@mantine/core';
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import { makeStore } from '../state/store';
import { loginSuccess } from '../state/slices/authSlice';
import { jsonResponse, stubFetch } from '../test/fetchStub';
import { renderWithStore } from '../test/renderWithStore';

const user = { id: 1, email: 'a@b.co', first_name: 'ada', last_name: 'lovelace' };

const renderHeader = () => {
    const store = makeStore();
    store.dispatch(loginSuccess({ user, token: 'abc' }));
    renderWithStore(<AppShell header={{ height: 60 }}><Header /></AppShell>, store);
    return store;
};

const logOut = async () => {
    fireEvent.click(await screen.findByRole('button', { name: 'Account menu' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }));
};

afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe('Header', () => {
    it('shows uppercase initials', async () => {
        stubFetch({ 'GET /api/users/me': () => user });
        renderHeader();
        expect(await screen.findByText('AL')).toBeInTheDocument();
    });

    it('shows ? instead of undefined when names are empty', async () => {
        stubFetch({ 'GET /api/users/me': () => ({ ...user, first_name: '', last_name: '' }) });
        renderHeader();
        expect(await screen.findByText('?')).toBeInTheDocument();
        expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });

    it('logs out: revokes the token on the server, clears it and goes to /login', async () => {
        const { calls } = stubFetch({ 'GET /api/users/me': () => user, 'DELETE /api/logout': () => jsonResponse(204) });
        const store = renderHeader();
        await logOut();

        expect(await screen.findByText('Login page')).toBeInTheDocument();
        expect(calls.find(c => c.method === 'DELETE')).toMatchObject({ path: '/api/logout', auth: 'Bearer abc' });
        expect(store.getState().auth.token).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('still clears the session when the logout request fails', async () => {
        stubFetch({ 'GET /api/users/me': () => user, 'DELETE /api/logout': () => jsonResponse(500) });
        const store = renderHeader();
        await logOut();

        expect(await screen.findByText('Login page')).toBeInTheDocument();
        expect(store.getState().auth.token).toBeNull();
    });
});
