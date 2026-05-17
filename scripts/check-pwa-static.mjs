import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function text(path) {
  return readFileSync(join(root, path), "utf8");
}

function exists(path) {
  return existsSync(join(root, path));
}

const manifest = JSON.parse(text("manifest.webmanifest"));
assert.equal(manifest.id, "./");
assert.equal(manifest.start_url, "./session.html");
assert.equal(manifest.scope, "./");
assert.equal(manifest.display, "standalone");
assert.ok(manifest.display_override.includes("standalone"));
for (const icon of manifest.icons) {
  assert.ok(exists(icon.src), `missing icon: ${icon.src}`);
}

const indexHtml = text("index.html");
const sessionHtml = text("session.html");
for (const html of [indexHtml, sessionHtml]) {
  assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(html, /navigator\.serviceWorker\.register\("\.\/sw\.js"\)/);
  assert.match(html, /style\.css\?v=pwa-4/);
}
assert.match(indexHtml, /engine\.js\?v=pwa-4/);
assert.match(sessionHtml, /engine\.js\?v=pwa-4/);
assert.match(sessionHtml, /session\.js\?v=pwa-4/);

const sw = text("sw.js");
assert.match(sw, /const CACHE_PREFIX = "chill-pwa"/);
assert.match(sw, /const VERSION = `\$\{CACHE_PREFIX\}-v4`/);
for (const asset of ["style.css?v=pwa-4", "engine.js?v=pwa-4", "session.js?v=pwa-4"]) {
  assert.ok(sw.includes(`"${asset}"`), `missing sw precache asset: ${asset}`);
}

const precacheBlock = sw.match(/const PRECACHE_URLS = \[([\s\S]*?)\];/);
assert.ok(precacheBlock, "missing PRECACHE_URLS");
for (const [, url] of precacheBlock[1].matchAll(/"([^"]+)"/g)) {
  if (url === "./") continue;
  assert.ok(exists(url.split("?")[0]), `missing precache target: ${url}`);
}

const engine = text("engine.js");
const session = text("session.js");
for (const source of [engine, session]) {
  assert.match(source, /pagehide/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /freeze/);
}
assert.match(engine, /releaseToneVoices/);
assert.match(engine, /Tone\.Transport\.stop/);
assert.match(session, /quietSessionForPageLifecycle/);

console.log("Chill PWA static contract passed");
