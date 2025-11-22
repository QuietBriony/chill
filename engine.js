// =========================================
//  UCM Piano Ambient — Zen Fractal / RAVE
//  Ambient (Debussy-ish) + Rave (Deep Tech / Trance)
// =========================================

let isPlaying = false;
let autoMode  = false;
let currentMode = "ambient"; // "ambient" | "rave"

// =========================================
//  背景 Canvas（軽量マンダラ）
// =========================================

const canvas = document.getElementById("bg");
const ctx     = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let tBG = 0;
function drawMandala() {
  tBG += 0.002;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const rMax = Math.min(w, h) * 0.4;

  // 背景グラデ
  const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, Math.max(w, h) * 0.8);
  g.addColorStop(0, "#0b233b");
  g.addColorStop(1, "#020710");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(cx, cy);

  // リング
  ctx.strokeStyle = "rgba(170, 210, 255, 0.28)";
  ctx.lineWidth = 0.8;
  const ringCount = 5;
  for (let r = 1; r <= ringCount; r++) {
    const baseR = (r / ringCount) * rMax;
    ctx.beginPath();
    for (let deg = 0; deg <= 360; deg += 6) {
      const rad = (deg * Math.PI) / 180;
      const wobble =
        4 *
        Math.sin(rad * (1.5 + r * 0.4) + tBG * (0.7 + r * 0.3));
      const rr = baseR + wobble;
      const x = rr * Math.cos(rad + tBG * 0.1);
      const y = rr * Math.sin(rad + tBG * 0.1);
      if (deg === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 放射状ライン
  ctx.strokeStyle = "rgba(190, 225, 255, 0.22)";
  ctx.lineWidth = 0.6;
  const spokeCount = 24;
  const innerR = rMax * 0.2;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2 + tBG * 0.15;
    const x1 = innerR * Math.cos(angle);
    const y1 = innerR * Math.sin(angle);
    const x2 = rMax * Math.cos(angle);
    const y2 = rMax * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 中心円
  ctx.beginPath();
  ctx.arc(0, 0, rMax * 0.08, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(220, 240, 255, 0.85)";
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.restore();

  requestAnimationFrame(drawMandala);
}
drawMandala();

// =========================================
//  Audio Graph
// =========================================

const masterVol = new Tone.Volume(-20).toDestination(); // 禅的中庸

const reverb = new Tone.Reverb({
  decay: 14,
  preDelay: 0.06,
  wet: 0.42,
}).connect(masterVol);

const delay = new Tone.FeedbackDelay("8n", 0.18).connect(reverb);

// ピアノ EQ（主旋律前に出す）
const leadEQ = new Tone.EQ3({
  low: -2,
  mid: 0,
  high: +2,
  highFrequency: 3000,
}).connect(delay);

// Ambient Piano Lead
const piano = new Tone.FMSynth({
  harmonicity: 2.0,
  modulationIndex: 2.8,
  oscillator: { type: "triangle" },
  envelope: {
    attack: 0.02,  // 弾き出す感じ
    decay: 0.4,
    sustain: 0.3,
    release: 3.8,  // 残響長め
  },
  modulation: { type: "sine" },
  modulationEnvelope: {
    attack: 0.01,
    decay: 0.3,
    sustain: 0.15,
    release: 1.8,
  },
}).connect(leadEQ);

// 遠景Pad
const padLP = new Tone.Filter({
  frequency: 4500,
  type: "lowpass",
  rolloff: -24,
}).connect(reverb);

const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: {
    attack: 4.2,
    decay: 1.6,
    sustain: 0.88,
    release: 12.0,
  },
}).connect(padLP);

padLP.volume.value = -18;

// 風っぽい自然音（極小音量）
const wind = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 2, release: 6 },
}).connect(masterVol);
wind.volume.value = -32;

// ===== RAVE側 Synth =====
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.03,
  octaves: 6,
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.4, sustain: 0 },
}).connect(masterVol);

const psyFilter = new Tone.Filter(120, "lowpass").connect(masterVol);
const psyBass = new Tone.Synth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.1 },
}).connect(psyFilter);

const raveLeadDist = new Tone.Distortion(0.28).connect(reverb);
const raveLead = new Tone.Synth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.2 },
}).connect(raveLeadDist);

// =========================================
//  グローバル状態（パラメータ）
// =========================================

let creationLevel = 0.5;
let natureLevel   = 0.15;

// UI要素
const fEnergy   = document.getElementById("fader_energy");
const fCreation = document.getElementById("fader_creation");
const fNature   = document.getElementById("fader_nature");
const bpmLabel  = document.getElementById("bpmLabel");
const modeLabel = document.getElementById("modeLabel");

const btnStart  = document.getElementById("btn_start");
const btnStop   = document.getElementById("btn_stop");
const btnAuto   = document.getElementById("btn_auto");
const btnRave   = document.getElementById("btn_rave");

let autoTimer = null;

// =========================================
//  美しい数学 & 和声（Ambient）
// =========================================

const PHI = 1.6180339887;

const debussyScale = ["C4","D#4","G4","A#4","D5","G4","E4","C4"];

function debussyMelody(time) {
  let t = time;
  for (let i = 0; i < debussyScale.length; i++) {
    // creation が低いと間引き
    if (Math.random() > 0.4 + creationLevel * 0.5) continue;

    const note = debussyScale[i];
    const vel  = 0.35 + Math.random() * 0.35;
    piano.triggerAttackRelease(note, "8n", t, vel);

    const swing = 1 + Math.sin(i * 0.7) * 0.3;
    t += Tone.Time("8n") * swing;
  }
}

// 印象派的な和声（四度堆積っぽい）
const impressionistChordsList = [
  ["C4","F4","A#4"],
  ["D4","G4","C5"],
  ["E4","A4","D5"],
  ["C4","D#4","G4"],
];

function impressionistChords(time) {
  const c = impressionistChordsList[Math.floor(Math.random() * impressionistChordsList.length)];
  pad.triggerAttackRelease(c, "2m", time, 0.3);
}

// Fractal Arpeggio（黄金比 × 分岐）
const arpBase = ["C3","G3","D#3","A#2"];

function fractalArp(time) {
  for (let i = 0; i < 12; i++) {
    if (Math.random() > 0.5 + creationLevel * 0.4) continue;

    const idx = Math.floor((i * PHI * 7) % arpBase.length);
    const pitch = arpBase[idx];
    const dt = Tone.Time("16n") * Math.pow(PHI, i * 0.08);
    const vel = 0.2 + Math.random() * 0.1;
    pad.triggerAttackRelease(pitch, "16n", time + dt, vel);
  }
}

// 自然音
function windPlay() {
  if (Math.random() < (0.2 + natureLevel * 0.5)) {
    wind.triggerAttackRelease("C2", 4);
  }
}

// =========================================
//  Ambient / Rave Loops
// =========================================

let ambientLoop = null;
let raveKickLoop = null;
let raveBassLoop = null;
let raveLeadLoop = null;

function setupAmbientLoop() {
  if (ambientLoop) return;
  ambientLoop = new Tone.Loop((time) => {
    debussyMelody(time);
    impressionistChords(time + Tone.Time("1m"));
    fractalArp(time + Tone.Time("2n"));
    windPlay();
  }, "2m");
}

function setupRaveLoops() {
  if (!raveKickLoop) {
    raveKickLoop = new Tone.Loop((time) => {
      kick.triggerAttackRelease("C1", "8n", time);
    }, "4n");
  }
  if (!raveBassLoop) {
    // C2 - G1 のライン
    const bassSeq = ["C2","G1","C2","G1","C2","G1","C2","G1"];
    let idx = 0;
    raveBassLoop = new Tone.Loop((time) => {
      const note = bassSeq[idx % bassSeq.length];
      psyBass.triggerAttackRelease(note, "16n", time, 0.6);
      idx++;
    }, "16n");
  }
  if (!raveLeadLoop) {
    const leadScale = ["C5","D5","E5","G5","A5","C6"];
    let step = 0;
    raveLeadLoop = new Tone.Loop((time) => {
      if (Math.random() > 0.7 + creationLevel * 0.2) return;
      const note = leadScale[step % leadScale.length];
      raveLead.triggerAttackRelease(note, "16n", time, 0.5);
      step++;
    }, "8n");
  }
}

// =========================================
//  モード切り替え & パラメータ反映
// =========================================

function applyFaders() {
  const energy   = parseInt(fEnergy.value, 10);
  creationLevel   = parseInt(fCreation.value, 10) / 100;
  natureLevel     = parseInt(fNature.value, 10) / 100;

  if (currentMode === "ambient") {
    const bpm = 55 + (energy / 100) * 30; // 55〜85
    Tone.Transport.bpm.rampTo(bpm, 1.0);
    bpmLabel.textContent = "BPM: " + Math.round(bpm);

    // wind 音量
    wind.volume.rampTo(-40 + natureLevel * 8, 2.0); // -40〜-32

  } else if (currentMode === "rave") {
    const bpm = 130 + (energy / 100) * 18; // 130〜148
    Tone.Transport.bpm.rampTo(bpm, 0.8);
    bpmLabel.textContent = "BPM: " + Math.round(bpm);

    const cutoff = 90 + energy * 2;
    psyFilter.frequency.rampTo(cutoff, 1.0);

    const dist = 0.18 + creationLevel * 0.4;
    raveLeadDist.distortion = dist;
  }
}

[fEnergy, fCreation, fNature].forEach((el) => {
  el.addEventListener("input", () => {
    applyFaders();
  });
});

function startAmbientMode() {
  currentMode = "ambient";
  modeLabel.textContent = "Mode: Ambient Piano";

  setupAmbientLoop();
  setupRaveLoops();

  // Raveループは止める
  if (raveKickLoop) raveKickLoop.stop();
  if (raveBassLoop) raveBassLoop.stop();
  if (raveLeadLoop) raveLeadLoop.stop();

  if (ambientLoop) ambientLoop.start(0);

  applyFaders();
}

function startRaveMode() {
  currentMode = "rave";
  modeLabel.textContent = "Mode: RAVE";

  setupAmbientLoop();
  setupRaveLoops();

  // Ambientループ止め
  if (ambientLoop) ambientLoop.stop();

  // Raveループ開始
  if (raveKickLoop) raveKickLoop.start(0);
  if (raveBassLoop) raveBassLoop.start("16n");
  if (raveLeadLoop) raveLeadLoop.start("8n");

  applyFaders();
}

// Auto Drift（Ambient 用）
function scheduleAuto() {
  if (autoTimer) clearTimeout(autoTimer);
  if (!autoMode || currentMode !== "ambient") return;

  const ms = (1 + Math.random() * 4) * 60 * 1000; // 1〜5分
  autoTimer = setTimeout(() => {
    // 少しだけフェーダーを揺らす
    fEnergy.value   = clamp(parseInt(fEnergy.value, 10)   + (Math.random() * 20 - 10), 0, 100);
    fCreation.value = clamp(parseInt(fCreation.value, 10) + (Math.random() * 20 - 10), 0, 100);
    fNature.value   = clamp(parseInt(fNature.value, 10)   + (Math.random() * 20 - 10), 0, 100);
    applyFaders();
    scheduleAuto();
  }, ms);
}

function clamp(x, min, max) {
  return x < min ? min : x > max ? max : x;
}

// =========================================
//  Start / Stop / Auto / RAVE ボタン
// =========================================

btnStart.onclick = async () => {
  if (isPlaying && currentMode === "ambient") return;
  await Tone.start();
  if (!Tone.Transport.state || Tone.Transport.state !== "started") {
    Tone.Transport.start();
  }
  startAmbientMode();
  isPlaying = true;
};

btnStop.onclick = () => {
  Tone.Transport.stop();
  isPlaying = false;
};

btnAuto.onclick = () => {
  autoMode = !autoMode;
  if (autoMode) {
    scheduleAuto();
    btnAuto.textContent = "Auto*";
  } else {
    if (autoTimer) clearTimeout(autoTimer);
    btnAuto.textContent = "Auto";
  }
};

btnRave.onclick = async () => {
  await Tone.start();
  if (!Tone.Transport.state || Tone.Transport.state !== "started") {
    Tone.Transport.start();
    isPlaying = true;
  }
  autoMode = false; // RAVE中はAuto切る
  btnAuto.textContent = "Auto";
  startRaveMode();
};

// =========================================
//  初期状態
// =========================================
applyFaders();
console.log("UCM Piano Ambient / RAVE Engine Loaded");