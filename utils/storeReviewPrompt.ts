import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

export const STORE_REVIEW_LAST_PROMPT_KEY = "store_review_last_prompt_at";
export const STORE_REVIEW_USER_COMPLETED_KEY = "store_review_user_completed";
const LEGACY_LAST_REVIEW_KEY = "lastReviewRequest";

const COOLDOWN_MS = 20 * 24 * 60 * 60 * 1000;

async function migrateLegacyReviewTimestamp(): Promise<void> {
  try {
    const legacy = await AsyncStorage.getItem(LEGACY_LAST_REVIEW_KEY);
    if (!legacy) return;
    const current = await AsyncStorage.getItem(STORE_REVIEW_LAST_PROMPT_KEY);
    if (!current)
      await AsyncStorage.setItem(STORE_REVIEW_LAST_PROMPT_KEY, legacy);
    await AsyncStorage.removeItem(LEGACY_LAST_REVIEW_KEY);
  } catch {}
}

export async function hasUserCompletedStoreReview(): Promise<boolean> {
  const v = await AsyncStorage.getItem(STORE_REVIEW_USER_COMPLETED_KEY);
  return v === "true";
}

export async function markStoreReviewUserCompleted(): Promise<void> {
  await AsyncStorage.setItem(STORE_REVIEW_USER_COMPLETED_KEY, "true");
}

export async function canPromptStoreReview(): Promise<boolean> {
  await migrateLegacyReviewTimestamp();
  if (await hasUserCompletedStoreReview()) return false;
  const last = await AsyncStorage.getItem(STORE_REVIEW_LAST_PROMPT_KEY);
  if (!last) return true;
  const lastMs = Number.parseInt(last, 10);
  if (!Number.isFinite(lastMs)) return true;
  return Date.now() - lastMs >= COOLDOWN_MS;
}

export async function recordStoreReviewPromptRequested(): Promise<void> {
  await migrateLegacyReviewTimestamp();
  await AsyncStorage.setItem(
    STORE_REVIEW_LAST_PROMPT_KEY,
    Date.now().toString(),
  );
}

export async function requestStoreReviewIfAllowed(): Promise<boolean> {
  if (!(await canPromptStoreReview())) return false;
  try {
    if (!(await StoreReview.isAvailableAsync())) return false;
    if (!(await StoreReview.hasAction())) return false;
    await StoreReview.requestReview();
    await recordStoreReviewPromptRequested();
    return true;
  } catch {
    return false;
  }
}
