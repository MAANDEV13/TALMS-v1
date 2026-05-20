// This script generates a notification sound WAV file
// Run with: node generate-notification-sound.js

const fs = require('fs');

// WAV file parameters
const sampleRate = 44100;
const duration = 0.3; // seconds
const numSamples = Math.floor(sampleRate * duration);

// Generate a pleasant two-tone chime (C6 + E6)
const frequencies = [1047, 1319]; // C6 and E6
const samples = new Float32Array(numSamples);

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const envelope = Math.exp(-t * 8); // Fast decay
  let sample = 0;
  for (const freq of frequencies) {
    sample += Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
  }
  samples[i] = Math.max(-1, Math.min(1, sample));
}

// Create WAV buffer
const bytesPerSample = 2;
const dataSize = numSamples * bytesPerSample;
const buffer = Buffer.alloc(44 + dataSize);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);

// fmt chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
buffer.writeUInt16LE(bytesPerSample, 32);
buffer.writeUInt16LE(16, 34); // bits per sample

// data chunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < numSamples; i++) {
  const val = Math.max(-1, Math.min(1, samples[i]));
  buffer.writeInt16LE(Math.floor(val * 32767), 44 + i * bytesPerSample);
}

fs.writeFileSync('public/notification.wav', buffer);
console.log('Created public/notification.wav');
