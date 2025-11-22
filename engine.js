//------------------------------------------------
//  Chill Piano Ambient — Zen / Acid Edition
//  Ambient作品＋Acid変形（同じモチーフをバキバキ化）
//------------------------------------------------

let isPlaying = false;
let autoMode  = false;
let acidMode  = false;

//--------------------------------------
// 背景マンダラ（軽量）
//--------------------------------------
const canvas = document.getElementById("bg");
const ctx     = canvas.getContext("2d");

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let tBG = 0;
function drawBG() {
  tBG += 0.002;
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const rMax = Math.min(w, h) * 0.35;

  // 背景グラデ
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h));
  g.addColorStop(0, "#081a2e");
  g.addColorStop(1, "#02070d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "rgba(150,200,255,0.22)";
  ctx.lineWidth = 0.6;

  // 一筆描きリング
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    const wobble = Math.sin(a * 3 + tBG * 2) * 4;
    const r = rMax + wobble;
    const x = r * Math.cos(a + tBG*0.1);
    const y = r * Math.sin(a + tBG*0.1);
    (a === 0) ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  requestAnimationFrame(drawBG);
}
drawBG();

//--------------------------------------
// Audio Graph（マスタとリバーブ）
//--------------------------------------
const master = new Tone.Volume(-18).toDestination();

const reverb = new Tone.Reverb({
  decay: 9,
  preDelay: 0.05,
  wet: 0.35
}).connect(master);

//--------------------------------------
// Ambient Piano / Pad
//--------------------------------------

// ピアノ（FM＋柔らかアタック）
const piano = new Tone.FMSynth({
  harmonicity: 1.5,
  modulationIndex: 2,
  oscillator: { type: "triangle" },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 3.0 },
  modulation: { type: "sine" },
  modulationEnvelope: {
    attack: 0.01, decay: 0.25, sustain: 0.15, release: 1.6
  }
}).connect(reverb);

// パッド（遠景・柔らか）
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 3, sustain: 0.9, release: 10 }
}).connect(reverb);
pad.volume.value = -16;

//--------------------------------------
// Acid 変形用：Kick / Bass
//--------------------------------------

const acidKick = new Tone.MembraneSynth({
  pitchDecay: 0.03,
  octaves: 6,
  envelope: { attack: 0.001, decay: 0.35, sustain: 0 }
}).connect(master);

// Acid Bass: Saw→Dist→Filter→Reverb
const acidDist = new Tone.Distortion(0.35);
const acidFilter = new Tone.Filter(900, "lowpass", -24).connect(reverb);
acidDist.connect(acidFilter);

const acidBass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.1 },
  filter: { Q: 10 },
}).connect(acidDist);
acidBass.volume.value = -14;

//--------------------------------------
// パターン（Ambient）
//--------------------------------------

const debussyScale = ["C4","D#4","G4","A#4","D5","F4"];

function playDebussy(time) {
  let t = time;
  for (let i=0; i<debussyScale.length; i++) {
    // ちょっと間引き（静けさ）
    if (Math.random() > 0.6) continue;
    const n = debussyScale[i];
    const vel = 0.35 + Math.random()*0.3;
    piano.triggerAttackRelease(n, "8n", t, vel);
    const swing = 1 + Math.sin(i*0.6)*0.25;
    t += Tone.Time("8n") * swing;
  }
}

// Fractal的アルペジオ（Pad）
const phi = 1.6180339887;
const arpNotes = ["C3","G3","D#3","A#2"];

function playArp(time) {
  for (let i=0; i<6; i++) {
    if (Math.random() > 0.7) continue;
    const idx = Math.floor((i * phi * 5) % arpNotes.length);
    const dt  = i * 0.12;
    pad.triggerAttackRelease(arpNotes[idx], "16n", time + dt, 0.22);
  }
}

//--------------------------------------
// パターン（Acid：同モチーフを変形）
//--------------------------------------

const acidScale = ["C3","C3","G2","C3","C3","G2","C3","A2"];
let acidStep = 0;

function playAcidBass(time) {
  const idx = acidStep % acidScale.length;
  const note = acidScale[idx];
  const vel  = 0.5 + Math.random()*0.2;
  acidBass.triggerAttackRelease(note, "16n", time, vel);
  acidStep++;
}

function playAcidKick(time) {
  acidKick.triggerAttackRelease("C1", "8n", time);
}

//--------------------------------------
// Loops
//--------------------------------------

// Ambient 作品ループ
const ambientLoop = new Tone.Loop((time) => {
  playDebussy(time);
  playArp(time + 0.4);
}, "1m");

// Acid 用ループ（最初は止めておく）
const acidKickLoop = new Tone.Loop((time) => {
  playAcidKick(time);
}, "4n");

const acidBassLoop = new Tone.Loop((time) => {
  playAcidBass(time);
}, "16n");

//--------------------------------------
// UI & パラメータ
//--------------------------------------

const fEnergy   = document.getElementById("fader_energy");
const fCreation = document.getElementById("fader_creation");
const fNature   = document.getElementById("fader_nature");
const modeLabel = document.getElementById("modeLabel");
const bpmLabel  = document.getElementById("bpmLabel");

let autoTimer = null;

function clamp(v, min, max) {
  return v < min ? min : (v > max ? max : v);
}

function applyFaders() {
  const energy   = parseInt(fEnergy.value, 10);
  const creation = parseInt(fCreation.value, 10);
  const nature   = parseInt(fNature.value, 10);

  // BPM マッピング（Acidのときは速く）
  const bpm = acidMode
    ? 115 + energy * 0.3     // 115〜145
    : 60  + energy * 0.3;    // 60〜90

  Tone.Transport.bpm.rampTo(bpm, 0.8);
  bpmLabel.textContent = "BPM: " + Math.round(bpm);

  // Pad の音量（Nature）
  const padVol = -20 + nature * 0.06;  // -20〜-14
  pad.volume.rampTo(padVol, 1.0);

  // Acid フィルタ（Creation）
  const cutoff = 400 + creation * 8;   // 400〜1200
  acidFilter.frequency.rampTo(cutoff, 0.8);
  acidDist.distortion = 0.2 + creation * 0.005; // 0.2〜0.7
}

// Auto ドリフト（Ambient用・軽め）
function scheduleAuto() {
  if (!autoMode) return;
  const delayMs = (60 + Math.random()*180) * 1000; // 1〜4分
  autoTimer = setTimeout(() => {
    fEnergy.value   = clamp(parseInt(fEnergy.value,10)   + (Math.random()*20-10), 0, 100);
    fCreation.value = clamp(parseInt(fCreation.value,10) + (Math.random()*20-10), 0, 100);
    fNature.value   = clamp(parseInt(fNature.value,10)   + (Math.random()*20-10), 0, 100);
    applyFaders();
    scheduleAuto();
  }, delayMs);
}

//--------------------------------------
// ボタン操作
//--------------------------------------

document.getElementById("btn_start").onclick = async () => {
  if (isPlaying) return;
  await Tone.start();              // ブラウザの制限解除
  Tone.Transport.start("+0.05");
  isPlaying = true;

  modeLabel.textContent = acidMode ? "Mode: Ambient + Acid" : "Mode: Ambient";
  ambientLoop.start(0);
  if (acidMode) {
    acidKickLoop.start(0);
    acidBassLoop.start("16n");
  }

  applyFaders();
};

document.getElementById("btn_stop").onclick = () => {
  isPlaying = false;
  Tone.Transport.stop();
};

document.getElementById("btn_auto").onclick = () => {
  autoMode = !autoMode;
  document.getElementById("btn_auto").textContent = autoMode ? "Auto*" : "Auto";
  if (!autoMode && autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
  } else if (autoMode) {
    scheduleAuto();
  }
};

// Acid ボタン：同じモチーフを一気にアシッド化
document.getElementById("btn_acid").onclick = () => {
  acidMode = !acidMode;

  if (acidMode) {
    modeLabel.textContent = "Mode: Ambient + Acid";
    if (isPlaying) {
      acidKickLoop.start(0);
      acidBassLoop.start("16n");
    }
  } else {
    modeLabel.textContent = "Mode: Ambient";
    acidKickLoop.stop();
    acidBassLoop.stop();
  }

  applyFaders();
};

// フェーダー変更時
[fEnergy, fCreation, fNature].forEach(el => {
  el.addEventListener("input", applyFaders);
});

// 初期適用
applyFaders();
