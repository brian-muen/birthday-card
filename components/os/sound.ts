const KEY = "birthday-mail:sound";

type SoundName = "tick" | "mail" | "sent" | "pop";

const listeners = new Set<() => void>();
let context: AudioContext | null = null;

function readOn() {
  try {
    return window.localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function subscribeToSound(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export const getSoundOn = readOn;
export const getSoundServer = () => false;

/** Sound effects are off until someone turns them on, and stay per browser. */
export function setSoundOn(on: boolean) {
  try {
    if (on) window.localStorage.setItem(KEY, "on");
    else window.localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((listener) => listener());
  if (on) playSound("tick");
}

// Never before the visitor has touched the page, so nothing plays on load.
function audio() {
  if (!readOn()) return null;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
  context ??= new AudioContext();
  if (context.state === "suspended") context.resume().catch(() => {});
  return context;
}

function tone(
  ac: AudioContext,
  at: number,
  {
    type = "sine",
    freq,
    to,
    dur,
    gain,
  }: { type?: OscillatorType; freq: number; to?: number; dur: number; gain: number },
) {
  const osc = ac.createOscillator();
  const level = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, at + dur);
  level.gain.setValueAtTime(0.0001, at);
  level.gain.exponentialRampToValueAtTime(gain, at + 0.005);
  level.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(level).connect(ac.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function pop(ac: AudioContext, at: number) {
  const length = Math.round(ac.sampleRate * 0.05);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
  const source = ac.createBufferSource();
  const band = ac.createBiquadFilter();
  const level = ac.createGain();
  source.buffer = buffer;
  band.type = "bandpass";
  band.frequency.value = 1200;
  band.Q.value = 0.8;
  level.gain.value = 0.08;
  source.connect(band).connect(level).connect(ac.destination);
  source.start(at);
}

const SOUNDS: Record<SoundName, (ac: AudioContext, at: number) => void> = {
  tick: (ac, at) => tone(ac, at, { type: "triangle", freq: 1200, dur: 0.035, gain: 0.04 }),
  mail: (ac, at) => {
    tone(ac, at, { type: "triangle", freq: 1046.5, dur: 0.08, gain: 0.06 });
    tone(ac, at + 0.09, { type: "triangle", freq: 1318.5, dur: 0.12, gain: 0.06 });
  },
  sent: (ac, at) => tone(ac, at, { freq: 600, to: 1200, dur: 0.18, gain: 0.05 }),
  pop: (ac, at) => [0, 0.12, 0.24].forEach((delay) => pop(ac, at + delay)),
};

export function playSound(name: SoundName) {
  const ac = audio();
  if (ac) SOUNDS[name](ac, ac.currentTime + 0.01);
}
