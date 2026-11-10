import posthog from "posthog-js";

export type AnalyticsEvent =
  | "clicked_login"
  | "clicked_upload_project"
  | "clicked_validate_project"
  | "clicked_publish_challenge"
  | "clicked_schedule_demo"
  | "clicked_apply_next_generation"
  | "clicked_nav_institutions"
  | "clicked_nav_companies"
  | "clicked_nav_talent"
  | "clicked_nav_how_it_works"
  | "clicked_nav_public_metrics"
  | "clicked_share_project"
  | "clicked_institution"
  | "clicked_upload_as_guest"
  | "clicked_create_account"
  | "viewed_wizard"
  | "completed_wizard_step"
  | "submitted_wizard"
  | "wizard_submit_failed"
  | "registered_company";

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://us.i.posthog.com";

// Sin clave (desarrollo local o previews sin variables) el tracking queda desactivado.
const enabled = Boolean(key);

export function initAnalytics() {
  if (!enabled || typeof window === "undefined") return;
  posthog.init(key as string, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: "history_change",
    session_recording: { maskAllInputs: true },
  });
}

export function track(event: AnalyticsEvent, properties?: Record<string, string>) {
  if (!enabled) return;
  posthog.capture(event, properties);
}
