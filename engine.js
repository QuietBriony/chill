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
  listeningScore: "chill:listening-score:v1",
});

const DEFAULT_CONFIG = Object.freeze({
  mode: "ambient",
  seed: 240424,
  faderA: 0.32,
  faderB: 0.24,
  faderC: 0.78,
  mood: "glow",
  referenceId: "piano-jazz-chill",
});

const MOODS = Object.freeze(["calm", "glow", "drift", "edge"]);

/** @type {Record<string, ChillRecipe>} */
const CHILL_RECIPES = Object.freeze({
  "piano-jazz-chill": {
    id: "piano-jazz-chill",
    label: "Quiet Piano",
    mode: "ambient",
    mood: "calm",
    bpm: 66,
    swing: 0.04,
    defaultFaders: { faderA: 0.28, faderB: 0.2, faderC: 0.78 },
    layers: [
      {
        id: "room-chord-bed",
        type: "piano",
        function: "bed",
        tone: "felt",
        every: 16,
        probability: 0.9,
        pattern: [0.98, 0, 0, 0, 0.32, 0, 0, 0, 0.64, 0, 0, 0, 0.24, 0, 0, 0],
        duration: ["2n", "1n"],
        notes: [
          ["D3", "F3", "A3", "C4", "E4"],
          ["G2", "F3", "A3", "B3", "E4"],
          ["C3", "E3", "G3", "B3", "D4"],
          ["A2", "C3", "E3", "G3", "B3"],
        ],
        velocity: 0.17,
        densityWeight: -0.06,
        energyWeight: 0.06,
        natureWeight: 0.18,
        humanize: 0.026,
        rollMs: 18,
        pedal: 0.68,
        room: 0.58,
        filterBase: 820,
        filterRange: 420,
      },
      {
        id: "piano-memory",
        type: "piano",
        function: "memory",
        tone: "felt",
        every: 8,
        probability: 0.18,
        pattern: [0.44, 0, 0, 0, 0.1, 0, 0.26, 0, 0.18, 0, 0, 0, 0.3, 0, 0, 0],
        duration: ["2n", "4n"],
        notes: [
          ["E4", "G4"],
          ["A3", "C4", "E4"],
          ["D4", "F4"],
          ["B3", "D4", "G4"],
          ["C4", "E4", "A4"],
        ],
        velocity: 0.095,
        densityWeight: 0.12,
        energyWeight: 0.08,
        natureWeight: -0.2,
        humanize: 0.032,
        swingPush: 0.004,
        rollMs: 16,
        pedal: 0.56,
        room: 0.58,
        filterBase: 780,
        filterRange: 360,
      },
      {
        id: "room-pedal-air",
        type: "pad",
        function: "space",
        every: 32,
        probability: 0,
        duration: "2n",
        notes: [
          ["D3", "A3", "F4"],
          ["G2", "D3", "B3"],
          ["C3", "G3", "E4"],
          ["A2", "E3", "C4"],
        ],
        velocity: 0,
        energyWeight: -0.04,
        natureWeight: 0.08,
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
    label: "Glass Piano",
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
        duration: ["2n", "1n"],
        notes: [
          ["E3", "G3", "B3", "D4", "F#4"],
          ["A2", "C#3", "E3", "B3", "D4"],
          ["D3", "F#3", "A3", "E4", "G4"],
          ["G2", "B2", "D3", "A3", "C4"],
        ],
        velocity: 0.14,
        densityWeight: -0.04,
        energyWeight: 0.05,
        natureWeight: 0.2,
        humanize: 0.03,
        rollMs: 16,
        pedal: 0.62,
        room: 0.62,
        filterBase: 900,
        filterRange: 420,
      },
      {
        id: "dust-piano-reply",
        type: "piano",
        function: "response",
        tone: "glass",
        every: 8,
        probability: 0.16,
        pattern: [0.26, 0, 0, 0, 0.12, 0, 0.24, 0, 0.16, 0, 0, 0, 0.22, 0, 0.04, 0],
        duration: ["4n", "2n"],
        notes: [
          ["D4", "F#4"],
          ["G4", "A4"],
          ["E4", "B4"],
          ["C#4", "F#4", "A4"],
        ],
        velocity: 0.085,
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
        probability: 0.04,
        pattern: [0.38, 0, 0, 0, 0.02, 0, 0.08, 0, 0.18, 0, 0, 0, 0.04, 0.1, 0, 0],
        duration: "8n",
        velocity: 0.045,
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
        probability: 0.05,
        pattern: [0.04, 0.18, 0.04, 0.16, 0.02, 0.2, 0.06, 0.14, 0.04, 0.22, 0.06, 0.14, 0.02, 0.18, 0.08, 0.12],
        duration: "16n",
        velocity: 0.018,
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
        every: 8,
        probability: 0.05,
        duration: "16n",
        velocity: 0.016,
        natureWeight: 0.12,
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
    label: "Memory Piano",
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
        velocity: 0.11,
        densityWeight: -0.06,
        energyWeight: 0.03,
        natureWeight: 0.22,
        humanize: 0.04,
        rollMs: 22,
        pedal: 0.72,
        room: 0.66,
        filterBase: 640,
        filterRange: 280,
      },
      {
        id: "solo-piano-memory",
        type: "piano",
        function: "memory",
        tone: "memory",
        every: 8,
        probability: 0.12,
        pattern: [0.24, 0, 0, 0, 0.1, 0, 0.04, 0, 0.16, 0, 0, 0, 0.12, 0, 0.04, 0],
        duration: ["2n", "4n"],
        notes: [
          ["C4", "E4"],
          ["D4", "G4"],
          ["E4", "A4"],
          ["B3", "D4", "A4"],
        ],
        velocity: 0.072,
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
        probability: 0.06,
        duration: "2n",
        notes: ["C2", "A1", "F1", "G1"],
        velocity: 0.045,
        energyWeight: 0.04,
        natureWeight: 0.06,
        filterBase: 240,
        filterRange: 220,
      },
      {
        id: "sleep-air",
        type: "air",
        function: "space",
        every: 16,
        probability: 0.04,
        duration: "16n",
        velocity: 0.012,
        natureWeight: 0.1,
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
  "soft-melody-piano": {
    id: "soft-melody-piano",
    label: "Soft Melody Piano",
    mode: "ambient",
    mood: "calm",
    bpm: 62,
    swing: 0.035,
    defaultFaders: { faderA: 0.3, faderB: 0.28, faderC: 0.86 },
    layers: [
      {
        id: "soft-melody-room",
        type: "piano",
        function: "bed",
        tone: "memory",
        every: 16,
        probability: 0.72,
        pattern: [0.86, 0, 0, 0, 0.2, 0, 0, 0, 0.52, 0, 0, 0, 0.16, 0, 0, 0],
        duration: ["1m", "2n"],
        notes: [
          ["D3", "A3", "C4", "E4"],
          ["G2", "D3", "B3", "E4"],
          ["C3", "G3", "B3", "D4"],
          ["A2", "E3", "G3", "C4"],
        ],
        velocity: 0.105,
        densityWeight: -0.08,
        energyWeight: 0.03,
        natureWeight: 0.2,
        humanize: 0.038,
        rollMs: 24,
        pedal: 0.74,
        room: 0.74,
        filterBase: 660,
        filterRange: 300,
      },
      {
        id: "soft-melody-answer",
        type: "piano",
        function: "melody",
        tone: "felt",
        every: 8,
        probability: 0.14,
        pattern: [0.18, 0, 0, 0, 0.28, 0, 0.08, 0, 0.12, 0, 0, 0, 0.22, 0, 0.06, 0],
        duration: ["4n", "2n"],
        notes: [
          ["E4"],
          ["G4"],
          ["A4"],
          ["D4", "F4"],
          ["B3", "E4"],
          ["C4", "G4"],
        ],
        velocity: 0.078,
        densityWeight: 0.08,
        energyWeight: 0.035,
        natureWeight: -0.12,
        humanize: 0.032,
        swingPush: 0.006,
        rollMs: 8,
        pedal: 0.58,
        room: 0.84,
        filterBase: 760,
        filterRange: 460,
      },
      {
        id: "soft-memory-dot",
        type: "piano",
        function: "memory",
        tone: "glass",
        every: 16,
        probability: 0.09,
        pattern: [0.08, 0, 0, 0, 0, 0, 0.16, 0, 0.08, 0, 0, 0, 0.12, 0, 0, 0],
        duration: ["4n", "8n"],
        notes: [
          ["F4", "A4"],
          ["E4", "G4"],
          ["D4", "A4"],
          ["C4", "E4"],
        ],
        velocity: 0.055,
        densityWeight: 0.04,
        energyWeight: 0.03,
        natureWeight: -0.06,
        humanize: 0.026,
        swingPush: 0.004,
        rollMs: 10,
        pedal: 0.5,
        room: 0.9,
        filterBase: 880,
        filterRange: 520,
      },
      {
        id: "soft-melody-air",
        type: "air",
        function: "space",
        every: 16,
        probability: 0.035,
        duration: "16n",
        velocity: 0.01,
        natureWeight: 0.1,
      },
    ],
    variations: [
      { id: "melody-rest", chance: 0.26, densityDelta: -0.1, natureDelta: 0.08 },
      { id: "answer-window", chance: 0.08, densityDelta: 0.03, energyDelta: 0.01 },
    ],
    transitionRules: {
      maxDensity: 0.34,
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

const FLOW_STATES = Object.freeze(["settle", "breathe", "lift", "decrescendo", "recover"]);

function pressureTargetValue(target) {
  if (target === "safe") return 0.34;
  if (target === "full") return 0.68;
  return 0.52;
}

function pressureStatus(value) {
  if (value < 0.42) return "safe";
  if (value < 0.64) return "warm";
  return "full";
}

function flowStateForBar(seed, referenceId, barIndex) {
  const cycle = 16;
  const phraseBar = Math.max(0, Math.floor(barIndex)) % cycle;
  if (phraseBar <= 2) return "settle";
  if (phraseBar <= 7) return "breathe";
  if (phraseBar <= 11) return "lift";
  if (phraseBar <= 14) return "decrescendo";
  return "recover";
}

function buildFlowState(options = {}) {
  const seed = normalizeSeed(options.seed ?? DEFAULT_CONFIG.seed);
  const referenceId = CHILL_RECIPES[options.referenceId] ? options.referenceId : DEFAULT_CONFIG.referenceId;
  const tickIndex = Math.max(0, Math.floor(Number(options.tickIndex) || 0));
  const barIndex = Math.max(0, Math.floor(Number(options.barIndex) || Math.floor(tickIndex / 16)));
  const touch = clamp01(options.touch ?? options.faderA ?? DEFAULT_CONFIG.faderA);
  const phrase = clamp01(options.phrase ?? options.faderB ?? DEFAULT_CONFIG.faderB);
  const room = clamp01(options.room ?? options.faderC ?? DEFAULT_CONFIG.faderC);
  const enabled = options.flowOn !== false;
  const state = enabled ? flowStateForBar(seed, referenceId, barIndex) : "settle";
  const target = pressureTargetValue(options.pressureTarget);
  const basePressure = clamp01(touch * 0.34 + phrase * 0.28 + (1 - room) * 0.28 + target * 0.1);
  const wobble = enabled ? (randomAt(seed, barIndex, `${referenceId}:flow-wobble`) - 0.5) * 0.08 : 0;
  const stateLift = {
    settle: -0.1,
    breathe: 0,
    lift: 0.12,
    decrescendo: -0.18,
    recover: -0.06,
  }[state];
  const pressure = clamp01(basePressure + stateLift + wobble);
  const decrescendo = state === "decrescendo";
  const soften = state === "settle" || state === "recover";
  const lift = state === "lift";

  if (!enabled) {
    return {
      enabled: false,
      state: "settle",
      barIndex,
      pressure: clamp01(basePressure),
      pressureStatus: pressureStatus(basePressure),
      decrescendo: false,
      densityDelta: 0,
      energyDelta: 0,
      natureDelta: 0,
      velocityScale: 1,
      pianoVelocityScale: 1,
      bassVelocityScale: 1,
      drumDensityScale: 1,
      restLift: 0,
      bassActivity: clamp01(phrase * 0.34 + touch * 0.16 + (1 - room) * 0.12),
      rollLift: 0,
      roomLift: 0,
    };
  }

  return {
    enabled,
    state,
    barIndex,
    pressure,
    pressureStatus: pressureStatus(pressure),
    decrescendo,
    densityDelta: decrescendo ? -0.16 : soften ? -0.08 : lift ? 0.04 : -0.02,
    energyDelta: decrescendo ? -0.14 : soften ? -0.05 : lift ? 0.05 : 0,
    natureDelta: decrescendo ? 0.1 : state === "breathe" ? 0.05 : soften ? 0.06 : 0.02,
    velocityScale: clamp01(decrescendo ? 0.68 : soften ? 0.82 : lift ? 0.96 : 0.9),
    pianoVelocityScale: clamp01(decrescendo ? 0.72 : soften ? 0.86 : lift ? 0.98 : 0.92),
    bassVelocityScale: clamp01(decrescendo ? 0.54 : soften ? 0.72 : lift ? 0.92 : 0.84),
    drumDensityScale: clamp01(decrescendo ? 0.48 : soften ? 0.68 : lift ? 0.86 : 0.76),
    restLift: clamp01(decrescendo ? 0.42 + room * 0.18 : soften ? 0.24 + room * 0.12 : room * 0.08),
    bassActivity: clamp01((phrase * 0.42 + touch * 0.2 + (1 - room) * 0.2) * (decrescendo ? 0.28 : lift ? 0.94 : 0.72)),
    rollLift: decrescendo ? 0.012 : state === "breathe" ? 0.006 : 0,
    roomLift: decrescendo ? 0.09 : state === "breathe" ? 0.05 : soften ? 0.04 : 0,
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

  /** @param {{tickIndex?:number, pulseOn?:boolean, grooveOn?:boolean, autoOn?:boolean, quiet?:boolean}=} context */
  onTick(context = {}) {
    const tickIndex = Number.isFinite(context.tickIndex) ? context.tickIndex : this.tickIndex;
    const recipe = this.getRecipe();
    const recipeHash = hashString(recipe.id);
    const events = [];
    const grooveActive = Boolean(context.pulseOn ?? context.grooveOn);
    const maxDensity = recipe.transitionRules.maxDensity;
    const effectiveDensity = Math.min(maxDensity, this.config.faderB);
    const flow = buildFlowState({
      seed: this.config.seed,
      referenceId: recipe.id,
      tickIndex,
      touch: this.config.faderA,
      phrase: this.config.faderB,
      room: this.config.faderC,
      flowOn: Boolean(context.flowOn ?? context.autoOn),
      pressureTarget: context.pressureTarget,
    });
    const autoShape = context.autoOn ? this.getAutoVariation(recipe, tickIndex) : null;
    const density = clamp01(effectiveDensity + (autoShape?.densityDelta ?? 0) + flow.densityDelta);
    const energy = clamp01(this.config.faderA + (autoShape?.energyDelta ?? 0) + flow.energyDelta);
    const nature = clamp01(this.config.faderC + (autoShape?.natureDelta ?? 0) + flow.natureDelta);

    recipe.layers.forEach((layer) => {
      if (tickIndex % layer.every !== 0) return;
      if (layer.type !== "air" && randomAt(this.config.seed + recipeHash, tickIndex, `${layer.id}:flow-rest`) < flow.restLift * 0.28) return;

      const patternPulse = Array.isArray(layer.pattern)
        ? layer.pattern[tickIndex % layer.pattern.length]
        : 1;
      const weightedChance =
        layer.probability +
        density * (layer.densityWeight ?? 0) +
        energy * (layer.energyWeight ?? 0) +
        nature * (layer.natureWeight ?? 0);
      const chance = clamp01(weightedChance * patternPulse * (1 - flow.restLift * (layer.type === "piano" ? 0.18 : 0.34)));

      if (randomAt(this.config.seed + recipeHash, tickIndex, layer.id) > chance) return;
      events.push(this.buildEvent(layer, tickIndex, { density, energy, nature, flow }));
    });

    if (grooveActive) {
      events.push(...this.buildPulseOverlay(tickIndex, { density, energy, nature, flow }));
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
      velocity: clamp01(((layer.velocity ?? 0.3) + shape.energy * (layer.type === "piano" ? 0.055 : 0.08)) * (layer.type === "piano" ? shape.flow.pianoVelocityScale : shape.flow.velocityScale)),
      filterHz: layer.filterBase ? layer.filterBase + shape.energy * (layer.filterRange ?? 0) - (shape.flow.decrescendo ? 90 : 0) : undefined,
      tone: layer.tone ?? "felt",
      rollSec: ((layer.rollMs ?? 0) / 1000) * (0.55 + shape.nature * 0.75) + shape.flow.rollLift,
      pedal: clamp01((layer.pedal ?? 0.52) + shape.nature * 0.18 + (shape.flow.decrescendo ? 0.08 : 0)),
      room: clamp01((layer.room ?? 0.48) + shape.nature * 0.16 + shape.flow.roomLift),
      depth: clamp01((layer.depth ?? 0.36) + shape.nature * 0.18 + shape.flow.roomLift * 0.58),
      offset:
        (randomAt(this.config.seed, tickIndex, `${layer.id}:humanize`) - 0.5) * (layer.humanize ?? 0) +
        ((tickIndex % 4 === 2 || tickIndex % 4 === 3) ? (layer.swingPush ?? 0) * shape.nature : 0),
    };
  }

  buildPulseOverlay(tickIndex, shape) {
    const events = [];
    const step = tickIndex % 16;
    const kickPattern = [0.46, 0, 0.02, 0, 0.08, 0, 0.2, 0, 0.26, 0, 0.04, 0, 0.08, 0.16, 0, 0.02];
    const hatPattern = [0.04, 0.2, 0.06, 0.18, 0.04, 0.22, 0.06, 0.16, 0.04, 0.24, 0.06, 0.16, 0.04, 0.2, 0.08, 0.14];
    const rootPattern = [0.16, 0, 0, 0, 0, 0, 0.08, 0, 0.1, 0, 0, 0, 0, 0.08, 0, 0];

    const pulseDensity = shape.flow.drumDensityScale;

    if (randomAt(this.config.seed, tickIndex, "pulse-kick") < clamp01(kickPattern[step] * (0.06 + shape.energy * 0.08) * pulseDensity)) {
      events.push({
        type: "kick",
        id: "pulse-kick",
        duration: "8n",
        velocity: clamp01((0.032 + shape.energy * 0.034) * shape.flow.velocityScale),
        offset: (randomAt(this.config.seed, tickIndex, "pulse-kick-offset") - 0.5) * 0.012 * shape.nature,
      });
    }

    if (randomAt(this.config.seed, tickIndex, "pulse-hat") < clamp01(hatPattern[step] * (0.08 + shape.energy * 0.08) * pulseDensity)) {
      events.push({
        type: "hat",
        id: "pulse-hat",
        duration: "32n",
        velocity: clamp01((0.012 + shape.energy * 0.014) * shape.flow.velocityScale),
        offset: 0.01 * shape.nature + (randomAt(this.config.seed, tickIndex, "pulse-hat-offset") - 0.5) * 0.014,
      });
    }

    if (randomAt(this.config.seed, tickIndex, "pulse-root") < clamp01(rootPattern[step] * (0.06 + shape.energy * 0.08) * shape.flow.bassActivity)) {
      events.push({
        type: "bass",
        id: "pulse-root",
        notes: chooseAt(["C2", "A1", "D2", "G1"], this.config.seed, Math.floor(tickIndex / 16), "pulse-root-note"),
        duration: "8n",
        velocity: clamp01((0.034 + shape.energy * 0.026) * shape.flow.bassVelocityScale),
        filterHz: 190 + shape.energy * 260,
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
const master = new Tone.Gain(0.78).connect(limiter);

const pianoRoom = new Tone.Reverb(3.4);
pianoRoom.wet.value = 0.26;
const pianoBus = new Tone.Gain(0.66).chain(pianoRoom, master);
const pianoDepthFilter = new Tone.Filter(2350, "lowpass");
const pianoDepthDelay = new Tone.FeedbackDelay({ delayTime: "16n", feedback: 0.1, wet: 0.055 });
const pianoDepthBus = new Tone.Gain(0.16).chain(pianoDepthFilter, pianoDepthDelay, master);
pianoBus.connect(pianoDepthBus);
const pianoBloomFilter = new Tone.Filter(2600, "highpass");
const pianoBloomDelay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.06, wet: 0.025 });
const pianoBloomBus = new Tone.Gain(0.04).chain(pianoBloomFilter, pianoBloomDelay, master);
pianoBus.connect(pianoBloomBus);

const pianoBodyFilter = new Tone.Filter(1050, "lowpass");
const pianoBody = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.008, decay: 1.25, sustain: 0.018, release: 2.35 },
}).chain(pianoBodyFilter, pianoBus);

const pianoBellFilter = new Tone.Filter(1750, "lowpass");
const pianoBell = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 1.04,
  modulationIndex: 0.34,
  oscillator: { type: "sine" },
  envelope: { attack: 0.004, decay: 0.18, sustain: 0, release: 0.9 },
  modulationEnvelope: { attack: 0.004, decay: 0.12, sustain: 0, release: 0.55 },
}).chain(pianoBellFilter, pianoBus);

const pianoHammerFilter = new Tone.Filter(1280, "bandpass");
const pianoHammer = new Tone.NoiseSynth({
  noise: { type: "brown" },
  envelope: { attack: 0.001, decay: 0.018, sustain: 0, release: 0.008 },
}).chain(pianoHammerFilter, pianoBus);

const leadFilter = new Tone.Filter(1400, "lowpass");
const lead = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.03, decay: 0.24, sustain: 0.16, release: 1.3 },
}).chain(leadFilter, master);

const padFilter = new Tone.Filter(720, "lowpass");
const padVerb = new Tone.Reverb(2.6);
padVerb.wet.value = 0.14;
const padBus = new Tone.Gain(0.18).chain(padVerb, master);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 0.8, decay: 0.18, sustain: 0.28, release: 2.2 },
}).chain(padFilter, padBus);

const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  filter: { type: "lowpass", rolloff: -24 },
  envelope: { attack: 0.01, decay: 0.18, sustain: 0.12, release: 0.25 },
  filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.12, release: 0.22 },
}).connect(master);

const sessionBassFilter = new Tone.Filter(380, "lowpass");
const sessionBassHighpass = new Tone.Filter(42, "highpass");
const sessionBassGlue = new Tone.Compressor({ threshold: -30, ratio: 2.2, attack: 0.035, release: 0.22 });
const sessionBassBus = new Tone.Gain(0.74).chain(sessionBassHighpass, sessionBassGlue, master);
const sessionBass = new Tone.MonoSynth({
  oscillator: { type: "triangle" },
  filter: { type: "lowpass", rolloff: -24 },
  envelope: { attack: 0.026, decay: 0.36, sustain: 0.18, release: 0.72 },
  filterEnvelope: { attack: 0.018, decay: 0.28, sustain: 0.12, release: 0.5 },
}).chain(sessionBassFilter, sessionBassBus);

const kick = new Tone.MembraneSynth({
  pitchDecay: 0.008,
  octaves: 3,
  envelope: { attack: 0.001, decay: 0.25, sustain: 0 },
}).connect(master);

const hat = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.07, sustain: 0 },
}).connect(master);

const airGain = new Tone.Gain(0.16).connect(master);
const air = new Tone.NoiseSynth({
  noise: { type: "pink" },
  envelope: { attack: 0.01, decay: 0.14, sustain: 0 },
}).connect(airGain);

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
    return { body: 0.78, bell: 0.13, hammer: 0.105, cutoff: 0.88, release: 1.04, room: 1.02, depth: 0.58, width: 0.66, bloom: 0.58 };
  }
  if (tone === "memory") {
    return { body: 0.7, bell: 0.075, hammer: 0.055, cutoff: 0.6, release: 1.22, room: 1.1, depth: 0.82, width: 0.5, bloom: 0.72 };
  }
  return { body: 0.94, bell: 0.052, hammer: 0.112, cutoff: 0.74, release: 1.12, room: 0.96, depth: 0.48, width: 0.42, bloom: 0.44 };
}

function schedulePianoEvent(event, time, velocity) {
  const notes = asNoteList(event.notes);
  if (notes.length === 0) return;

  const profile = toneProfile(event.tone);
  const roll = Math.min(0.044, Math.max(0, event.rollSec ?? 0));
  const pedal = clamp01(event.pedal ?? 0.58);
  const room = clamp01(event.room ?? 0.54);
  const baseCutoff = (event.filterHz ?? 1200) * profile.cutoff;
  const depth = clamp01(((event.depth ?? 0.38) + room * 0.3 + pedal * 0.12) * profile.depth);
  const bodyDur = pedal > 0.78 ? "2n" : event.duration;
  const bellDur = event.tone === "memory" ? "8n" : "4n";

  pianoRoom.wet.setValueAtTime(Math.min(0.42, 0.14 + room * 0.24 * profile.room), time);
  pianoBodyFilter.frequency.setValueAtTime(Math.max(420, Math.min(1900, baseCutoff)), time);
  pianoBellFilter.frequency.setValueAtTime(Math.max(900, Math.min(2800, baseCutoff * 1.46)), time);
  pianoDepthFilter.frequency.setValueAtTime(Math.max(900, Math.min(3400, baseCutoff * (1.08 + profile.width * 0.38))), time);
  pianoDepthDelay.wet.value = Math.min(0.16, 0.028 + depth * 0.12);
  pianoDepthDelay.feedback.value = Math.min(0.22, 0.07 + depth * 0.13);
  pianoBloomFilter.frequency.setValueAtTime(Math.max(1800, Math.min(4200, baseCutoff * (1.4 + profile.width * 0.32))), time);
  pianoBloomDelay.wet.value = Math.min(0.07, 0.012 + depth * profile.bloom * 0.058);
  pianoBloomDelay.feedback.value = Math.min(0.11, 0.032 + room * 0.055);

  notes.forEach((note, index) => {
    const noteTime = time + (event.offset ?? 0) + index * roll;
    const voicingTilt = notes.length > 3 ? 0.038 : 0.045;
    const noteTilt = 1 - index * voicingTilt;
    const rootWeight = index === 0 && notes.length > 1 ? (room > 0.78 ? 1.02 : 1.05) : 1;
    const upperMemory = index > 0 ? (room > 0.8 ? 1.02 : 1.06) : 0.94;
    const bodyVelocity = clamp01(velocity * profile.body * noteTilt * rootWeight);
    const bellVelocity = clamp01(velocity * profile.bell * (0.9 - index * 0.03) * upperMemory);
    const hammerVelocity = clamp01(velocity * profile.hammer * (0.9 - index * 0.06) * (room > 0.78 ? 0.82 : 1));

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
        pulseOn: Boolean(options.pulseOn ?? options.grooveOn),
        autoOn: Boolean(options.autoOn),
        flowOn: Boolean(options.flowOn ?? options.autoOn),
        pressureTarget: options.pressureTarget,
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

function previewFlow(options = {}) {
  const bars = Math.max(1, Math.min(64, Math.floor(options.bars ?? 16)));
  const startBar = Math.max(0, Math.floor(Number(options.startBar ?? options.barIndex) || 0));
  const config = buildPreviewConfig({
    referenceId: options.referenceId,
    seed: options.seed,
    faderA: options.touch ?? options.faderA,
    faderB: options.phrase ?? options.faderB,
    faderC: options.room ?? options.faderC,
  });
  const flowBars = [];

  for (let index = 0; index < bars; index += 1) {
    const barIndex = startBar + index;
    const flow = buildFlowState({
      seed: config.seed,
      referenceId: config.referenceId,
      barIndex,
      touch: config.faderA,
      phrase: config.faderB,
      room: config.faderC,
      flowOn: options.flowOn ?? true,
      pressureTarget: options.pressureTarget,
    });
    const pianoDensity = Number(clamp01(config.faderB * 0.5 + (1 - flow.restLift) * 0.28 + flow.pressure * 0.12).toFixed(4));
    const bassDensity = Number(clamp01(flow.bassActivity * (flow.decrescendo ? 0.35 : 0.78)).toFixed(4));
    const drumDensity = Number(clamp01(flow.drumDensityScale * (0.36 + config.faderB * 0.22)).toFixed(4));
    flowBars.push({
      barIndex,
      state: flow.state,
      pressure: Number(flow.pressure.toFixed(4)),
      pressureStatus: flow.pressureStatus,
      decrescendo: flow.decrescendo,
      pianoDensity,
      bassDensity,
      drumDensity,
      restLift: Number(flow.restLift.toFixed(4)),
      bassActivity: Number(flow.bassActivity.toFixed(4)),
      drumDensityScale: Number(flow.drumDensityScale.toFixed(4)),
    });
  }

  return {
    bars: flowBars,
    barCount: bars,
    config,
    pressureStatus: flowBars[0]?.pressureStatus ?? "safe",
    fingerprint: hashString(JSON.stringify(flowBars)).toString(16),
  };
}

const sessionRuntime = {
  bassOn: true,
  flowOn: false,
  bassPersona: "elasticQuiet",
  pressureTarget: "warm",
};

const SESSION_BASS_ROUTES = Object.freeze({
  "piano-jazz-chill": {
    roots: ["D2", "G1", "C2", "A1"],
    fifths: ["A2", "D2", "G2", "E2"],
    approaches: ["C#2", "F#1", "B1", "G#1"],
    ghosts: ["E2", "A1", "B1", "C#2"],
  },
  "rainy-lofi-room": {
    roots: ["E2", "A1", "D2", "G1"],
    fifths: ["B2", "E2", "A2", "D2"],
    approaches: ["D#2", "G#1", "C#2", "F#1"],
    ghosts: ["F#2", "B1", "E2", "A1"],
  },
  "soft-solo-drift": {
    roots: ["C2", "A1", "F1", "G1"],
    fifths: ["G2", "E2", "C2", "D2"],
    approaches: ["B1", "G#1", "E1", "F#1"],
    ghosts: ["D2", "B1", "A1", "C2"],
  },
});

function buildSessionBassEvents(options = {}) {
  if (options.bassOn === false) return [];
  const referenceId = CHILL_RECIPES[options.referenceId] ? options.referenceId : generator.config.referenceId;
  const route = SESSION_BASS_ROUTES[referenceId] ?? SESSION_BASS_ROUTES[DEFAULT_CONFIG.referenceId];
  const seed = normalizeSeed(options.seed ?? generator.config.seed);
  const barIndex = Math.max(0, Math.floor(Number(options.barIndex) || 0));
  const touch = clamp01(options.touch ?? options.faderA ?? generator.config.faderA);
  const phrase = clamp01(options.phrase ?? options.faderB ?? generator.config.faderB);
  const room = clamp01(options.room ?? options.faderC ?? generator.config.faderC);
  const baseTick = barIndex * 16;
  const rootIndex = barIndex % route.roots.length;
  const events = [];
  const flow = buildFlowState({
    seed,
    referenceId,
    barIndex,
    touch,
    phrase,
    room,
    flowOn: options.flowOn ?? sessionRuntime.flowOn,
    pressureTarget: options.pressureTarget ?? sessionRuntime.pressureTarget,
  });
  const rootChance = referenceId === "soft-solo-drift" ? 0.58 : 0.82;
  const roomRest = room * (referenceId === "soft-solo-drift" ? 0.34 : 0.26) + flow.restLift * 0.32;

  if (flow.decrescendo && randomAt(seed, baseTick, "session-bass-decrescendo-rest") < 0.74) {
    return [];
  }

  if (randomAt(seed, baseTick, "session-bass-root") < clamp01(rootChance + touch * 0.05 + flow.bassActivity * 0.12 - roomRest)) {
    events.push({
      type: "session-bass",
      role: "root",
      note: route.roots[rootIndex],
      beat: 0,
      duration: flow.state === "breathe" ? "1n" : room > 0.84 ? "4n" : "2n",
      velocity: Number(clamp01((0.08 + touch * 0.024 - room * 0.018) * flow.bassVelocityScale).toFixed(4)),
      filterHz: Math.round(195 + touch * 118 - room * 50 - (flow.decrescendo ? 40 : 0)),
      offset: Number(((randomAt(seed, baseTick, "session-bass-root-offset") - 0.5) * 0.018).toFixed(4)),
      persona: "elasticQuiet",
    });
  }

  const answerChance = clamp01(phrase * 0.34 + (1 - room) * 0.12 + flow.bassActivity * 0.18 - flow.restLift * 0.28 - (referenceId === "soft-solo-drift" ? 0.1 : 0));
  if (events.length < 2 && randomAt(seed, baseTick, "session-bass-answer") < answerChance) {
    const useApproach = randomAt(seed, baseTick, "session-bass-answer-kind") < phrase * 0.52;
    const useGlide = useApproach && randomAt(seed, baseTick, "session-bass-glide") < 0.42 + flow.bassActivity * 0.24;
    events.push({
      type: "session-bass",
      role: useGlide ? "glide" : useApproach ? "approach" : "fifth",
      note: useApproach ? route.approaches[rootIndex] : route.fifths[rootIndex],
      beat: useApproach ? 3.42 + randomAt(seed, baseTick, "session-bass-glide-late") * 0.14 : 2,
      duration: useGlide ? "16n" : useApproach ? "8n" : "4n",
      velocity: Number(clamp01((0.044 + touch * 0.014 + phrase * 0.01 - room * 0.015) * flow.bassVelocityScale).toFixed(4)),
      filterHz: Math.round(215 + touch * 128 - room * 38),
      offset: Number(((randomAt(seed, baseTick, "session-bass-answer-offset") - 0.5) * 0.024).toFixed(4)),
      glide: useGlide,
      persona: "elasticQuiet",
    });
  }

  const ghostChance = clamp01(phrase * 0.18 + flow.bassActivity * 0.22 - room * 0.16 - flow.restLift * 0.2);
  if (events.length < 3 && randomAt(seed, baseTick, "session-bass-ghost") < ghostChance) {
    events.push({
      type: "session-bass",
      role: "ghost",
      note: route.ghosts[rootIndex],
      beat: randomAt(seed, baseTick, "session-bass-ghost-beat") < 0.5 ? 1.62 : 2.72,
      duration: "16n",
      velocity: Number(clamp01((0.024 + phrase * 0.012) * flow.bassVelocityScale).toFixed(4)),
      filterHz: Math.round(225 + touch * 80 - room * 44),
      offset: Number(((randomAt(seed, baseTick, "session-bass-ghost-offset") - 0.5) * 0.03).toFixed(4)),
      persona: "elasticQuiet",
    });
  }

  return events.slice(0, 3);
}

function previewBassBar(options = {}) {
  const events = buildSessionBassEvents({
    bassOn: options.bassOn ?? true,
    referenceId: options.referenceId,
    seed: options.seed,
    barIndex: options.barIndex,
    touch: options.touch,
    phrase: options.phrase,
    room: options.room,
    flowOn: options.flowOn,
    pressureTarget: options.pressureTarget,
  });
  return {
    barIndex: Math.max(0, Math.floor(Number(options.barIndex) || 0)),
    referenceId: CHILL_RECIPES[options.referenceId] ? options.referenceId : generator.config.referenceId,
    eventCount: events.length,
    fingerprint: hashString(JSON.stringify(events)).toString(16),
    bassPersona: "elasticQuiet",
    events,
  };
}

function scheduleSessionBassBar(options = {}) {
  if (options.bassOn === false || !sessionRuntime.bassOn) {
    return { scheduled: false, reason: "bass-off", eventCount: 0, events: [] };
  }
  if (runtimeHealth.quiet) {
    return { scheduled: false, reason: "quiet-mode", eventCount: 0, events: [] };
  }

  const bpm = Math.max(54, Math.min(120, Number(options.bpm) || Tone.Transport.bpm.value || 72));
  const beatSec = 60 / bpm;
  const startTime = Number.isFinite(options.startTime) ? options.startTime : Tone.now();
  const preview = previewBassBar({
    ...options,
    bassOn: true,
  });

  preview.events.forEach((event) => {
    const eventTime = startTime + event.beat * beatSec + event.offset;
    sessionBassFilter.frequency.setValueAtTime(Math.max(115, Math.min(470, event.filterHz)), eventTime);
    if ("portamento" in sessionBass) sessionBass.portamento = event.glide ? 0.055 : event.role === "root" ? 0.022 : 0.016;
    sessionBass.triggerAttackRelease(event.note, event.duration, eventTime, event.velocity);
  });

  return {
    scheduled: preview.events.length > 0,
    reason: preview.events.length > 0 ? "scheduled" : "rest",
    eventCount: preview.events.length,
    events: preview.events,
    fingerprint: preview.fingerprint,
  };
}

function isNativeAudioContext(value) {
  return !!(
    value &&
    typeof value.createGain === "function" &&
    typeof value.createDynamicsCompressor === "function"
  );
}

function getToneAudioContext() {
  const context = typeof Tone.getContext === "function" ? Tone.getContext() : Tone.context;
  const candidates = [
    context?.rawContext,
    context?._context?.rawContext,
    context?._context,
    context?.context?.rawContext,
    context?.context,
    Tone.context?.rawContext,
    Tone.context?._context?.rawContext,
    Tone.context?._context,
    context,
  ];
  return candidates.find(isNativeAudioContext) || null;
}

function setSessionState(options = {}) {
  if (typeof options.bassOn === "boolean") sessionRuntime.bassOn = options.bassOn;
  if (typeof options.flowOn === "boolean") sessionRuntime.flowOn = options.flowOn;
  if (options.bassPersona === "elasticQuiet") sessionRuntime.bassPersona = options.bassPersona;
  if (["safe", "warm", "full"].includes(options.pressureTarget)) sessionRuntime.pressureTarget = options.pressureTarget;
  if (Number.isFinite(options.seed)) generator.setSeed(options.seed);
  if (options.referenceId && CHILL_RECIPES[options.referenceId]) generator.setReference(options.referenceId);
  const nextA = options.touch ?? options.faderA ?? generator.config.faderA;
  const nextB = options.phrase ?? options.faderB ?? generator.config.faderB;
  const nextC = options.room ?? options.faderC ?? generator.config.faderC;
  generator.applyFaderState(nextA, nextB, nextC);
  const bpm = Number(options.bpm);
  if (Number.isFinite(bpm)) Tone.Transport.bpm.rampTo(Math.max(54, Math.min(120, bpm)), 0.2);
  syncControlsFromConfig();
  updateUi();
  const flow = previewFlow({
    bars: 1,
    referenceId: generator.config.referenceId,
    seed: generator.config.seed,
    touch: generator.config.faderA,
    phrase: generator.config.faderB,
    room: generator.config.faderC,
    flowOn: sessionRuntime.flowOn,
    pressureTarget: sessionRuntime.pressureTarget,
  }).bars[0];
  return {
    ...generator.config,
    bassOn: sessionRuntime.bassOn,
    flowOn: sessionRuntime.flowOn,
    bassPersona: sessionRuntime.bassPersona,
    pressureTarget: sessionRuntime.pressureTarget,
    flow,
    bpm: Tone.Transport.bpm.value,
  };
}

function scheduleSessionTick(options = {}) {
  const events = generator.onTick({
    tickIndex: Number.isFinite(options.tickIndex) ? options.tickIndex : transportStep,
    pulseOn: Boolean(options.pulseOn ?? options.grooveOn),
    autoOn: Boolean(options.autoOn),
    flowOn: Boolean(options.flowOn ?? options.autoOn ?? sessionRuntime.flowOn),
    pressureTarget: options.pressureTarget ?? sessionRuntime.pressureTarget,
    quiet: runtimeHealth.quiet,
  });
  const time = Number.isFinite(options.time) ? options.time : Tone.now();
  events.forEach((event) => scheduleEvent(event, time));
  return events;
}

function panicSession() {
  Tone.Transport.stop();
  try {
    sessionBass.triggerRelease(Tone.now());
  } catch (error) {
    console.warn("session bass release failed", error);
  }
  runtimeHealth.quiet = true;
  runtimeHealth.recoverAt = performance.now() + 3200;
  master.gain.rampTo(0.04, 0.35);
  updateUi();
  return { quiet: runtimeHealth.quiet, status: runtimeHealth.lastScheduleResult };
}

const chillAdapter = {
  STORAGE_KEYS,
  recipes: CHILL_RECIPES,
  intentToFaders,
  schedule: scheduleEvent,
  diagnostics: {
    previewEventStream,
    runDeterminismCheck,
    previewFlow,
  },
  session: {
    getAudioContext: getToneAudioContext,
    scheduleTick: scheduleSessionTick,
    scheduleBassBar: scheduleSessionBassBar,
    setSessionState,
    previewBassBar,
    previewFlow,
    panic: panicSession,
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
    pulseOn: grooveOn,
    grooveOn,
    autoOn,
    flowOn: autoOn,
    pressureTarget: sessionRuntime.pressureTarget,
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
  ui.modeLabel.textContent = grooveOn ? "pulse" : generator.config.mode;
  ui.guardLabel.textContent = runtimeHealth.quiet ? "quiet" : "stable";
  ui.acidBtn.textContent = grooveOn ? "PULSE ON" : "PULSE";
  ui.autoBtn.textContent = autoOn ? "AUTO ON" : "AUTO";
  ui.acidBtn.setAttribute("aria-pressed", String(grooveOn));
  ui.autoBtn.setAttribute("aria-pressed", String(autoOn));
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
  const flow = buildFlowState({
    seed: generator.config.seed,
    referenceId: recipe.id,
    barIndex: autoStep,
    touch: generator.config.faderA,
    phrase: generator.config.faderB,
    room: generator.config.faderC,
    flowOn: true,
    pressureTarget: sessionRuntime.pressureTarget,
  });
  const jitterA = (randomAt(generator.config.seed, autoStep, "auto-a") - 0.5) * 0.028;
  const jitterB = (randomAt(generator.config.seed, autoStep, "auto-b") - 0.5) * 0.032;
  const jitterC = (randomAt(generator.config.seed, autoStep, "auto-c") - 0.5) * 0.03;
  const pulseLift = flow.state === "lift" ? 0.018 : flow.state === "decrescendo" ? -0.02 : 0;

  const nextA = generator.config.faderA + (target.faderA - generator.config.faderA) * 0.08 + jitterA + pulseLift;
  const nextB = generator.config.faderB + (target.faderB - generator.config.faderB) * 0.08 + jitterB + pulseLift * 0.32 - flow.restLift * 0.028;
  const nextC = generator.config.faderC + (target.faderC - generator.config.faderC) * 0.1 + jitterC + flow.roomLift * 0.12;
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
