// ======================================================
// UCM Mandala Engine – Classical / Ambient Style Blend
// - Style: Classical ⇄ Ambient（連続ミックス）
// - Energy: 静⇄動（BPM / 厚み）
// - Creation: 生成の派手さ（音数 / テンション）
// - Void: 余白（休符 / 薄さ）
// - オート：Style にゆっくり揺らぎ（約 2 分周期）
// ======================================================

let isRunning = false;
let audioInitialized = false;

// --------------------
// 状態
// --------------------
const State = {
  style: 25,    // 0–100: Classical → Ambient
  energy: 40,   // 0–100: 静→動
  creation: 50, // 0–100: 派手さ
  voidAmt: 20,  // 0–100: 余白
};

// 内部パラメータ
const EngineParams = {
  styleMix: 0.25,  // 0=Classical, 1=Ambient（オート揺らぎ込み）
  restProb: 0.2,
  padDensity: 0.7,
};

// Tone.js 共通ノード
const masterGain = new Tone.Gain(0.9).toDestination();
const reverb = new Tone.Reverb({
  decay: 4,
  preDelay: 0.03,
  wet: 0.35,
}).connect(masterGain);
const delay = new Tone.FeedbackDelay("8n", 0.25).connect(masterGain);

// 楽器
let classicalPad, ambientPad, pianoSynth, fluteSynth, noiseSynth, subSynth;
// LFO
let classicalDriftLFO, ambientDriftLFO, reverbBreathLFO;

// ループ
let padLoop = null;
let textureLoop = null;

// ======================================================
// Helper
// ======================================================

function mapValue(x, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  const t = (x - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function rand(prob) {
  return Math.random() < prob;
}

function styleNameFromMix(mix) {
  if (mix < 0.2) return "Classical";
  if (mix < 0.5) return "Classical-ish";
  if (mix < 0.8) return "Ambient-ish";
  return "Ambient";
}

// ======================================================
// Audio 初期化
// ======================================================

function initAudioGraph() {
  if (audioInitialized) return;

  // クラシカル系パッド（ストリングスっぽい）
  classicalPad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.6, decay: 0.8, sustain: 0.7, release: 3.5 },
  }).connect(reverb);

  // アンビエント系パッド（柔らか）
  ambientPad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 1.2, decay: 1.0, sustain: 0.8, release: 4.0 },
  }).connect(reverb);

  // ピアノ的アタック（クラシカル側）
  pianoSynth = new Tone.FMSynth({
    modulationIndex: 4,
    harmonicity: 1.5,
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.8 },
  }).connect(reverb);

  // フルート的（上モノ）
  fluteSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.1, decay: 0.4, sustain: 0.6, release: 1.8 },
  }).connect(reverb);

  // アンビエントノイズ（風・空調系）
  noiseSynth = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 1.0, decay: 2.5, sustain: 0.0, release: 3.0 },
  }).connect(reverb);

  // サブベース（ゆるい底）
  subSynth = new Tone.MonoSynth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.4, decay: 1.0, sustain: 0.7, release: 2.0 },
    filter: { type: "lowpass", frequency: 120, Q: 1 },
  }).connect(masterGain);

  // 倍音揺らぎ LFO（detune）
  classicalDriftLFO = new Tone.LFO({
    frequency: 0.03, // ~30秒周期
    min: -8,
    max: 8,
  });
  classicalDriftLFO.connect(classicalPad.detune);
  classicalDriftLFO.start();

  ambientDriftLFO = new Tone.LFO({
    frequency: 0.02, // ~50秒周期
    min: -5,
    max: 5,
  });
  ambientDriftLFO.connect(ambientPad.detune);
  ambientDriftLFO.start();

  // リバーブの“呼吸”
  reverbBreathLFO = new Tone.LFO({
    frequency: 0.01, // ~100秒周期
    min: 0.25,
    max: 0.55,
  });
  reverbBreathLFO.connect(reverb.wet);
  reverbBreathLFO.start();

  // パッドループ（2小節ごと）
  padLoop = new Tone.Loop(onPadLoop, "2m");

  // テクスチャループ（8分音符刻み）
  textureLoop = new Tone.Loop(onTextureLoop, "8n");

  audioInitialized = true;
}

// ======================================================
// スタイルミックス計算（クラシカル⇄アンビエント）
// ======================================================

function computeStyleBlend() {
  const now = Tone.now();

  // ユーザーの Style フェーダー
  const baseMix = State.style / 100; // 0–1
  // オート揺らぎ（約 120 秒周期で ±0.15）
  const wobble = 0.15 * Math.sin(now * (2 * Math.PI / 120));
  const mix = clamp(baseMix + wobble, 0, 1);

  EngineParams.styleMix = mix;

  // Void → 休符率
  EngineParams.restProb = mapValue(State.voidAmt, 0, 100, 0.05, 0.6);

  // Creation → パッド出現頻度
  EngineParams.padDensity = mapValue(State.creation, 0, 100, 0.4, 0.9);

  // BPM：クラシカル寄りでゆっくり、アンビエント寄りで少しだけ速く
  let bpmBase;
  if (mix < 0.5) {
    const t = mix / 0.5;
    bpmBase = lerp(70, 80, t);
  } else {
    const t = (mix - 0.5) / 0.5;
    bpmBase = lerp(80, 96, t);
  }
  // Energy で微調整
  let bpm = bpmBase + mapValue(State.energy, 0, 100, -6, 8);
  bpm = clamp(bpm, 50, 110);

  Tone.Transport.bpm.rampTo(bpm, 0.4);

  // UI 更新
  const styleLabel = document.getElementById("style-label");
  const bpmLabel = document.getElementById("bpm-label");
  if (styleLabel) styleLabel.textContent = "Style: " + styleNameFromMix(mix);
  if (bpmLabel) bpmLabel.textContent = `Tempo: ${Math.round(bpm)} BPM`;
}

// ======================================================
// ループ：パッド（和音）
// ======================================================

const CLASSICAL_CHORDS = [
  ["D4", "G4", "B4", "E5"],   // Gmaj9系
  ["C4", "E4", "G4", "B4"],   // Cmaj7
  ["F3", "A3", "C4", "E4"],   // Fmaj7
  ["E3", "G4", "B4", "D5"],   // Em9
];

const AMBIENT_CHORDS = [
  ["C4", "G4"],
  ["D4", "A4"],
  ["E4", "B4"],
  ["G3", "D4"],
];

function onPadLoop(time) {
  const mix = EngineParams.styleMix;
  const classicalLevel = 1 - mix;
  const ambientLevel = mix;

  // Void → 休符
  if (rand(EngineParams.restProb)) return;

  // Creation → 出るかどうか
  if (!rand(EngineParams.padDensity)) return;

  // クラシカル側パッド
  if (classicalLevel > 0.05) {
    const idx = Math.floor(Math.random() * CLASSICAL_CHORDS.length);
    const chord = CLASSICAL_CHORDS[idx];
    const vel = classicalLevel * mapValue(State.creation, 0, 100, 0.4, 1.0);
    classicalPad.triggerAttackRelease(chord, "2m", time, vel);
  }

  // アンビエント側パッド
  if (ambientLevel > 0.05) {
    const idx = Math.floor(Math.random() * AMBIENT_CHORDS.length);
    const chord = AMBIENT_CHORDS[idx];
    const vel = ambientLevel * mapValue(100 - State.voidAmt, 0, 100, 0.3, 1.0);
    ambientPad.triggerAttackRelease(chord, "2m", time, vel);
  }
}

// ======================================================
// ループ：テクスチャ（ピアノ／フルート／ノイズ／サブ）
// ======================================================

const PIANO_SCALE = ["A3", "C4", "D4", "E4", "G4", "A4", "C5"];
const FLUTE_SCALE = ["E5", "G5", "A5", "C6"];

function onTextureLoop(time) {
  const mix = EngineParams.styleMix;
  const classicalLevel = 1 - mix;
  const ambientLevel = mix;

  // Void 強い → かなり休む
  if (rand(EngineParams.restProb + 0.1)) return;

  const baseProb = mapValue(State.creation, 0, 100, 0.05, 0.35);
  const pClass = baseProb * classicalLevel;
  const pAmb = baseProb * ambientLevel;

  // クラシカル側：ピアノ or フルート
  if (rand(pClass)) {
    if (Math.random() < 0.7) {
      const note = PIANO_SCALE[Math.floor(Math.random() * PIANO_SCALE.length)];
      pianoSynth.triggerAttackRelease(note, "8n", time, 0.5 + 0.4 * Math.random());
    } else {
      const note = FLUTE_SCALE[Math.floor(Math.random() * FLUTE_SCALE.length)];
      fluteSynth.triggerAttackRelease(note, "4n", time, 0.4 + 0.3 * Math.random());
    }
  }

  // アンビエント側：ノイズ or サブ
  if (rand(pAmb)) {
    if (Math.random() < 0.6) {
      // ノイズゆらぎ
      noiseSynth.triggerAttackRelease("2n", time);
    } else {
      // サブベース、Key: C / A あたり
      const roots = ["C1", "A1"];
      const root = roots[Math.floor(Math.random() * roots.length)];
      subSynth.triggerAttackRelease(root, "1n", time, 0.4);
    }
  }
}

// ======================================================
// UI 連携
// ======================================================

function updateFromUI() {
  const sStyle = document.getElementById("fader_style");
  const sEnergy = document.getElementById("fader_energy");
  const sCreation = document.getElementById("fader_creation");
  const sVoid = document.getElementById("fader_void");

  if (sStyle) State.style = parseInt(sStyle.value, 10) || 0;
  if (sEnergy) State.energy = parseInt(sEnergy.value, 10) || 0;
  if (sCreation) State.creation = parseInt(sCreation.value, 10) || 0;
  if (sVoid) State.voidAmt = parseInt(sVoid.value, 10) || 0;

  computeStyleBlend();
}

function attachUI() {
  const sStyle = document.getElementById("fader_style");
  const sEnergy = document.getElementById("fader_energy");
  const sCreation = document.getElementById("fader_creation");
  const sVoid = document.getElementById("fader_void");
  const btnStart = document.getElementById("btn_start");
  const btnStop = document.getElementById("btn_stop");
  const status = document.getElementById("status-text");

  const onChange = () => updateFromUI();

  if (sStyle) sStyle.addEventListener("input", onChange);
  if (sEnergy) sEnergy.addEventListener("input", onChange);
  if (sCreation) sCreation.addEventListener("input", onChange);
  if (sVoid) sVoid.addEventListener("input", onChange);

  if (btnStart) {
    btnStart.onclick = async () => {
      if (isRunning) return;

      if (!audioInitialized) {
        initAudioGraph();
      }
      await Tone.start();

      updateFromUI(); // 初期パラメータ反映

      padLoop.start(0);
      textureLoop.start("4n");
      Tone.Transport.start();

      isRunning = true;
      if (status) status.textContent = "Playing…";
    };
  }

  if (btnStop) {
    btnStop.onclick = () => {
      if (!isRunning) return;
      Tone.Transport.stop();
      padLoop.stop();
      textureLoop.stop();
      isRunning = false;
      if (status) status.textContent = "Stopped";
    };
  }
}

// ======================================================
// INIT
// ======================================================

window.addEventListener("DOMContentLoaded", () => {
  attachUI();
  updateFromUI();
  console.log("UCM Mandala Engine – Classical / Ambient Blend Ready");
});
