import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { makeStore } from '../state/store';

// Renders `ui` at "/" with a real store, plus a /login route to assert redirects against.
export const renderWithStore = (ui: ReactNode, store = makeStore()) => {
    render(
        <MantineProvider>
            <Notifications />
            <Provider store={store}>
                <MemoryRouter initialEntries={['/']}>
                    <Routes>
                        <Route path="/login" element={<div>Login page</div>} />
                        <Route path="/*" element={ui} />
                    </Routes>
                </MemoryRouter>
            </Provider>
        </MantineProvider>,
    );
    return store;
};
