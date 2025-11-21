let isRunning = false;
let audioInitialized = false;

const btnStart = document.getElementById("btn_start");
const btnStop   = document.getElementById("btn_stop");
const status    = document.getElementById("status-text");

let padLoop, textureLoop;
let masterVol;

// -------------------------------
// Audio Graph Init
// -------------------------------
function initAudioGraph() {

  masterVol = new Tone.Volume(-10).toDestination();

  // PAD（ゆっくり鳴る 3音 C/E/G）
  const pad = new Tone.PolySynth(Tone.Synth).connect(masterVol);
  pad.set({ volume: -12 });

  padLoop = new Tone.Loop((time) => {
    const notes = ["C4", "E4", "G4"];
    pad.triggerAttackRelease(notes[Math.floor(Math.random()*3)], "4n", time);
  }, "2m");

  // Texture（Brown Noise）
  const noise = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 2, release: 4 }
  }).connect(masterVol);

  textureLoop = new Tone.Loop((time) => {
    noise.triggerAttackRelease("8n", time);
  }, "8n");
}


// -------------------------------
// UI → audio graph
// -------------------------------
function updateFromUI() {
  const energy = document.getElementById("fader_energy").value;
  const bpm = 60 + (energy * 1.2);

  Tone.Transport.bpm.value = bpm;
  document.getElementById("bpm-label").textContent = "Tempo: " + Math.round(bpm) + " BPM";

  const vol = document.getElementById("fader_volume").value;
  if (masterVol) masterVol.volume.value = Number(vol);
}


// -------------------------------
// Start
// -------------------------------
btnStart.onclick = async () => {
  if (isRunning) return;

  // 必ずユーザー操作でAudioContextを起動
  await Tone.start();
  if (Tone.context.state !== "running") {
    await Tone.context.resume();
  }

  if (!audioInitialized) {
    initAudioGraph();
    audioInitialized = true;
  }

  updateFromUI();

  Tone.Transport.start("+0.1");
  padLoop.start(0);
  textureLoop.start("4n");

  isRunning = true;
  status.textContent = "Playing…";
};


// -------------------------------
// Stop
// -------------------------------
btnStop.onclick = () => {
  if (!isRunning) return;

  padLoop.stop();
  textureLoop.stop();
  Tone.Transport.stop();

  isRunning = false;
  status.textContent = "Stopped";
};
