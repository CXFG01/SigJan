const DEFAULT_SIGN_IN_DESTINATION = "/today";

export function getSafeAuthDestination(
  destination: string | null | undefined,
): string {
  if (
    !destination ||
    !destination.startsWith("/") ||
    destination.startsWith("//") ||
    destination.includes("\\")
  ) {
    return DEFAULT_SIGN_IN_DESTINATION;
  }

  try {
    const parsed = new URL(destination, "https://signalrx.invalid");
    if (parsed.origin !== "https://signalrx.invalid") {
      return DEFAULT_SIGN_IN_DESTINATION;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_SIGN_IN_DESTINATION;
  }
}

export function getAuthEmailRedirectUrl(
  origin: string,
  destination: string | null | undefined,
): string {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", getSafeAuthDestination(destination));
  return callback.toString();
}
