/* ============================================================
   UCM Chill Engine — Quiet Ambient Edition
   静か・きれい・フラクタル揺らぎ・1〜5分オートモード
============================================================ */

let started = false;

/* ---- Synths ---- */
let padA, padB, padC;
let masterVol;

/* Utility */
const map = (x, a, b, c, d) => c + (x - a) * (d - c) / (b - a);

/* ---- Start ---- */
async function startEngine() {
  await Tone.start();

  masterVol = new Tone.Volume(-18).toDestination();

  padA = new Tone.Oscillator(110, "sine");
  padB = new Tone.Oscillator(110 * 3/2, "sine"); // 5度
  padC = new Tone.Oscillator(110 * 2, "sine");   // オクターブ

  const filter = new Tone.Filter(8000, "lowpass").connect(masterVol);

  const gainA = new Tone.AmplitudeEnvelope({ attack: 3, release: 5 }).connect(filter);
  const gainB = new Tone.AmplitudeEnvelope({ attack: 3, release: 6 }).connect(filter);
  const gainC = new Tone.AmplitudeEnvelope({ attack: 4, release: 8 }).connect(filter);

  padA.connect(gainA);
  padB.connect(gainB);
  padC.connect(gainC);

  padA.start();
  padB.start();
  padC.start();

  gainA.triggerAttack();
  gainB.triggerAttack();
  gainC.triggerAttack();

  started = true;
  Tone.Transport.start();

  // 自然揺らぎループ
  Tone.Transport.scheduleRepeat(() => naturalDrift(), "4s");

  // オートモード（初回）
  scheduleAutoChange();
}

/* ---- Natural Drift (倍音揺らぎ) ---- */
function naturalDrift() {
  const e = parseInt(document.getElementById("fader_energy").value, 10);
  const br = parseInt(document.getElementById("fader_bright").value, 10);
  const v = parseInt(document.getElementById("fader_void").value, 10);

  const base = map(e, 0, 100, 90, 140);

  padA.frequency.rampTo(base, 4);
  padB.frequency.rampTo(base * 3/2, 4);
  padC.frequency.rampTo(base * 2, 4);

  masterVol.volume.rampTo(map(br, 0, 100, -36, -10), 3);
}

/* ---- Auto Mode (1〜5分) ---- */
function scheduleAutoChange() {
  const mins = parseInt(document.getElementById("auto_len").value, 10);
  const ms = mins * 60 * 1000;

  setTimeout(() => {
    randomShift();
    scheduleAutoChange();
  }, ms);
}

function randomShift() {
  const e = document.getElementById("fader_energy");
  const br = document.getElementById("fader_bright");
  const v = document.getElementById("fader_void");

  e.value = Math.floor(Math.random() * 60);
  br.value = Math.floor(Math.random() * 60);
  v.value = Math.floor(Math.random() * 60);
}

/* ---- Stop ---- */
function stopEngine() {
  Tone.Transport.stop();
  padA.stop();
  padB.stop();
  padC.stop();
}

/* ---- Event ---- */
document.getElementById("btn_start").onclick = () => {
  if (!started) startEngine();
};

document.getElementById("btn_stop").onclick = () => stopEngine();
