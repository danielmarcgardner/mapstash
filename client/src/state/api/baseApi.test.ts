import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '../store';
import { loginSuccess } from '../slices/authSlice';
import { authApi } from './authApi';
import { placeApi } from './placeApi';
import { tagApi } from './tagApi';
import { listApi } from './listApi';
import { stubFetch } from '../../test/fetchStub';

const user = { id: 1, email: 'a@b.co', first_name: 'A', last_name: 'B' };
const newPlace = { title: 'Cafe', address: '1 Main', lat: 1, lng: 2, tag_ids: [3] };

afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe('store', () => {
    it('holds auth plus one API reducer', () => {
        expect(Object.keys(makeStore().getState()).sort()).toEqual(['api', 'auth']);
    });
});

describe('request bodies', () => {
    it('nests login under user', async () => {
        const { calls } = stubFetch({ 'POST /api/login': () => ({ user, token: 't' }) });
        await makeStore().dispatch(authApi.endpoints.login.initiate({ email: 'a@b.co', password: 'pw' }));
        expect(calls[0].body).toEqual({ user: { email: 'a@b.co', password: 'pw' } });
    });

    it('nests createTag under tag', async () => {
        const { calls } = stubFetch({ 'POST /api/tags': () => ({ id: 1, name: 'Coffee', color: '#fff', places_count: 0 }) });
        await makeStore().dispatch(tagApi.endpoints.createTag.initiate({ name: 'Coffee', color: '#fff' }));
        expect(calls[0]).toMatchObject({ method: 'POST', path: '/api/tags', body: { tag: { name: 'Coffee', color: '#fff' } } });
    });

    it('nests createPlace under place, with tag_ids', async () => {
        const { calls } = stubFetch({ 'POST /api/places': () => ({ id: 1 }) });
        await makeStore().dispatch(placeApi.endpoints.createPlace.initiate(newPlace));
        expect(calls[0].body).toEqual({ place: newPlace });
    });

    it('nests createList under list', async () => {
        const { calls } = stubFetch({ 'POST /api/lists': () => ({ id: 1 }) });
        await makeStore().dispatch(listApi.endpoints.createList.initiate({ title: 'Trip' }));
        expect(calls[0].body).toEqual({ list: { title: 'Trip' } });
    });
});

describe('cache invalidation', () => {
    it('refetches tags after createTag', async () => {
        const { count } = stubFetch({
            'GET /api/tags': () => [],
            'POST /api/tags': () => ({ id: 1, name: 'Coffee', color: '#fff', places_count: 0 }),
        });
        const store = makeStore();
        const sub = store.dispatch(tagApi.endpoints.getTags.initiate());
        await sub;
        await store.dispatch(tagApi.endpoints.createTag.initiate({ name: 'Coffee', color: '#fff' }));
        await vi.waitFor(() => expect(count('GET', '/api/tags')).toBe(2));
        sub.unsubscribe();
    });

    it('refetches tags and lists after createPlace', async () => {
        const { count } = stubFetch({
            'GET /api/tags': () => [],
            'GET /api/lists': () => [],
            'POST /api/places': () => ({ id: 1 }),
        });
        const store = makeStore();
        const tags = store.dispatch(tagApi.endpoints.getTags.initiate());
        const lists = store.dispatch(listApi.endpoints.getLists.initiate());
        await Promise.all([tags, lists]);
        await store.dispatch(placeApi.endpoints.createPlace.initiate(newPlace));
        await vi.waitFor(() => {
            expect(count('GET', '/api/tags')).toBe(2);
            expect(count('GET', '/api/lists')).toBe(2);
        });
        tags.unsubscribe();
        lists.unsubscribe();
    });
});

describe('prepareHeaders', () => {
    it('sends the bearer token when logged in', async () => {
        const { calls } = stubFetch({ 'GET /api/tags': () => [] });
        const store = makeStore();
        store.dispatch(loginSuccess({ user, token: 'abc' }));
        await store.dispatch(tagApi.endpoints.getTags.initiate());
        expect(calls[0].auth).toBe('Bearer abc');
    });

    it('sends no Authorization header without a token', async () => {
        const { calls } = stubFetch({ 'GET /api/tags': () => [] });
        await makeStore().dispatch(tagApi.endpoints.getTags.initiate());
        expect(calls[0].auth).toBeNull();
    });
});
