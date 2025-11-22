// ========= Audio Context ==========
const ctx = new (window.AudioContext || window.webkitAudioContext)();
let master = ctx.createGain();
master.gain.value = 0.8;
master.connect(ctx.destination);

// ======= Reverb =======
async function loadReverb() {
    let convolver = ctx.createConvolver();
    const res = await fetch("https://cdn.jsdelivr.net/gh/QuietBriony/chill/reverb/soft.wav")
    const arr = await res.arrayBuffer();
    convolver.buffer = await ctx.decodeAudioData(arr);
    return convolver;
}

let reverbNode;
loadReverb().then(n => reverbNode = n);

// ========= Piano Ambient Engine ==========
function playPianoAmbient() {
    const scale = [0,2,4,7,9,11,12];
    const choose = arr => arr[Math.floor(Math.random()*arr.length)];

    function loop() {
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        let filt = ctx.createBiquadFilter();

        // 遊びの強弱
        gain.gain.value = 0.05 + Math.random()*0.1;

        // Piano 波形（倍音を少し強めに）
        osc.type = "sine";
        osc.frequency.value = 220 * Math.pow(2, choose(scale)/12);

        // 柔らかいローパス
        filt.type = "lowpass";
        filt.frequency.value = 500 + Math.random()*800;

        osc.connect(filt);
        filt.connect(gain);

        // ふっと現れる感じ
        if (reverbNode) gain.connect(reverbNode).connect(master);
        gain.connect(master);

        const now = ctx.currentTime;
        osc.start(now);
        osc.stop(now + 2.5);

        setTimeout(loop, 400 + Math.random()*900);
    }

    loop();
}

playPianoAmbient();

// ========= Bass Boost（押してる間だけ） ==========
let boostActive = false;

function startBoost() {
    boostActive = true;

    function loop() {
        if (!boostActive) return;

        let osc = ctx.createOscillator();
        let gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.value = 45 + Math.random()*4;
        gain.gain.value = 0.15;

        if (reverbNode) gain.connect(reverbNode).connect(master);
        gain.connect(master);

        osc.start();
        osc.stop(ctx.currentTime + 0.25);

        setTimeout(loop, 250);
    }

    loop();
}

function stopBoost() {
    boostActive = false;
}

// ========= Acid Mode ==========
let acidActive = false;

function startAcid() {
    acidActive = true;

    function acidLoop() {
        if (!acidActive) return;

        let osc = ctx.createOscillator();
        let filt = ctx.createBiquadFilter();
        let gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.value = 110 + Math.random()*60;

        // Acid特有のレゾナンス
        filt.type = "lowpass";
        filt.Q.value = 12;
        filt.frequency.value = 300 + Math.random()*600;

        gain.gain.value = 0.2;

        osc.connect(filt);
        filt.connect(gain);

        if (reverbNode) gain.connect(reverbNode).connect(master);
        gain.connect(master);

        const now = ctx.currentTime;
        osc.start(now);
        osc.stop(now + 0.3);

        setTimeout(acidLoop, 200);
    }

    acidLoop();
}

function stopAcid() {
    acidActive = false;
}

// ======== Buttons ========
document.getElementById("acidBtn").onmousedown = startAcid;
document.getElementById("acidBtn").onmouseup = stopAcid;
document.getElementById("acidBtn").onmouseleave = stopAcid;

document.getElementById("boostBtn").onmousedown = startBoost;
document.getElementById("boostBtn").onmouseup = stopBoost;
document.getElementById("boostBtn").onmouseleave = stopBoost;