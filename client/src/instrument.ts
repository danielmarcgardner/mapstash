import * as Sentry from "@sentry/react";

// Errors, tracing, logs (on by default in SDK 11) and Session Replay. Nothing is sent without VITE_SENTRY_DSN (unset in tests and CI).
Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    // Every trace in development so they show up while developing; a sample in production.
    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
    // Same-origin API calls (/api/...) carry trace headers, so traces continue into Rails.
    tracePropagationTargets: [/^\//],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // No request or response bodies (login and signup post passwords). Auth headers and tokens are
    // already sent as [Filtered] by the SDK's denylist, and Replay masks all text and inputs by default.
    dataCollection: { httpBodies: [] },
});
