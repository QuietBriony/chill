# chill

# Status

This repository is no longer the primary active music runtime.

Current direction:
- Experimental / edge generative rig: QuietBriony/Music
- Public-friendly ambient player: QuietBriony/namima
- Band groove generator: QuietBriony/drum-floor

This repository is kept as a reference/archive candidate until useful ideas are harvested.

- Do not add audio files or samples
- Do not add dependencies
- Do not add GitHub Actions
- Do not use this repo as the main runtime unless reactivated intentionally

# Regrowth candidate

This repo now contains a lightweight browser-only re-growth candidate for harvesting useful ideas back into the Music stack.

Implemented direction:
- Reference-driven recipes from Music-style generative research
- Public-friendly interaction shape from namima
- Guarded degradation / quiet recovery rules from drum-floor
- 3-fader identity preserved as Energy / Creation / Nature
- ACID and AUTO preserved as edge injection and deterministic drift

Public runtime contracts:
- `ChillRuntimeConfig`
- `ChillRecipe`
- `ChillGenerator`
- `window.chillAdapter`

Fixed storage keys:
- `chill:session:v1`
- `chill:recipe:v1`
- `chill:lastSeed`

Acceptance gates before intentional reactivation:
- Same `seed` + same `referenceId` should produce the same event stream for the same fader state.
- Fader changes should affect density / timbre within the next scheduler ticks.
- Audio errors, late ticks, or memory pressure should enter quiet recovery rather than hard failing.
- iOS Safari start must stay tied to a user gesture.
- Five-minute playback should not require adding new assets, samples, dependencies, or workflows.
