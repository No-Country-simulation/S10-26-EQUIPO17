/**
 * Every route lives under this prefix. In production the frontend host proxies `/api/*` here, so
 * the browser sees the API on the frontend's own origin and the session cookies stay first-party.
 */
export const API_PREFIX = "/api";
