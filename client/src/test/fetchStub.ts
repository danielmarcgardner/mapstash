import { vi } from 'vitest';

export type Route = (body: unknown, url: URL) => unknown;

// Stubs global fetch with "METHOD /path" handlers and records every request.
export const stubFetch = (routes: Record<string, Route>) => {
    const calls: { method: string; path: string; query: string; body: unknown; auth: string | null }[] = [];
    const fetchMock = vi.fn(async (input: Request) => {
        const url = new URL(input.url);
        const path = url.pathname;
        const text = await input.text();
        const body = text ? JSON.parse(text) : undefined;
        calls.push({ method: input.method, path, query: decodeURIComponent(url.search), body, auth: input.headers.get('Authorization') });
        const route = routes[`${input.method} ${path}`];
        if (!route) return new Response(null, { status: 404 });
        const out = await route(body, url); // a route may return a promise to hold its response
        if (out instanceof Response) return out; // lets a route answer 401, 204, etc.
        return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const count = (method: string, path: string) => calls.filter(c => c.method === method && c.path === path).length;
    return { calls, count };
};

// A JSON response with a non-200 status, for routes that should fail.
export const jsonResponse = (status: number, body?: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
