import { getLang } from "./i18n.js";

// ==================== ARAW AT GABI NG AETHELGARD ====================
// Isang araw = 6 minuto: Araw (3m) → Takipsilim (30s) → Gabi (2m) → Bukang-liwayway (30s).
// LORE Act I: sa gabi, ang mga halimaw ay "prowling with crimson and violet ocular gleams".
//
// GABI (night = 1; unti-unti sa takipsilim at bukang-liwayway):
//   Halimaw: +20% pinsala, +15% bilis, mas malayong nakakakita, mas marami; +30% EXP at mas maraming samsam
//   Bayani:  limitado ang paningin; Mage +10% pinsala (mga bituin ni Sam)
// ARAW: Priest +10% lakas ng heal (liwanag ni Astraea)
// Archer (elf): mas malawak ang paningin sa dilim.
// Maw of Damnation: laging gabi (walang langit). Kinubkob na Citadel: laging pulang takipsilim.

const FPS = 60;
const DAY_LENGTH = 6 * 60 * FPS;          // 21600 frame
const PHASES = [
  { id: "DAY", start: 0, end: 3 * 60 * FPS },
  { id: "DUSK", start: 3 * 60 * FPS, end: 3.5 * 60 * FPS },
  { id: "NIGHT", start: 3.5 * 60 * FPS, end: 5.5 * 60 * FPS },
  { id: "DAWN", start: 5.5 * 60 * FPS, end: DAY_LENGTH }
];
const NAMES = {
  en: { DAY: "Day", DUSK: "Dusk", NIGHT: "Night", DAWN: "Dawn" },
  fil: { DAY: "Araw", DUSK: "Takipsilim", NIGHT: "Gabi", DAWN: "Bukang-liwayway" }
};
const ICON = { DAY: "☀️", DUSK: "🌇", NIGHT: "🌙", DAWN: "🌅" };

export class DayNight {
  constructor() {
    this.tick = 60 * FPS;          // magsimula sa umaga
    this.forced = null;            // lugar na may sariling langit
  }

  // Tawagin kapag lumipat ng lugar
  setPlace(id) {
    this.forced = id === "maw" ? "NIGHT" : id === "siege" ? "DUSK" : null;
  }

  update() {
    this.tick = (this.tick + 1) % DAY_LENGTH;
  }

  phase() {
    if (this.forced) return this.forced;
    return PHASES.find((p) => this.tick >= p.start && this.tick < p.end).id;
  }

  // 0 = araw, 1 = gabi (unti-unting nagbabago sa takipsilim/bukang-liwayway)
  night() {
    if (this.forced === "NIGHT") return 1;
    if (this.forced === "DUSK") return 0.6;
    const t = this.tick;
    const [, dusk, night, dawn] = PHASES;
    if (t < dusk.start) return 0;
    if (t < dusk.end) return (t - dusk.start) / (dusk.end - dusk.start);
    if (t < night.end) return 1;
    return 1 - (t - dawn.start) / (dawn.end - dawn.start);
  }

  // Oras sa Aethelgard: 06:00 ang simula ng araw
  clock() {
    const mins = Math.floor(((this.tick / DAY_LENGTH) * 24 * 60 + 6 * 60) % (24 * 60));
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  }

  label() {
    const L = getLang() === "fil" ? "fil" : "en";
    const ph = this.phase();
    return `${ICON[ph]} ${NAMES[L][ph]} ${this.forced ? "" : this.clock()}`.trim();
  }

  // Epekto sa bayani ayon sa class
  heroMods(cls) {
    const n = this.night();
    return {
      dmg: cls === "mage" ? 1 + 0.1 * n : 1,
      heal: cls === "priest" ? 1 + 0.1 * (1 - n) : 1,
      sight: cls === "archer" ? 0.55 : 1          // gaano kadilim ang gabi para sa bayani
    };
  }

  // Dilim sa screen: tint + liwanag sa paligid ng bayani (screen space)
  draw(ctx, W, H, px, py, sight = 1, siege = false) {
    const n = this.night();
    if (n <= 0.01) return;
    ctx.save();
    const dark = 0.62 * n * sight;
    const tint = siege ? "40, 5, 10" : "5, 8, 26";
    const g = ctx.createRadialGradient(px, py, 34, px, py, 150);
    g.addColorStop(0, `rgba(${tint}, ${dark * 0.15})`);
    g.addColorStop(0.55, `rgba(${tint}, ${dark * 0.6})`);
    g.addColorStop(1, `rgba(${tint}, ${dark})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (n > 0.3 && !siege) {
      // bahagyang bughaw na liwanag ng buwan
      ctx.fillStyle = `rgba(90, 120, 200, ${0.05 * n})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  serialize() {
    return this.tick;
  }

  load(t) {
    if (Number.isFinite(t)) this.tick = Math.max(0, Math.min(DAY_LENGTH - 1, t | 0));
  }
}
