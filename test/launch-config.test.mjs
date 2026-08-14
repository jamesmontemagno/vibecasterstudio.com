import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getVerifiedSignInUrl, launchConfig } from "../launch-config.js";

const now = new Date("2026-08-14T00:00:00.000Z");

function verifiedConfig(overrides = {}) {
  return {
    invitedHostSignIn: {
      enabled: true,
      url: "https://app.vibecasterstudio.com",
      verification: {
        publicFactsApproval: "marketing-approval-123",
        releaseEvidenceReference: "release-gate-456",
        routeVerifiedAt: "2026-08-13T00:00:00.000Z",
        verifiedRoute: "https://app.vibecasterstudio.com/",
      },
      ...overrides,
    },
  };
}

test("the committed launch configuration fails closed", () => {
  assert.equal(getVerifiedSignInUrl(launchConfig, now), null);
});

test("a verified invited-host route is the only allowed sign-in destination", () => {
  assert.equal(getVerifiedSignInUrl(verifiedConfig(), now), "https://app.vibecasterstudio.com/");
});

test("invalid, unverified, or stale route configurations do not render a sign-in link", () => {
  const cases = [
    verifiedConfig({ url: "http://app.vibecasterstudio.com" }),
    verifiedConfig({ url: "https://example.com" }),
    verifiedConfig({ url: "https://app.vibecasterstudio.com/login" }),
    verifiedConfig({
      verification: {
        publicFactsApproval: "",
        releaseEvidenceReference: "release-gate-456",
        routeVerifiedAt: "2026-08-13T00:00:00.000Z",
        verifiedRoute: "https://app.vibecasterstudio.com/",
      },
    }),
    verifiedConfig({
      verification: {
        publicFactsApproval: "marketing-approval-123",
        releaseEvidenceReference: "release-gate-456",
        routeVerifiedAt: "2026-08-01T00:00:00.000Z",
        verifiedRoute: "https://app.vibecasterstudio.com/",
      },
    }),
  ];

  for (const config of cases) {
    assert.equal(getVerifiedSignInUrl(config, now), null);
  }
});

test("the static page has no enrollment provider, public signup, analytics, or launch claims", async () => {
  const page = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.doesNotMatch(page, /tally\.so|waitlist|join the waitlist|google-analytics|googletagmanager/i);
  assert.doesNotMatch(page, /production-ready|provider-backed|compliant|available to everyone/i);
  assert.doesNotMatch(page, /rel="canonical"|property="og:|application\/ld\+json/i);
  assert.match(page, /id="header-access"/);
  assert.match(page, /id="primary-access"/);
});
