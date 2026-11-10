import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginForm from './LoginForm';
import { jsonResponse, stubFetch } from '../test/fetchStub';
import { renderWithStore } from '../test/renderWithStore';

const fillAndSubmit = () => {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
};

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
});

describe('LoginForm', () => {
    it('shows the API error message', async () => {
        stubFetch({ 'POST /api/login': () => jsonResponse(401, { errors: ['Invalid email or password'] }) });
        renderWithStore(<LoginForm />);
        fillAndSubmit();
        expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    });

    it('stores the token on success without logging to the console', async () => {
        const log = vi.spyOn(console, 'log');
        stubFetch({ 'POST /api/login': () => ({ user: { id: 1, email: 'a@b.co', first_name: 'A', last_name: 'B' }, token: 'abc' }) });
        const store = renderWithStore(<LoginForm />);
        fillAndSubmit();
        await vi.waitFor(() => expect(store.getState().auth.token).toBe('abc'));
        expect(log).not.toHaveBeenCalled();
    });
});
