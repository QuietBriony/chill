//------------------------------------------------------
// グローバル状態（UI値）
//------------------------------------------------------
let energyVal   = 0.6;
let creationVal = 0.5;
let natureVal   = 0.4;

//------------------------------------------------------
// Canvas 初期化（Cyber-Zen マンダラ）
//------------------------------------------------------
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// 軽量 24fps 描画
let last = 0;
function draw(t) {
  if (t - last < 1000 / 24) {
    requestAnimationFrame(draw);
    return;
  }
  last = t;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const rings = 10 + Math.floor(6 * creationVal);
  const baseR = Math.min(cx, cy) * 0.33;
  const drift = Math.sin(t * 0.00035) * (30 + 25 * natureVal);

  for (let i = 0; i < rings; i++) {
    const r = baseR + i * 20 + drift * Math.sin(i * 0.6);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);

    ctx.strokeStyle = `rgba(120,180,255, ${0.12 + energyVal * 0.15})`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}
draw(0);

//------------------------------------------------------
// Tone.js 音響パイプライン
//------------------------------------------------------
Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.12;

// 全体ゲイン
const master = new Tone.Gain(0.9).toDestination();

// Piano（Salamander）
const piano = new Tone.Sampler({
  urls: {
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3"
  },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
  release: 2.0
}).connect(master);

// Pad（コード / フィルタ / リバーブ）
const padFilter = new Tone.Filter(900, "lowpass");
const padVerb   = new Tone.Reverb(3);
padVerb.wet.value = 0.4;

const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 1.2, release: 3 }
}).chain(padFilter, padVerb, master);

// Acid Bass（303っぽい）
const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  filter: { type: "lowpass", rolloff: -24 },
  envelope: { attack: 0.01, decay: 0.18, sustain: 0.1, release: 0.25 },
  filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 }
});
const bassGain = new Tone.Gain(0.65).connect(master);
bass.connect(bassGain);

// Kick / Hat
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.008,
  octaves: 3,
  envelope: { attack: 0.001, decay: 0.25, sustain: 0 }
}).connect(master);

const hat = new Tone.NoiseSynth({
  envelope: { attack: 0.001, decay: 0.07 }
}).connect(master);

let acidOn = false;

//------------------------------------------------------
// Loops（ピアノ右手 / 左手 / Pad / Acid）
//------------------------------------------------------

// ピアノ右手：美メロ
const scale = ["C4","D4","E4","G4","A4","C5","D5","E5","G5"];

const melodyLoop = new Tone.Loop(time => {
  if (Math.random() < (0.25 + energyVal * 0.6)) {
    const note = scale[Math.floor(Math.random() * scale.length)];
    const dur  = ["16n","8n","8t","4n"][Math.floor(Math.random() * 4)];
    piano.triggerAttackRelease(note, dur, time);
  }
}, "16n");

// ピアノ左手：ベース
const bassNotes = ["C2","G2","D2","E2"];
let bi = 0;

const leftLoop = new Tone.Loop(time => {
  piano.triggerAttackRelease(bassNotes[bi % bassNotes.length], "2n", time);
  bi++;
}, () => natureVal < 0.5 ? "2m" : "1m");

// Pad コード循環
const chords = [
  ["C4","E4","G4","B4"],
  ["A3","E4","A4","C5"],
  ["F4","A4","C5","E5"],
  ["G3","D4","G4","A4"]
];
let ci = 0;

const padLoop = new Tone.Loop(time => {
  padFilter.frequency.rampTo(700 + energyVal * 1200, 2);
  pad.triggerAttackRelease(chords[ci], "2m", time);
  ci = (ci + 1) % chords.length;
}, "2m");

// Acid ループ
const acidLoop = new Tone.Loop(time => {
  if (!acidOn) return;

  kick.triggerAttackRelease("C1", "8n", time);

  const pat = [0, 0.25, 0.5, 0.75];
  pat.forEach(p => {
    if (Math.random() < 0.45 + creationVal * 0.5) {
      bass.triggerAttackRelease("C2", "16n", time + p);
    }
  });

  if (Math.random() < (0.35 + natureVal * 0.4)) {
    hat.triggerAttackRelease("16n", time + 0.5);
  }
}, "1n");

//------------------------------------------------------
// Auto Drift（BPM & フェーダー）
//------------------------------------------------------
let autoOn = false;
function autoTick() {
  if (!autoOn) return;

  const next = 82 + (Math.random() * 4 - 2) * natureVal;
  Tone.Transport.bpm.rampTo(next, 6);

  creationVal = Math.min(1, Math.max(0, creationVal + (Math.random() * 0.07 - 0.035)));
  natureVal   = Math.min(1, Math.max(0, natureVal   + (Math.random() * 0.07 - 0.035)));

  document.getElementById("creation").value = creationVal;
  document.getElementById("nature").value   = natureVal;

  setTimeout(autoTick, 7000);
}

//------------------------------------------------------
// UI Events（iPhone Touch Unlock 対応）
//------------------------------------------------------
let busy    = false;
let started = false;

const startBtn = document.getElementById("startBtn");
const stopBtn  = document.getElementById("stopBtn");
const acidBtn  = document.getElementById("acidBtn");
const autoBtn  = document.getElementById("autoBtn");

startBtn.onclick = async () => {
  if (busy) return;
  busy = true;
  setTimeout(() => busy = false, 250);

  try {
    // iOS Safari: WebAudio 解禁
    await Tone.start();

    const ctx = Tone.getContext();
    if (ctx.state !== "running") {
      await ctx.resume();
    }

    // ピアノサンプル読み込み完了まで待つ（無音防止）
    await piano.loaded;

    if (!started) {
      // タイムライン初期化
      Tone.Transport.position = 0;
      melodyLoop.start(0);
      leftLoop.start(0);
      padLoop.start(0);
      acidLoop.start(0);
      started = true;
    }

    Tone.Transport.start("+0.05");
    startBtn.textContent = "▶ PLAYING";
  } catch (e) {
    console.warn(e);
    alert("iPhone がオーディオをブロックしました。\n画面を一度タップしてから、もう一度 START を押してください。");
  }
};

stopBtn.onclick = () => {
  Tone.Transport.stop();
};

acidBtn.onclick = () => {
  acidOn = !acidOn;
};

autoBtn.onclick = () => {
  autoOn = !autoOn;
  if (autoOn) autoTick();
};

// Sliders -> 値をリアルタイム反映
document.getElementById("energy").oninput   = e => energyVal   = parseFloat(e.target.value);
document.getElementById("creation").oninput = e => creationVal = parseFloat(e.target.value);
document.getElementById("nature").oninput   = e => natureVal   = parseFloat(e.target.value);