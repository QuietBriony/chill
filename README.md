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

Primary direction:
- Listening-first piano jazz chill / lofi ambient radio
- Safe long-form background listening
- Warm piano-like tone, jazz voicing, loose hip-hop pulse, soft ambient bed, small mutation
- Artist references must be translated into production parameters, never copied as songs, phrases, samples, or grooves

Implemented direction:
- Reference-driven recipes from Music-style generative research
- Public-friendly interaction shape from namima
- Guarded degradation / quiet recovery rules from drum-floor
- 3-fader identity preserved as Energy / Creation / Nature
- GROOVE and AUTO preserved as low-density pulse injection and deterministic room drift

3-fader meaning:
- `Energy`: pulse / brightness / chord attack
- `Creation`: melodic fragment probability / voicing variation
- `Nature`: looseness / room / tape drift / rest

Current recipes:
- `piano-jazz-chill`
- `rainy-lofi-room`
- `soft-solo-drift`

Stack separation:
- `Music`: experimental / edge reference-driven rig
- `namima`: visual / touch / water ambient player
- `drum-floor`: groove grammar and stage safety reference
- `chill`: listening-first piano jazz chill radio candidate

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
- Fader changes should affect pulse / voicing / room drift within the next scheduler ticks.
- Audio errors, late ticks, or memory pressure should enter quiet recovery rather than hard failing.
- iOS Safari start must stay tied to a user gesture.
- Ten-minute playback should not require adding new assets, samples, dependencies, or workflows.
- `Energy` must not act as a direct loudness boost.
- `Creation` must not make melody the foreground for too long.
- `Nature` should increase rest, looseness, and room feel.
