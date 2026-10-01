// ============ Constants ============

export const BATCH_SIZE = 50;
export const DELAY_BETWEEN_USERS_MS = 200; // ~5 requests/second
export const DELAY_BETWEEN_BATCHES_MS = 5000; // 5 second pause between batches
export const RATE_LIMIT_RETRY_DELAY_MS = 5000; // Wait 5s before retry on rate limit

// ============ Helpers ============

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatPrice(
  cents: number,
  interval: "monthly" | "annual"
): string {
  const dollars = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  return interval === "monthly" ? `$${dollars}/month` : `$${dollars}/year`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
