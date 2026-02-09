import { SAMPLE_PROMPTS, SamplePrompt } from '../constants/sample-prompts';

/**
 * Deterministic hash that maps a string to a stable number.
 * Uses a simple DJB2-style hash — fast and well-distributed for short strings.
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // ensure unsigned 32-bit
}

/**
 * Returns the prompt assigned to a group on a given date.
 * Deterministic: same (groupId, date) always returns the same prompt.
 * All group members see the same prompt on the same day.
 */
export function getPromptForGroupOnDate(groupId: string, date: Date): SamplePrompt {
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `${dateStr}:${groupId}`;
  const index = djb2Hash(key) % SAMPLE_PROMPTS.length;
  return SAMPLE_PROMPTS[index];
}
