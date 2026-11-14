let audioContext;

export function unlockNotificationSound() {
  if (typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audioContext || audioContext.state === 'closed') audioContext = new AudioContextClass();
  if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
}

export function playNotificationSound() {
  if (!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, now);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(0.055, now + 0.02);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.32);
}
