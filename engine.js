//------------------------------------------------------
// Public runtime contracts
//------------------------------------------------------

/**
 * @typedef {"ambient" | "edge"} ChillMode
 * @typedef {"calm" | "glow" | "drift" | "edge"} ChillMood
 *
 * @typedef {Object} ChillRuntimeConfig
 * @property {ChillMode} mode
 * @property {number} seed
 * @property {number} faderA
 * @property {number} faderB
 * @property {number} faderC
 * @property {ChillMood=} mood
 * @property {string=} referenceId
 *
 * @typedef {Object} ChillRecipeLayer
 * @property {string} id
 * @property {"piano" | "lead" | "pad" | "bass" | "kick" | "hat" | "air"} type
 * @property {"anchor" | "response" | "texture" | "space" | "memory" | "bed"=} function
 * @property {number} every
 * @property {number} probability
 * @property {number[]=} pattern
 * @property {string | string[]=} duration
 * @property {string[] | string[][]=} notes
 * @property {number=} velocity
 * @property {number=} densityWeight
 * @property {number=} energyWeight
 * @property {number=} natureWeight
 * @property {number=} humanize
 * @property {number=} swingPush
 * @property {"felt" | "glass" | "memory"=} tone
 * @property {number=} rollMs
 * @property {number=} pedal
 * @property {number=} room
 * @property {number=} filterBase
 * @property {number=} filterRange
 *
 * @typedef {Object} ChillRecipe
 * @property {string} id
 * @property {string} label
 * @property {ChillMode} mode
 * @property {ChillMood} mood
 * @property {number=} bpm
 * @property {number=} swing
 * @property {{faderA:number, faderB:number, faderC:number}} defaultFaders
 * @property {ChillRecipeLayer[]} layers
 * @property {{id:string, chance:number, densityDelta?:number, energyDelta?:number, natureDelta?:number}[]} variations
 * @property {{maxDensity:number, quietOnLateTicks:number, fallback:"air" | "mute"}} transitionRules
 */

const STORAGE_KEYS = Object.freeze({
  session: "chill:session:v1",
  recipe: "chill:recipe:v1",
  lastSeed: "chill:lastSeed",
});

const DEFAULT_CONFIG = Object.freeze({
  mode: "ambient",
  seed: 240424,
  faderA: 0.54,
  faderB: 0.42,
  faderC: 0.66,
  mood: "glow",
  referenceId: "piano-jazz-chill",
});

const MOODS = Object.freeze(["calm", "glow", "drift", "edge"]);

/** @type {Record<string, ChillRecipe>} */
const CHILL_RECIPES = Object.freeze({
  "piano-jazz-chill": {
    id: "piano-jazz-chill",
    label: "piano jazz chill",
    mode: "ambient",
    mood: "calm",
    bpm: 66,
    swing: 0.04,
    defaultFaders: { faderA: 0.34, faderB: 0.26, faderC: 0.86 },
    layers: [
      {
        id: "room-chord-bed",
        type: "piano",
        function: "bed",
        tone: "felt",
        every: 16,
        probability: 0.84,
        pattern: [0.98, 0, 0, 0, 0.32, 0, 0, 0, 0.64, 0, 0, 0, 0.24, 0, 0, 0],
        duration: ["2n", "1m"],
        notes: [
          ["D3", "A3", "C4", "F4"],
          ["G2", "D3", "F3", "B3"],
          ["C3", "G3", "B3", "E4"],
          ["A2", "E3", "G3", "C4"],
        ],
        velocity: 0.2,
        densityWeight: -0.06,
        energyWeight: 0.06,
        natureWeight: 0.18,
        humanize: 0.026,
        rollMs: 22,
        pedal: 0.78,
        room: 0.72,
        filterBase: 920,
        filterRange: 620,
      },
      {
        id: "piano-memory",
        type: "piano",
        function: "memory",
        tone: "felt",
        every: 4,
        probability: 0.22,
        pattern: [0.44, 0, 0, 0, 0.1, 0, 0.26, 0, 0.18, 0, 0, 0, 0.3, 0, 0, 0],
        duration: ["4n", "2n"],
        notes: ["A3", "C4", "D4", "E4", "G4", "A4", "B4", "D5"],
        velocity: 0.12,
        densityWeight: 0.12,
        energyWeight: 0.08,
        natureWeight: -0.2,
        humanize: 0.032,
        swingPush: 0.004,
        rollMs: 10,
        pedal: 0.64,
        room: 0.76,
        filterBase: 980,
        filterRange: 520,
      },
      {
        id: "room-pedal-air",
        type: "pad",
        function: "space",
        every: 32,
        probability: 0.34,
        duration: "2m",
        notes: [
          ["D3", "A3", "F4"],
          ["G2", "D3", "B3"],
          ["C3", "G3", "E4"],
          ["A2", "E3", "C4"],
        ],
        velocity: 0.08,
        energyWeight: -0.04,
        natureWeight: 0.22,
        filterBase: 420,
        filterRange: 420,
      },
    ],
    variations: [
      { id: "voicing-turn", chance: 0.1, densityDelta: 0.01, energyDelta: 0.01 },
      { id: "room-rest", chance: 0.24, densityDelta: -0.1, natureDelta: 0.08 },
    ],
    transitionRules: {
      maxDensity: 0.38,
      quietOnLateTicks: 3,
      fallback: "air",
    },
  },
  "rainy-lofi-room": {
    id: "rainy-lofi-room",
    label: "rainy lofi room",
    mode: "ambient",
    mood: "drift",
    bpm: 74,
    swing: 0.1,
    defaultFaders: { faderA: 0.38, faderB: 0.36, faderC: 0.8 },
    layers: [
      {
        id: "rain-pad",
        type: "piano",
        function: "bed",
        tone: "glass",
        every: 16,
        probability: 0.74,
        pattern: [0.82, 0, 0, 0, 0.24, 0, 0.12, 0, 0.56, 0, 0, 0.16, 0.28, 0, 0, 0],
        duration: ["2n", "1m"],
        notes: [
          ["E3", "B3", "D4", "F#4"],
          ["A2", "E3", "B3", "C#4"],
          ["D3", "A3", "E4", "G4"],
          ["G2", "D3", "A3", "B3"],
        ],
        velocity: 0.17,
        densityWeight: -0.04,
        energyWeight: 0.05,
        natureWeight: 0.2,
        humanize: 0.03,
        rollMs: 18,
        pedal: 0.72,
        room: 0.84,
        filterBase: 1040,
        filterRange: 620,
      },
      {
        id: "dust-piano-reply",
        type: "piano",
        function: "response",
        tone: "glass",
        every: 4,
        probability: 0.2,
        pattern: [0.34, 0, 0.08, 0, 0.18, 0, 0.36, 0, 0.2, 0, 0.08, 0, 0.28, 0, 0.06, 0],
        duration: ["4n", "8n"],
        notes: ["D4", "F4", "G4", "A4", "C5", "D5", "E5"],
        velocity: 0.11,
        densityWeight: 0.1,
        energyWeight: 0.06,
        natureWeight: -0.18,
        humanize: 0.024,
        swingPush: 0.008,
        rollMs: 9,
        pedal: 0.56,
        room: 0.82,
        filterBase: 960,
        filterRange: 620,
      },
      {
        id: "space-aware-kick",
        type: "kick",
        function: "anchor",
        every: 1,
        probability: 0.18,
        pattern: [0.58, 0, 0, 0, 0.04, 0, 0.14, 0, 0.28, 0, 0, 0, 0.08, 0.16, 0, 0],
        duration: "8n",
        velocity: 0.11,
        densityWeight: 0.08,
        energyWeight: 0.08,
        natureWeight: -0.12,
        humanize: 0.018,
      },
      {
        id: "ghost-hat-room",
        type: "hat",
        function: "texture",
        every: 1,
        probability: 0.14,
        pattern: [0.06, 0.28, 0.08, 0.22, 0.04, 0.3, 0.1, 0.18, 0.06, 0.32, 0.08, 0.2, 0.04, 0.28, 0.12, 0.16],
        duration: "16n",
        velocity: 0.035,
        densityWeight: 0.08,
        energyWeight: 0.03,
        natureWeight: -0.1,
        humanize: 0.026,
        swingPush: 0.018,
      },
      {
        id: "rain-air",
        type: "air",
        function: "space",
        every: 2,
        probability: 0.14,
        duration: "16n",
        velocity: 0.035,
        natureWeight: 0.28,
      },
    ],
    variations: [
      { id: "rain-window", chance: 0.16, densityDelta: -0.04, natureDelta: 0.08 },
      { id: "ghost-answer", chance: 0.1, densityDelta: 0.04 },
    ],
    transitionRules: {
      maxDensity: 0.58,
      quietOnLateTicks: 3,
      fallback: "air",
    },
  },
  "soft-solo-drift": {
    id: "soft-solo-drift",
    label: "soft solo drift",
    mode: "ambient",
    mood: "calm",
    bpm: 58,
    swing: 0.03,
    defaultFaders: { faderA: 0.28, faderB: 0.22, faderC: 0.9 },
    layers: [
      {
        id: "solo-haze-pad",
        type: "piano",
        function: "bed",
        tone: "memory",
        every: 16,
        probability: 0.68,
        pattern: [0.76, 0, 0, 0, 0.18, 0, 0, 0, 0.44, 0, 0, 0, 0.12, 0, 0, 0],
        duration: ["1m", "2m"],
        notes: [
          ["C3", "E3", "G3", "B3", "D4"],
          ["A2", "E3", "G3", "B3", "C4"],
          ["F2", "C3", "E3", "A3", "D4"],
          ["G2", "D3", "F3", "A3", "C4"],
        ],
        velocity: 0.13,
        densityWeight: -0.06,
        energyWeight: 0.03,
        natureWeight: 0.22,
        humanize: 0.04,
        rollMs: 24,
        pedal: 0.86,
        room: 0.9,
        filterBase: 760,
        filterRange: 460,
      },
      {
        id: "solo-piano-memory",
        type: "piano",
        function: "memory",
        tone: "memory",
        every: 4,
        probability: 0.16,
        pattern: [0.34, 0, 0, 0, 0.12, 0, 0.08, 0, 0.2, 0, 0, 0, 0.16, 0, 0.06, 0],
        duration: ["4n", "2n"],
        notes: ["C4", "D4", "E4", "G4", "A4", "B4", "D5"],
        velocity: 0.09,
        densityWeight: 0.1,
        energyWeight: 0.04,
        natureWeight: -0.22,
        humanize: 0.028,
        swingPush: 0.006,
        rollMs: 14,
        pedal: 0.72,
        room: 0.88,
        filterBase: 820,
        filterRange: 520,
      },
      {
        id: "distant-root",
        type: "bass",
        function: "space",
        every: 32,
        probability: 0.14,
        duration: "2n",
        notes: ["C2", "A1", "F1", "G1"],
        velocity: 0.08,
        energyWeight: 0.04,
        natureWeight: 0.06,
        filterBase: 240,
        filterRange: 220,
      },
      {
        id: "sleep-air",
        type: "air",
        function: "space",
        every: 4,
        probability: 0.16,
        duration: "16n",
        velocity: 0.03,
        natureWeight: 0.28,
      },
    ],
    variations: [
      { id: "solo-breath", chance: 0.2, densityDelta: -0.08, natureDelta: 0.06 },
      { id: "small-memory", chance: 0.08, energyDelta: 0.02 },
    ],
    transitionRules: {
      maxDensity: 0.42,
      quietOnLateTicks: 3,
      fallback: "air",
    },
  },
});

//------------------------------------------------------
// Small deterministic utilities
//------------------------------------------------------

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function normalizeSeed(seed) {
  const parsed = Number(seed);
  if (!Number.isFinite(parsed)) return DEFAULT_CONFIG.seed;
  return Math.abs(Math.floor(parsed)) % 2147483647;
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomAt(seed, tick, salt) {
  let x = (normalizeSeed(seed) ^ Math.imul(tick + 1, 374761393) ^ hashString(salt)) >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 4294967296;
}

function chooseAt(items, seed, tick, salt) {
  if (!items || items.length === 0) return undefined;
  const index = Math.floor(randomAt(seed, tick, salt) * items.length);
  return items[Math.min(index, items.length - 1)];
}

function safeJsonRead(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("chill storage read failed", key, error);
    return fallback;
  }
}

function safeStorageRead(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn("chill storage read failed", key, error);
    return null;
  }
}

function safeJsonWrite(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("chill storage write failed", key, error);
  }
}

function inferMoodFromFaders(a, b, c) {
  if (a > 0.72 && b > 0.58) return "edge";
  if (c > 0.68 && b < 0.66) return "drift";
  if (a > 0.52 || b > 0.58) return "glow";
  return "calm";
}

function intentToFaders(intent = {}) {
  const mood = MOODS.includes(intent.mood) ? intent.mood : "glow";
  const intensity = clamp01(intent.intensity ?? (mood === "edge" ? 0.78 : 0.52));
  const density = clamp01(intent.density ?? (mood === "calm" ? 0.36 : 0.56));
  const moodBase = {
    calm: { faderA: 0.38, faderB: 0.32, faderC: 0.78 },
    glow: { faderA: 0.58, faderB: 0.54, faderC: 0.56 },
    drift: { faderA: 0.48, faderB: 0.4, faderC: 0.86 },
    edge: { faderA: 0.82, faderB: 0.7, faderC: 0.42 },
  }[mood];

  return {
    faderA: clamp01(moodBase.faderA * 0.55 + intensity * 0.45),
    faderB: clamp01(moodBase.faderB * 0.55 + density * 0.45),
    faderC: clamp01(moodBase.faderC),
  };
}

function loadConfig() {
  const storedSession = safeJsonRead(STORAGE_KEYS.session, {});
  const storedSeedRaw = safeStorageRead(STORAGE_KEYS.lastSeed);
  const storedSeed = storedSeedRaw === null ? NaN : Number(storedSeedRaw);
  const next = {
    ...DEFAULT_CONFIG,
    ...storedSession,
    seed: Number.isFinite(storedSeed) ? storedSeed : storedSession.seed ?? DEFAULT_CONFIG.seed,
  };

  next.seed = normalizeSeed(next.seed);
  next.faderA = clamp01(next.faderA);
  next.faderB = clamp01(next.faderB);
  next.faderC = clamp01(next.faderC);
  next.referenceId = CHILL_RECIPES[next.referenceId] ? next.referenceId : DEFAULT_CONFIG.referenceId;
  next.mood = MOODS.includes(next.mood) ? next.mood : inferMoodFromFaders(next.faderA, next.faderB, next.faderC);
  next.mode = next.mode === "edge" ? "edge" : "ambient";
  return next;
}

function persistConfig(config) {
  safeJsonWrite(STORAGE_KEYS.session, {
    mode: config.mode,
    seed: config.seed,
    faderA: config.faderA,
    faderB: config.faderB,
    faderC: config.faderC,
    mood: config.mood,
    referenceId: config.referenceId,
  });
  safeJsonWrite(STORAGE_KEYS.recipe, {
    referenceId: config.referenceId,
    updatedAt: new Date().toISOString(),
  });
  try {
    window.localStorage.setItem(STORAGE_KEYS.lastSeed, String(config.seed));
  } catch (error) {
    console.warn("chill seed storage write failed", error);
  }
}

//------------------------------------------------------
// ChillGenerator event interface
//------------------------------------------------------

class ChillGenerator {
  constructor(config, recipes) {
    this.config = { ...config };
    this.recipes = recipes;
    this.tickIndex = 0;
    this.manualMood = null;
    this.lastFaderChangeAt = performance.now();
  }

  /** @param {{tickIndex?:number, grooveOn?:boolean, autoOn?:boolean, quiet?:boolean}=} context */
  onTick(context = {}) {
    const tickIndex = Number.isFinite(context.tickIndex) ? context.tickIndex : this.tickIndex;
    const recipe = this.getRecipe();
    const recipeHash = hashString(recipe.id);
    const events = [];
    const grooveActive = Boolean(context.grooveOn);
    const maxDensity = recipe.transitionRules.maxDensity;
    const effectiveDensity = Math.min(maxDensity, this.config.faderB);
    const autoShape = context.autoOn ? this.getAutoVariation(recipe, tickIndex) : null;
    const density = clamp01(effectiveDensity + (autoShape?.densityDelta ?? 0));
    const energy = clamp01(this.config.faderA + (autoShape?.energyDelta ?? 0));
    const nature = clamp01(this.config.faderC + (autoShape?.natureDelta ?? 0));

    recipe.layers.forEach((layer) => {
      if (tickIndex % layer.every !== 0) return;

      const patternPulse = Array.isArray(layer.pattern)
        ? layer.pattern[tickIndex % layer.pattern.length]
        : 1;
      const weightedChance =
        layer.probability +
        density * (layer.densityWeight ?? 0) +
        energy * (layer.energyWeight ?? 0) +
        nature * (layer.natureWeight ?? 0);
      const chance = clamp01(weightedChance * patternPulse);

      if (randomAt(this.config.seed + recipeHash, tickIndex, layer.id) > chance) return;
      events.push(this.buildEvent(layer, tickIndex, { density, energy, nature }));
    });

    if (grooveActive) {
      events.push(...this.buildPulseOverlay(tickIndex, { density, energy, nature }));
    }

    this.tickIndex = tickIndex + 1;
    return events.filter(Boolean);
  }

  applyFaderState(a, b, c) {
    this.config.faderA = clamp01(Number(a));
    this.config.faderB = clamp01(Number(b));
    this.config.faderC = clamp01(Number(c));
    this.config.mood = this.manualMood ?? inferMoodFromFaders(this.config.faderA, this.config.faderB, this.config.faderC);
    this.config.mode = this.config.mood === "edge" ? "edge" : this.getRecipe().mode;
    this.lastFaderChangeAt = performance.now();
    persistConfig(this.config);
    return { ...this.config };
  }

  setSeed(seed) {
    this.config.seed = normalizeSeed(seed);
    this.tickIndex = 0;
    persistConfig(this.config);
    return this.config.seed;
  }

  setMood(profile) {
    if (!MOODS.includes(profile)) return { ...this.config };
    this.manualMood = profile;
    this.config.mood = profile;
    this.config.mode = profile === "edge" ? "edge" : "ambient";
    persistConfig(this.config);
    return { ...this.config };
  }

  setReference(ref) {
    if (!this.recipes[ref]) return { ...this.config };
    const recipe = this.recipes[ref];
    this.config.referenceId = ref;
    this.config.mode = recipe.mode;
    this.config.mood = this.manualMood ?? inferMoodFromFaders(this.config.faderA, this.config.faderB, this.config.faderC);
    this.tickIndex = 0;
    persistConfig(this.config);
    return { ...this.config };
  }

  getRecipe() {
    return this.recipes[this.config.referenceId] ?? this.recipes[DEFAULT_CONFIG.referenceId];
  }

  getAutoVariation(recipe, tickIndex) {
    const variation = chooseAt(recipe.variations, this.config.seed, Math.floor(tickIndex / 16), "auto-variation");
    if (!variation) return null;
    const chance = variation.chance * (0.6 + this.config.faderC * 0.5);
    return randomAt(this.config.seed, tickIndex, variation.id) < chance ? variation : null;
  }

  buildEvent(layer, tickIndex, shape) {
    const noteChoice = Array.isArray(layer.notes)
      ? chooseAt(layer.notes, this.config.seed, tickIndex, `${layer.id}:notes`)
      : undefined;
    const duration = Array.isArray(layer.duration)
      ? chooseAt(layer.duration, this.config.seed, tickIndex, `${layer.id}:duration`)
      : layer.duration ?? "16n";

    return {
      type: layer.type,
      id: layer.id,
      notes: noteChoice,
      duration,
      velocity: clamp01((layer.velocity ?? 0.3) + shape.energy * 0.16),
      filterHz: layer.filterBase ? layer.filterBase + shape.energy * (layer.filterRange ?? 0) : undefined,
      tone: layer.tone ?? "felt",
      rollSec: ((layer.rollMs ?? 0) / 1000) * (0.55 + shape.nature * 0.75),
      pedal: clamp01((layer.pedal ?? 0.52) + shape.nature * 0.18),
      room: clamp01((layer.room ?? 0.48) + shape.nature * 0.16),
      offset:
        (randomAt(this.config.seed, tickIndex, `${layer.id}:humanize`) - 0.5) * (layer.humanize ?? 0) +
        ((tickIndex % 4 === 2 || tickIndex % 4 === 3) ? (layer.swingPush ?? 0) * shape.nature : 0),
    };
  }

  buildPulseOverlay(tickIndex, shape) {
    const events = [];
    const step = tickIndex % 16;
    const kickPattern = [0.8, 0, 0.04, 0, 0.16, 0, 0.42, 0, 0.5, 0, 0.08, 0, 0.16, 0.32, 0, 0.04];
    const hatPattern = [0.1, 0.42, 0.16, 0.38, 0.08, 0.46, 0.14, 0.34, 0.12, 0.5, 0.14, 0.36, 0.08, 0.42, 0.18, 0.3];
    const rootPattern = [0.28, 0, 0, 0, 0, 0, 0.18, 0, 0.2, 0, 0, 0, 0, 0.14, 0, 0];

    if (randomAt(this.config.seed, tickIndex, "pulse-kick") < clamp01(kickPattern[step] * (0.12 + shape.energy * 0.12))) {
      events.push({ type: "kick", id: "pulse-kick", duration: "8n", velocity: 0.08 + shape.energy * 0.08, offset: 0.004 * shape.nature });
    }

    if (randomAt(this.config.seed, tickIndex, "pulse-hat") < clamp01(hatPattern[step] * (0.12 + shape.density * 0.14))) {
      events.push({ type: "hat", id: "pulse-hat", duration: "16n", velocity: 0.025 + shape.density * 0.04, offset: 0.01 * shape.nature });
    }

    if (randomAt(this.config.seed, tickIndex, "pulse-root") < clamp01(rootPattern[step] * (0.1 + shape.density * 0.12))) {
      events.push({
        type: "bass",
        id: "pulse-root",
        notes: chooseAt(["F1", "A1", "C2", "D2"], this.config.seed, tickIndex, "pulse-root-pitch"),
        duration: "8n",
        velocity: 0.06 + shape.energy * 0.08,
        filterHz: 260 + shape.energy * 420,
        offset: 0.006 * shape.nature,
      });
    }

    return events;
  }
}

//------------------------------------------------------
// Canvas renderer
//------------------------------------------------------

const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

let lastDrawAt = 0;
function draw(t) {
  if (t - lastDrawAt < 1000 / 24) {
    requestAnimationFrame(draw);
    return;
  }
  lastDrawAt = t;

  const { faderA, faderB, faderC, mood } = generator.config;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const rings = 9 + Math.floor(7 * faderB);
  const baseR = Math.min(cx, cy) * (0.27 + faderC * 0.08);
  const drift = Math.sin(t * 0.00035) * (28 + 34 * faderC);
  const hue = mood === "edge" ? 38 : mood === "drift" ? 154 : mood === "calm" ? 48 : 96;

  for (let i = 0; i < rings; i += 1) {
    const r = baseR + i * (16 + faderB * 9) + drift * Math.sin(i * 0.6);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${hue + i * 4}, 78%, 66%, ${0.1 + faderA * 0.18})`;
    ctx.lineWidth = 0.7 + faderA * 0.6;
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}

//------------------------------------------------------
// Tone.js audio graph: oscillator/noise only, no samples
//------------------------------------------------------

Tone.Transport.bpm.value = 84;
Tone.Transport.swing = 0.16;
Tone.Transport.swingSubdivision = "8n";

const limiter = new Tone.Limiter(-1).toDestination();
const master = new Tone.Gain(0.82).connect(limiter);

const pianoRoom = new Tone.Reverb(4.2);
pianoRoom.wet.value = 0.36;
const pianoBus = new Tone.Gain(0.58).chain(pianoRoom, master);

const pianoBodyFilter = new Tone.Filter(1350, "lowpass");
const pianoBody = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.012, decay: 1.6, sustain: 0.05, release: 3.2 },
}).chain(pianoBodyFilter, pianoBus);

const pianoBellFilter = new Tone.Filter(2200, "lowpass");
const pianoBell = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 1.08,
  modulationIndex: 0.72,
  oscillator: { type: "sine" },
  envelope: { attack: 0.004, decay: 0.28, sustain: 0, release: 1.6 },
  modulationEnvelope: { attack: 0.004, decay: 0.18, sustain: 0, release: 0.8 },
}).chain(pianoBellFilter, pianoBus);

const pianoHammerFilter = new Tone.Filter(1700, "bandpass");
const pianoHammer = new Tone.NoiseSynth({
  noise: { type: "brown" },
  envelope: { attack: 0.001, decay: 0.024, sustain: 0, release: 0.01 },
}).chain(pianoHammerFilter, pianoBus);

const leadFilter = new Tone.Filter(1400, "lowpass");
const lead = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.03, decay: 0.24, sustain: 0.16, release: 1.3 },
}).chain(leadFilter, master);

const padFilter = new Tone.Filter(900, "lowpass");
const padVerb = new Tone.Reverb(3.2);
padVerb.wet.value = 0.42;
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 1.1, decay: 0.2, sustain: 0.82, release: 3.4 },
}).chain(padFilter, padVerb, master);

const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  filter: { type: "lowpass", rolloff: -24 },
  envelope: { attack: 0.01, decay: 0.18, sustain: 0.12, release: 0.25 },
  filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.12, release: 0.22 },
}).connect(master);

const kick = new Tone.MembraneSynth({
  pitchDecay: 0.008,
  octaves: 3,
  envelope: { attack: 0.001, decay: 0.25, sustain: 0 },
}).connect(master);

const hat = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.07, sustain: 0 },
}).connect(master);

const air = new Tone.NoiseSynth({
  noise: { type: "pink" },
  envelope: { attack: 0.01, decay: 0.18, sustain: 0 },
}).connect(master);

//------------------------------------------------------
// Runtime state, guard rail, adapter
//------------------------------------------------------

const runtimeHealth = {
  quiet: false,
  lateTicks: 0,
  lastTickAt: 0,
  recoverAt: 0,
  lastScheduleResult: null,
};

const ui = {
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  acidBtn: document.getElementById("acidBtn"),
  autoBtn: document.getElementById("autoBtn"),
  seedBtn: document.getElementById("seedBtn"),
  energy: document.getElementById("energy"),
  creation: document.getElementById("creation"),
  nature: document.getElementById("nature"),
  referenceSelect: document.getElementById("referenceSelect"),
  seedLabel: document.getElementById("seedLabel"),
  moodLabel: document.getElementById("moodLabel"),
  modeLabel: document.getElementById("modeLabel"),
  guardLabel: document.getElementById("guardLabel"),
};

const generator = new ChillGenerator(loadConfig(), CHILL_RECIPES);
let grooveOn = false;
let autoOn = false;
let busy = false;
let started = false;
let transportStep = 0;
let autoStep = 0;
let autoTimer = null;

function recordRuntimeError(reason, error) {
  const entry = {
    reason,
    message: error?.message ?? String(error),
    at: new Date().toISOString(),
  };
  const log = safeJsonRead("chill:runtime-errors:v1", []);
  log.unshift(entry);
  safeJsonWrite("chill:runtime-errors:v1", log.slice(0, 8));
  console.warn("chill guard", entry);
}

function enterQuietMode(reason) {
  if (!runtimeHealth.quiet) {
    recordRuntimeError(reason, new Error(reason));
  }
  runtimeHealth.quiet = true;
  runtimeHealth.recoverAt = performance.now() + 3200;
  master.gain.rampTo(0.04, 0.35);
  updateUi();
}

function maybeRecoverFromQuiet() {
  if (!runtimeHealth.quiet || performance.now() < runtimeHealth.recoverAt) return;
  runtimeHealth.quiet = false;
  runtimeHealth.lateTicks = 0;
  master.gain.rampTo(0.82, 0.8);
  updateUi();
}

function watchRuntimeLoad() {
  const now = performance.now();
  if (runtimeHealth.lastTickAt > 0 && now - runtimeHealth.lastTickAt > 1000) {
    runtimeHealth.lateTicks += 1;
  } else {
    runtimeHealth.lateTicks = Math.max(0, runtimeHealth.lateTicks - 1);
  }
  runtimeHealth.lastTickAt = now;

  const recipe = generator.getRecipe();
  if (runtimeHealth.lateTicks >= recipe.transitionRules.quietOnLateTicks) {
    enterQuietMode("late tick guard");
  }

  if (performance.memory) {
    const usedRatio = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    if (usedRatio > 0.85) enterQuietMode("memory pressure guard");
  }
}

function asNoteList(notes) {
  if (!Array.isArray(notes)) return notes ? [notes] : [];
  return notes;
}

function toneProfile(tone) {
  if (tone === "glass") {
    return { body: 0.74, bell: 0.28, hammer: 0.22, cutoff: 1.1, release: 0.94, room: 1.1 };
  }
  if (tone === "memory") {
    return { body: 0.58, bell: 0.18, hammer: 0.12, cutoff: 0.72, release: 1.24, room: 1.18 };
  }
  return { body: 0.86, bell: 0.12, hammer: 0.18, cutoff: 0.86, release: 1.08, room: 1 };
}

function schedulePianoEvent(event, time, velocity) {
  const notes = asNoteList(event.notes);
  if (notes.length === 0) return;

  const profile = toneProfile(event.tone);
  const roll = Math.min(0.032, Math.max(0, event.rollSec ?? 0));
  const pedal = clamp01(event.pedal ?? 0.58);
  const room = clamp01(event.room ?? 0.54);
  const baseCutoff = (event.filterHz ?? 1200) * profile.cutoff;
  const bodyDur = pedal > 0.72 ? "1m" : event.duration;
  const bellDur = event.tone === "memory" ? "8n" : "4n";

  pianoRoom.wet.setValueAtTime(Math.min(0.58, 0.22 + room * 0.34 * profile.room), time);
  pianoBodyFilter.frequency.setValueAtTime(Math.max(520, Math.min(2400, baseCutoff)), time);
  pianoBellFilter.frequency.setValueAtTime(Math.max(1100, Math.min(3600, baseCutoff * 1.74)), time);

  notes.forEach((note, index) => {
    const noteTime = time + (event.offset ?? 0) + index * roll;
    const noteTilt = 1 - index * 0.045;
    const bodyVelocity = clamp01(velocity * profile.body * noteTilt);
    const bellVelocity = clamp01(velocity * profile.bell * (0.9 - index * 0.03));
    const hammerVelocity = clamp01(velocity * profile.hammer * (0.9 - index * 0.06));

    pianoBody.triggerAttackRelease(note, bodyDur, noteTime, bodyVelocity);
    if (bellVelocity > 0.008) {
      pianoBell.triggerAttackRelease(note, bellDur, noteTime + 0.006, bellVelocity);
    }
    if (index === 0 && hammerVelocity > 0.008) {
      pianoHammer.triggerAttackRelease("32n", noteTime, hammerVelocity);
    }
  });
}

function scheduleEvent(event, time = Tone.now()) {
  if (runtimeHealth.quiet && event.type !== "air") {
    const result = {
      executed: false,
      fallback: "quiet-mode",
      reason: "guard-active",
      eventType: event.type,
    };
    runtimeHealth.lastScheduleResult = result;
    return result;
  }

  try {
    const velocity = clamp01(event.velocity ?? 0.3);
    if (event.filterHz) {
      leadFilter.frequency.setValueAtTime(event.filterHz, time);
      padFilter.frequency.setValueAtTime(event.filterHz, time);
      bass.filter.frequency.setValueAtTime(event.filterHz, time);
    }

    if (event.type === "piano" && event.notes) {
      schedulePianoEvent(event, time, velocity);
    } else if (event.type === "lead" && event.notes) {
      lead.triggerAttackRelease(event.notes, event.duration, time + event.offset, velocity);
    } else if (event.type === "pad" && event.notes) {
      pad.triggerAttackRelease(event.notes, event.duration, time + event.offset, velocity);
    } else if (event.type === "bass" && event.notes) {
      bass.triggerAttackRelease(event.notes, event.duration, time + event.offset, velocity);
    } else if (event.type === "kick") {
      kick.triggerAttackRelease("C1", event.duration ?? "8n", time + event.offset, velocity);
    } else if (event.type === "hat") {
      hat.triggerAttackRelease(event.duration ?? "16n", time + event.offset, velocity);
    } else if (event.type === "air") {
      air.triggerAttackRelease(event.duration ?? "16n", time + event.offset, velocity);
    }

    const result = {
      executed: true,
      fallback: null,
      reason: "scheduled",
      eventType: event.type,
    };
    runtimeHealth.lastScheduleResult = result;
    return result;
  } catch (error) {
    recordRuntimeError(`schedule:${event.type}`, error);
    enterQuietMode(`schedule fallback:${event.type}`);
    try {
      air.triggerAttackRelease("16n", time, 0.05);
      const result = {
        executed: false,
        fallback: "air",
        reason: error.message,
        eventType: event.type,
      };
      runtimeHealth.lastScheduleResult = result;
      return result;
    } catch (fallbackError) {
      recordRuntimeError("schedule:fallback-air", fallbackError);
      const result = {
        executed: false,
        fallback: "mute",
        reason: fallbackError.message,
        eventType: event.type,
      };
      runtimeHealth.lastScheduleResult = result;
      return result;
    }
  }
}

function buildPreviewConfig(options = {}) {
  const referenceId = CHILL_RECIPES[options.referenceId]
    ? options.referenceId
    : DEFAULT_CONFIG.referenceId;
  const recipe = CHILL_RECIPES[referenceId];
  return {
    mode: recipe.mode,
    seed: normalizeSeed(options.seed ?? generator.config.seed),
    faderA: clamp01(options.faderA ?? recipe.defaultFaders.faderA),
    faderB: clamp01(options.faderB ?? recipe.defaultFaders.faderB),
    faderC: clamp01(options.faderC ?? recipe.defaultFaders.faderC),
    mood: MOODS.includes(options.mood) ? options.mood : recipe.mood,
    referenceId,
  };
}

function compactEvent(event, tick) {
  return {
    tick,
    type: event.type,
    id: event.id,
    notes: event.notes,
    duration: event.duration,
    tone: event.tone,
    velocity: Number((event.velocity ?? 0).toFixed(4)),
    offset: Number((event.offset ?? 0).toFixed(4)),
    rollSec: Number((event.rollSec ?? 0).toFixed(4)),
    pedal: Number((event.pedal ?? 0).toFixed(4)),
    room: Number((event.room ?? 0).toFixed(4)),
  };
}

function previewEventStream(options = {}) {
  const bars = Math.max(1, Math.min(64, Math.floor(options.bars ?? 16)));
  const ticks = bars * 16;
  const preview = new ChillGenerator(buildPreviewConfig(options), CHILL_RECIPES);
  const events = [];

  for (let tick = 0; tick < ticks; tick += 1) {
    preview
      .onTick({
        tickIndex: tick,
        grooveOn: Boolean(options.grooveOn),
        autoOn: Boolean(options.autoOn),
        quiet: false,
      })
      .forEach((event) => events.push(compactEvent(event, tick)));
  }

  return {
    bars,
    ticks,
    config: { ...preview.config },
    eventCount: events.length,
    fingerprint: hashString(JSON.stringify(events)).toString(16),
    events,
  };
}

function runDeterminismCheck(options = {}) {
  const first = previewEventStream(options);
  const second = previewEventStream(options);
  return {
    passed: first.fingerprint === second.fingerprint && first.eventCount === second.eventCount,
    referenceId: first.config.referenceId,
    seed: first.config.seed,
    bars: first.bars,
    eventCount: first.eventCount,
    fingerprint: first.fingerprint,
  };
}

const chillAdapter = {
  STORAGE_KEYS,
  recipes: CHILL_RECIPES,
  intentToFaders,
  schedule: scheduleEvent,
  diagnostics: {
    previewEventStream,
    runDeterminismCheck,
  },
  getRuntimeConfig: () => ({ ...generator.config }),
  setIntent(intent) {
    const faders = intentToFaders(intent);
    generator.applyFaderState(faders.faderA, faders.faderB, faders.faderC);
    if (intent.mood) generator.setMood(intent.mood);
    syncControlsFromConfig();
    updateUi();
    return { ...generator.config };
  },
  setReference(ref) {
    const next = generator.setReference(ref);
    syncControlsFromConfig();
    updateUi();
    return next;
  },
};

window.ChillGenerator = ChillGenerator;
window.chillAdapter = chillAdapter;
window.chillRuntime = {
  generator,
  adapter: chillAdapter,
  diagnostics: chillAdapter.diagnostics,
  STORAGE_KEYS,
};

//------------------------------------------------------
// Transport and UI
//------------------------------------------------------

const mainLoop = new Tone.Loop((time) => {
  maybeRecoverFromQuiet();
  watchRuntimeLoad();
  const events = generator.onTick({
    tickIndex: transportStep,
    grooveOn,
    autoOn,
    quiet: runtimeHealth.quiet,
  });
  events.forEach((event) => scheduleEvent(event, time));
  transportStep += 1;
}, "16n");

function syncControlsFromConfig() {
  ui.energy.value = generator.config.faderA;
  ui.creation.value = generator.config.faderB;
  ui.nature.value = generator.config.faderC;
  ui.referenceSelect.value = generator.config.referenceId;
}

function updateUi() {
  ui.seedLabel.textContent = `Seed ${generator.config.seed}`;
  ui.moodLabel.textContent = generator.config.mood;
  ui.modeLabel.textContent = grooveOn ? "groove" : generator.config.mode;
  ui.guardLabel.textContent = runtimeHealth.quiet ? "quiet" : "stable";
  ui.acidBtn.classList.toggle("is-active", grooveOn);
  ui.autoBtn.classList.toggle("is-active", autoOn);
  ui.startBtn.classList.toggle("is-active", Tone.Transport.state === "started");
}

function applyRecipeTransport(recipe, ramp = 3) {
  Tone.Transport.swing = recipe.swing ?? 0.16;
  Tone.Transport.swingSubdivision = "8n";
  Tone.Transport.bpm.rampTo(recipe.bpm ?? 84, Math.max(0.05, ramp));
}

function applyFadersFromUi() {
  generator.applyFaderState(
    parseFloat(ui.energy.value),
    parseFloat(ui.creation.value),
    parseFloat(ui.nature.value)
  );
  updateUi();
}

function applyReferenceDefaults(recipe) {
  const a = generator.config.faderA * 0.62 + recipe.defaultFaders.faderA * 0.38;
  const b = generator.config.faderB * 0.62 + recipe.defaultFaders.faderB * 0.38;
  const c = generator.config.faderC * 0.62 + recipe.defaultFaders.faderC * 0.38;
  generator.applyFaderState(a, b, c);
  applyRecipeTransport(recipe, 4);
  syncControlsFromConfig();
}

function startAutoDrift() {
  window.clearTimeout(autoTimer);
  if (!autoOn) return;

  const recipe = generator.getRecipe();
  const target = recipe.defaultFaders;
  const jitterA = (randomAt(generator.config.seed, autoStep, "auto-a") - 0.5) * 0.06;
  const jitterB = (randomAt(generator.config.seed, autoStep, "auto-b") - 0.5) * 0.07;
  const jitterC = (randomAt(generator.config.seed, autoStep, "auto-c") - 0.5) * 0.05;
  const grooveLift = randomAt(generator.config.seed, autoStep, "auto-groove") < 0.18 ? 0.02 : 0;

  const nextA = generator.config.faderA + (target.faderA - generator.config.faderA) * 0.08 + jitterA + grooveLift;
  const nextB = generator.config.faderB + (target.faderB - generator.config.faderB) * 0.08 + jitterB + grooveLift * 0.6;
  const nextC = generator.config.faderC + (target.faderC - generator.config.faderC) * 0.1 + jitterC;
  generator.applyFaderState(nextA, nextB, nextC);
  syncControlsFromConfig();

  const bpm = (recipe.bpm ?? 84) + (generator.config.faderA - 0.5) * 5 - (generator.config.faderC - 0.5) * 2;
  Tone.Transport.bpm.rampTo(Math.max(68, Math.min(92, bpm)), 6);
  autoStep += 1;
  updateUi();
  autoTimer = window.setTimeout(startAutoDrift, 7000);
}

function installGlobalUnlock() {
  const handler = async () => {
    try {
      await Tone.start();
    } catch (error) {
      recordRuntimeError("global unlock failed", error);
    } finally {
      document.documentElement.removeEventListener("touchend", handler);
      document.documentElement.removeEventListener("click", handler);
    }
  };

  document.documentElement.addEventListener("touchend", handler, { once: true });
  document.documentElement.addEventListener("click", handler, { once: true });
}

ui.startBtn.onclick = async () => {
  if (busy) return;
  busy = true;
  window.setTimeout(() => {
    busy = false;
  }, 250);

  try {
    await Tone.start();

    if (!started) {
      transportStep = 0;
      Tone.Transport.position = 0;
      mainLoop.start(0);
      started = true;
    }

    Tone.Transport.start("+0.05");
    updateUi();
  } catch (error) {
    recordRuntimeError("audio start failed", error);
    enterQuietMode("audio start failed");
    window.alert(
      "iPhone がオーディオをブロックしました。\n画面を一度タップしてから、もう一度 START を押してください。"
    );
  }
};

ui.stopBtn.onclick = () => {
  Tone.Transport.stop();
  updateUi();
};

ui.acidBtn.onclick = () => {
  grooveOn = !grooveOn;
  generator.config.mode = generator.getRecipe().mode;
  persistConfig(generator.config);
  updateUi();
};

ui.autoBtn.onclick = () => {
  autoOn = !autoOn;
  startAutoDrift();
  updateUi();
};

ui.seedBtn.onclick = () => {
  const next = Math.floor(Date.now() % 2147483647);
  generator.setSeed(next);
  transportStep = 0;
  updateUi();
};

ui.referenceSelect.onchange = (event) => {
  const ref = event.target.value;
  generator.setReference(ref);
  applyReferenceDefaults(generator.getRecipe());
  updateUi();
};

[ui.energy, ui.creation, ui.nature].forEach((input) => {
  input.oninput = applyFadersFromUi;
});

syncControlsFromConfig();
persistConfig(generator.config);
applyRecipeTransport(generator.getRecipe(), 0.05);
installGlobalUnlock();
requestAnimationFrame(draw);
updateUi();
