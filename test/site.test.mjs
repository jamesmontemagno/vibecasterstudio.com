import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse as parseHtml } from "parse5";

const SITE_ORIGIN = "https://rillandpine.com";
const APPROVED_EXTERNAL_HOSTS = new Set(["rillandpine.com", "tally.so", "schema.org", "www.sitemaps.org", "www.w3.org"]);
const LEGACY_BRAND = /vibe\s*caster/i;

async function readSiteFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function walkHtml(node, visit) {
  visit(node);
  for (const child of node.childNodes ?? []) {
    walkHtml(child, visit);
  }
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

function findMeta(document, attributeName, value) {
  return findElements(document, "meta").find((node) => getAttribute(node, attributeName) === value);
}

function assertAccessibleDocument(page) {
  const document = parseHtml(page);
  const [html] = findElements(document, "html");
  const titles = findElements(document, "title");
  const descriptions = findElements(document, "meta").filter((node) => getAttribute(node, "name") === "description");
  const headings = ["h1", "h2", "h3", "h4", "h5", "h6"].flatMap((tagName) => findElements(document, tagName));
  const ids = new Set();

  assert.equal(getAttribute(html, "lang"), "en", "the document language must be declared");
  assert.equal(titles.length, 1, "each page needs one title");
  assert.notEqual(getText(titles[0]).trim(), "", "the title must not be empty");
  assert.equal(descriptions.length, 1, "each page needs one meta description");
  assert.notEqual(getAttribute(descriptions[0], "content")?.trim(), "", "the meta description must not be empty");
  assert.equal(findElements(document, "main").length, 1, "each page needs one main landmark");
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

    assert.ok(href, "links need an href");
    assert.notEqual(href, "#", "links must point at a real target");

    if (href.startsWith("#")) {
      assert.equal(ids.has(href.slice(1)), true, `fragment target is missing: ${href}`);
    }

    assert.notEqual(`${getText(anchor)} ${getAttribute(anchor, "aria-label") ?? ""}`.trim(), "", "links need an accessible name");
  }

  for (const button of findElements(document, "button")) {
    assert.notEqual(`${getText(button)} ${getAttribute(button, "aria-label") ?? ""}`.trim(), "", "buttons need an accessible name");
  }

  for (const frame of findElements(document, "iframe")) {
    assert.notEqual(getAttribute(frame, "title")?.trim(), "", "iframes need a title");
  }

  for (const image of findElements(document, "img")) {
    assert.notEqual(getAttribute(image, "alt"), undefined, "images need alt text");
  }

  const headingLevels = headings.map((heading) => Number(heading.tagName.slice(1)));

  for (let index = 1; index < headingLevels.length; index += 1) {
    assert.ok(headingLevels[index] <= headingLevels[index - 1] + 1, "heading levels must not skip");
  }
}

function assertApprovedDestinations(source, label) {
  for (const match of source.matchAll(/https?:\/\/([^/\s"'<>)]+)/gi)) {
    assert.ok(APPROVED_EXTERNAL_HOSTS.has(match[1].toLowerCase()), `${label} references an unapproved host: ${match[1]}`);
  }

  assert.doesNotMatch(source, /plausible|google-analytics|googletagmanager|hotjar|segment\.com/i, `${label} must not include trackers`);
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

test("the homepage publishes complete Rill & Pine metadata on rillandpine.com", async () => {
  const page = await readSiteFile("index.html");
  const document = parseHtml(page);
  const canonical = findElements(document, "link").find((node) => getAttribute(node, "rel") === "canonical");
  const icon = findElements(document, "link").find((node) => getAttribute(node, "rel") === "icon");
  const jsonLd = findElements(document, "script").find((node) => getAttribute(node, "type") === "application/ld+json");

  assert.match(getText(findElements(document, "title")[0]), /^Rill & Pine/);
  assert.equal(getAttribute(canonical, "href"), `${SITE_ORIGIN}/`);
  assert.equal(getAttribute(icon, "href"), "assets/favicon.svg");
  assert.equal(getAttribute(findMeta(document, "property", "og:url"), "content"), `${SITE_ORIGIN}/`);
  assert.equal(getAttribute(findMeta(document, "property", "og:site_name"), "content"), "Rill & Pine");
  assert.equal(getAttribute(findMeta(document, "property", "og:image"), "content"), `${SITE_ORIGIN}/assets/social-card.png`);
  assert.equal(getAttribute(findMeta(document, "name", "twitter:card"), "content"), "summary_large_image");
  assert.equal(getAttribute(findMeta(document, "name", "twitter:image"), "content"), `${SITE_ORIGIN}/assets/social-card.png`);

  for (const key of ["og:title", "og:description", "og:image:alt", "twitter:title", "twitter:description"]) {
    const meta = findMeta(document, key.startsWith("og:") ? "property" : "name", key);
    assert.notEqual(getAttribute(meta, "content")?.trim(), "", `${key} must be present and non-empty`);
  }

  const structuredData = JSON.parse(getText(jsonLd));
  assert.equal(structuredData["@type"], "WebSite");
  assert.equal(structuredData.name, "Rill & Pine");
  assert.equal(structuredData.url, `${SITE_ORIGIN}/`);
});

test("the homepage offers the public waitlist and describes the product", async () => {
  const page = await readSiteFile("index.html");
  const document = parseHtml(page);
  const waitlistLinks = findElements(document, "a").filter((node) => getAttribute(node, "href") === "#waitlist");
  const [embed] = findElements(document, "iframe");

  assert.ok(findElements(document, "section").some((node) => getAttribute(node, "id") === "waitlist"), "the waitlist section must exist");
  assert.ok(waitlistLinks.length >= 2, "the header and hero must link to the waitlist");
  assert.match(getAttribute(embed, "src"), /^https:\/\/tally\.so\/embed\//);
  assert.match(getAttribute(embed, "title"), /Rill & Pine/);
  assert.match(page, /remote podcast conversations/i);
  assert.match(page, /local recording holds the take/i);
  assert.match(page, /Join the waitlist/);
});

test("public pages preserve accessible semantics and valid internal destinations", async () => {
  const [homepage, notFoundPage] = await Promise.all(["index.html", "404.html"].map(readSiteFile));

  assertAccessibleDocument(homepage);
  assertAccessibleDocument(notFoundPage);
  assert.match(notFoundPage, /<link rel="stylesheet" href="\/styles\.css" \/>/);
  assert.match(notFoundPage, /<link rel="icon" type="image\/svg\+xml" href="\/assets\/favicon\.svg" \/>/);
  assert.match(notFoundPage, /<a class="button not-found-home" href="\/">Go to Rill &amp; Pine<\/a>/);
});

test("served assets only reference approved destinations", async () => {
  const files = ["index.html", "404.html", "script.js", "styles.css"];
  const sources = await Promise.all(files.map(readSiteFile));

  files.forEach((file, index) => assertApprovedDestinations(sources[index], file));
  assert.doesNotMatch(sources[files.indexOf("styles.css")], /@import|url\s*\(/i, "the stylesheet must not load remote resources");
});

test("every public file uses the Rill & Pine brand and rillandpine.com domain", async () => {
  const files = [
    "index.html",
    "404.html",
    "script.js",
    "styles.css",
    "robots.txt",
    "sitemap.xml",
    "CNAME",
    "README.md",
    "PRODUCT.md",
    "DESIGN.md",
    "assets/favicon.svg",
    "assets/social-card.svg",
  ];
  const sources = await Promise.all(files.map(readSiteFile));

  files.forEach((file, index) => {
    assert.doesNotMatch(sources[index], LEGACY_BRAND, `${file} still references the legacy brand`);
    assert.doesNotMatch(sources[index], /vibecasterstudio\.com/i, `${file} still references the legacy domain`);
  });

  assert.equal(sources[files.indexOf("CNAME")].trim(), "rillandpine.com");
  assert.match(sources[files.indexOf("robots.txt")], new RegExp(`Sitemap: ${SITE_ORIGIN}/sitemap\\.xml`));
  assert.match(sources[files.indexOf("sitemap.xml")], new RegExp(`<loc>${SITE_ORIGIN}/</loc>`));
  assert.match(sources[files.indexOf("assets/favicon.svg")], /<title id="title">Rill &amp; Pine<\/title>/);
  assert.match(sources[files.indexOf("assets/social-card.svg")], /<title id="title">Rill &amp; Pine<\/title>/);
  assert.match(sources[files.indexOf("assets/social-card.svg")], /RILLANDPINE\.COM/);
});

test("the social card PNG is a 1200×630 image", async () => {
  const png = await readFile(new URL("../assets/social-card.png", import.meta.url));

  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "social card must be a PNG");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test("small crimson labels meet AA contrast on their dark card", async () => {
  const stylesheet = await readSiteFile("styles.css");

  assert.match(stylesheet, /--signal:\s*#f58b77;/);
  assert.match(stylesheet, /\.not-found-eyebrow,\s*\.not-found-route\s*\{[^}]*color:\s*var\(--signal\);/s);
  assert.ok(contrastRatio("#f58b77", "#174143") >= 4.5, "crimson labels must meet WCAG AA on pine light");
});

test("shared styles keep visible focus and reduced-motion support", async () => {
  const stylesheet = await readSiteFile("styles.css");

  assert.match(stylesheet, /:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--brass\);/s);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)\s*\{/);
});
