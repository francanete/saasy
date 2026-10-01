const DEFAULT_AUTH_CALLBACK = "/dashboard";

export function getSafeAuthCallback(callbackUrl?: string): string {
  if (!callbackUrl) {
    return DEFAULT_AUTH_CALLBACK;
  }

  try {
    const url = new URL(callbackUrl, "http://saasy.local");

    if (url.origin !== "http://saasy.local") {
      return DEFAULT_AUTH_CALLBACK;
    }

    if (url.pathname === "/dashboard" && !url.search && !url.hash) {
      return "/dashboard";
    }

    if (url.pathname === "/checkout/continue") {
      const slug = url.searchParams.get("slug");

      if (slug && url.searchParams.size === 1) {
        return `/checkout/continue?slug=${encodeURIComponent(slug)}`;
      }
    }
  } catch {
    // Fall through to the safe default.
  }

  return DEFAULT_AUTH_CALLBACK;
}
