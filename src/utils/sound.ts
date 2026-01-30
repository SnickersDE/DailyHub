// Simple synthesizer for UI sounds without external assets
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

const playTone = (freq: number, type: OscillatorType, duration: number, delay = 0) => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration);
};

export const playSound = {
  click: () => playTone(800, 'sine', 0.1),
  success: () => {
    playTone(600, 'sine', 0.1);
    playTone(800, 'sine', 0.1, 0.1);
    playTone(1200, 'sine', 0.2, 0.2);
  },
  delete: () => playTone(300, 'sawtooth', 0.1),
  unlock: () => {
    playTone(400, 'square', 0.1);
    playTone(600, 'square', 0.1, 0.1);
    playTone(800, 'square', 0.1, 0.2);
    playTone(1000, 'square', 0.3, 0.3);
  },
  purchase: () => {
    playTone(600, 'sine', 0.1);
    playTone(1200, 'sine', 0.3, 0.1);
  }
};
