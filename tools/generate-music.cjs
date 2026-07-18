const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

vm.runInThisContext(fs.readFileSync(require.resolve('lamejs/lame.all.js'), 'utf8'));
const lamejs = globalThis.lamejs;

const SAMPLE_RATE = 44100;
const BARS = 8;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'audio');

const tracks = [
  { file: 'betonhain-night.mp3', bpm: 92, root: 45, mood: 'night', seed: 11 },
  { file: 'funk-88-8.mp3', bpm: 124, root: 45, mood: 'funk', seed: 23 },
  { file: 'radio-chrom.mp3', bpm: 108, root: 38, mood: 'chrome', seed: 37 },
  { file: 'nachtfalter-fm.mp3', bpm: 126, root: 40, mood: 'nightdrive', seed: 53 },
  { file: 'basskeller.mp3', bpm: 136, root: 36, mood: 'bass', seed: 71 },
];

const bassPatterns = {
  night:      [0,-1,0,-1,3,-1,0,-1,5,-1,3,-1,7,-1,5,-1],
  funk:       [0,0,-1,0,3,-1,0,0,5,5,-1,3,7,-1,5,3],
  chrome:     [0,-1,-1,0,3,-1,-1,5,0,-1,0,-1,7,-1,5,-1],
  nightdrive: [0,0,-1,0,3,3,-1,3,5,5,-1,5,-2,-2,-1,0],
  bass:       [0,0,0,-1,0,3,-1,0,5,5,3,-1,0,0,7,-1],
};

const leadPatterns = {
  night:      [-1,-1,12,-1,-1,15,-1,-1,19,-1,17,-1,15,-1,-1,-1],
  funk:       [12,-1,15,17,19,-1,17,15,12,-1,10,12,15,-1,19,17],
  chrome:     [-1,12,-1,15,-1,17,-1,19,-1,17,-1,15,-1,12,-1,10],
  nightdrive: [-1,12,-1,10,-1,8,-1,7,-1,8,-1,10,-1,12,-1,15],
  bass:       [-1,-1,12,-1,12,-1,15,-1,-1,17,-1,15,-1,12,-1,-1],
};

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function midiFrequency(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function oscillator(type, phase) {
  const cycle = phase / (Math.PI * 2);
  if (type === 'square') return Math.sin(phase) >= 0 ? 1 : -1;
  if (type === 'saw') return 2 * (cycle - Math.floor(cycle + 0.5));
  if (type === 'triangle') return 2 * Math.abs(2 * (cycle - Math.floor(cycle + 0.5))) - 1;
  return Math.sin(phase);
}

function addNote(left, right, start, duration, note, type, gain, pan) {
  const first = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const last = Math.min(left.length, Math.ceil((start + duration) * SAMPLE_RATE));
  const frequency = midiFrequency(note);
  const leftGain = gain * Math.sqrt((1 - pan) * 0.5);
  const rightGain = gain * Math.sqrt((1 + pan) * 0.5);
  for (let sample = first; sample < last; sample += 1) {
    const t = sample / SAMPLE_RATE - start;
    const attack = Math.min(1, t / 0.012);
    const release = Math.min(1, (duration - t) / Math.min(0.12, duration * 0.35));
    const envelope = attack * Math.max(0, release) * Math.exp(-t * 0.55);
    const value = oscillator(type, Math.PI * 2 * frequency * t) * envelope;
    left[sample] += value * leftGain;
    right[sample] += value * rightGain;
  }
}

function addKick(left, right, start, gain) {
  const first = Math.floor(start * SAMPLE_RATE);
  const duration = 0.34;
  for (let offset = 0; offset < duration * SAMPLE_RATE && first + offset < left.length; offset += 1) {
    const t = offset / SAMPLE_RATE;
    const phase = Math.PI * 2 * (48 * t + 3.2 * (1 - Math.exp(-24 * t)));
    const value = Math.sin(phase) * Math.exp(-t * 13) * gain;
    left[first + offset] += value;
    right[first + offset] += value;
  }
}

function addNoiseHit(left, right, start, duration, gain, random, bright) {
  const first = Math.floor(start * SAMPLE_RATE);
  let previous = 0;
  for (let offset = 0; offset < duration * SAMPLE_RATE && first + offset < left.length; offset += 1) {
    const t = offset / SAMPLE_RATE;
    const noise = random() * 2 - 1;
    const filtered = bright ? noise - previous * 0.72 : noise * 0.65 + previous * 0.35;
    previous = noise;
    const value = filtered * Math.exp(-t * (bright ? 46 : 18)) * gain;
    left[first + offset] += value * 0.82;
    right[first + offset] += value;
  }
}

function synthesize(track) {
  const beat = 60 / track.bpm;
  const step = beat / 4;
  const totalSteps = BARS * 16;
  const duration = totalSteps * step;
  const sampleCount = Math.ceil(duration * SAMPLE_RATE);
  const left = new Float64Array(sampleCount);
  const right = new Float64Array(sampleCount);
  const random = seededRandom(track.seed);
  const bass = bassPatterns[track.mood];
  const lead = leadPatterns[track.mood];

  for (let index = 0; index < totalSteps; index += 1) {
    const patternStep = index % 16;
    const time = index * step;
    const accent = patternStep % 4 === 0;
    if (accent) addKick(left, right, time, track.mood === 'bass' ? 0.74 : 0.58);
    if (patternStep === 4 || patternStep === 12) addNoiseHit(left, right, time, 0.22, 0.21, random, false);
    if (patternStep % 2 === 0) addNoiseHit(left, right, time, 0.07, 0.065, random, true);

    if (bass[patternStep] >= 0) {
      addNote(left, right, time, step * 1.75, track.root + bass[patternStep], 'saw', 0.22, -0.08);
      addNote(left, right, time, step * 1.8, track.root + bass[patternStep] - 12, 'sine', 0.28, 0.06);
    }
    if (lead[patternStep] >= 0) {
      const leadType = track.mood === 'nightdrive' ? 'square' : 'triangle';
      addNote(left, right, time, step * 1.35, track.root + lead[patternStep], leadType, 0.11, 0.36);
    }
  }

  const chords = [[0,3,7], [5,8,12], [3,7,10], [7,10,14]];
  for (let bar = 0; bar < BARS; bar += 1) {
    const chord = chords[bar % chords.length];
    for (let voice = 0; voice < chord.length; voice += 1) {
      addNote(left, right, bar * beat * 4, beat * 3.9, track.root + chord[voice] + 12, 'triangle', 0.035, (voice - 1) * 0.45);
    }
  }

  let peak = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    left[index] = Math.tanh(left[index] * 1.25);
    right[index] = Math.tanh(right[index] * 1.25);
    peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
  }
  const scale = peak > 0 ? 0.9 / peak : 1;
  const leftPcm = new Int16Array(sampleCount);
  const rightPcm = new Int16Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    leftPcm[index] = Math.round(left[index] * scale * 32767);
    rightPcm[index] = Math.round(right[index] * scale * 32767);
  }
  return { left: leftPcm, right: rightPcm };
}

function encodeMp3({ left, right }) {
  const encoder = new lamejs.Mp3Encoder(2, SAMPLE_RATE, 112);
  const chunks = [];
  for (let offset = 0; offset < left.length; offset += 1152) {
    const chunk = encoder.encodeBuffer(left.subarray(offset, offset + 1152), right.subarray(offset, offset + 1152));
    if (chunk.length) chunks.push(Buffer.from(chunk));
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(Buffer.from(tail));
  return Buffer.concat(chunks);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
for (const track of tracks) {
  const output = path.join(OUTPUT_DIR, track.file);
  fs.writeFileSync(output, encodeMp3(synthesize(track)));
  console.log(`${track.file}: ${fs.statSync(output).size} bytes`);
}
