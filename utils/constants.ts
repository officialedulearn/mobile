export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

export const levels = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']

export const STREAMING_WAIT_MESSAGES = [
  "Analysing your request",
  "Eddie is thinking",
  "Finding the best answer",
  "Crunching the details",
  "Almost there…",
  "Warming up the neurons",
] as const;
