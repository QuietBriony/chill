const SESSION_BPM = 72;
const DRUM_ADAPTER_VERSION = "20260503-base-path";
const DRUM_PROFILE = "nerdy_jazzy_hiphop";
const DRUM_FRAME = "jazzy_ghost_glue";
const DRUM_KIT = "hard_bop_room";
const LISTENING_SCORE_KEY = "chill:listening-score:v1";
const DEFAULT_PRESSURE_TARGET = "warm";
const BASS_PERSONA = "elasticQuiet";
const MUSIC_STACK_PACKET_STORAGE_KEY = "qb:music-stack:latest-packet:v1";
const MUSIC_STACK_CHANNEL_NAME = "qb:music-stack:v1";
const CHILL_REFERENCE_IDS = ["piano-jazz-chill", "rainy-lofi-room", "soft-solo-drift", "soft-melody-piano"];
const CHILL_REFERENCE_LABELS = {
  "piano-jazz-chill": "Quiet Piano",
  "rainy-lofi-room": "Glass Room",
  "soft-solo-drift": "Memory Piano",
  "soft-melody-piano": "Soft Melody"
};

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
  flowStatus: document.getElementById("flowStatus"),
  pressureStatus: document.getElementById("pressureStatus"),
  scoreFlow: document.getElementById("scoreFlow"),
  scoreDynamics: document.getElementById("scoreDynamics"),
  scoreBass: document.getElementById("scoreBass"),
  scoreFatigue: document.getElementById("scoreFatigue"),
  scoreNotes: document.getElementById("scoreNotes"),
  scoreSaveBtn: document.getElementById("scoreSaveBtn"),
  scoreStatus: document.getElementById("scoreStatus"),
};

let drumAdapter = null;
let drumLoop = null;
let drumBar = 0;
let drumsOn = false;
let drumSuggested = false;
let bassOn = true;
let sessionAuto = false;
let drumLoadStarted = false;
let drumLoadPromise = null;
let lastBassEventCount = 0;
let lastFlowSnapshot = null;
let lastMixMeter = null;
let lastMusicSessionPacket = null;
let lastMusicSessionTranslation = null;
let sessionPressureTarget = DEFAULT_PRESSURE_TARGET;

const originalStart = refs.startBtn.onclick;
const originalStop = refs.stopBtn.onclick;
const originalAuto = refs.autoBtn.onclick;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function unit(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, 0, 1) : fallback;
}

function percent(value, fallback = 0) {
  const number = Number(value);
  const source = Number.isFinite(number) ? number : Number(fallback);
  return Number.isFinite(source) ? clamp(source, 0, 100) / 100 : 0;
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function currentSeed() {
  return window.chillAdapter?.getRuntimeConfig?.().seed ?? 240424;
}

function sessionBasePath() {
  if (window.location.hostname.endsWith("github.io")) return "/drum-floor/";
  if (window.location.pathname.includes("/chill/")) return "/drum-floor/";
  return "../drum-floor/";
}

function setText(node, text) {
  if (node) node.textContent = text;
}

function referenceLabel(id) {
  return CHILL_REFERENCE_LABELS[id] || "Quiet Piano";
}

function currentControls() {
  return {
    referenceId: refs.referenceSelect.value || "piano-jazz-chill",
    touch: Number(refs.energy.value),
    phrase: Number(refs.creation.value),
    room: Number(refs.nature.value),
  };
}

function chooseReferenceId(packet, intent, gradient) {
  const requested = String(intent.reference_id || intent.referenceId || "");
  if (CHILL_REFERENCE_IDS.includes(requested)) return requested;
  const ucm = object(packet?.ucm_state);
  const pad = String(object(packet?.performance_state).active_pad || "").toLowerCase();
  const memory = unit(gradient.memory);
  const creation = percent(ucm.creation, 0);
  const voidness = percent(ucm.void, 0);
  if (pad === "drift" || (memory > 0.58 && creation < 0.36)) return "soft-solo-drift";
  if (memory > 0.42 && creation > 0.32 && voidness < 0.62) return "soft-melody-piano";
  if (pad === "void" || unit(gradient.chrome) > 0.46 || unit(gradient.haze) > 0.52) return "rainy-lofi-room";
  return "piano-jazz-chill";
}

function translateMusicSessionPacket(packet) {
  const routing = object(packet?.routing);
  const chill = object(routing.chill);
  const intent = object(chill.trio_intent);
  const gradient = object(packet?.reference_gradient?.weights);
  const ucm = object(packet?.ucm_state);
  const energy = percent(ucm.energy, 32);
  const creation = percent(ucm.creation, 28);
  const voidness = percent(ucm.void, 24);
  const circle = percent(ucm.circle, 48);
  const observer = percent(ucm.observer, 48);
  const memory = unit(gradient.memory, 0.34);
  const haze = unit(gradient.haze, 0.38);
  const micro = unit(gradient.micro, 0.24);
  const ghost = unit(gradient.ghost, 0.24);
  const drumSupport = unit(chill.drum_support, energy * 0.28 + ghost * 0.2 + micro * 0.12 - voidness * 0.18);
  const roomFallback = clamp(0.54 + voidness * 0.2 + observer * 0.12 + haze * 0.12 - energy * 0.12, 0.42, 0.94);
  const touch = unit(intent.touch, clamp(0.16 + energy * 0.24 + micro * 0.12 - voidness * 0.1, 0.08, 0.68));
  const phrase = unit(intent.phrase, clamp(0.12 + creation * 0.22 + memory * 0.16 + ghost * 0.08, 0.08, 0.72));
  const room = unit(intent.room, roomFallback);
  const pressureTarget = ["safe", "warm", "full"].includes(intent.pressure_target) ? intent.pressure_target : energy > 0.58 ? "safe" : "warm";
  return {
    schema: "chill.music-stack-sync.v1",
    source_session_id: packet?.session_id || "",
    enabled: chill.enabled !== false,
    referenceId: chooseReferenceId(packet, intent, gradient),
    touch,
    phrase,
    room,
    bassOn: intent.bass_on !== false,
    flowOn: intent.flow_on !== false,
    drumsOn: Boolean(intent.drums_suggested ?? (drumSupport > 0.34 && voidness < 0.58)),
    pressureTarget,
    drumSupport,
    pianoMemory: unit(chill.piano_memory, memory * 0.45 + haze * 0.22 + circle * 0.1),
    review_only: true,
  };
}

function applyMusicSessionPacket(packet, source = "sync") {
  const translation = translateMusicSessionPacket(packet);
  if (!translation.enabled) return translation;
  lastMusicSessionPacket = packet;
  lastMusicSessionTranslation = translation;
  refs.referenceSelect.value = translation.referenceId;
  refs.energy.value = String(translation.touch);
  refs.creation.value = String(translation.phrase);
  refs.nature.value = String(translation.room);
  bassOn = translation.bassOn;
  sessionAuto = translation.flowOn;
  drumSuggested = translation.drumsOn;
  drumsOn = drumsOn && drumSuggested;
  sessionPressureTarget = translation.pressureTarget;
  lastBassEventCount = 0;
  drumBar = 0;
  syncSessionState();
  updateSessionUi();
  setText(refs.sessionStatus, `SYNC ${referenceLabel(translation.referenceId)} / STARTで聴く`);
  setText(refs.bassStatus, bassOn ? "Quiet Bass ready" : "bass off");
  setText(refs.drumStatus, drumSuggested ? "DRUMS任意: 押すと参加" : "DRUMSなしでOK");
  return translation;
}

function musicPacketFromStackPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.packet && typeof payload.packet === "object" && payload.packet.source_repo === "Music") return payload.packet;
  if (payload.source_repo === "Music") return payload;
  return null;
}

function receiveMusicStackPacket(payload, source = "sync") {
  const packet = musicPacketFromStackPayload(payload);
  if (!packet) return false;
  try {
    applyMusicSessionPacket(packet, source);
    return true;
  } catch (error) {
    console.warn("[chill session] Music stack sync failed", error);
    setText(refs.sessionStatus, `SYNC error: ${error.message}`);
    return false;
  }
}

function readLatestMusicStackPacket() {
  try {
    const raw = window.localStorage?.getItem(MUSIC_STACK_PACKET_STORAGE_KEY);
    if (!raw) return false;
    return receiveMusicStackPacket(JSON.parse(raw), "latest");
  } catch (error) {
    console.warn("[chill session] latest sync read failed", error);
    return false;
  }
}

function setupMusicStackSyncReceiver() {
  try {
    if (typeof window.BroadcastChannel === "function") {
      const channel = new window.BroadcastChannel(MUSIC_STACK_CHANNEL_NAME);
      channel.addEventListener("message", (event) => receiveMusicStackPacket(event.data, "broadcast"));
    }
  } catch (error) {
    console.warn("[chill session] BroadcastChannel unavailable", error);
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== MUSIC_STACK_PACKET_STORAGE_KEY || !event.newValue) return;
    try {
      receiveMusicStackPacket(JSON.parse(event.newValue), "storage");
    } catch (error) {
      console.warn("[chill session] storage sync failed", error);
    }
  });
}

function sessionFlow(barIndex = drumBar) {
  const controls = currentControls();
  const flowPreview = window.chillAdapter?.session?.previewFlow?.({
    bars: 1,
    startBar: barIndex,
    seed: currentSeed(),
    referenceId: controls.referenceId,
    touch: controls.touch,
    phrase: controls.phrase,
    room: controls.room,
    flowOn: sessionAuto,
    pressureTarget: sessionPressureTarget,
  });
  lastFlowSnapshot = flowPreview?.bars?.[0] ?? {
    state: sessionAuto ? "breathe" : "settle",
    pressure: 0.4,
    pressureStatus: "safe",
    decrescendo: false,
    bassActivity: 0,
    drumDensityScale: 1,
    restLift: 0,
  };
  lastMixMeter = {
    pressure: lastFlowSnapshot.pressure,
    pressureStatus: lastFlowSnapshot.pressureStatus,
    pianoDensity: lastFlowSnapshot.pianoDensity ?? 0,
    bassDensity: lastFlowSnapshot.bassDensity ?? 0,
    drumDensity: lastFlowSnapshot.drumDensity ?? 0,
  };
  return lastFlowSnapshot;
}

function refreshFlowStatus() {
  const flow = sessionFlow(drumBar);
  setText(refs.flowStatus, `FLOW ${flow.state}`);
  setText(refs.pressureStatus, `PRESSURE ${flow.pressureStatus}`);
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
  refreshFlowStatus();
  if (!bassOn) setText(refs.bassStatus, "bass off");
  if (!drumAdapter && drumLoadStarted) setText(refs.drumStatus, drumLoadPromise ? "drums loading" : "drums unavailable");
}

function sessionShape(barIndex = drumBar) {
  const { touch, phrase, room } = currentControls();
  const flow = sessionFlow(barIndex);
  const lift = flow.state === "lift" ? 1 : 0;
  const decrescendo = flow.decrescendo ? 1 : 0;
  const bassSpace = bassOn ? 1 + Math.min(1, lastBassEventCount) * 0.35 : 0;
  const density = clamp((12 + phrase * 20 + touch * 8 - room * 8 + lift * 3 - bassSpace * 3 - decrescendo * 6) * (flow.drumDensityScale ?? 1), 6, 34);
  const energy = clamp(16 + touch * 22 + lift * 2 - bassSpace * 2 - decrescendo * 5, 12, 38);
  const space = clamp(68 + room * 24 - phrase * 8 + bassSpace * 3 + (flow.restLift ?? 0) * 12 + decrescendo * 5, 58, 96);
  const humanize = clamp(56 + room * 20 + phrase * 4, 48, 82);
  const swing = clamp(8 + room * 4 + phrase * 2, 7, 14);
  const fillDemand = clamp(2 + phrase * 9 - room * 5 + lift * 2 - decrescendo * 6, 0, 10);

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

function trioSnapshot() {
  const { referenceId, touch, phrase, room } = currentControls();
  const shape = sessionShape(drumBar);
  const flow = sessionFlow(drumBar);
  let bassPreview = null;
  let drumSnapshot = {
    loaded: false,
    status: drumLoadStarted ? "loading" : "idle",
  };

  try {
    bassPreview = window.chillAdapter?.session?.previewBassBar?.({
      bpm: SESSION_BPM,
      seed: currentSeed(),
      referenceId,
      barIndex: drumBar,
      touch,
      phrase,
      room,
      bassOn,
      flowOn: sessionAuto,
      pressureTarget: sessionPressureTarget,
    }) ?? null;
  } catch (error) {
    bassPreview = { error: error.message };
  }

  try {
    drumSnapshot = drumAdapter?.snapshot?.() ?? drumSnapshot;
  } catch (error) {
    drumSnapshot = { ...drumSnapshot, error: error.message };
  }

  return {
    version: 1,
    role: "chill-piano-bass-drum-trio",
    bassOn,
    drumsOn,
    drumSuggested,
    auto: sessionAuto,
    flow,
    mixMeter: lastMixMeter,
    pressureStatus: flow.pressureStatus,
    bassPersona: BASS_PERSONA,
    barIndex: drumBar,
    seed: currentSeed(),
    referenceId,
    controls: { touch, phrase, room },
    sessionShape: shape,
    bassPreview,
    drumAdapter: drumSnapshot,
    lastMusicSession: lastMusicSessionTranslation,
    statuses: {
      session: refs.sessionStatus?.textContent || "",
      bass: refs.bassStatus?.textContent || "",
      drums: refs.drumStatus?.textContent || "",
    },
  };
}

async function ensureDrums() {
  if (drumAdapter) return drumAdapter;
  if (drumLoadPromise) return drumLoadPromise;
  drumLoadStarted = true;
  setText(refs.drumStatus, "drums loading");

  drumLoadPromise = (async () => {
    const module = await import(`${sessionBasePath()}src/session-adapter.js?v=${DRUM_ADAPTER_VERSION}`);
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
  })();

  try {
    return await drumLoadPromise;
  } catch (error) {
    console.warn("[chill session] drum-floor unavailable", error);
    setText(refs.drumStatus, "drums unavailable");
    drumsOn = false;
    drumLoadStarted = false;
    drumLoadPromise = null;
    updateSessionUi();
    return null;
  }
}

function syncSessionState() {
  const { referenceId, touch, phrase, room } = currentControls();
  window.chillAdapter?.session?.setSessionState?.({
    bpm: SESSION_BPM,
    seed: currentSeed(),
    referenceId,
    touch,
    phrase,
    room,
    bassOn,
    flowOn: sessionAuto,
    bassPersona: BASS_PERSONA,
    pressureTarget: sessionPressureTarget,
  });
  if (drumAdapter) drumAdapter.setSession(sessionShape());
  refreshFlowStatus();
}

function ensureDrumLoop() {
  if (drumLoop) return drumLoop;
  drumLoop = new Tone.Loop((time) => {
    const controls = currentControls();
    const flow = sessionFlow(drumBar);
    if (bassOn) {
      const bassResult = window.chillAdapter?.session?.scheduleBassBar?.({
        bpm: SESSION_BPM,
        seed: currentSeed(),
        referenceId: controls.referenceId,
        barIndex: drumBar,
        touch: controls.touch,
        phrase: controls.phrase,
        room: controls.room,
        bassOn,
        flowOn: sessionAuto,
        pressureTarget: sessionPressureTarget,
        startTime: time,
      });
      lastBassEventCount = bassResult?.eventCount ?? 0;
      const firstBass = bassResult?.events?.[0];
      setText(refs.bassStatus, firstBass ? `bass ${firstBass.role}:${firstBass.note}` : "bass rest");
    } else {
      lastBassEventCount = 0;
    }

    if (!drumsOn || !drumAdapter) {
      setText(refs.drumStatus, drumsOn ? "drums waiting" : "drums off");
      drumBar += 1;
      updateSessionUi();
      return;
    }
    drumAdapter.setSession(sessionShape(drumBar));
    const result = drumAdapter.scheduleBar({ barIndex: drumBar, startTime: time });
    if (!result.scheduled) {
      drumsOn = false;
      setText(refs.drumStatus, `drums stopped: ${result.reason}`);
    } else {
      setText(refs.drumStatus, flow.decrescendo ? "soft pocket decrescendo" : "soft pocket playing");
    }
    drumBar += 1;
    updateSessionUi();
  }, "1m");
  return drumLoop;
}

refs.startBtn.onclick = async (event) => {
  syncSessionState();
  await originalStart?.call(refs.startBtn, event);
  setText(refs.sessionStatus, "session playing");

  const loop = ensureDrumLoop();
  loop.stop(0);
  loop.start(0);

  if (drumsOn) {
    const adapter = await ensureDrums();
    if (adapter) {
      try {
        await adapter.start();
      } catch (error) {
        console.warn("[chill session] drum start failed; piano will continue", error);
        drumsOn = false;
        setText(refs.drumStatus, "drums unavailable");
      }
    }
  }
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
  drumSuggested = drumSuggested || drumsOn;
  if (drumsOn) {
    const adapter = await ensureDrums();
    if (adapter && Tone.Transport.state === "started") {
      try {
        await adapter.start();
      } catch (error) {
        console.warn("[chill session] drum start failed; piano will continue", error);
        drumsOn = false;
        setText(refs.drumStatus, "drums unavailable");
      }
    }
  }
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
  syncSessionState();
  setText(refs.sessionStatus, sessionAuto ? "flow director armed" : "manual session");
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

function saveListeningScore() {
  const entry = {
    version: 1,
    savedAt: new Date().toISOString(),
    score: {
      flow: refs.scoreFlow?.value || "3",
      dynamics: refs.scoreDynamics?.value || "3",
      bass: refs.scoreBass?.value || "3",
      fatigue: refs.scoreFatigue?.value || "3",
      notes: (refs.scoreNotes?.value || "").slice(0, 500),
    },
    snapshot: trioSnapshot(),
  };

  try {
    const existing = JSON.parse(window.localStorage.getItem(LISTENING_SCORE_KEY) || "[]");
    const next = Array.isArray(existing) ? existing.concat(entry).slice(-24) : [entry];
    window.localStorage.setItem(LISTENING_SCORE_KEY, JSON.stringify(next));
    setText(refs.scoreStatus, "score saved locally");
  } catch (error) {
    console.warn("[chill session] score save failed", error);
    setText(refs.scoreStatus, "score save failed");
  }
}

refs.scoreSaveBtn?.addEventListener("click", saveListeningScore);

window.chillTrioSession = Object.freeze({
  snapshot: trioSnapshot,
  applyMusicSessionPacket,
  translateMusicSessionPacket,
});

setupMusicStackSyncReceiver();
syncSessionState();
ensureDrums();
updateSessionUi();
readLatestMusicStackPacket();
