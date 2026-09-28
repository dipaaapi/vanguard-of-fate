import { getLang } from "./i18n.js";

// ==================== ABNORMAL STATUS (LORE Act I: Seven Anomaly Blights + Ragnarok/Diablo) ====================
// Void Miasma blights that afflict the hero. Each has a real effect:
//   poison      — loses 2% max HP every 1.5s (never lethal, as in Ragnarok); no regen
//   bleeding    — damage every 0.75s (lethal); no regen
//   burn        — fire damage every 0.5s (lethal)
//   freeze      — slowed (−55%), no sprint, slower attacks (Diablo: chill)
//   electrified — paralysed now and then (Ragnarok: stun)
//   silence     — K cannot be used; Mage and Priest cannot cast J either
//   blind       — darkened sight and no criticals
//   curse       — −25% ATK, no criticals, −15% speed (Ragnarok: Curse)
//   confusion   — reversed controls (Ragnarok: Chaos)
// RESISTANCE (Ragnarok): stats give a chance to resist a blight (up to 60%).

export const STATUS = {
  poison:      { color: "#4ade80", icon: "☠", res: "vit", name: { en: "Poison", fil: "Lason" } },
  bleeding:    { color: "#ef4444", icon: "🩸", res: "vit", name: { en: "Bleeding", fil: "Pagdurugo" } },
  burn:        { color: "#fb923c", icon: "🔥", res: "vit", name: { en: "Burn", fil: "Paso" } },
  freeze:      { color: "#7dd3fc", icon: "❄", res: "vit", name: { en: "Freeze", fil: "Yelo" } },
  electrified: { color: "#facc15", icon: "⚡", res: "vit", name: { en: "Stun", fil: "Kuryente" } },
  silence:     { color: "#a78bfa", icon: "🔇", res: "int", name: { en: "Silence", fil: "Katahimikan" } },
  blind:       { color: "#64748b", icon: "👁", res: "int", name: { en: "Blind", fil: "Pagkabulag" } },
  curse:       { color: "#c084fc", icon: "💀", res: "luk", name: { en: "Curse", fil: "Sumpa" } },
  confusion:   { color: "#f472b6", icon: "💫", res: "int", name: { en: "Confusion", fil: "Pagkalito" } }
};
export const STATUS_KEYS = Object.keys(STATUS);

export const statusName = (k) => (STATUS[k] ? STATUS[k].name[getLang() === "fil" ? "fil" : "en"] : k);

// Resist chance: 0.8% per stat point, up to 60%
export function resistChance(player, type) {
  const s = STATUS[type];
  if (!s || !player.totalStat) return 0;
  return Math.min(0.6, player.totalStat(s.res) * 0.008);
}

// Every frame: damage and countdown. Returns { paralyzed } for movement.
export function tickStatuses(player, fx) {
  const d = player.debuffs;
  const pop = (text, color) => { if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 4, text, false, color); };
  let paralyzed = false;

  STATUS_KEYS.forEach((k) => {
    if (d[k] <= 0) return;
    d[k]--;
    const t = d[k];
    if (k === "poison" && t % 90 === 0) {
      const dmg = Math.max(1, Math.round(player.maxHp * 0.02));
      if (player.hp > 1) { player.hp = Math.max(1, player.hp - dmg); pop(`-${dmg}`, STATUS.poison.color); }
    } else if (k === "bleeding" && t % 45 === 0) {
      const dmg = 3 + Math.round(player.maxHp * 0.01);
      player.hp = Math.max(0, player.hp - dmg);
      pop(`-${dmg}`, STATUS.bleeding.color);
    } else if (k === "burn" && t % 30 === 0) {
      const dmg = 2 + Math.round(player.maxHp * 0.008);
      player.hp = Math.max(0, player.hp - dmg);
      pop(`-${dmg}`, STATUS.burn.color);
    } else if (k === "electrified" && t % 70 < 22) {
      paralyzed = true;                                   // 22 of every 70 frames: cannot move
    }
  });
  return { paralyzed };
}

// Does the status block HP regen?
export const blocksRegen = (player) => player.debuffs.poison > 0 || player.debuffs.bleeding > 0;
