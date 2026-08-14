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
    "+010000-01-01T00:00:00.000Z",
    "-000001-01-01T00:00:00.000Z",
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

function assertPermittedUrlAttributes(page) {
  const urlAttributes = [...page.matchAll(/\b(href|src|action)\s*=\s*(["'])(.*?)\2/gi)].map(([, name, , value]) => ({
    name: name.toLowerCase(),
    value,
  }));

  for (const { name, value } of urlAttributes) {
    if (name === "href") {
      assert.ok(value === "styles.css" || value.startsWith("#"), `unapproved href: ${value}`);
      continue;
    }

    assert.equal(name, "src");
    assert.equal(value, "script.js");
  }
}

function assertNoClientNavigation(executableAssets) {
  assert.doesNotMatch(
    executableAssets,
    /(?:window\s*\.\s*|window\s*\[\s*["'])?location(?:\s*\.\s*\w+|\s*\[\s*["']\w+["']\s*\])?|history\s*\.\s*(?:pushState|replaceState)|document\s*\.\s*createElement\s*\(|(?:\.\s*href|\[\s*["']href["']\s*\])\s*=|\.setAttribute\s*\(\s*["'](?:href|src|action)["']/i,
  );
}

function assertNoUnapprovedDestinations(servedAssets) {
  assert.doesNotMatch(servedAssets, /(?:https?:)?\/\/|tally\.so|plausible|google-analytics|googletagmanager/i);
}

function assertNoUnapprovedStylesheetDestinations(stylesheet) {
  assert.doesNotMatch(
    stylesheet,
    /@import\s+(?:url\(\s*)?["']?(?:https?:)?\/\/|url\(\s*["']?(?:https?:)?\/\/|tally\.so|plausible|google-analytics|googletagmanager/i,
  );
}

test("served assets have no enrollment provider, sign-in route, tracking, or launch claims", async () => {
  const [page, script, config, stylesheet] = await Promise.all(
    ["../index.html", "../script.js", "../launch-config.js", "../styles.css"].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
  );
  const servedAssets = `${page}\n${script}\n${config}\n${stylesheet}`;

  assertPermittedUrlAttributes(page);
  assertNoClientNavigation(`${script}\n${config}`);
  assertNoUnapprovedDestinations(servedAssets);
  assertNoUnapprovedStylesheetDestinations(stylesheet);
  assert.doesNotMatch(servedAssets, /waitlist|join the waitlist/i);
  assert.doesNotMatch(servedAssets, /invited hosts: sign in|https:\/\/app\.vibecasterstudio\.com/i);
  assert.doesNotMatch(servedAssets, /production-ready|provider-backed|compliant|available to everyone/i);
  assert.doesNotMatch(page, /rel="canonical"|property="og:|application\/ld\+json/i);
  assert.doesNotMatch(page, /<a[^>]+href="https?:\/\//i);
  assert.match(page, /Invited-host sign-in is not enabled on this page\./);
});

test("the static asset gate rejects relative sign-in links and alternate trackers", async () => {
  const page = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.throws(() => assertPermittedUrlAttributes(`${page}<a href = "/sign-in">Sign in</a>`));
  assert.throws(() => assertNoUnapprovedDestinations('<script src="https://plausible.io/js/script.js"></script>'));
  assert.throws(() => assertNoClientNavigation('const tagName = "a"; document.createElement(tagName); link.href = "/sign-in";'));
  assert.throws(() => assertNoUnapprovedStylesheetDestinations('@import url("https://plausible.io/css/site.css");'));
  assert.throws(() => assertNoUnapprovedStylesheetDestinations('.promo { background: url(//tracker.example/pixel.gif); }'));
});
