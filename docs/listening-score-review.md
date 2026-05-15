# Chill Listening Score Review

## Purpose

Use this guide when reviewing `chill` as a quiet piano / trio listening surface.

The review goal is to decide whether a small future PR should improve docs,
recipe export confidence, or a tiny quiet-music parameter. It is not a
reactivation decision and it is not a Music integration decision.

## Source surface

- Local / Pages surface: `session.html`
- Runtime snapshot: `window.chillTrioSession.snapshot()`
- Local metadata key: `chill:listening-score:v1`
- Recipe export reference: `exports/chill-piano-recipe.json`

The score stores local metadata only. It must not store audio, samples,
microphone input, copied motifs, external analytics, or raw performance capture.
Music SYNC also stays metadata-only on this path: it can shape the session
posture, but playback still waits for a human `START`.

## Review flow

1. Open `session.html`.
2. Start with `START` only and listen for a short quiet pass.
3. Add `BASS` only if the piano feels too weightless.
4. Add `AUTO` only to test flow shaping, breath, and decrescendo.
5. Add `DRUMS` only as an optional soft pocket check.
6. Save a local listening score.
7. Use the saved score and snapshot as context for the next small PR.

## Score axes

| Axis | Listen for | Good signal | Watch for |
| --- | --- | --- | --- |
| `flow` | Does the trio breathe naturally? | settle / breathe / lift / recover feels quiet and continuous | stiff loops, abrupt sections, stuck flow |
| `dynamics` | Does loudness stay comfortable? | controlled felt attack, soft decrescendo, no hard jumps | flatness, harsh attacks, loudness creep |
| `bass` | Does BASS support the piano? | elastic roots, fifths, approaches, and glides stay behind the piano | lead-bass behavior, busy low end, dull root-only movement |
| `fatigue` | Can this stay on in the background? | long rests, low density, low irritation | repeated motif, too much melody, rhythm becoming the point |
| `mastering` | Did the browser mastering lift stay quiet enough? | clearer piano without pushing the room forward | harsh attack, loudness creep, background fatigue |

## Recipe export check

Use `exports/chill-piano-recipe.json` as a read-only reference for whether the
current recipe vocabulary still matches the listening surface.

Expected posture:

- `piano-jazz-chill` remains the default quiet room piano identity.
- `soft-melody-piano` stays behind the main runtime.
- Runtime recipes are the four `engine.js` references; `midnight-whisper` and
  `morning-light` in the export are supplemental portable references until a
  separate task promotes them.
- Recipe export is portable reference material, not an instruction to fold
  `chill` into `Music`.
- Any future re-export or script run needs a separate task envelope.

## Next PR decision

After one listening pass, choose exactly one:

- docs refinement if the session behavior is good but hard to explain
- recipe export validation if the recipe reference may be stale
- tiny quiet-parameter tuning only if a specific listening-score failure repeats
- hold if the repo still feels like reference/regrowth rather than active work

## Human gates

- Before intentional reactivation.
- Before folding any identity into `Music`.
- Before changing recipe defaults.
- Before adding dependencies, assets, samples, workflows, or audio export.
- Before treating `DRUMS` as the main rhythm surface.
