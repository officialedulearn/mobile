type PaywallSource =
  | "welcome"
  | "chat_limit"
  | "quiz_limit"
  | "settings"
  | "unknown";

type PaywallEventName =
  | "paywall_viewed"
  | "paywall_step_viewed"
  | "plan_selected"
  | "trial_cta_tapped"
  | "purchase_started"
  | "purchase_succeeded"
  | "purchase_cancelled"
  | "purchase_failed";

type PaywallEventPayload = {
  source?: PaywallSource;
  platform?: "ios" | "android" | "web" | "windows" | "macos";
  step?: number;
  planType?: "monthly" | "annual";
  screen?: "freeTrialIntro" | "subscription";
  error?: string;
};

export function normalizePaywallSource(value?: string): PaywallSource {
  if (
    value === "welcome" ||
    value === "chat_limit" ||
    value === "quiz_limit" ||
    value === "settings"
  ) {
    return value;
  }
  return "unknown";
}

export function trackPaywallEvent(
  event: PaywallEventName,
  payload: PaywallEventPayload = {},
): void {
  // Centralized event hook: replace with Segment/Mixpanel/Amplitude integration.
  console.log("[paywall-event]", event, payload);
}
