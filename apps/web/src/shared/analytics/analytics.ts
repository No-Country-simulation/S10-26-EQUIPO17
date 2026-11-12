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
  | "clicked_create_account"
  | "viewed_wizard"
  | "completed_wizard_step"
  | "submitted_wizard"
  | "wizard_submit_failed"
  | "registered_company"
  | "logged_in"
  | "login_failed"
  | "clicked_public_metrics_hero"
  | "clicked_talent_cta_banner"
  | "clicked_company_dashboard_nav"
  | "clicked_admin_dashboard_nav"
  | "logout_succeeded"
  | "logout_failed"
  | "clicked_register_from_login"
  | "clicked_company_new_project"
  | "opened_company_project"
  | "started_company_project_edit"
  | "cancelled_company_project_edit"
  | "company_project_edit_submitted"
  | "company_project_edit_failed"
  | "opened_admin_edit_review"
  | "admin_edit_review_succeeded"
  | "admin_edit_review_failed";

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
