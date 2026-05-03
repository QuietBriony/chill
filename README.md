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
- Listening-first quiet piano radio
- Safe long-form background listening
- Warm piano-like tone, real-feeling jazz voicing, optional loose hip-hop pulse, small mutation
- Piano is synthetic / felt-like, not sampled.
- Artist references must be translated into production parameters, never copied as songs, phrases, samples, or grooves
- The default sound should be piano chord + rest, not a continuous pad bed.

Implemented direction:
- Reference-driven recipes from Music-style generative research
- Public-friendly interaction shape from namima
- Guarded degradation / quiet recovery rules from drum-floor
- 3-fader identity retuned as Touch / Phrase / Room
- PULSE and AUTO preserved as low-density rhythm injection and deterministic room drift

3-fader meaning:
- `Touch`: hammer contour / brightness / chord attack
- `Phrase`: short answers / voicing variation
- `Room`: looseness / room / rest

Current recipes:
- `piano-jazz-chill` (`Quiet Piano`): quiet room chords, long rests, felt-like synthetic piano
- `rainy-lofi-room` (`Glass Piano`): transparent add/sus voicing, cool room, reduced air
- `soft-solo-drift` (`Memory Piano`): distant memory piano, rare strange repeats, no aggressive rhythm
- `soft-melody-piano` (`Soft Melody`): soft piano answers and memory dots, still low-density and behind the main runtime

Button meaning:
- `PULSE`: optional soft kick / hat / bass floor under the piano. It is off by default and should not become the main feature.
- `AUTO`: slow changes to voicing, rest, and room. It should not suddenly turn the radio into a different track.
- `BASS` on the session page is a sparse synthetic upright-ish root/fifth layer hosted by `chill`, not `Music` or `drum-floor`.

Stack separation:
- `Music`: experimental / edge reference-driven rig
- `namima`: visual / touch / water ambient player
- `drum-floor`: groove grammar and stage safety reference
- `chill`: listening-first piano jazz chill radio candidate

Live preview:
- GitHub Pages: https://quietbriony.github.io/chill/
- Quiet Piano Trio session: https://quietbriony.github.io/chill/session.html
- Pages source: `main` branch, repository root.

Quiet Piano Trio session:
- `BASS`: sparse synthetic upright-ish roots/fifths hosted by `chill`.
- `DRUMS`: optional drum-floor soft pocket bars.
- `AUTO`: slow piano room / drum space drift without changing the track identity.

Public runtime contracts:
- `ChillRuntimeConfig`
- `ChillRecipe`
- `ChillGenerator`
- `window.chillAdapter`
- `window.chillAdapter.diagnostics.previewEventStream()`
- `window.chillAdapter.diagnostics.runDeterminismCheck()`

Fixed storage keys:
- `chill:session:v1`
- `chill:recipe:v1`
- `chill:lastSeed`

Acceptance gates before intentional reactivation:
- Same `seed` + same `referenceId` should produce the same event stream for the same fader state.
- `window.chillAdapter.diagnostics.runDeterminismCheck()` should pass for the default 16-bar preview.
- Default `piano-jazz-chill` preview should prioritize piano chord events and normally produce no kick/hat/pad/air unless PULSE is enabled.
- Fader changes should affect touch / voicing / room drift within the next scheduler ticks.
- Audio errors, late ticks, or memory pressure should enter quiet recovery rather than hard failing.
- iOS Safari start must stay tied to a user gesture.
- Ten-minute playback should not require adding new assets, samples, dependencies, or workflows.
- `Touch` must not act as a direct loudness boost.
- `Phrase` must not make melody the foreground for too long.
- `Room` should increase rest, looseness, and room feel.
