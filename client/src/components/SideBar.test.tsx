import { AppShell, MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SideBar from './SideBar';
import { makeStore } from '../state/store';
import { tagApi } from '../state/api/tagApi';
import { stubFetch } from '../test/fetchStub';

afterEach(() => vi.unstubAllGlobals());

const renderSideBar = () => {
    const store = makeStore();
    render(
        <MantineProvider>
            <Provider store={store}>
                <AppShell navbar={{ width: 200, breakpoint: 'sm' }}>
                    <SideBar />
                </AppShell>
            </Provider>
        </MantineProvider>,
    );
    return store;
};

describe('SideBar', () => {
    it('shows a newly created tag without a reload', async () => {
        const tags = [{ id: 1, name: 'Brunch', color: '#eee', places_count: 0 }];
        stubFetch({
            'GET /api/tags': () => tags,
            'GET /api/lists': () => [{ id: 1, title: 'SF Trip', places_count: 0, place_ids: [] }],
            'POST /api/tags': (body) => {
                const { tag } = body as { tag: { name: string; color: string } };
                const created = { id: tags.length + 1, ...tag, places_count: 0 };
                tags.push(created);
                return created;
            },
        });
        const store = renderSideBar();

        expect(await screen.findByText('Brunch')).toBeInTheDocument();
        expect(await screen.findByText('SF Trip')).toBeInTheDocument();

        await act(() => store.dispatch(tagApi.endpoints.createTag.initiate({ name: 'Coffee', color: '#fff' })));
        expect(await screen.findByText('Coffee')).toBeInTheDocument();
    });

    it('shows an error, not an empty state, when loading fails', async () => {
        stubFetch({}); // every request 404s
        renderSideBar();

        expect(await screen.findAllByRole('alert')).toHaveLength(2);
        expect(screen.getAllByText('Something went wrong. Please try again later.')).toHaveLength(2);
        expect(screen.queryByText('No lists yet')).not.toBeInTheDocument();
        expect(screen.queryByText('No tags yet')).not.toBeInTheDocument();
    });
});
