const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const RECIPE_IDS = [
  "piano-jazz-chill",
  "rainy-lofi-room",
  "soft-solo-drift",
  "soft-melody-piano",
];

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
    recipes: RECIPE_IDS.map((id) => {
      if (!recipes[id]) throw new Error(`missing recipe: ${id}`);
      return exportRecipe(recipes[id]);
    }),
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
}

main();
