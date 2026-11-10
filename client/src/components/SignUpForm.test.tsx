import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SignUpForm from './SignUpForm';
import { jsonResponse, stubFetch } from '../test/fetchStub';
import { renderWithStore } from '../test/renderWithStore';

afterEach(() => vi.unstubAllGlobals());

describe('SignUpForm', () => {
    it('shows every API error message', async () => {
        stubFetch({
            'POST /api/signup': () => jsonResponse(422, { errors: ['Email has already been taken', 'Password is too short'] }),
        });
        renderWithStore(<SignUpForm />);
        fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Ada' } });
        fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Lovelace' } });
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password1' } });
        fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
        expect(await screen.findByText('Email has already been taken Password is too short')).toBeInTheDocument();
    });
});
