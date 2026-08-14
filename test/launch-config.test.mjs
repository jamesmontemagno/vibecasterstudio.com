import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse as parseJavaScript } from "acorn";
import { parse as parseHtml } from "parse5";
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

const URL_ATTRIBUTES = new Set([
  "action",
  "background",
  "cite",
  "data",
  "formaction",
  "href",
  "longdesc",
  "manifest",
  "ping",
  "poster",
  "profile",
  "src",
  "srcset",
  "xlink:href",
]);
const EMBEDDED_DOCUMENT_ELEMENTS = new Set(["embed", "frame", "iframe", "object", "portal"]);
const ALLOWED_MEMBER_CALLS = new Set([
  "addEventListener",
  "DateTimeFormat",
  "exec",
  "format",
  "freeze",
  "getFullYear",
  "getTime",
  "isFinite",
  "map",
  "querySelector",
  "setAttribute",
  "slice",
  "test",
  "toISOString",
  "toggle",
]);

function walkHtml(node, visit) {
  visit(node);
  for (const child of node.childNodes ?? []) {
    walkHtml(child, visit);
  }
}

function assertPermittedHtml(page, { allowedHrefs = [], allowedStylesheetHrefs = ["styles.css"] } = {}) {
  const document = parseHtml(page);

  walkHtml(document, (node) => {
    if (!node.tagName) {
      return;
    }

    const tagName = node.tagName.toLowerCase();
    const attributes = new Map((node.attrs ?? []).map(({ name, value }) => [name.toLowerCase(), value]));

    assert.notEqual(tagName, "base", "base elements can redirect otherwise local links");
    assert.notEqual(tagName, "form", "the static site must not create forms");
    assert.equal(EMBEDDED_DOCUMENT_ELEMENTS.has(tagName), false, `embedded documents are not allowed: ${tagName}`);
    assert.notEqual(tagName, "style", "inline styles are not allowed");

    if (tagName === "script") {
      assert.equal(attributes.get("src"), "script.js", "only the local application script is allowed");
      assert.equal(attributes.has("type"), false, "module scripts are not allowed");
    }

    if (tagName === "meta" && attributes.get("http-equiv")?.toLowerCase() === "refresh") {
      assert.fail("meta refresh is navigation");
    }

    for (const [name, value] of attributes) {
      assert.equal(name.startsWith("on"), false, `inline event handler is not allowed: ${name}`);
      assert.notEqual(name, "srcdoc", "embedded document content is not allowed");
      assert.notEqual(name, "style", "style attributes are not allowed");

      if (!URL_ATTRIBUTES.has(name)) {
        continue;
      }

      if (
        name === "href"
        && (
          (tagName === "link" && allowedStylesheetHrefs.includes(value))
          || value.startsWith("#")
          || allowedHrefs.includes(value)
        )
      ) {
        continue;
      }

      if (name === "src" && value === "script.js") {
        continue;
      }

      assert.fail(`unapproved ${name}: ${value}`);
    }
  });
}

function getAttribute(node, name) {
  return node.attrs?.find((attribute) => attribute.name.toLowerCase() === name)?.value;
}

function getText(node) {
  if (node.nodeName === "#text") {
    return node.value;
  }

  return (node.childNodes ?? []).map(getText).join("");
}

function findElements(document, tagName) {
  const elements = [];

  walkHtml(document, (node) => {
    if (node.tagName && (tagName === "*" || node.tagName.toLowerCase() === tagName)) {
      elements.push(node);
    }
  });

  return elements;
}

function assertAccessibleDocument(page, { requiresFigure = false } = {}) {
  const document = parseHtml(page);
  const [html] = findElements(document, "html");
  const titles = findElements(document, "title");
  const descriptions = findElements(document, "meta").filter((node) => getAttribute(node, "name") === "description");
  const mains = findElements(document, "main");
  const headings = ["h1", "h2", "h3", "h4", "h5", "h6"].flatMap((tagName) => findElements(document, tagName));
  const ids = new Set();

  assert.equal(getAttribute(html, "lang"), "en", "the document language must be declared");
  assert.equal(titles.length, 1, "each page needs one title");
  assert.notEqual(getText(titles[0]).trim(), "", "the title must not be empty");
  assert.equal(descriptions.length, 1, "each page needs one meta description");
  assert.notEqual(getAttribute(descriptions[0], "content")?.trim(), "", "the meta description must not be empty");
  assert.equal(mains.length, 1, "each page needs one main landmark");
  assert.equal(findElements(document, "h1").length, 1, "each page needs one h1");

  for (const node of findElements(document, "*")) {
    const id = getAttribute(node, "id");

    if (id) {
      assert.equal(ids.has(id), false, `duplicate id: ${id}`);
      ids.add(id);
    }
  }

  for (const anchor of findElements(document, "a")) {
    const href = getAttribute(anchor, "href");

    if (href?.startsWith("#")) {
      assert.equal(ids.has(href.slice(1)), true, `fragment target is missing: ${href}`);
    }

    assert.notEqual(
      `${getText(anchor)} ${getAttribute(anchor, "aria-label") ?? ""}`.trim(),
      "",
      "links need an accessible name",
    );
  }

  for (const button of findElements(document, "button")) {
    assert.notEqual(
      `${getText(button)} ${getAttribute(button, "aria-label") ?? ""}`.trim(),
      "",
      "buttons need an accessible name",
    );
  }

  const headingLevels = headings.map((heading) => Number(heading.tagName.slice(1)));

  for (let index = 1; index < headingLevels.length; index += 1) {
    assert.ok(headingLevels[index] <= headingLevels[index - 1] + 1, "heading levels must not skip");
  }

  if (requiresFigure) {
    const figures = findElements(document, "figure");

    assert.equal(figures.length, 1, "the illustrative session must be a figure");
    assert.equal(getAttribute(figures[0], "aria-label"), undefined, "the figure caption supplies the context");
    assert.equal(
      figures[0].childNodes?.some((node) => node.tagName === "figcaption"),
      true,
      "the figure needs an associated figcaption",
    );
  }
}

function contrastRatio(foreground, background) {
  const relativeLuminance = (hex) => {
    const channels = hex.slice(1).match(/../g).map((channel) => Number.parseInt(channel, 16) / 255);
    const [red, green, blue] = channels.map((channel) => (
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    ));

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((left, right) => right - left);

  return (lighter + 0.05) / (darker + 0.05);
}

function walkJavaScript(node, visit) {
  if (!node || typeof node !== "object") {
    return;
  }

  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      value.forEach((child) => walkJavaScript(child, visit));
    } else if (value?.type) {
      walkJavaScript(value, visit);
    }
  }
}

function memberPropertyName(node) {
  if (!node.computed && node.property.type === "Identifier") {
    return node.property.name;
  }

  return node.computed && node.property.type === "Literal" && typeof node.property.value === "string"
    ? node.property.value
    : null;
}

function assertNoClientNavigation(executableAssets) {
  const program = parseJavaScript(executableAssets, { ecmaVersion: "latest", sourceType: "module" });

  walkJavaScript(program, (node) => {
    assert.equal(node.type === "ImportDeclaration" || node.type === "ImportExpression", false, "module imports are not allowed");
    assert.notEqual(node.type, "NewExpression", "constructors are not allowed in served scripts");
    assert.notEqual(node.type, "TaggedTemplateExpression", "tagged templates are not allowed in served scripts");

    if (node.type === "CallExpression" && node.callee.type === "MemberExpression") {
      const property = memberPropertyName(node.callee);
      assert.equal(node.callee.computed, false, "computed method calls are not allowed in served scripts");

      if (property === "setAttribute") {
        assert.equal(node.arguments[0]?.type, "Literal");
        assert.equal(node.arguments[0]?.value, "aria-pressed");
        return;
      }

      assert.equal(ALLOWED_MEMBER_CALLS.has(property), true, `unapproved method call: ${property}`);
    }

    if (node.type === "CallExpression" && node.callee.type === "Identifier") {
      assert.equal(node.callee.name, "String", `unapproved function call: ${node.callee.name}`);
    }

    if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression") {
      const property = memberPropertyName(node.left);
      assert.equal(node.left.computed, false, "computed property assignments are not allowed in served scripts");
      assert.equal(["action", "formAction", "href", "location", "src"].includes(property), false);
    }
  });
}

function assertNoUnapprovedDestinations(servedAssets) {
  assert.doesNotMatch(servedAssets, /(?:https?:)?\/\/|tally\.so|plausible|google-analytics|googletagmanager/i);
}

function assertNoUnapprovedStylesheetDestinations(stylesheet) {
  assert.doesNotMatch(stylesheet, /@import|url\s*\(|\\/i);
  assertNoUnapprovedDestinations(stylesheet);
}

test("served assets have no enrollment provider, sign-in route, tracking, or launch claims", async () => {
  const [page, script, config, stylesheet] = await Promise.all(
    ["../index.html", "../script.js", "../launch-config.js", "../styles.css"].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
  );
  const servedAssets = `${page}\n${script}\n${config}\n${stylesheet}`;

  assertPermittedHtml(page);
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

  assert.throws(() => assertPermittedHtml(`${page}<a href = "/sign-in">Sign in</a>`));
  assert.throws(() => assertPermittedHtml(`${page}<form action=/sign-in></form>`));
  assert.throws(() => assertPermittedHtml(`${page}<button formaction="/sign-in">Sign in</button>`));
  assert.throws(() => assertPermittedHtml(`${page}<iframe srcdoc="<a href='/sign-in'>Sign in</a>"></iframe>`));
  assert.throws(() => assertPermittedHtml(`${page}<style>@import url(\\2f \\2f tracker.example/pixel.css);</style>`));
  assert.throws(() => assertPermittedHtml(`${page}<div style="background: url(//tracker.example/pixel.gif)"></div>`));
  assert.throws(() => assertNoUnapprovedDestinations('<script src="https://plausible.io/js/script.js"></script>'));
  assert.throws(() => assertNoClientNavigation('document["createElement"]("form");'));
  assert.throws(() => assertNoClientNavigation('form["action"] = "/sign-in";'));
  assert.throws(() => assertNoClientNavigation("form.submit();"));
  assert.throws(() => assertNoClientNavigation("window.open('/sign-in');"));
  assert.throws(() => assertNoClientNavigation("import './asset.js';"));
  assert.throws(() => assertNoClientNavigation("import('./asset.js');"));
  assert.throws(() => assertNoClientNavigation("new Function(\"location.assign('/sign-in')\")();"));
  assert.throws(() => assertNoClientNavigation("Function`location.href='/sign-in'`();"));
  assert.throws(() => assertNoUnapprovedStylesheetDestinations('@import url("https://plausible.io/css/site.css");'));
  assert.throws(() => assertNoUnapprovedStylesheetDestinations('.promo { background: url(//tracker.example/pixel.gif); }'));
  assert.throws(() => assertNoUnapprovedStylesheetDestinations("@import url(\\2f \\2f tracker.example/pixel.css);"));
});

test("public pages preserve accessible semantics and valid internal destinations", async () => {
  const [homepage, notFoundPage] = await Promise.all(
    ["../index.html", "../404.html"].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
  );

  assertPermittedHtml(homepage);
  assertPermittedHtml(notFoundPage, { allowedHrefs: ["/"], allowedStylesheetHrefs: ["/styles.css"] });
  assertAccessibleDocument(homepage, { requiresFigure: true });
  assertAccessibleDocument(notFoundPage);
  assert.match(notFoundPage, /<link rel="stylesheet" href="\/styles\.css" \/>/);
  assert.match(notFoundPage, /<a class="button not-found-home" href="\/">Go to Rill &amp; Pine<\/a>/);
  assert.doesNotMatch(notFoundPage, /waitlist|tally\.so|sign-in|enroll|tracking|live|provider|production|rel="canonical"|property="og:|application\/ld\+json/i);
});

test("small crimson labels meet AA contrast on their dark card", async () => {
  const stylesheet = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(stylesheet, /--signal:\s*#f58b77;/);
  assert.match(
    stylesheet,
    /\.not-found-eyebrow,\s*\.not-found-route\s*\{[^}]*color:\s*var\(--signal\);/s,
  );
  assert.ok(contrastRatio("#f58b77", "#174143") >= 4.5, "crimson labels must meet WCAG AA on pine light");
});

test("shared styles keep visible focus and reduced-motion support", async () => {
  const stylesheet = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(stylesheet, /:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--brass\);/s);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)\s*\{/);
});
