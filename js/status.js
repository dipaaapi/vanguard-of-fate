import { getLang } from "./i18n.js";

// ==================== ABNORMAL STATUS (LORE Act I: Seven Anomaly Blights + Ragnarok/Diablo) ====================
// Mga sumpa ng Void Miasma na tumatama sa bayani. Ang bawat isa ay may tunay na epekto:
//   poison      — nababawasan ng 2% max HP bawat 1.5s (hindi nakamamatay, tulad sa Ragnarok); walang regen
//   bleeding    — pinsala bawat 0.75s (nakamamatay); walang regen
//   burn        — pinsala ng apoy bawat 0.5s (nakamamatay)
//   freeze      — mabagal (−55%), walang sprint, mas mabagal ang atake (Diablo: chill)
//   electrified — paralisado nang pana-panahon (Ragnarok: stun)
//   silence     — hindi magamit ang K; ang Mage at Priest ay hindi rin makapag-cast ng J
//   blind       — madilim ang paningin at walang critical
//   curse       — −25% ATK, walang critical, −15% bilis (Ragnarok: Curse)
//   confusion   — baligtad ang kontrol (Ragnarok: Chaos)
// RESISTANCE (Ragnarok): ang stat ay may tsansang pigilan ang sumpa (hanggang 60%).

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

// Tsansang pigilan: 0.8% bawat puntos ng stat, hanggang 60%
export function resistChance(player, type) {
  const s = STATUS[type];
  if (!s || !player.totalStat) return 0;
  return Math.min(0.6, player.totalStat(s.res) * 0.008);
}

// Bawat frame: pinsala at pagbilang pababa. Ibinabalik ang { paralyzed } para sa galaw.
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
      paralyzed = true;                                   // 22 sa bawat 70 frame: hindi makagalaw
    }
  });
  return { paralyzed };
}

// Pumipigil ba ang status sa regen ng HP
export const blocksRegen = (player) => player.debuffs.poison > 0 || player.debuffs.bleeding > 0;
