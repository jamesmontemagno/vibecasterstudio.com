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
  const match = typeof value === "string" && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.exec(value);

  if (!match) {
    return false;
  }

  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  const monthLengths = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return month >= 1 && month <= 12 && day >= 1 && day <= monthLengths[month - 1] && hour <= 23 && minute <= 59 && second <= 59;
}
