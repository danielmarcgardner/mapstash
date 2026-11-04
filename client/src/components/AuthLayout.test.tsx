import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuthLayout from './AuthLayout';

const renderLayout = (onSubmit = vi.fn()) =>
    render(
        <MantineProvider>
            <AuthLayout title="Log In" onSubmit={onSubmit}>
                <button type="submit">Go</button>
            </AuthLayout>
        </MantineProvider>,
    );

describe('AuthLayout', () => {
    it('renders the title', () => {
        renderLayout();
        expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument();
    });

    it('calls onSubmit when the form is submitted', () => {
        const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => e.preventDefault());
        renderLayout(onSubmit);
        fireEvent.click(screen.getByRole('button', { name: 'Go' }));
        expect(onSubmit).toHaveBeenCalledOnce();
    });
});
