/*
  This checked-in static site must never enable invited-host access. A release owner
  may publish a separately verified deployment only after protected release evidence
  and route checks are complete; that deployment must include a truthful static link
  for visitors without JavaScript.
*/

export const launchConfig = Object.freeze({
  invitedHostAccess: Object.freeze({
    state: "unavailable",
  }),
  publicMetadata: Object.freeze({
    enabled: false,
    canonicalUrl: "",
    socialImageUrl: "",
  }),
});

export function isCanonicalUtcRfc3339(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return false;
  }

  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString() === value;
}
