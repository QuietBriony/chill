//------------------------------------------------------
//  背景マンダラ（呼吸・発光）
//------------------------------------------------------
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

let energyVal = 0.5;
let creationVal = 0.5;
let natureVal = 0.5;

function draw(t) {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const cx = canvas.width/2;
  const cy = canvas.height/2;

  const rings = 12 + Math.floor(creationVal * 6);
  const brightness = 0.15 + energyVal * 0.25;
  const drift = Math.sin(t * 0.0004) * 20 * (natureVal + 0.3);

  for (let i = 0; i < rings; i++) {
    const r = 80 + i * 22 + drift * Math.sin(i * 0.8);
    ctx.strokeStyle = `rgba(150,200,255,${brightness})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.stroke();
  }
  requestAnimationFrame(draw);
}
draw(0);

//------------------------------------------------------
//  音響レイヤー
//------------------------------------------------------
Tone.Transport.bpm.value = 82;

// Piano Sampler
const piano = new Tone.Sampler({
  urls: {
    A3:"A3.mp3", C4:"C4.mp3", D#4:"Ds4.mp3", F#4:"Fs4.mp3", A4:"A4.mp3"
  },
  baseUrl:"https://tonejs.github.io/audio/salamander/",
  release: 2.5
}).toDestination();

// Pad
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator:{type:"sine"},
  envelope:{attack:1.5,release:4}
}).chain(new Tone.Filter(800,"lowpass"), new Tone.Reverb(4), Tone.Destination);

// Acid Synth
const bass = new Tone.MonoSynth({
  oscillator:{type:"sawtooth"},
  filter:{type:"lowpass",rolloff:-24},
  filterEnvelope:{attack:0.01,decay:0.2,sustain:0.1,release:0.3,baseFrequency:90,octaves:3}
}).chain(new Tone.Distortion(0.5), new Tone.Filter(200,"lowpass"), Tone.Destination);

const kick = new Tone.MembraneSynth({
  pitchDecay:0.01,
  octaves:3,
  envelope:{attack:0.001, decay:0.3, sustain:0}
}).toDestination();

const hat = new Tone.NoiseSynth({
  envelope:{attack:0.001, decay:0.08}
}).toDestination();

let acidOn = false;

//------------------------------------------------------
//  ピアノ右手（美メロフラクタル）
//------------------------------------------------------
const scale = ["C4","D4","E4","G4","A4","C5","D5","E5","G5"];

const melodyLoop = new Tone.Loop(time=>{
  const density = 0.3 + energyVal * 0.6; // 発音密度
  if (Math.random() < density) {
    const note = scale[Math.floor(Math.random()*scale.length)];
    const dur = ["8n","8t","16n","4n"][Math.floor(Math.random()*4)];
    piano.triggerAttackRelease(note, dur, time);
  }
}, "16n");

//------------------------------------------------------
//  ピアノ左手（揺れベース）
//------------------------------------------------------
const bassNotes = ["C2","G2","D2","E2"];
let bassIndex = 0;

const leftLoop = new Tone.Loop(time=>{
  const note = bassNotes[bassIndex % bassNotes.length];
  piano.triggerAttackRelease(note, "2n", time);
  bassIndex++;
}, ()=> (natureVal < 0.5 ? "2m" : "1m") );

//------------------------------------------------------
//  Pad（コード循環）
//------------------------------------------------------
const chords = [
  ["C4","E4","G4","B4"],
  ["A3","E4","A4","C5"],
  ["F4","A4","C5","E5"],
  ["G3","D4","G4","A4"]
];
let chordIndex = 0;

const padLoop = new Tone.Loop(time=>{
  pad.triggerAttackRelease(chords[chordIndex], "2m", time);
  chordIndex = (chordIndex+1)%chords.length;
}, "2m");

//------------------------------------------------------
//  Acid Loop（Kick/Bass/Hat）
//------------------------------------------------------
const acidLoop = new Tone.Loop(time=>{
  if (!acidOn) return;

  kick.triggerAttackRelease("C1","8n",time);

  // Bass groove
  const pat = [0, 0.25, 0.5, 0.75];
  pat.forEach(p=>{
    if (Math.random() < (0.5 + creationVal*0.5)) {
      bass.triggerAttackRelease("C2","16n", time + p);
    }
  });

  // Hat
  if (Math.random() < (0.4 + natureVal*0.4)) {
    hat.triggerAttackRelease("16n", time+0.5);
  }

}, "1n");

//------------------------------------------------------
//  Auto Mode
//------------------------------------------------------
let autoOn = false;

function autoTick() {
  if (!autoOn) return;

  // BPM
  const nextBPM = 82 + (Math.random()*6 - 3)*natureVal;
  Tone.Transport.bpm.rampTo(nextBPM, 8);

  // Faders drift
  creationVal += (Math.random()*0.1 - 0.05);
  natureVal += (Math.random()*0.1 - 0.05);

  creationVal = Math.min(1, Math.max(0, creationVal));
  natureVal = Math.min(1, Math.max(0, natureVal));

  document.getElementById("creation").value = creationVal;
  document.getElementById("nature").value = natureVal;

  setTimeout(autoTick, 8000);
}

//------------------------------------------------------
//  UI
//------------------------------------------------------
document.getElementById("startBtn").onclick = async ()=>{
  await Tone.start();
  Tone.Transport.start();

  melodyLoop.start(0);
  leftLoop.start(0);
  padLoop.start(0);
  acidLoop.start(0);
};

document.getElementById("stopBtn").onclick = ()=>{
  Tone.Transport.stop();
};

document.getElementById("acidBtn").onclick = ()=>{
  acidOn = !acidOn;
};

document.getElementById("autoBtn").onclick = ()=>{
  autoOn = !autoOn;
  if (autoOn) autoTick();
};

document.getElementById("energy").oninput = e => energyVal = parseFloat(e.target.value);
document.getElementById("creation").oninput = e => creationVal = parseFloat(e.target.value);
document.getElementById("nature").oninput = e => natureVal  = parseFloat(e.target.value);