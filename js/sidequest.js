import { getLang } from "./i18n.js";
import { MONSTERS } from "./bestiary.js";
import { areaDef, areaName, areaLevels, actAreas } from "./world/areas.js";
import { mulberry32 } from "./world/tileset.js";

// ==================== SIDE QUESTS (Book I) ====================
// Every Act from II to XV rolls 5 to 10 side quests from the save's seed, spread over the Act's maps
// (js/world/areas.js actAreas: the Act's own map plus the frontier beside it). The Act's main quest
// waits at its gate step until they are all done (js/quest.js GATE_STEPS).
//   hunt      slay N of one regular kind          trophy   collect N trophies (half the kills drop one)
//   elite     slay one elite kind (always on the map, returns after it falls)
//   scout     walk to a named site                cull     slay N monsters of any kind
//   champion  slay N Champions or Elites          sky      slay N flying monsters
// Acts II–IV (a Novice on the way to the Lv 10 Awakening) never roll elite or champion bounties.

const TEXT = {
  en: {
    hunt: "Hunt {monster} ×{n} in the {place}",
    trophy: "Collect {n} trophies from {monster} in the {place}",
    elite: "Defeat the elite {monster} in the {place}",
    scout: "Scout the {site} in the {place}",
    cull: "Slay {n} monsters in the {place}",
    champion: "Defeat {n} Champions or Elites in the {place}",
    sky: "Clear the skies: slay {n} flying monsters in the {place}",
    title: { hunt: "Hunt", trophy: "Trophies", elite: "Elite Bounty", scout: "Scouting", cull: "Purge", champion: "Champion Bounty", sky: "Skyward" },
    head: "Side quests", log: "Side Quests · Act {act}", left: "Side quests {done}/{total}",
    done: "Side quest complete", all: "Every side quest of Act {act} is done. The main quest continues!",
    trophyGot: "{monster} trophy {have}/{n}", scouted: "Scouted: {site}",
    reward: "+{exp} EXP · +{gold}G"
  },
  fil: {
    hunt: "Manghuli ng {monster} ×{n} sa {place}",
    trophy: "Mangolekta ng {n} tropeo mula sa {monster} sa {place}",
    elite: "Talunin ang elite na {monster} sa {place}",
    scout: "Siyasatin ang {site} sa {place}",
    cull: "Pumatay ng {n} halimaw sa {place}",
    champion: "Talunin ang {n} Champion o Elite sa {place}",
    sky: "Linisin ang himpapawid: pumatay ng {n} lumilipad na halimaw sa {place}",
    title: { hunt: "Pangangaso", trophy: "Tropeo", elite: "Pabuya sa Elite", scout: "Pagmamanman", cull: "Paglilinis", champion: "Pabuya sa Champion", sky: "Himpapawid" },
    head: "Mga side quest", log: "Mga Side Quest · Act {act}", left: "Side quest {done}/{total}",
    done: "Tapos ang side quest", all: "Tapos na ang lahat ng side quest ng Act {act}. Tuloy ang main quest!",
    trophyGot: "Tropeo ng {monster} {have}/{n}", scouted: "Nasiyasat: {site}",
    reward: "+{exp} EXP · +{gold}G"
  }
};
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
const SCOUT_RANGE = 40;
const TROPHY_CHANCE = 0.5;

const L = () => (getLang() === "fil" ? "fil" : "en");
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? `{${k}}`));
export const st = (key) => (TEXT[L()] || TEXT.en)[key];

export class SideQuests {
  constructor() {
    this.reset();
  }

  reset() {
    this.seed = (Math.random() * 0x7fffffff) | 0;
    this.act = 0;
    this.list = [];
  }

  // Roll the board for an Act (kept if it is already that Act's board)
  ensure(act) {
    if (act === this.act) return;
    this.act = act;
    this.list = act >= 2 && act <= 15 ? this.roll(act) : [];
  }

  roll(act) {
    const rnd = mulberry32(this.seed + act * 977);
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const areas = actAreas(act);
    const count = 5 + Math.floor(rnd() * 6);
    const early = act <= 4;
    const used = new Set();
    const out = [];
    for (let i = 0; out.length < count && i < count * 6; i++) {
      const area = areas[out.length % areas.length];
      const def = areaDef(area);
      const regulars = (def.monsters || []).filter((k) => MONSTERS[k] && !MONSTERS[k].elite);
      const flyers = regulars.filter((k) => MONSTERS[k].flying);
      const types = ["hunt", "hunt", "trophy", "scout", "cull", ...(flyers.length ? ["sky"] : []), ...(early ? [] : ["elite", "elite", "champion"])];
      const t = pick(types);
      let q = null;
      if (t === "hunt" || t === "trophy") q = { t, area, k: pick(regulars), n: t === "hunt" ? 6 + Math.floor(rnd() * 5) : 4 + Math.floor(rnd() * 3) };
      else if (t === "elite") q = { t, area, k: pick(def.elites || []), n: 1 };
      else if (t === "scout") q = { t, area, k: Math.floor(rnd() * (def.sites || []).length), n: 1 };
      else if (t === "cull") q = { t, area, n: 12 + Math.floor(rnd() * 7) };
      else if (t === "champion") q = { t, area, n: 2 + Math.floor(rnd() * 2) };
      else if (t === "sky") q = { t, area, n: 6 + Math.floor(rnd() * 4) };
      if (!q || (q.t !== "cull" && q.t !== "champion" && q.t !== "sky" && q.k === undefined)) continue;
      const id = `${q.t}:${q.area}:${q.k ?? ""}`;
      if (used.has(id) || (["cull", "champion", "sky"].includes(q.t) && used.has(`${q.t}:${q.area}:`))) continue;
      used.add(id);
      q.have = 0;
      out.push(q);
    }
    return out;
  }

  serialize() {
    return { seed: this.seed, act: this.act, list: this.list.map((q) => ({ ...q })) };
  }

  // From a save; anything malformed is rolled again for the Act
  load(data, act) {
    this.reset();
    if (data && Number.isInteger(data.seed)) this.seed = data.seed;
    if (data && data.act === act && Array.isArray(data.list)) {
      this.act = act;
      const fresh = this.roll(act);
      // keep the saved progress on the same rolled quests (the seed makes them identical)
      this.list = fresh.map((q, i) => {
        const s = data.list[i];
        return s && s.t === q.t && s.area === q.area && s.k === q.k ? { ...q, have: Math.max(0, Math.min(q.n, s.have | 0)) } : q;
      });
    } else this.ensure(act);
  }

  complete() {
    return this.list.every((q) => q.have >= q.n);
  }

  progress() {
    return { done: this.list.filter((q) => q.have >= q.n).length, total: this.list.length };
  }

  // The first unfinished side quest (the one the HUD and the arrow follow)
  current() {
    return this.list.find((q) => q.have < q.n) || null;
  }

  // A monster died on map areaId. Returns [{ q, trophy, finished }] for the messages.
  onKill(e, areaId) {
    const out = [];
    if (!e || e.boss || e.minionOf === "summon") return out;
    this.list.forEach((q) => {
      if (q.have >= q.n || q.area !== areaId) return;
      let hit = false, trophy = false;
      if (q.t === "hunt") hit = e.key === q.k;
      else if (q.t === "trophy") hit = trophy = e.key === q.k && Math.random() < TROPHY_CHANCE;
      else if (q.t === "elite") hit = e.key === q.k && e.elite;
      else if (q.t === "cull") hit = true;
      else if (q.t === "champion") hit = Boolean(e.champion || e.elite);
      else if (q.t === "sky") hit = Boolean(e.kind && e.kind.flying);
      if (!hit) return;
      q.have++;
      out.push({ q, trophy, finished: q.have >= q.n });
    });
    return out;
  }

  // The hero walked on map areaId: scouting sites. Returns the quests finished now.
  onMove(areaId, x, y) {
    const out = [];
    this.list.forEach((q) => {
      if (q.t !== "scout" || q.have >= q.n || q.area !== areaId) return;
      const s = this.site(q);
      if (s && Math.hypot(x - s.x, y - s.y) < SCOUT_RANGE) { q.have = q.n; out.push({ q, finished: true }); }
    });
    return out;
  }

  site(q) {
    const def = areaDef(q.area);
    return q.t === "scout" && def && def.sites ? def.sites[q.k] || null : null;
  }

  // Sites still to scout on a map (for the markers on the ground and the maps)
  pendingSites(areaId) {
    return this.list.filter((q) => q.t === "scout" && q.area === areaId && q.have < q.n).map((q) => this.site(q)).filter(Boolean);
  }

  // Unfinished side quests per map (for the world map)
  openByArea() {
    const out = {};
    this.list.forEach((q) => { if (q.have < q.n) out[q.area] = (out[q.area] || 0) + 1; });
    return out;
  }

  // EXP and gold for finishing one: about three kills' worth at the middle of the map's band
  reward(q) {
    const [lo, hi] = areaLevels(q.area);
    const lvl = Math.round((lo + hi) / 2);
    const mult = q.t === "elite" || q.t === "champion" ? 1.6 : q.t === "scout" ? 0.8 : 1;
    return { exp: Math.round((25 + lvl * 8) * 3 * mult), gold: Math.round((12 + lvl * 4) * mult) };
  }

  monsterName(q) {
    return q.k && MONSTERS[q.k] ? MONSTERS[q.k].name[L()] : "";
  }

  title(q) {
    return st("title")[q.t];
  }

  // "Hunt 8 Dune Scarab in the Sunscorch Dunes (3/8)"
  text(q, withCount = true) {
    const lang = L();
    const site = this.site(q);
    const s = fmt(st(q.t), {
      n: q.n, monster: q.k && MONSTERS[q.k] ? MONSTERS[q.k].name[lang] : "",
      place: areaName(q.area, lang), site: site ? site.name[lang] : ""
    });
    return withCount && q.n > 1 ? `${s} (${Math.min(q.have, q.n)}/${q.n})` : s;
  }

  // Line for the HUD while the main quest waits: "Side quests 2/7 · Hunt …"
  hudLine() {
    const q = this.current();
    const p = this.progress();
    return `${fmt(st("left"), p)} · ${q ? this.text(q) : ""}`;
  }

  logTitle() {
    return fmt(st("log"), { act: ROMAN[this.act] || this.act });
  }

  message(key, vars) {
    return fmt(st(key), { act: ROMAN[this.act] || this.act, ...vars });
  }
}

// Little stone cairns at the sites still to scout on this map; the one the hero is heading for pulses
export function drawSites(ctx, sites, tick, activeSite = null) {
  sites.forEach((s) => {
    const on = s === activeSite;
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 6, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#78716c"; ctx.fillRect(s.x - 6, s.y, 12, 5);
    ctx.fillStyle = "#a8a29e"; ctx.fillRect(s.x - 4, s.y - 4, 8, 4);
    ctx.fillStyle = "#d6d3d1"; ctx.fillRect(s.x - 2, s.y - 7, 4, 3);
    ctx.fillStyle = "#ffd166"; ctx.fillRect(s.x + 3, s.y - 14, 1, 10);           // pennant
    ctx.fillRect(s.x + 4, s.y - 14, 5, 3);
    const p = 0.5 + Math.sin(tick / 8) * 0.5;
    ctx.strokeStyle = on ? `rgba(255, 209, 102, ${0.35 + p * 0.5})` : "rgba(255, 209, 102, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 4, SCOUT_RANGE * 0.6 + (on ? p * 4 : 0), SCOUT_RANGE * 0.3 + (on ? p * 2 : 0), 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  });
}
