const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const RECIPE_IDS = [
  "piano-jazz-chill",
  "rainy-lofi-room",
  "soft-solo-drift",
  "soft-melody-piano",
];

const SUPPLEMENTAL_RECIPES = Object.freeze([
  {
    id: "midnight-whisper",
    label: "Midnight Whisper",
    bpm: 56,
    swing: 0.02,
    layers: [
      {
        id: "midnight-memory-chords",
        type: "piano",
        tone: "memory",
        notes: [
          ["D2", "A2", "C3", "F3"],
          ["G2", "D3", "F3", "A3"],
          ["C2", "G2", "B2", "E3"],
          ["A1", "E2", "G2", "C3"],
        ],
        pattern: [0.6, 0, 0, 0, 0, 0, 0.24, 0, 0, 0, 0.42, 0, 0, 0, 0, 0],
        duration: "2n",
        velocity: 0.1,
        every: 2,
        probability: 0.58,
        humanize: 0.034,
        swingPush: 0.008,
        pedal: 0.78,
        room: 0.66,
        densityWeight: 0.34,
      },
      {
        id: "midnight-soft-answer",
        type: "piano",
        tone: "felt",
        notes: [
          ["F3", "A3"],
          ["E3", "G3"],
          ["C3", "D3"],
          ["A2", "C3"],
        ],
        pattern: [0, 0, 0.22, 0, 0, 0, 0, 0, 0, 0.18, 0, 0, 0, 0, 0.2, 0],
        duration: "4n",
        velocity: 0.075,
        every: 4,
        probability: 0.32,
        humanize: 0.041,
        swingPush: 0.004,
        pedal: 0.64,
        room: 0.72,
        densityWeight: 0.18,
      },
      {
        id: "midnight-low-anchor",
        type: "piano",
        tone: "memory",
        notes: [
          ["D2"],
          ["A1"],
          ["G1"],
          ["C2"],
        ],
        pattern: [0.36, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0],
        duration: "1n",
        velocity: 0.065,
        every: 4,
        probability: 0.28,
        humanize: 0.038,
        swingPush: 0,
        pedal: 0.82,
        room: 0.7,
        densityWeight: 0.12,
      },
    ],
    defaultFaders: {
      faderA: 0.22,
      faderB: 0.18,
      faderC: 0.82,
    },
    transitionRules: {
      maxDensity: 0.34,
      quietOnLateTicks: true,
    },
  },
  {
    id: "morning-light",
    label: "Morning Light",
    bpm: 76,
    swing: 0.06,
    layers: [
      {
        id: "morning-glass-chords",
        type: "piano",
        tone: "glass",
        notes: [
          ["A3", "E4", "G4", "B4"],
          ["D4", "F4", "A4", "C5"],
          ["E3", "B3", "D4", "F4"],
          ["G3", "C4", "E4", "A4"],
        ],
        pattern: [0.85, 0, 0.4, 0, 0.3, 0, 0.5, 0],
        duration: "4n",
        velocity: 0.18,
        every: 1,
        probability: 0.78,
        humanize: 0.022,
        swingPush: 0.018,
        pedal: 0.52,
        room: 0.48,
        densityWeight: 0.54,
      },
      {
        id: "morning-dorian-response",
        type: "piano",
        tone: "felt",
        notes: [
          ["B4", "C5"],
          ["E4", "G4"],
          ["A4", "B4"],
          ["F4", "E4"],
        ],
        pattern: [0, 0.28, 0, 0, 0.36, 0, 0, 0.24],
        duration: "8n",
        velocity: 0.125,
        every: 2,
        probability: 0.5,
        humanize: 0.026,
        swingPush: 0.024,
        pedal: 0.42,
        room: 0.42,
        densityWeight: 0.28,
      },
      {
        id: "morning-left-hand",
        type: "piano",
        tone: "felt",
        notes: [
          ["A2", "E3"],
          ["D3", "A3"],
          ["G2", "D3"],
          ["E2", "B2"],
        ],
        pattern: [0.42, 0, 0, 0.2, 0, 0, 0.34, 0],
        duration: "2n",
        velocity: 0.115,
        every: 2,
        probability: 0.56,
        humanize: 0.024,
        swingPush: 0.012,
        pedal: 0.56,
        room: 0.46,
        densityWeight: 0.24,
      },
    ],
    defaultFaders: {
      faderA: 0.48,
      faderB: 0.42,
      faderC: 0.46,
    },
    transitionRules: {
      maxDensity: 0.62,
      quietOnLateTicks: true,
    },
  },
]);

const DEFAULT_FADERS = Object.freeze({
  faderA: 0,
  faderB: 0,
  faderC: 0,
});

const repoRoot = path.resolve(__dirname, "..");
const enginePath = path.join(repoRoot, "engine.js");
const outputPath = path.join(repoRoot, "exports", "chill-piano-recipe.json");

function extractObjectLiteral(source) {
  const marker = "const CHILL_RECIPES = Object.freeze(";
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error("CHILL_RECIPES marker not found");

  const objectStart = source.indexOf("{", markerIndex);
  if (objectStart < 0) throw new Error("CHILL_RECIPES object start not found");

  let depth = 0;
  let inString = false;
  let quote = "";
  let escape = false;

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(objectStart, index + 1);
  }

  throw new Error("CHILL_RECIPES object end not found");
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function exportLayer(layer) {
  return {
    id: layer.id,
    type: layer.type,
    tone: layer.tone ?? "felt",
    notes: clone(layer.notes ?? []),
    pattern: clone(layer.pattern ?? []),
    duration: clone(layer.duration ?? null),
    velocity: layer.velocity ?? 0,
    every: layer.every,
    probability: layer.probability,
    humanize: layer.humanize ?? 0,
    swingPush: layer.swingPush ?? 0,
    pedal: layer.pedal ?? 0,
    room: layer.room ?? 0,
    densityWeight: layer.densityWeight ?? 0,
  };
}

function exportRecipe(recipe) {
  return {
    id: recipe.id,
    label: recipe.label || recipe.id,
    bpm: recipe.bpm,
    swing: recipe.swing,
    layers: recipe.layers.map(exportLayer),
    defaultFaders: {
      faderA: recipe.defaultFaders?.faderA ?? DEFAULT_FADERS.faderA,
      faderB: recipe.defaultFaders?.faderB ?? DEFAULT_FADERS.faderB,
      faderC: recipe.defaultFaders?.faderC ?? DEFAULT_FADERS.faderC,
    },
    transitionRules: {
      maxDensity: recipe.transitionRules?.maxDensity,
      quietOnLateTicks: recipe.transitionRules?.quietOnLateTicks,
    },
  };
}

function main() {
  const source = fs.readFileSync(enginePath, "utf8");
  const literal = extractObjectLiteral(source);
  const recipes = vm.runInNewContext(`(${literal})`, Object.create(null), {
    filename: enginePath,
  });

  // Exported from chill:CHILL_RECIPES. Suitable for Tone.js PolySynth voicing.
  const output = {
    version: 1,
    format: "chill-piano-recipe",
    recipes: [
      ...RECIPE_IDS.map((id) => {
        if (!recipes[id]) throw new Error(`missing recipe: ${id}`);
        return exportRecipe(recipes[id]);
      }),
      ...SUPPLEMENTAL_RECIPES.map(exportRecipe),
    ],
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
}

main();
