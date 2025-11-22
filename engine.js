//------------------------------------------------------
//  UCM Chill Piano Ambient + Acid Edition（作品版）
//------------------------------------------------------

let isPlaying = false;
let acidMode  = false;
let autoMode  = false;

//------------------------------------------------------
// 背景：軽量マンダラ
//------------------------------------------------------
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let tBG = 0;
function drawBG() {
  tBG += 0.002;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w/2, cy = h/2;
  const rMax = Math.min(w,h)*0.33;

  const g = ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h));
  g.addColorStop(0,"#091724");
  g.addColorStop(1,"#000207");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);

  ctx.save();
  ctx.translate(cx,cy);
  ctx.strokeStyle = "rgba(150,200,255,0.25)";
  ctx.lineWidth = 0.6;

  ctx.beginPath();
  for (let a=0; a<Math.PI*2; a+=0.05) {
    const wobble = Math.sin(a*4 + tBG*1.5)*4;
    const r = rMax + wobble;
    const x = r*Math.cos(a+tBG*0.1);
    const y = r*Math.sin(a+tBG*0.1);
    (a===0)?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.restore();

  requestAnimationFrame(drawBG);
}
drawBG();

//------------------------------------------------------
// Master / Reverb
//------------------------------------------------------
const master = new Tone.Volume(-14).toDestination();

const reverb = new Tone.Reverb({
  decay: 6,
  preDelay: 0.04,
  wet: 0.38
}).connect(master);

//------------------------------------------------------
// ピアノ（ウォーミーに改良）
//------------------------------------------------------
const piano = new Tone.Sampler({
  urls: { "C4":"C4.mp3","E4":"E4.mp3","G4":"G4.mp3","C5":"C5.mp3" },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
  attack: 0.002,
}).connect(reverb);
piano.volume.value = -4;

// 和声パッド
const pad = new Tone.PolySynth(Tone.Synth,{
  oscillator:{type:"sine"},
  envelope:{attack:1.5,sustain:0.8,release:8}
}).connect(reverb);
pad.volume.value = -18;

//------------------------------------------------------
// Ambient Piano：主旋律 ＋ 伴奏（両手）＋ 和声
//------------------------------------------------------

const scaleLead = ["C4","D#4","G4","A#4","D5","F4"];
const scaleLeft = ["C2","F2","G2","A#2"];
const scaleRight= ["C3","D#3","G3","A#3"];

function playLead(time) {
  const n = scaleLead[Math.floor(Math.random()*scaleLead.length)];
  const vel = 0.3 + Math.random()*0.35;
  piano.triggerAttackRelease(n,"8n",time,vel);
}

function playLeftHand(time) {
  const n = scaleLeft[Math.floor(Math.random()*scaleLeft.length)];
  piano.triggerAttackRelease(n,"2n",time,0.22);
}

function playRightArp(time) {
  for (let i=0;i<4;i++){
    if (Math.random()>0.7) continue;
    const n = scaleRight[Math.floor(Math.random()*scaleRight.length)];
    const dt = i*0.18;
    piano.triggerAttackRelease(n,"16n",time+dt,0.18);
  }
}

let chordIndex=0;
const chords = [
  ["C3","G3","D4"],
  ["A#2","F3","D4"],
  ["G2","D3","A#3"]
];

function playPadChord(time){
  const c = chords[chordIndex%chords.length];
  chordIndex++;
  pad.triggerAttackRelease(c,"1m",time,0.25);
}

// メイン Ambient ループ
const ambientLoop = new Tone.Loop((time)=>{
  playLead(time);
  playRightArp(time+0.35);
}, "2n");

const leftLoop = new Tone.Loop((time)=>{
  playLeftHand(time);
}, "1m");

const chordLoop = new Tone.Loop((time)=>{
  playPadChord(time);
}, "1m");

//------------------------------------------------------
// Acid：自動生成（複雑性 + 美しさ）
//------------------------------------------------------
const acidKick = new Tone.MembraneSynth({
  pitchDecay:0.03,
  octaves:6,
  envelope:{attack:0.001,decay:0.3,sustain:0}
}).connect(master);

const aFilter = new Tone.Filter(900,"lowpass",-24).connect(reverb);
const aDist   = new Tone.Distortion(0.38).connect(aFilter);

const acidBass = new Tone.MonoSynth({
  oscillator:{type:"sawtooth"},
  envelope:{attack:0.01,decay:0.2,sustain:0.7,release:0.1},
  filter:{Q:12}
}).connect(aDist);
acidBass.volume.value = -14;

let acidStep=0;
const acidSeq=["C3","C3","A2","G2","C3","D3"];

function playAcidBass(time){
  const n = acidSeq[acidStep%acidSeq.length];
  const vel=0.45+Math.random()*0.25;
  acidBass.triggerAttackRelease(n,"16n",time,vel);

  // 自動生成フィルタ動作
  const cutoff = 800 + Math.sin(time*0.4)*500 + Math.random()*300;
  aFilter.frequency.rampTo(cutoff,0.1);

  acidStep++;
}

function playAcidKick(time){
  acidKick.triggerAttackRelease("C1","8n",time);
}

const acidKickLoop = new Tone.Loop(time=>playAcidKick(time),"4n");
const acidBassLoop = new Tone.Loop(time=>playAcidBass(time),"16n");

//------------------------------------------------------
// UI
//------------------------------------------------------

const fEnergy   = document.getElementById("fader_energy");
const fCreation = document.getElementById("fader_creation");
const fNature   = document.getElementById("fader_nature");
const modeLabel = document.getElementById("modeLabel");
const bpmLabel  = document.getElementById("bpmLabel");

function applyFaders(){
  const e = Number(fEnergy.value);
  const c = Number(fCreation.value);
  const n = Number(fNature.value);

  const bpm = acidMode ? 120+e*0.5 : 70+e*0.3;
  Tone.Transport.bpm.rampTo(bpm,0.8);
  bpmLabel.textContent = bpm.toFixed(0)+" BPM";

  pad.volume.rampTo(-20 + n*0.06,1.0);

  aDist.distortion = 0.25 + c*0.004;
  aFilter.frequency.rampTo(600 + c*4,1.0);
}

document.getElementById("btn_start").onclick = async ()=>{
  if(isPlaying) return;
  await Tone.start();
  Tone.Transport.start();

  isPlaying=true;
  ambientLoop.start(0);
  leftLoop.start(0);
  chordLoop.start(0);

  if(acidMode){
    acidKickLoop.start(0);
    acidBassLoop.start("16n");
  }

  applyFaders();
};

document.getElementById("btn_stop").onclick=()=>{
  isPlaying=false;
  Tone.Transport.stop();
};

// Acid
document.getElementById("btn_acid").onclick=()=>{
  acidMode=!acidMode;
  modeLabel.textContent = acidMode ? "Mode: Ambient + Acid" : "Mode: Ambient";

  if(isPlaying){
    if(acidMode){
      acidKickLoop.start(0);
      acidBassLoop.start("16n");
    } else {
      acidKickLoop.stop();
      acidBassLoop.stop();
    }
  }

  applyFaders();
};

// Auto
document.getElementById("btn_auto").onclick=()=>{
  autoMode=!autoMode;
};