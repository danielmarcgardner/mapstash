import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

// jsdom has no matchMedia, and Mantine's color scheme needs it.
window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
});

// Node's Request rejects relative URLs that browsers resolve; RTK Query builds one per call.
const NodeRequest = globalThis.Request;
globalThis.Request = class extends NodeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(typeof input === 'string' ? new URL(input, window.location.href) : input, init);
    }
};

// jsdom has no ResizeObserver, and Mantine's ScrollArea needs it.
globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};
