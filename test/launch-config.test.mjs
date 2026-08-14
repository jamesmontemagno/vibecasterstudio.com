import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isCanonicalUtcRfc3339, launchConfig } from "../launch-config.js";

test("the committed launch configuration fails closed", () => {
  assert.equal(launchConfig.invitedHostAccess.state, "unavailable");
  assert.equal(launchConfig.publicMetadata.enabled, false);
});

test("verification timestamps must be canonical UTC RFC3339 values", () => {
  assert.equal(isCanonicalUtcRfc3339("2026-08-13T00:00:00.123Z"), true);
});

test("normalized, date-only, and non-UTC verification timestamps are rejected", () => {
  const invalidTimestamps = [
    "2026-02-30T00:00:00.000Z",
    "2026-08-13",
    "2026-08-13T00:00:00",
    "2026-08-13T00:00:00+00:00",
    "2026-08-13T00:00:00Z",
    "not-a-timestamp",
  ];

  for (const timestamp of invalidTimestamps) {
    assert.equal(isCanonicalUtcRfc3339(timestamp), false);
  }
});

test("served assets have no enrollment provider, sign-in route, tracking, or launch claims", async () => {
  const [page, script, config] = await Promise.all(
    ["../index.html", "../script.js", "../launch-config.js"].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
  );
  const servedAssets = `${page}\n${script}\n${config}`;

  assert.doesNotMatch(servedAssets, /tally\.so|waitlist|join the waitlist|google-analytics|googletagmanager/i);
  assert.doesNotMatch(servedAssets, /invited hosts: sign in|https:\/\/app\.vibecasterstudio\.com/i);
  assert.doesNotMatch(servedAssets, /production-ready|provider-backed|compliant|available to everyone/i);
  assert.doesNotMatch(page, /rel="canonical"|property="og:|application\/ld\+json/i);
  assert.doesNotMatch(page, /<a[^>]+href="https?:\/\//i);
  assert.match(page, /Invited-host sign-in is not enabled on this page\./);
});
