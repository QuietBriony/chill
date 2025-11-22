// ======================================================
// UCM Piano Ambient — Fractal Suite (Clean Version)
// Debussy / Ravel 系の和声 + Aphex-ish 跳ねフレーズ
// ======================================================

let isRunning = false;
let audioReady = false;

const PI_DIGITS = [3,1,4,1,5,9,2,6,5,3,5,8,9,7,9];
const PHI = 1.6180339887;
let piIndex = 0;
let phiPhase = 0;

// 状態
const State = {
  style: 30,
  energy: 30,
  space: 60,
  bright: 40,
  volume: -16,
  autoLenMin: 3,
  autoEnabled: true,
  modeIndex: 0, // 0=A,1=B,2=C
};

// UI参照
const Els = {};

// Tone.js ノード
let masterVol, reverb, delay;
let pianoLead, pianoComp, pad;
let chordLoop, compLoop, leadLoop, arpLoop;
let autoTimer = null;

// スケール & コード
const SCALE = ["C4","D4","E4","F#4","G4","A4","B4","C5","D5","E5"];

const CHORDS_A = [ // Piano Ambient A
  ["C4","E4","G4","B4"],   // Cmaj7
  ["A3","C4","E4","G4"],   // Am7
  ["F3","A3","C4","E4"],   // Fmaj7
  ["D3","G3","C4","E4"],   // G-ish
];

const CHORDS_B = [ // 少しモーダル
  ["E4","A4","C5","F#5"],
  ["D4","G4","B4","E5"],
  ["B3","E4","G4","C5"],
];

const CHORDS_C = [ // もっとAmbient
  ["C4","G4","D5"],
  ["D4","A4","E5"],
  ["E4","B4","F#5"],
  ["G3","D4","A4"],
];

function currentChordSet() {
  if (State.modeIndex === 0) return CHORDS_A;
  if (State.modeIndex === 1) return CHORDS_B;
  return CHORDS_C;
}
function modeName() {
  return ["Ambient Piano A","Ambient Piano B","Deep Ambient C"][State.modeIndex] || "Ambient Piano A";
}
function nextPiDigit() {
  const d = PI_DIGITS[piIndex];
  piIndex = (piIndex + 1) % PI_DIGITS.length;
  return d;
}
function mapValue(x, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  const t = (x - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}
function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
function rand(p) { return Math.random() < p; }

// --------------------------------------
// Audio Graph
// --------------------------------------
function initAudioGraph() {
  if (audioReady) return;

  masterVol = new Tone.Volume(State.volume).toDestination();

  reverb = new Tone.Reverb({
    decay: 10,
    preDelay: 0.09,
    wet: 0.55,
  }).connect(masterVol);

  delay = new Tone.FeedbackDelay("8n", 0.28).connect(reverb);

  pianoLead = new Tone.FMSynth({
    harmonicity: 1.99,
    modulationIndex: 2.5,
    oscillator: { type: "triangle" },
    envelope: {
      attack: 0.005,
      decay: 0.35,
      sustain: 0.25,
      release: 2.5
    },
    modulation: { type: "sine" },
    modulationEnvelope: {
      attack: 0.004,
      decay: 0.25,
      sustain: 0.1,
      release: 1.3
    }
  }).connect(delay);

  pianoComp = new Tone.PolySynth(Tone.FMSynth, {
    maxPolyphony: 8,
    options: {
      harmonicity: 1.92,
      modulationIndex: 2,
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.3,
        release: 3.2
      },
      modulationEnvelope: {
        attack: 0.008,
        decay: 0.4,
        sustain: 0.15,
        release: 1.5
      }
    }
  }).connect(reverb);

  pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: {
      attack: 2.0,
      decay: 1.0,
      sustain: 0.9,
      release: 7.0
    }
  }).connect(reverb);

  setupLoops();
  audioReady = true;
}

// --------------------------------------
// Loops
// --------------------------------------
function setupLoops() {
  let chordIndex = 0;
  let barCount = 0;

  // 大きなコード進行 ＋ Pad
  chordLoop = new Tone.Loop((time) => {
    barCount++;
    const chords = currentChordSet();
    const step = nextPiDigit() % chords.length;
    chordIndex = (chordIndex + step) % chords.length;
    const chord = chords[chordIndex];

    const padVel = mapValue(State.energy, 0, 100, 0.35, 0.9);
    pad.triggerAttackRelease(chord, "2m", time, padVel);

    const compVel = mapValue(State.space, 0, 100, 0.55, 0.25);
    pianoComp.triggerAttackRelease(chord, "2n", time + 0.12, compVel);
  }, "2m");

  // Broken chord 的な伴奏（ポロロン）
  compLoop = new Tone.Loop((time) => {
    const chords = currentChordSet();
    const chord = chords[chordIndex];
    if (!chord) return;

    const density = mapValue(State.energy, 0, 100, 0.25, 0.85);
    if (!rand(density)) return;

    const idx = nextPiDigit() % chord.length;
    const note = chord[idx];
    const vel = mapValue(State.space, 0, 100, 0.45, 0.25);
    pianoComp.triggerAttackRelease(note, "8n", time, vel);
  }, "4n");

  // 主旋律（黄金比＋πで跳ねる）
  leadLoop = new Tone.Loop((time) => {
    const restProb = mapValue(State.space, 0, 100, 0.15, 0.55);
    if (rand(restProb)) return;

    const density = mapValue(State.energy, 0, 100, 0.35, 0.9);
    if (!rand(density)) return;

    const mix = State.style / 100;
    const d = nextPiDigit();
    phiPhase += PHI;
    let idx = Math.floor((d + phiPhase) % SCALE.length);

    // Aphex-ish Whole-tone drift
    if (Math.random() < 0.18 && mix > 0.35) {
      idx = (idx + 2) % SCALE.length;
    }

    const note = SCALE[idx];
    const dur = rand(0.3) ? "8n" : "4n";
    const vel = mapValue(State.bright, 0, 100, 0.35, 0.85);

    pianoLead.triggerAttackRelease(note, dur, time, vel);
  }, "8n");

  // 細かいきらめき
  arpLoop = new Tone.Loop((time) => {
    if (State.energy < 25) return;

    const chords = currentChordSet();
    const chord = chords[chordIndex];
    if (!chord) return;

    const prob = mapValue(State.energy, 25, 100, 0.2, 0.9);
    if (!rand(prob)) return;

    const note = chord[Math.floor(Math.random() * chord.length)];
    const vel = mapValue(State.bright, 0, 100, 0.25, 0.7);
    pianoLead.triggerAttackRelease(note, "16n", time, vel);
  }, "16n");
}

// --------------------------------------
// Params & Auto
// --------------------------------------
function applyParams() {
  const mix = State.style / 100;

  let bpmBase = mix < 0.5
    ? mapValue(mix, 0, 0.5, 60, 76)
    : mapValue(mix, 0.5, 1, 76, 92);

  bpmBase += mapValue(State.energy, 0, 100, -6, +6);
  bpmBase = clamp(bpmBase, 52, 100);
  Tone.Transport.bpm.rampTo(bpmBase, 0.4);

  if (reverb) {
    const wet = mapValue(State.space, 0, 100, 0.35, 0.9);
    reverb.wet.rampTo(wet, 0.8);
  }
  if (delay) {
    const fb = mapValue(State.space, 0, 100, 0.18, 0.42);
    delay.feedback.rampTo(fb, 0.6);
  }
  if (masterVol) {
    masterVol.volume.rampTo(State.volume, 0.4);
  }

  if (Els.modeLabel) {
    Els.modeLabel.textContent = `Mode: ${modeName()}`;
  }
  if (Els.bpmLabel) {
    Els.bpmLabel.textContent = `Tempo: ${Math.round(bpmBase)} BPM`;
  }
}

function scheduleAuto() {
  if (autoTimer) clearTimeout(autoTimer);
  if (!State.autoEnabled) return;

  const ms = State.autoLenMin * 60 * 1000;
  autoTimer = setTimeout(() => {
    // モードを切り替えつつ、パラメータもゆっくり動かす
    State.modeIndex = (State.modeIndex + 1) % 3;

    State.style  = clamp(State.style  + (Math.random() - 0.5) * 18, 0, 100);
    State.energy = clamp(State.energy + (Math.random() - 0.5) * 18, 0, 100);
    State.space  = clamp(State.space  + (Math.random() - 0.5) * 18, 0, 100);

    Els.f_style.value  = State.style;
    Els.f_energy.value = State.energy;
    Els.f_space.value  = State.space;

    applyParams();
    scheduleAuto();
  }, ms);
}

// --------------------------------------
// UI Binding
// --------------------------------------
function bindUI() {
  Els.f_style  = document.getElementById("f_style");
  Els.f_energy = document.getElementById("f_energy");
  Els.f_space  = document.getElementById("f_space");
  Els.f_bright = document.getElementById("f_bright");
  Els.f_volume = document.getElementById("f_volume");
  Els.f_auto   = document.getElementById("f_auto_len");
  Els.autoToggle = document.getElementById("auto_toggle");
  Els.btnStart = document.getElementById("btn_start");
  Els.btnStop  = document.getElementById("btn_stop");
  Els.status   = document.getElementById("status-text");
  Els.modeLabel = document.getElementById("mode-label");
  Els.bpmLabel  = document.getElementById("bpm-label");

  const onInput = () => {
    State.style  = parseInt(Els.f_style.value, 10);
    State.energy = parseInt(Els.f_energy.value, 10);
    State.space  = parseInt(Els.f_space.value, 10);
    State.bright = parseInt(Els.f_bright.value, 10);
    State.volume = parseInt(Els.f_volume.value, 10);
    State.autoLenMin = parseInt(Els.f_auto.value, 10);
    State.autoEnabled = Els.autoToggle.checked;
    applyParams();
  };

  [Els.f_style, Els.f_energy, Els.f_space, Els.f_bright, Els.f_volume, Els.f_auto]
    .forEach(el => el && el.addEventListener("input", () => { onInput(); scheduleAuto(); }));

  if (Els.autoToggle) {
    Els.autoToggle.addEventListener("change", () => {
      State.autoEnabled = Els.autoToggle.checked;
      scheduleAuto();
    });
  }

  if (Els.btnStart) {
    Els.btnStart.onclick = async () => {
      if (isRunning) return;

      await Tone.start();
      if (Tone.context.state !== "running") await Tone.context.resume();
      if (!audioReady) initAudioGraph();

      applyParams();
      scheduleAuto();

      chordLoop.start(0);
      compLoop.start("4n");
      leadLoop.start("8n");
      arpLoop.start("16n");
      Tone.Transport.start("+0.1");

      isRunning = true;
      if (Els.status) Els.status.textContent = "Playing…";
    };
  }

  if (Els.btnStop) {
    Els.btnStop.onclick = () => {
      if (!isRunning) return;
      Tone.Transport.stop();
      chordLoop.stop();
      compLoop.stop();
      leadLoop.stop();
      arpLoop.stop();
      isRunning = false;
      if (Els.status) Els.status.textContent = "Stopped";
    };
  }

  onInput();
}

// --------------------------------------
// Canvas（軽いフラクタル波）
// --------------------------------------
function startCanvas() {
  const canvas = document.getElementById("mandalaCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  let t = 0;

  function draw() {
    t += 0.002;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const grd = ctx.createRadialGradient(
      w/2, h/2, 0,
      w/2, h/2, Math.max(w,h)/1.2
    );
    grd.addColorStop(0, "#101a33");
    grd.addColorStop(1, "#02040b");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.strokeStyle = "rgba(160,200,255,0.32)";
    ctx.lineWidth = 0.8;

    const rings = 4;
    for (let r = 0; r < rings; r++) {
      const radius = (Math.min(w, h) / 4) * ((r+1)/rings);
      ctx.beginPath();
      for (let i = 0; i <= 360; i += 5) {
        const rad = (i * Math.PI) / 180;
        const noise =
          5 * Math.sin(rad * (3+r) + t* (1 + r*0.3)) *
          Math.sin(t * (0.5 + r*0.2));
        const x = (radius + noise) * Math.cos(rad);
        const y = (radius + noise) * Math.sin(rad);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.restore();
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

// --------------------------------------
// INIT
// --------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  bindUI();
  startCanvas();
  console.log("UCM Piano Ambient — Fractal Suite Ready");
});