// ============================================
// UCM Piano Ambient — Fractal Edition
// ============================================

let isRunning = false;
let audioReady = false;

// UI refs（DOMContentLoaded後に代入）
let els = {};

const State = {
  style: 30,
  energy: 25,
  space: 60,
  bright: 40,
  volume: -16,
  autoLenMin: 3,
  autoEnabled: true,
};

// π と 黄金比
const PI_DIGITS = [3,1,4,1,5,9,2,6,5,3,5,8,9,7,9];
const PHI = 1.6180339887;
let piIndex = 0;
let phiPhase = 0;

// Tone.js ノード
let masterVol;
let reverb;
let piano, pad;
let natureNoise, natureFilter, natureGain;

// ループ
let chordLoop, pianoLoop, companionLoop, natureLoop;
let autoTimer = null;

// スケール／コード
const SCALE = ["C4","D4","E4","G4","A4","C5","D5","E5"];
const CHORDS_CLASSICAL = [
  ["C4","E4","G4","B4"],   // Cmaj7
  ["A3","C4","E4","G4"],   // Am7
  ["F3","A3","C4","E4"],   // Fmaj7
  ["G3","B3","D4","F4"],   // G7
];

const CHORDS_AMBIENT = [
  ["C4","G4"],
  ["D4","A4"],
  ["E4","B4"],
  ["G3","D4"],
];

// ------------------------------------
// ユーティリティ
// ------------------------------------

function mapValue(x, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  const t = (x - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function rand(prob) {
  return Math.random() < prob;
}

function nextPiDigit() {
  const d = PI_DIGITS[piIndex];
  piIndex = (piIndex + 1) % PI_DIGITS.length;
  return d;
}

// ------------------------------------
// Audio Graph Init
// ------------------------------------

function initAudioGraph() {
  if (audioReady) return;

  masterVol = new Tone.Volume(State.volume).toDestination();

  reverb = new Tone.Reverb({
    decay: 10,
    preDelay: 0.08,
    wet: 0.5,
  }).connect(masterVol);

  // ピアノっぽいFM
  piano = new Tone.PolySynth(Tone.FMSynth, {
    volume: -10,
    options: {
      modulationIndex: 4,
      harmonicity: 1.5,
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 2.0 },
      modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 1.0 },
    }
  }).connect(reverb);

  // パッド
  pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 1.5, decay: 1.0, sustain: 0.8, release: 6.0 },
  }).connect(reverb);

  // 自然音（かなり控えめ）
  natureNoise = new Tone.Noise("pink");
  natureFilter = new Tone.Filter(2000, "lowpass");
  natureGain = new Tone.Gain(0.03); // かなり小さく
  natureNoise.connect(natureFilter).connect(natureGain).connect(reverb);
  natureNoise.start();

  // ループ定義
  setupLoops();

  audioReady = true;
}

// ------------------------------------
// Loops
// ------------------------------------

function setupLoops() {
  let chordIdx = 0;

  // 1) Chord Pad Loop（2小節ごと）
  chordLoop = new Tone.Loop((time) => {
    const mix = State.style / 100; // 0=Classical, 1=Ambient
    const padWeight = mapValue(State.space, 0, 100, 0.4, 1.0);

    const useClassical = mix < 0.5;
    const chordSet = useClassical ? CHORDS_CLASSICAL : CHORDS_AMBIENT;

    const stepPi = nextPiDigit();
    chordIdx = (chordIdx + (stepPi % chordSet.length)) % chordSet.length;
    const chord = chordSet[chordIdx];

    const velPad = mapValue(State.energy, 0, 100, 0.35, 0.9) * padWeight;
    pad.triggerAttackRelease(chord, "2m", time, velPad);

    // クラシカル寄りのときだけピアノでブロックコード
    if (useClassical) {
      const velPiano = mapValue(State.space, 0, 100, 0.5, 0.2);
      piano.triggerAttackRelease(chord, "2n", time + 0.1, velPiano);
    }
  }, "2m");

  // 2) Piano Arp（π + φ によるフラクタル）
  pianoLoop = new Tone.Loop((time) => {
    const mix = State.style / 100;
    const restProb = mapValue(State.space, 0, 100, 0.15, 0.55);

    if (rand(restProb)) return; // 余白

    // Energy が低いときは密度を下げる
    const density = mapValue(State.energy, 0, 100, 0.15, 0.7);
    if (!rand(density)) return;

    // πと黄金比でノート選択
    const d = nextPiDigit();           // πの桁
    phiPhase += PHI;
    const idx = Math.floor((d + phiPhase) % SCALE.length);
    const note = SCALE[idx];

    const dur = rand(0.3) ? "8n" : "4n";
    const vel = mapValue(State.bright, 0, 100, 0.2, 0.8);

    piano.triggerAttackRelease(note, dur, time, vel);
  }, "8n");

  // 3) Companion（先行する伴走ライン）
  companionLoop = new Tone.Loop((time) => {
    const mix = State.style / 100;
    if (mix > 0.8) return; // Ambient寄りではほぼお休み

    const ahead = mapValue(State.energy, 0, 100, 0.05, 0.2); // 少し先行
    const d = nextPiDigit();
    const idx = (d * 2) % SCALE.length;
    const note = SCALE[idx];

    const vel = mapValue(State.space, 0, 100, 0.1, 0.5);
    piano.triggerAttackRelease(note, "8n", time - ahead, vel);
  }, "4n");

  // 4) Nature（風のような息）
  natureLoop = new Tone.Loop((time) => {
    const mix = State.style / 100;
    const base = mapValue(State.space, 0, 100, 0.01, 0.06);
    const extra = mapValue(mix, 0, 1, 0.0, 0.03);
    const g = clamp(base + extra, 0.0, 0.08);
    natureGain.gain.rampTo(g, 2.0);

    // フィルタもわずかに揺らす
    const freq = mapValue(State.bright, 0, 100, 1500, 4000);
    natureFilter.frequency.rampTo(freq, 5.0);
  }, "2m");
}

// ------------------------------------
// パラメータ適用
// ------------------------------------

function applyParams() {
  const mix = State.style / 100;

  // BPM：クラシカル寄りで遅く、Ambient寄りで少し速い
  let bpmBase = mix < 0.5
    ? mapValue(mix, 0, 0.5, 60, 76)
    : mapValue(mix, 0.5, 1.0, 76, 92);

  bpmBase += mapValue(State.energy, 0, 100, -6, +6);
  bpmBase = clamp(bpmBase, 50, 100);

  Tone.Transport.bpm.rampTo(bpmBase, 0.5);

  // Reverb量
  if (reverb) {
    const wet = mapValue(State.space, 0, 100, 0.3, 0.85);
    reverb.wet.rampTo(wet, 1.0);
  }

  // マスター音量
  if (masterVol) {
    masterVol.volume.rampTo(State.volume, 0.4);
  }

  // UI
  if (els.styleLabel) {
    const name =
      mix < 0.2 ? "Classical" :
      mix < 0.5 ? "Classical-ish" :
      mix < 0.8 ? "Ambient-ish" :
                  "Ambient";
    els.styleLabel.textContent = `Style: ${name}`;
  }
  if (els.bpmLabel) {
    els.bpmLabel.textContent = `Tempo: ${Math.round(bpmBase)} BPM`;
  }
}

// ------------------------------------
// Auto モード（1〜5分のゆっくり変化）
// ------------------------------------

function scheduleAuto() {
  if (autoTimer) clearTimeout(autoTimer);
  if (!State.autoEnabled) return;

  const mins = State.autoLenMin;
  const ms = mins * 60 * 1000;

  autoTimer = setTimeout(() => {
    // Style / Energy / Space を少しだけランダムウォーク
    State.style  = clamp(State.style  + (Math.random() - 0.5) * 20, 0, 100);
    State.energy = clamp(State.energy + (Math.random() - 0.5) * 20, 0, 100);
    State.space  = clamp(State.space  + (Math.random() - 0.5) * 20, 0, 100);

    // UIにも反映
    els.fStyle.value  = State.style;
    els.fEnergy.value = State.energy;
    els.fSpace.value  = State.space;

    applyParams();
    scheduleAuto();
  }, ms);
}

// ------------------------------------
// UI セットアップ
// ------------------------------------

function bindUI() {
  els = {
    fStyle:  document.getElementById("fader_style"),
    fEnergy: document.getElementById("fader_energy"),
    fSpace:  document.getElementById("fader_space"),
    fBright: document.getElementById("fader_bright"),
    fVol:    document.getElementById("fader_volume"),
    fAuto:   document.getElementById("auto_len"),
    autoToggle: document.getElementById("auto_toggle"),
    btnStart: document.getElementById("btn_start"),
    btnStop:  document.getElementById("btn_stop"),
    status:   document.getElementById("status-text"),
    styleLabel: document.getElementById("style-label"),
    bpmLabel:   document.getElementById("bpm-label"),
  };

  const onChange = () => {
    State.style  = parseInt(els.fStyle.value, 10);
    State.energy = parseInt(els.fEnergy.value, 10);
    State.space  = parseInt(els.fSpace.value, 10);
    State.bright = parseInt(els.fBright.value, 10);
    State.volume = parseInt(els.fVol.value, 10);
    State.autoLenMin = parseInt(els.fAuto.value, 10);
    State.autoEnabled = els.autoToggle.checked;

    applyParams();
  };

  [els.fStyle, els.fEnergy, els.fSpace, els.fBright, els.fVol, els.fAuto]
    .forEach(el => el && el.addEventListener("input", () => { onChange(); scheduleAuto(); }));

  if (els.autoToggle) {
    els.autoToggle.addEventListener("change", () => {
      State.autoEnabled = els.autoToggle.checked;
      scheduleAuto();
    });
  }

  if (els.btnStart) {
    els.btnStart.onclick = async () => {
      if (isRunning) return;

      await Tone.start();
      if (Tone.context.state !== "running") await Tone.context.resume();

      if (!audioReady) initAudioGraph();

      applyParams();
      scheduleAuto();

      chordLoop.start(0);
      pianoLoop.start("4n");
      companionLoop.start("2n");
      natureLoop.start("1m");
      Tone.Transport.start("+0.1");

      isRunning = true;
      if (els.status) els.status.textContent = "Playing…";
    };
  }

  if (els.btnStop) {
    els.btnStop.onclick = () => {
      if (!isRunning) return;
      Tone.Transport.stop();
      chordLoop.stop();
      pianoLoop.stop();
      companionLoop.stop();
      natureLoop.stop();
      isRunning = false;
      if (els.status) els.status.textContent = "Stopped";
    };
  }

  onChange();
}

// ------------------------------------
// 背景キャンバス：ゆるいフラクタル波
// ------------------------------------

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
    ctx.strokeStyle = "rgba(160,200,255,0.35)";
    ctx.lineWidth = 0.8;

    const rings = 4;
    for (let r = 0; r < rings; r++) {
      const radius = (Math.min(w, h) / 4) * ((r+1)/rings);
      ctx.beginPath();
      for (let i = 0; i <= 360; i += 5) {
        const rad = (i * Math.PI) / 180;
        const noise =
          6 * Math.sin(rad * (3+r) + t* (1 + r*0.3)) *
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

// ------------------------------------
// INIT
// ------------------------------------

window.addEventListener("DOMContentLoaded", () => {
  bindUI();
  startCanvas();
  console.log("UCM Piano Ambient — Fractal Edition Ready");
});