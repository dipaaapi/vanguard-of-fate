// ==================== MUSIC (original compositions, played by audio.js) ====================
// Every track is written here as data: a chord chart, a hand-written melody and pattern styles for
// bass, arpeggio, pad and drums. compileTrack() turns that into note events for the sequencer in
// audio.js. Nothing is sampled; every sound is synthesised at runtime.
//
// Notation
//   chords:  one chord per bar, or "Dm/Bb" for two half-bar chords ("C", "Am", "F#m", "G7", "Bbmaj7", "Bdim", "Esus4", "A5")
//   melody:  one token per 8th note (or per `div` steps): note name ("D5", "C#4", "Bb3"), "-" holds, "." rests; "|" is ignored
//   drums:   one character per 16th: k kick, s snare, h hat, o open hat, t tom, c crash, r snare roll, . rest
//   Steps are 16ths (16 per bar) unless the track sets `steps` (12 = triplet feel). `gain` evens out loudness between tracks.

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function midi(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}
export const freq = (n) => 440 * Math.pow(2, (n - 69) / 12);

const QUALITY = {
  "": [0, 4, 7], m: [0, 3, 7], "7": [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6], aug: [0, 4, 8],
  sus4: [0, 5, 7], sus2: [0, 2, 7], "5": [0, 7, 12], add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14]
};
/** "F#m7" → { root: pitch class, tones: semitone offsets } */
export function chord(name) {
  const m = /^([A-G])([#b]?)(.*)$/.exec(name);
  const root = NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  return { root: (root + 12) % 12, tones: QUALITY[m[3]] || QUALITY[""] };
}

// ── Pattern styles ────────────────────────────────────────────────────────────
// Each returns events [step, midi, lengthInSteps, velocity] for one chord span.

const BASS = {
  pedal: (c, s, len) => [[s, 36 + c.root, len, 0.9]],
  root4: (c, s, len) => range(0, len, 4).map((i) => [s + i, 36 + c.root, 3, i % 8 === 0 ? 1 : 0.8]),
  root8: (c, s, len) => range(0, len, 2).map((i) => [s + i, 36 + c.root + (i % 8 === 6 ? 12 : 0), 2, i % 4 === 0 ? 1 : 0.75]),
  rootFifth: (c, s, len) => range(0, len, 4).map((i, k) => [s + i, 36 + c.root + (k % 2 ? 7 : 0), 3, k % 2 ? 0.75 : 1]),
  gallop: (c, s, len) => range(0, len, 4).flatMap((i) => [[s + i, 36 + c.root, 2, 1], [s + i + 2, 36 + c.root, 1, 0.7], [s + i + 3, 36 + c.root, 1, 0.7]]),
  march: (c, s, len) => range(0, len, 4).map((i, k) => [s + i, 36 + c.root + [0, 7, 12, 7][k % 4], 3, k % 2 ? 0.8 : 1]),
  waltz: (c, s, len) => range(0, len, 4).map((i, k) => [s + i, 36 + c.root + (k % 3 ? 7 : 0), 3, k % 3 ? 0.6 : 1])
};

const ARP = {
  up: (c, s, len, oct = 60) => range(0, len, 2).map((i, k) => [s + i, oct + c.root + c.tones[k % c.tones.length], 2, 0.7]),
  updown: (c, s, len, oct = 60) => {
    const seq = [...c.tones, c.tones[0] + 12, ...c.tones.slice(1).reverse()];
    return range(0, len, 2).map((i, k) => [s + i, oct + c.root + seq[k % seq.length], 2, 0.7]);
  },
  sixteenths: (c, s, len, oct = 60) => {
    const seq = [0, 1, 2, 1].map((k) => c.tones[k % c.tones.length]);
    return range(0, len, 1).map((i, k) => [s + i, oct + c.root + seq[k % 4] + (k % 8 >= 4 ? 12 : 0), 1, k % 4 === 0 ? 0.8 : 0.55]);
  },
  broken: (c, s, len, oct = 60) => range(0, len, 4).flatMap((i) => [[s + i, oct + c.root, 2, 0.7], [s + i + 2, oct + c.root + c.tones[1] + 12, 2, 0.6]]),
  triplet: (c, s, len, oct = 60) => range(0, len, 1).map((i, k) => [s + i, oct + c.root + c.tones[k % 3] + (Math.floor(k / 3) % 2 ? 12 : 0), 1, k % 3 === 0 ? 0.75 : 0.5]),
  sparse: (c, s, len, oct = 72) => [[s, oct + c.root + c.tones[1], 4, 0.6], [s + Math.floor(len * 0.625), oct + c.root + c.tones[2], 4, 0.5]]
};

const PAD = {
  // close voicing: each chord tone at its first pitch at or above `oct`
  chord: (c, s, len, oct = 52) => c.tones.slice(0, 3).map((t) => [s, oct + ((((c.root + t - oct) % 12) + 12) % 12), len, 0.55]),
  open: (c, s, len, oct = 48) => [[s, oct + c.root, len, 0.5], [s, oct + c.root + 7, len, 0.45], [s, oct + c.root + 12 + c.tones[1], len, 0.45]]
};

function range(a, b, step) { const r = []; for (let i = a; i < b; i += step) r.push(i); return r; }

// ── Compiler ──────────────────────────────────────────────────────────────────

function parseMelody(str, div, spb, oct = 0) {
  const toks = str.replace(/\|/g, " ").trim().split(/\s+/);
  const ev = [];
  let step = 0, cur = null;
  for (const t of toks) {
    if (t === "-") { if (cur) cur[2] += div; }
    else if (t === ".") cur = null;
    else { const n = midi(t); cur = n === null ? null : [step, n + oct, div, 0.85]; if (cur) ev.push(cur); }
    step += div;
  }
  return { ev, len: step };
}

function chordSpans(chords, spb) {
  const spans = [];
  chords.forEach((bar, b) => {
    const parts = bar.split("/");
    const each = spb / parts.length;
    parts.forEach((name, k) => spans.push({ c: chord(name), s: b * spb + k * each, len: each }));
  });
  return spans;
}

/** Track definition → { bpm, steps, length (steps), parts: [{ inst, vol, ev: [[step, midi, len, vel]] }] } */
export function compileTrack(def) {
  const spb = def.steps || 16;
  const spans = chordSpans(def.chords, spb);
  const length = def.chords.length * spb;
  const parts = [];
  for (const p of def.parts) {
    let ev = [];
    if (p.melody) {
      const div = p.div || (spb === 12 ? 3 : 2);
      const { ev: m, len } = parseMelody(p.melody, div, spb, p.oct || 0);
      const start = (p.fromBar || 0) * spb;
      // repeat the melody to fill the rest of the track when it is shorter
      for (let off = start; off < length; off += len) { ev.push(...m.map(([s, n, l, v]) => [s + off, n, l, v])); if (!p.repeat) break; }
    } else if (p.bass) spans.forEach((sp) => ev.push(...BASS[p.bass](sp.c, sp.s, sp.len)));
    else if (p.arp) spans.forEach((sp) => ev.push(...ARP[p.arp](sp.c, sp.s, sp.len, p.oct)));
    else if (p.pad) spans.forEach((sp) => ev.push(...PAD[p.pad](sp.c, sp.s, sp.len, p.oct)));
    else if (p.drums) {
      const pat = p.drums.replace(/\s|\|/g, "");
      for (let s = 0; s < length; s++) {
        const ch = pat[s % pat.length];
        if (ch && ch !== ".") ev.push([s, ch, 1, 1]);
      }
    }
    if (p.bars) ev = ev.filter(([s]) => { const b = Math.floor(s / spb); return b >= p.bars[0] && b < p.bars[1]; });
    parts.push({ inst: p.inst || (p.drums ? "drums" : "lead"), vol: p.vol ?? 0.5, ev });
  }
  return { bpm: def.bpm, steps: spb, length, parts };
}

// ── The tracks ────────────────────────────────────────────────────────────────

export const TRACKS = {
  // Title / prologue / creator: "The Pentagram Prophecy". Choir and bells, then the verse melody.
  title: {
    bpm: 76, gain: 1.6,
    chords: ["Dm", "Bb", "F", "C", "Dm", "Gm", "Bb/A", "A", "Dm", "Bb", "F", "C", "Gm", "Bb", "A", "A7"],
    parts: [
      { pad: "chord", inst: "choir", vol: 0.32, oct: 50 },
      { arp: "updown", inst: "bell", vol: 0.18, oct: 62 },
      { bass: "pedal", inst: "strings", vol: 0.3 },
      { inst: "flute", vol: 0.34, fromBar: 8, melody:
        "D5 - - - A4 - D5 E5 | F5 - - - E5 - D5 - | C5 - - - A4 - C5 D5 | E5 - - - - - . . | " +
        "D5 - Bb4 - D5 - G5 - | F5 - E5 - D5 - Bb4 - | C#5 - - - E5 - A5 - | A5 - - - - - . ." },
      { drums: "t............... ................", vol: 0.35, bars: [8, 16] }
    ]
  },

  // Hub plains by day: "Banners of Aethelgard"
  hub: {
    bpm: 112,
    chords: ["G", "D", "Em", "C", "G", "C", "D", "D", "Em", "C", "G", "D", "Em", "C", "Dsus4", "D"],
    parts: [
      { bass: "rootFifth", inst: "bass", vol: 0.42 },
      { arp: "up", inst: "pluck", vol: 0.16, oct: 60 },
      { pad: "chord", inst: "strings", vol: 0.14, oct: 55 },
      { inst: "pulse", vol: 0.26, melody:
        "G5 - B5 - D6 - B5 G5 | A5 - - - F#5 - D5 - | E5 - G5 - B5 - A5 G5 | E5 - - - . . D5 E5 | " +
        "G5 - B5 - D6 - E6 D6 | C6 - B5 - A5 - G5 - | A5 - - - B5 - A5 - | F#5 - D5 - E5 F#5 A5 - | " +
        "B5 - - - A5 - G5 - | E5 - - - G5 - C6 - | B5 - A5 - G5 - D5 - | F#5 - - - - - A5 - | " +
        "G5 - E5 - B5 - G5 - | C6 - - - E6 - D6 C6 | B5 - - - A5 - - - | D6 - - - - - . ." },
      { drums: "k...s...k.k.s... ", vol: 0.42 },
      { drums: "..h...h...h...h.", vol: 0.16 }
    ]
  },

  // Hub at night: "Miasma Moon"
  night: {
    bpm: 80, gain: 1.3,
    chords: ["Am", "F", "Dm", "E", "Am", "F", "Dm/E", "E7"],
    parts: [
      { pad: "chord", inst: "pad", vol: 0.26, oct: 52 },
      { arp: "sparse", inst: "bell", vol: 0.18, oct: 72 },
      { bass: "pedal", inst: "bass", vol: 0.32 },
      { inst: "flute", vol: 0.28, melody:
        "E5 - - - C5 - - - | A4 - - - - - . . | D5 - F5 - E5 - D5 - | G#4 - - - - - . . | " +
        "C5 - - - E5 - A5 - | G5 - F5 - E5 - . . | F5 - E5 - D5 - B4 - | E5 - - - - - . ." },
      { drums: "k.......k.......", vol: 0.26 }
    ]
  },

  // Act VII: "Whispering Canopy" (E dorian, hand drums)
  canopy: {
    bpm: 96,
    chords: ["Em", "A", "Em", "A", "C", "D", "Em", "D"],
    parts: [
      { bass: "root4", inst: "bass", vol: 0.38 },
      { arp: "broken", inst: "pluck", vol: 0.2, oct: 64 },
      { pad: "open", inst: "pad", vol: 0.16 },
      { inst: "flute", vol: 0.3, melody:
        "B4 - E5 - F#5 - G5 - | F#5 - E5 - C#5 - - - | B4 - E5 - G5 - B5 - | A5 - - - - - . . | " +
        "G5 - E5 - C5 - E5 - | F#5 - - - D5 - A5 - | G5 - F#5 - E5 - B4 - | D5 - - - - - . ." },
      { drums: "t..t..t.t..t.t..", vol: 0.26 },
      { drums: "....h.......h..h", vol: 0.14 }
    ]
  },

  // Act VIII: "Cerulean Tide" (triplet sway)
  coast: {
    bpm: 98, steps: 12,
    chords: ["Dm", "C", "Bb", "A", "Dm", "C", "Gm/A", "A"],
    parts: [
      { bass: "waltz", inst: "bass", vol: 0.38 },
      { arp: "triplet", inst: "harp", vol: 0.2, oct: 62 },
      { pad: "chord", inst: "strings", vol: 0.2, oct: 53 },
      { inst: "flute", vol: 0.3, melody:
        "A5 - G5 F5 | E5 - - D5 | E5 F5 - E5 | C#5 - - . | " +
        "D5 F5 A5 G5 | F5 - E5 D5 | C#5 - E5 - | D5 - - . ", div: 3 },
      { drums: "k.....s.....", vol: 0.28 }
    ]
  },

  // Act IX: "Glacial Crest" (bells over choir)
  frost: {
    bpm: 88, gain: 1.6,
    chords: ["Bm", "G", "Em", "F#", "Bm", "G", "D/A", "F#7"],
    parts: [
      { pad: "chord", inst: "choir", vol: 0.26, oct: 50 },
      { arp: "updown", inst: "bell", vol: 0.2, oct: 71 },
      { bass: "pedal", inst: "strings", vol: 0.28 },
      { inst: "lead", vol: 0.2, melody:
        "F#5 - - - B5 - - - | A5 - G5 - F#5 - D5 - | E5 - - - G5 - F#5 - | C#5 - - - - - . . | " +
        "D5 - F#5 - B5 - C#6 - | D6 - - - B5 - G5 - | A5 - F#5 - E5 - A5 - | F#5 - - - - - . ." },
      { drums: "k...............", vol: 0.22 }
    ]
  },

  // Act X: "The Hellforge" (C phrygian, anvils)
  ash: {
    bpm: 126,
    chords: ["Cm", "Db", "Cm", "Bb", "Cm", "Db", "Ab/Bb", "C5"],
    parts: [
      { bass: "gallop", inst: "bass", vol: 0.46 },
      { pad: "open", inst: "power", vol: 0.2 },
      { arp: "broken", inst: "anvil", vol: 0.16, oct: 72 },
      { inst: "lead", vol: 0.24, melody:
        "C5 - - Db5 C5 - G4 - | Ab4 - - - G4 - F4 - | Eb4 - F4 - G4 - C5 - | Bb4 - - - - - . . | " +
        "C5 - Eb5 - G5 - Ab5 - | G5 - - - F5 - Db5 - | Eb5 - D5 - C5 - Bb4 - | C5 - - - - - . ." },
      { drums: "k.k.s..kk.k.s.s.", vol: 0.5 },
      { drums: "h.h.h.h.h.h.h.h.", vol: 0.12 }
    ]
  },

  // Act XI: "Siege of the Obsidian Citadel" (march)
  siege: {
    bpm: 128,
    chords: ["Gm", "Eb", "Cm", "D", "Gm", "Eb", "Cm/D", "D7"],
    parts: [
      { bass: "march", inst: "bass", vol: 0.42 },
      { pad: "chord", inst: "brass", vol: 0.2, oct: 55 },
      { arp: "up", inst: "pluck", vol: 0.14, oct: 67 },
      { inst: "pulse", vol: 0.24, melody:
        "G5 - - - D5 - G5 A5 | Bb5 - - - A5 - G5 - | C6 - Bb5 - A5 - G5 - | F#5 - - - D5 - - - | " +
        "G5 - Bb5 - D6 - C6 Bb5 | Eb6 - - - D6 - C6 - | Bb5 - A5 - G5 - F#5 - | G5 - - - - - . ." },
      { drums: "k...s.rrk...s.rr", vol: 0.44 },
      { drums: "h.h.h.h.h.h.h.h.", vol: 0.1 }
    ]
  },

  // Act XII: "Maw of Damnation" (dissonant, restless)
  maw: {
    bpm: 136,
    chords: ["Em", "F", "Em", "Ebaug", "Em", "F", "Cm", "B7"],
    parts: [
      { bass: "root8", inst: "bass", vol: 0.42 },
      { arp: "sixteenths", inst: "pluck", vol: 0.14, oct: 64 },
      { pad: "chord", inst: "choir", vol: 0.24, oct: 52 },
      { inst: "lead", vol: 0.2, melody:
        "E5 - - - F5 - - - | E5 - B4 - C5 - - - | G5 - F5 - E5 - D#5 - | E5 - - - - - . . | " +
        "B5 - - - C6 - - - | A5 - G5 - F5 - E5 - | Eb5 - G5 - C6 - B5 - | D#5 - - - - - . ." },
      { drums: "k..k..s.k.kk..s.", vol: 0.46 },
      { drums: "hhhhhhhhhhhhhhhh", vol: 0.08 }
    ]
  },

  // Any Herald: "Herald's Wrath"
  boss: {
    bpm: 150,
    chords: ["Am", "F", "G", "E", "Am", "F", "Dm/E", "E"],
    parts: [
      { bass: "root8", inst: "bass", vol: 0.48 },
      { pad: "open", inst: "power", vol: 0.22 },
      { arp: "sixteenths", inst: "pluck", vol: 0.12, oct: 69 },
      { inst: "lead", vol: 0.26, melody:
        "A5 - - - E5 - A5 B5 | C6 - B5 - A5 - F5 - | G5 - - - D5 - G5 A5 | G#5 - - - E5 - - - | " +
        "A5 - C6 - E6 - D6 C6 | F6 - - - E6 - C6 - | D6 - C6 - B5 - A5 - | G#5 - - - B5 - E6 - " },
      { drums: "k.s.k.s.kks.k.sc", vol: 0.5 },
      { drums: "hhhhhhhhhhhhhhhh", vol: 0.1 }
    ]
  },

  // Satan: "The Lantern Goes Home", the prophecy theme at battle tempo
  finale: {
    bpm: 140,
    chords: ["Dm", "Bb", "F", "C", "Dm", "Gm", "Bb/A", "A", "Dm", "Bb", "F", "C", "Gm", "Bb", "A", "A7"],
    parts: [
      { bass: "root8", inst: "bass", vol: 0.46 },
      { pad: "chord", inst: "choir", vol: 0.28, oct: 50 },
      { arp: "sixteenths", inst: "bell", vol: 0.1, oct: 62 },
      { inst: "brass", vol: 0.3, melody:
        "D5 - - - A4 - D5 E5 | F5 - - - E5 - D5 - | C5 - - - A4 - C5 D5 | E5 - - - - - . . | " +
        "D5 - Bb4 - D5 - G5 - | F5 - E5 - D5 - Bb4 - | C#5 - - - E5 - A5 - | A5 - - - - - . . | " +
        "F5 - - - D5 - F5 G5 | A5 - - - G5 - F5 - | E5 - - - C5 - E5 F5 | G5 - - - - - . . | " +
        "Bb5 - A5 - G5 - F5 - | D5 - E5 - F5 - G5 - | A5 - - - C#6 - - - | D6 - - - - - . ." },
      { drums: "k...s...k.k.s..c", vol: 0.48 },
      { drums: "h.h.h.h.h.h.h.h.", vol: 0.12 }
    ]
  }
};

// Which track plays where: platform id → track (the boss track overrides while a boss is engaged)
export const AREA_TRACK = { hub: "hub", canopy: "canopy", coast: "coast", frost: "frost", ash: "ash", siege: "siege", darkShore: "siege", maw: "maw",
  rocky: "hub", swamp: "canopy", mountain: "frost", desert: "ash" };   // frontier maps borrow the nearest Act's theme

// Short one-shot phrases (played on the SFX bus): [step (16ths), note, length, velocity]
export const JINGLES = {
  levelUp: { bpm: 180, inst: "pulse", notes: [[0, "C5", 1], [1, "E5", 1], [2, "G5", 1], [3, "C6", 4], [4, "E6", 1], [5, "G6", 6]] },
  awakening: { bpm: 96, inst: "brass", notes: [[0, "D4", 2], [2, "A4", 2], [4, "D5", 4], [8, "F#5", 2], [10, "E5", 2], [12, "A5", 8], [12, "D5", 8], [12, "F#5", 8]] },
  victory: { bpm: 140, inst: "brass", notes: [[0, "G4", 1], [1, "G4", 1], [2, "G4", 1], [3, "C5", 5], [8, "Bb4", 3], [11, "C5", 1], [12, "D5", 2], [14, "C5", 8], [14, "E5", 8], [14, "G5", 8]] },
  gameOver: { bpm: 70, inst: "strings", notes: [[0, "A4", 4], [4, "F4", 4], [8, "D4", 4], [12, "E4", 2], [14, "C#4", 10], [14, "A3", 10]] },
  quest: { bpm: 160, inst: "bell", notes: [[0, "E5", 1], [1, "A5", 1], [2, "C#6", 3], [5, "E6", 6]] }
};
