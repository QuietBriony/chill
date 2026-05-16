// Domain-logic check for chill (Quiet Piano radio / trio).
//
// Unlike check-pwa-static.mjs (which only inspects the PWA shell), this loads
// engine.js in a controlled VM sandbox and exercises its real runtime so it can
// assert chill's core domain contracts actually hold:
//   1. the documented "deterministic preview" contract -- the same
//      seed + referenceId + fader state must yield an identical event stream;
//   2. the public adapter surface (window.chillAdapter / window.chillRuntime);
//   3. piano-recipe JSON export schema validity against the live recipe set.
//
// Node built-ins only. Exits 0 on success, throws (non-zero) on any failure.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "engine.js"), "utf8");

// ---- inert DOM + audio doubles ---------------------------------------------
// engine.js builds many Tone.* nodes and touches the DOM at module load. None
// of that is the logic under test, so it is stubbed just enough to let the
// module evaluate; the deterministic preview path never produces real audio.

const inertElement = () => ({
  addEventListener() {},
  appendChild() {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  dataset: {},
  getContext() { return canvasContext; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  remove() {},
  setAttribute() {},
  getAttribute() { return null; },
  style: {},
  width: 0,
  height: 0,
  value: "",
  textContent: ""
});

const canvasContext = new Proxy({}, {
  get() { return () => canvasContext; }
});

const documentMock = {
  addEventListener() {},
  body: inertElement(),
  createElement() { return inertElement(); },
  documentElement: inertElement(),
  getElementById() { return inertElement(); },
  querySelector() { return null; },
  querySelectorAll() { return []; }
};

// A Tone.js double: every constructor / method / property resolves to another
// chainable double, so `new Tone.Gain(x).chain(...).connect(...)` is a no-op.
const toneNode = new Proxy(function toneNode() {}, {
  get(_target, prop) {
    if (prop === "value") return 0;
    if (prop === Symbol.toPrimitive) return () => 0;
    return toneNode;
  },
  apply() { return toneNode; },
  construct() { return toneNode; }
});

const windowMock = {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
  alert() {},
  document: documentMock,
  innerWidth: 1280,
  innerHeight: 720,
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: { userAgent: "node-check" },
  performance: { now: () => 0 },
  Tone: toneNode
};

const sandbox = {
  clearInterval() {},
  clearTimeout() {},
  console: { log() {}, warn() {}, error() {}, info() {} },
  document: documentMock,
  localStorage: windowMock.localStorage,
  navigator: windowMock.navigator,
  performance: windowMock.performance,
  requestAnimationFrame() { return 0; },
  cancelAnimationFrame() {},
  setInterval() { return 0; },
  setTimeout() { return 0; },
  Tone: toneNode,
  window: windowMock
};
sandbox.globalThis = sandbox;

vm.runInNewContext(source, sandbox, { filename: "engine.js" });

// ---- 1. public adapter surface ---------------------------------------------

const adapter = windowMock.chillAdapter;
assert.equal(typeof adapter, "object", "engine.js should expose window.chillAdapter");
assert.equal(typeof adapter.getRuntimeConfig, "function", "chillAdapter.getRuntimeConfig should be callable");
assert.equal(typeof adapter.setReference, "function", "chillAdapter.setReference should be callable");

const diagnostics = adapter.diagnostics;
assert.equal(typeof diagnostics, "object", "chillAdapter.diagnostics should exist");
for (const fn of ["previewEventStream", "runDeterminismCheck", "previewFlow"]) {
  assert.equal(typeof diagnostics[fn], "function", `chillAdapter.diagnostics.${fn} should be a function`);
}

const runtime = windowMock.chillRuntime;
assert.equal(typeof runtime, "object", "engine.js should expose window.chillRuntime");
assert.equal(runtime.adapter, adapter, "chillRuntime.adapter should be the same adapter object");
assert.equal(typeof windowMock.ChillGenerator, "function", "engine.js should expose window.ChillGenerator");

const baseConfig = adapter.getRuntimeConfig();
for (const fader of ["faderA", "faderB", "faderC"]) {
  assert.ok(
    Number.isFinite(baseConfig[fader]) && baseConfig[fader] >= 0 && baseConfig[fader] <= 1,
    `runtime config ${fader} should be a 0..1 number`
  );
}
assert.ok(diagnostics === runtime.diagnostics, "chillRuntime.diagnostics should mirror the adapter diagnostics");

// ---- 2. deterministic preview contract -------------------------------------
// chill's central promise: identical seed + referenceId + fader state must
// produce a byte-identical event stream. Verify by running the live preview.

const previewArgs = {
  bars: 12,
  seed: 240424,
  referenceId: "piano-jazz-chill",
  faderA: 0.42,
  faderB: 0.36,
  faderC: 0.7,
  autoOn: true,
  flowOn: true
};

const runA = diagnostics.previewEventStream(previewArgs);
const runB = diagnostics.previewEventStream({ ...previewArgs });
assert.ok(runA.eventCount > 0, "preview should emit at least one piano event");
assert.equal(runA.eventCount, runB.eventCount, "repeated preview should emit the same event count");
assert.equal(runA.fingerprint, runB.fingerprint, "repeated preview should have an identical fingerprint");
assert.deepEqual(runA.events, runB.events, "repeated preview should emit a byte-identical event stream");

// The engine's own self-check helper must agree.
const determinism = diagnostics.runDeterminismCheck(previewArgs);
assert.equal(determinism.passed, true, "runDeterminismCheck should report a passing determinism contract");
assert.equal(determinism.fingerprint, runA.fingerprint, "runDeterminismCheck fingerprint should match the preview");

// Changing the seed must change the stream -- otherwise the seed is dead input.
const seededAway = diagnostics.previewEventStream({ ...previewArgs, seed: previewArgs.seed + 9991 });
assert.notEqual(
  seededAway.fingerprint,
  runA.fingerprint,
  "a different seed should produce a different event stream"
);

// Flow Director must be a real influence on density, not a no-op flag.
const flowOff = diagnostics.previewFlow({ ...previewArgs, bars: 16, flowOn: false });
const flowOn = diagnostics.previewFlow({ ...previewArgs, bars: 16, flowOn: true });
assert.equal(flowOff.bars.length, 16, "previewFlow should return one entry per requested bar");
assert.notEqual(
  flowOn.fingerprint,
  flowOff.fingerprint,
  "Flow Director ON vs OFF should yield different flow plans"
);
const flowStates = new Set(["settle", "breathe", "lift", "decrescendo", "recover"]);
for (const bar of flowOn.bars) {
  assert.ok(flowStates.has(bar.state), `flow bar state '${bar.state}' should be a known Flow Director state`);
  assert.ok(
    bar.pianoDensity >= 0 && bar.pianoDensity <= 1,
    "flow bar pianoDensity should be a normalized 0..1 value"
  );
}

// SYNC-is-metadata-only invariant: previewing never auto-starts transport audio.
assert.doesNotMatch(source, /Tone\.Transport\.start\(\)/, "engine.js should not auto-start the transport");

// ---- 3. piano-recipe JSON export schema ------------------------------------
// exports/chill-piano-recipe.json is the published recipe artifact. It must be
// valid JSON and structurally consistent with the recipes the engine uses.

const recipeExport = JSON.parse(readFileSync(join(root, "exports", "chill-piano-recipe.json"), "utf8"));
assert.equal(recipeExport.format, "chill-piano-recipe", "recipe export should declare its format");
assert.ok(Array.isArray(recipeExport.recipes) && recipeExport.recipes.length > 0, "recipe export should list recipes");

const exportedIds = new Set();
for (const recipe of recipeExport.recipes) {
  assert.equal(typeof recipe.id, "string", "each exported recipe should have a string id");
  assert.ok(!exportedIds.has(recipe.id), `recipe id '${recipe.id}' should be unique in the export`);
  exportedIds.add(recipe.id);
  assert.ok(Array.isArray(recipe.layers) && recipe.layers.length > 0, `recipe '${recipe.id}' should have layers`);
  for (const layer of recipe.layers) {
    assert.equal(typeof layer.id, "string", `recipe '${recipe.id}' layer should have a string id`);
    assert.equal(typeof layer.type, "string", `recipe '${recipe.id}' layer '${layer.id}' should have a type`);
    if (Array.isArray(layer.pattern)) {
      for (const step of layer.pattern) {
        assert.ok(
          typeof step === "number" && step >= 0 && step <= 1,
          `recipe '${recipe.id}' layer '${layer.id}' pattern steps should be 0..1`
        );
      }
    }
  }
}

// The default recipe the engine boots with must be present in the export.
assert.ok(
  exportedIds.has(baseConfig.referenceId),
  `recipe export should include the engine's default reference '${baseConfig.referenceId}'`
);

// setReference must reject unknown ids and accept exported ones.
const switched = adapter.setReference([...exportedIds][0]);
assert.equal(switched.referenceId, [...exportedIds][0], "setReference should switch to a known recipe");
const rejected = adapter.setReference("definitely-not-a-recipe");
assert.ok(exportedIds.has(rejected.referenceId), "setReference should keep a valid recipe when given an unknown id");

console.log("Chill domain-logic check passed");
