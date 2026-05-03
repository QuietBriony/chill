const SESSION_BPM = 72;
const DRUM_PROFILE = "nerdy_jazzy_hiphop";
const DRUM_FRAME = "jazzy_ghost_glue";
const DRUM_KIT = "hard_bop_room";

const refs = {
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  drumsBtn: document.getElementById("acidBtn"),
  bassBtn: document.getElementById("bassBtn"),
  autoBtn: document.getElementById("autoBtn"),
  panicBtn: document.getElementById("panicBtn"),
  seedBtn: document.getElementById("seedBtn"),
  energy: document.getElementById("energy"),
  creation: document.getElementById("creation"),
  nature: document.getElementById("nature"),
  referenceSelect: document.getElementById("referenceSelect"),
  sessionStatus: document.getElementById("sessionStatus"),
  bassStatus: document.getElementById("bassStatus"),
  drumStatus: document.getElementById("drumStatus"),
  sessionBar: document.getElementById("sessionBar"),
};

let drumAdapter = null;
let drumLoop = null;
let drumBar = 0;
let drumsOn = false;
let bassOn = true;
let sessionAuto = false;
let drumLoadStarted = false;
let lastBassEventCount = 0;

const originalStart = refs.startBtn.onclick;
const originalStop = refs.stopBtn.onclick;
const originalAuto = refs.autoBtn.onclick;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function currentSeed() {
  return window.chillAdapter?.getRuntimeConfig?.().seed ?? 240424;
}

function sessionBasePath() {
  if (window.location.hostname.endsWith("github.io")) return "/drum-floor/";
  return "../drum-floor/";
}

function setText(node, text) {
  if (node) node.textContent = text;
}

function updateSessionUi() {
  refs.drumsBtn.textContent = drumsOn ? "DRUMS ON" : "DRUMS";
  refs.drumsBtn.setAttribute("aria-pressed", String(drumsOn));
  refs.drumsBtn.classList.toggle("is-active", drumsOn);
  refs.bassBtn.textContent = bassOn ? "BASS ON" : "BASS";
  refs.bassBtn.setAttribute("aria-pressed", String(bassOn));
  refs.bassBtn.classList.toggle("is-active", bassOn);
  refs.autoBtn.textContent = sessionAuto ? "AUTO ON" : "AUTO";
  refs.autoBtn.setAttribute("aria-pressed", String(sessionAuto));
  setText(refs.sessionBar, `bar ${drumBar}`);
  if (!bassOn) setText(refs.bassStatus, "bass off");
  if (!drumAdapter && drumLoadStarted) setText(refs.drumStatus, "drums unavailable");
}

function sessionShape(barIndex = drumBar) {
  const touch = Number(refs.energy.value);
  const phrase = Number(refs.creation.value);
  const room = Number(refs.nature.value);
  const autoWave = sessionAuto ? Math.sin((barIndex + currentSeed() % 17) * 0.41) : 0;
  const autoLift = sessionAuto ? Math.max(0, autoWave) : 0;
  const bassSpace = bassOn ? 1 + Math.min(1, lastBassEventCount) * 0.35 : 0;
  const density = clamp(12 + phrase * 20 + touch * 8 - room * 8 + autoLift * 4 - bassSpace * 3, 8, 36);
  const energy = clamp(16 + touch * 24 + autoLift * 3 - bassSpace * 2, 14, 42);
  const space = clamp(68 + room * 24 - phrase * 8 - autoLift * 4 + bassSpace * 3, 58, 94);
  const humanize = clamp(56 + room * 20 + phrase * 4, 48, 82);
  const swing = clamp(8 + room * 4 + phrase * 2, 7, 14);
  const fillDemand = clamp(2 + phrase * 10 - room * 5 + autoLift * 2, 0, 12);

  return {
    bpm: SESSION_BPM,
    seed: currentSeed(),
    profileId: DRUM_PROFILE,
    frameId: room > 0.84 ? "deep_neo_soul_pocket" : DRUM_FRAME,
    kit: DRUM_KIT,
    energy,
    density,
    swing,
    humanize,
    space,
    section: "verse",
    fillDemand,
    crashGate: false,
  };
}

async function ensureDrums() {
  if (drumAdapter) return drumAdapter;
  if (drumLoadStarted) return null;
  drumLoadStarted = true;
  setText(refs.drumStatus, "drums loading");

  try {
    const module = await import(`${sessionBasePath()}src/session-adapter.js`);
    const audioContext = window.chillAdapter?.session?.getAudioContext?.() ?? null;
    drumAdapter = module.createDrumFloorSessionAdapter({
      basePath: sessionBasePath(),
      audioContext,
      gain: 0.13,
    });
    drumAdapter.setSession(sessionShape(0));
    await drumAdapter.load();
    setText(refs.drumStatus, "soft pocket ready");
    return drumAdapter;
  } catch (error) {
    console.warn("[chill session] drum-floor unavailable", error);
    setText(refs.drumStatus, "drums unavailable");
    drumsOn = false;
    drumLoadStarted = false;
    updateSessionUi();
    return null;
  }
}

function syncSessionState() {
  const touch = Number(refs.energy.value);
  const phrase = Number(refs.creation.value);
  const room = Number(refs.nature.value);
  window.chillAdapter?.session?.setSessionState?.({
    bpm: SESSION_BPM,
    seed: currentSeed(),
    referenceId: refs.referenceSelect.value || "piano-jazz-chill",
    touch,
    phrase,
    room,
    bassOn,
  });
  if (drumAdapter) drumAdapter.setSession(sessionShape());
}

function ensureDrumLoop() {
  if (drumLoop) return drumLoop;
  drumLoop = new Tone.Loop((time) => {
  if (bassOn) {
      const bassResult = window.chillAdapter?.session?.scheduleBassBar?.({
        bpm: SESSION_BPM,
        seed: currentSeed(),
        referenceId: refs.referenceSelect.value || "piano-jazz-chill",
        barIndex: drumBar,
        touch: Number(refs.energy.value),
        phrase: Number(refs.creation.value),
        room: Number(refs.nature.value),
        bassOn,
        startTime: time,
      });
      lastBassEventCount = bassResult?.eventCount ?? 0;
      const firstBass = bassResult?.events?.[0];
      setText(refs.bassStatus, firstBass ? `bass ${firstBass.note}` : "bass rest");
    } else {
      lastBassEventCount = 0;
    }

    if (!drumsOn || !drumAdapter) return;
    drumAdapter.setSession(sessionShape(drumBar));
    const result = drumAdapter.scheduleBar({ barIndex: drumBar, startTime: time });
    if (!result.scheduled) {
      drumsOn = false;
      setText(refs.drumStatus, `drums stopped: ${result.reason}`);
    } else {
      setText(refs.drumStatus, "soft pocket playing");
    }
    drumBar += 1;
    updateSessionUi();
  }, "1m");
  return drumLoop;
}

refs.startBtn.onclick = async (event) => {
  syncSessionState();
  await ensureDrums();
  const loop = ensureDrumLoop();
  loop.stop(0);
  loop.start(0);
  if (drumAdapter) {
    try {
      await drumAdapter.start();
    } catch (error) {
      console.warn("[chill session] drum start failed; piano will continue", error);
      drumsOn = false;
      setText(refs.drumStatus, "drums unavailable");
    }
  }
  await originalStart?.call(refs.startBtn, event);
  setText(refs.sessionStatus, "session playing");
  updateSessionUi();
};

refs.stopBtn.onclick = (event) => {
  originalStop?.call(refs.stopBtn, event);
  if (drumLoop) drumLoop.stop(0);
  if (drumAdapter) drumAdapter.stop();
  setText(refs.sessionStatus, "session stopped");
  setText(refs.drumStatus, drumsOn ? "soft pocket paused" : "drums off");
  updateSessionUi();
};

refs.drumsBtn.onclick = async () => {
  drumsOn = !drumsOn;
  if (drumsOn) await ensureDrums();
  setText(refs.drumStatus, drumsOn ? "soft pocket armed" : "drums off");
  updateSessionUi();
};

refs.bassBtn.onclick = () => {
  bassOn = !bassOn;
  lastBassEventCount = 0;
  setText(refs.bassStatus, bassOn ? "bass armed" : "bass off");
  syncSessionState();
  updateSessionUi();
};

refs.autoBtn.onclick = (event) => {
  sessionAuto = !sessionAuto;
  originalAuto?.call(refs.autoBtn, event);
  setText(refs.sessionStatus, sessionAuto ? "auto drift armed" : "manual session");
  updateSessionUi();
};

refs.panicBtn.onclick = () => {
  if (drumLoop) drumLoop.stop(0);
  if (drumAdapter) drumAdapter.panic();
  window.chillAdapter?.session?.panic?.();
  drumsOn = false;
  bassOn = false;
  lastBassEventCount = 0;
  setText(refs.sessionStatus, "panic quiet");
  setText(refs.bassStatus, "bass quiet");
  setText(refs.drumStatus, "drums quiet");
  updateSessionUi();
};

refs.seedBtn.addEventListener("click", () => {
  window.setTimeout(() => {
    drumBar = 0;
    syncSessionState();
    updateSessionUi();
  }, 0);
});

[refs.energy, refs.creation, refs.nature, refs.referenceSelect].forEach((input) => {
  input.addEventListener("input", syncSessionState);
  input.addEventListener("change", syncSessionState);
});

syncSessionState();
ensureDrums();
updateSessionUi();
