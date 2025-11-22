//------------------------------------------------
//  UCM Ambient Piano — Zen / RAVE（軽量・高音質）
//------------------------------------------------

let isPlaying = false;
let autoMode = false;
let currentMode = "ambient";

//--------------------------------------
// 背景（最軽量マンダラ）
//--------------------------------------
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

let t = 0;
function draw() {
  t += 0.002;

  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;

  // background
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h));
  g.addColorStop(0, "#081a2e");
  g.addColorStop(1, "#02070d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.translate(cx, cy);
  ctx.strokeStyle = "rgba(150,200,255,0.22)";
  ctx.lineWidth = 0.5;

  const rMax = Math.min(w, h) * 0.35;

  ctx.beginPath();
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    const wobble = Math.sin(a * 3 + t * 2) * 4;
    const r = rMax + wobble;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    (a === 0) ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.resetTransform();

  requestAnimationFrame(draw);
}
draw();

//--------------------------------------
// Audio Graph
//--------------------------------------
const master = new Tone.Volume(-18).toDestination();

// Ambient piano
const piano = new Tone.FMSynth({
  harmonicity: 1.5,
  modulationIndex: 2,
  oscillator: { type: "triangle" },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 3.2 }
}).connect(master);

// Pad
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 3, sustain: 0.9, release: 8 }
}).connect(master);
pad.volume.value = -16;

// RAVE instruments
const kick = new Tone.MembraneSynth().connect(master);
const raveLead = new Tone.Synth({ 
  oscillator: { type: "sawtooth" }, 
  envelope: { attack: 0.03, decay: 0.2, sustain: 0.5, release: 0.2 } 
}).connect(master);

//--------------------------------------
// Piano Patterns
//--------------------------------------
const debussyScale = ["C4","D#4","G4","A#4","D5","F4"];
function playDebussy(time) {
  const n = debussyScale[Math.floor(Math.random() * debussyScale.length)];
  piano.triggerAttackRelease(n, "8n", time, 0.5);
}

// Fractal Arp
const phi = 1.6180339;
const arpNotes = ["C3","G3","D#3","A#2"];
function playArp(time) {
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor((i * phi * 13) % arpNotes.length);
    pad.triggerAttackRelease(arpNotes[idx], "16n", time + i * 0.12, 0.25);
  }
}

//--------------------------------------
// Loops
//--------------------------------------
const ambientLoop = new Tone.Loop((time) => {
  playDebussy(time);
  playArp(time + 0.4);
}, "1m");

const raveLoop = new Tone.Loop((time) => {
  kick.triggerAttackRelease("C1", "8n", time);
  raveLead.triggerAttackRelease("C5", "16n", time + 0.1);
}, "4n");

//--------------------------------------
// UI Logic
//--------------------------------------
function applyFaders() {
  const energy = +document.getElementById("fader_energy").value;
  const bpm = currentMode === "ambient"
    ? 60 + (energy * 0.3)
    : 135 + (energy * 0.15);
  Tone.Transport.bpm.rampTo(bpm, 1);
  document.getElementById("bpmLabel").textContent = "BPM: " + Math.round(bpm);
}

document.getElementById("btn_start").onclick = async () => {
  await Tone.start();
  Tone.Transport.start("+0.1");

  currentMode = "ambient";
  document.getElementById("modeLabel").textContent = "Mode: Ambient";

  raveLoop.stop();
  ambientLoop.start(0);

  applyFaders();
};

document.getElementById("btn_stop").onclick = () => {
  Tone.Transport.stop();
};

document.getElementById("btn_rave").onclick = async () => {
  await Tone.start();
  Tone.Transport.start("+0.1");

  currentMode = "rave";
  document.getElementById("modeLabel").textContent = "Mode: RAVE";

  ambientLoop.stop();
  raveLoop.start(0);

  applyFaders();
};

// Auto Mode
document.getElementById("btn_auto").onclick = () => {
  autoMode = !autoMode;
  document.getElementById("btn_auto").textContent = autoMode ? "Auto*" : "Auto";
};

// Faders
["fader_energy","fader_creation","fader_nature"].forEach(id => {
  document.getElementById(id).oninput = applyFaders;
});