// ============================================
// UCM Piano Ambient — Debussy / Ravel / Aphex-ish
// 主旋律 + 伴奏 + パッド + 自然音 + オートモード
// ============================================

let isRunning = false;
let audioReady = false;

// UI refs
let els = {};

const State = {
  style: 30,      // 0=Classical, 100=Ambient
  energy: 25,     // 音数・テンポ
  space: 60,      // 残響 / 余白
  bright: 40,     // 明るさ
  volume: -16,    // dB
  autoLenMin: 3,  // 1〜5分
  autoEnabled: true,
};

// π と 黄金比
const PI_DIGITS = [3,1,4,1,5,9,2,6,5,3,5,8,9,7,9];
const PHI = 1.6180339887;
let piIndex = 0;
let phiPhase = 0;

// Tone.js ノード
let masterVol;
let reverb, delay;
let pianoLead, pianoComp, pad;
let natureNoise, natureFilter, natureGain;

// ループ
let chordLoop, compLoop, leadLoop, arpLoop, natureLoop;
let autoTimer = null;

// スケール／コード
// Cリディアン寄り（F#含む）で少しドビュッシー風
const SCALE = ["C4","D4","E4","F#4","G4","A4","B4","C5","D5","E5"];
const CHORDS_CLASSICAL = [
  ["C4","E4","G4","B4"],   // Cmaj7
  ["A3","C4","E4","G4"],   // Am7
  ["F3","A3","C4","E4"],   // Fmaj7
  ["D3","G3","C4","E4"],   // Gadd9/M7-ish
];

const CHORDS_AMBIENT = [
  ["C4","G4","D5"],
  ["D4","A4","E5"],
  ["E4","B4","F#5"],
  ["G3","D4","A4"],
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

function styleName(mix) {
  if (mix < 0.2) return "Classical";
  if (mix < 0.5) return "Classical-ish";
  if (mix < 0.8) return "Ambient-ish";
  return "Ambient";
}

// ------------------------------------
// Audio Graph Init
// ------------------------------------

function initAudioGraph() {
  if (audioReady) return;

  masterVol = new Tone.Volume(State.volume).toDestination();

  reverb = new Tone.Reverb({
    decay: 12,
    preDelay: 0.1,
    wet: 0.6,
  }).connect(masterVol);

  delay = new Tone.FeedbackDelay("8n", 0.3).connect(reverb);

  // ピアノ主旋律（少し柔らかめ）
  pianoLead = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.25, sustain: 0.4, release: 2.5 },
  }).connect(delay);

  // ピアノ伴奏（和音）
  pianoComp = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 3.5 },
  }).connect(reverb);

  // パッド（ストリングス風）
  pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 2.0, decay: 1.0, sustain: 0.85, release: 6.0 },
  }).connect(reverb);

  // 自然音（風・空調のようにかなり控えめ）
  natureNoise = new Tone.Noise("pink");
  natureFilter = new Tone.Filter(1800, "lowpass");
  natureGain = new Tone.Gain(0.02); // かなり小さく
  natureNoise.connect(natureFilter).connect(natureGain).connect(reverb);
  natureNoise.start();

  setupLoops();

  audioReady = true;
}

// ------------------------------------
// Loops: コード / 伴奏 / 主旋律 / アルペジオ / 自然音
// ------------------------------------

function setupLoops() {
  let chordIdx = 0;

  // 1) Pad & Piano block chords（2小節ごと）
  chordLoop = new Tone.Loop((time) => {
    const mix = State.style / 100; // 0=Classical, 1=Ambient
    const useClassical = mix < 0.6;
    const chordSet = useClassical ? CHORDS_CLASSICAL : CHORDS_AMBIENT;

    // πで次のコード選択（飛び方がフラクタル）
    const step = nextPiDigit() % chordSet.length;
    chordIdx = (chordIdx + step) % chordSet.length;
    const chord = chordSet[chordIdx];

    const padVel = mapValue(State.energy, 0, 100, 0.35, 0.9);
    const compVel = mapValue(State.space, 0, 100, 0.5, 0.2);

    // Pad（背景のストリングス）
    pad.triggerAttackRelease(chord, "2m", time, padVel);

    // Piano block chord（少し遅れて入る）
    pianoComp.triggerAttackRelease(chord, "2n", time + 0.15, compVel);
  }, "2m");

  // 2) Piano accompaniment（4分ごとに和音シンコペーション）
  compLoop = new Tone.Loop((time) => {
    const mix = State.style / 100;
    if (mix > 0.8) return; // アンビエント寄りでは控えめ

    const density = mapValue(State.energy, 0, 100, 0.2, 0.85);
    if (!rand(density)) return;

    const chordSet = mix < 0.5 ? CHORDS_CLASSICAL : CHORDS_AMBIENT;
    const c = chordSet[chordIdx];
    if (!c) return;

    const notes = c.slice(0, 3);
    const vel = mapValue(State.space, 0, 100, 0.4, 0.2);
    pianoComp.triggerAttackRelease(notes, "4n", time, vel);
  }, "4n");

  // 3) Piano Lead（主旋律）— π + 黄金比 でノート決定
  leadLoop = new Tone.Loop((time) => {
    const restProb = mapValue(State.space, 0, 100, 0.15, 0.5);
    if (rand(restProb)) return;

    const density = mapValue(State.energy, 0, 100, 0.3, 0.9);
    if (!rand(density)) return;

    const mix = State.style / 100;

    const d = nextPiDigit();   // π 桁
    phiPhase += PHI;
    let idx = Math.floor((d + phiPhase) % SCALE.length);

    // Aphex-ish: たまに Whole-tone 的に +2 ずらす
    if (Math.random() < 0.15 && mix > 0.3) {
      idx = (idx + 2) % SCALE.length;
    }

    const note = SCALE[idx];

    const dur = rand(0.3) ? "8n" : "4n";
    const vel = mapValue(State.bright, 0, 100, 0.35, 0.85);

    pianoLead.triggerAttackRelease(note, dur, time, vel);
  }, "8n");

  // 4) Arp（エネルギーが上がると細かく動く）
  arpLoop = new Tone.Loop((time) => {
    const energy = State.energy;
    if (energy < 20) return; // 静のときはお休み

    const prob = mapValue(energy, 20, 100, 0.2, 0.9);
    if (!rand(prob)) return;

    const chordSet = CHORDS_CLASSICAL;
    const c = chordSet[chordIdx];
    if (!c) return;

    const note = c[Math.floor(Math.random() * c.length)];
    const vel = mapValue(State.bright, 0, 100, 0.2, 0.7);

    pianoLead.triggerAttackRelease(note, "16n", time, vel);
  }, "16n");

  // 5) Nature（風のような息）
  natureLoop = new Tone.Loop((time) => {
    const mix = State.style / 100;
    const base = mapValue(State.space, 0, 100, 0.01, 0.05);
    const extra = mapValue(mix, 0, 1, 0.0, 0.03);
    const g = clamp(base + extra, 0.0, 0.08);
    natureGain.gain.rampTo(g, 2.0);

    const freq = mapValue(State.bright, 0, 100, 1500, 3500);
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
  Tone.Transport.bpm.rampTo(bpmBase, 0.4);

  // Reverb & Delay
  if (reverb) {
    const wet = mapValue(State.space, 0, 100, 0.35, 0.9);
    reverb.wet.rampTo(wet, 1.0);
  }
  if (delay) {
    const fb = mapValue(State.space, 0, 100, 0.15, 0.4);
    delay.feedback.rampTo(fb, 0.6);
  }

  // Brightness → EQ 的なものは synth 設定に軽く反映している想定
  // Volume
  if (masterVol) {
    masterVol.volume.rampTo(State.volume, 0.4);
  }

  // UI
  const mixName = styleName(mix);
  if (els.styleLabel) els.styleLabel.textContent = `Style: ${mixName}`;
  if (els.bpmLabel) els.bpmLabel.textContent = `Tempo: ${Math.round(bpmBase)} BPM`;
}

// ------------------------------------
// Auto モード
// ------------------------------------

function scheduleAuto() {
  if (autoTimer) clearTimeout(autoTimer);
  if (!State.autoEnabled) return;

  const mins = State.autoLenMin;
  const ms = mins * 60 * 1000;

  autoTimer = setTimeout(() => {
    // ゆっくりランダムウォーク
    State.style  = clamp(State.style  + (Math.random() - 0.5) * 18, 0, 100);
    State.energy = clamp(State.energy + (Math.random() - 0.5) * 18, 0, 100);
    State.space  = clamp(State.space  + (Math.random() - 0.5) * 18, 0, 100);

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
      compLoop.start("4n");
      leadLoop.start("8n");
      arpLoop.start("16n");
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
      compLoop.stop();
      leadLoop.stop();
      arpLoop.stop();
      natureLoop.stop();
      isRunning = false;
      if (els.status) els.status.textContent = "Stopped";
    };
  }

  onChange();
}

// ------------------------------------
// 背景キャンバス（そのままでもOK）
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

// ------------------------------------
// INIT
// ------------------------------------

window.addEventListener("DOMContentLoaded", () => {
  bindUI();
  startCanvas();
  console.log("UCM Piano Ambient — Debussy/Ravel/Aphex-ish Ready");
});