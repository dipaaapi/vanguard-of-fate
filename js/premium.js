import { PLAYABLES, PLAYABLE_IDS } from "./playables.js";

import { normalizeSummonCfg } from "./summons/summoncfg.js";
export const CASH_GOLD = 10000; // ₱1 = 100 platinum = 10,000 gold; wallet retains centavos.
export const TRANSMUTE_STYLES = {
  ember: { name: ["Ember Dragon", "Dragon ng Baga"], color: "#ff8055", accent: "#ffe7a0" },
  storm: { name: ["Storm Crown", "Korona ng Bagyo"], color: "#63e8ff", accent: "#d9faff" },
  astral: { name: ["Astral Lotus", "Lotus ng Bituin"], color: "#da94ff", accent: "#fff4ff" }
};
// Every NPC receives one UTC-day spotlight per cycle, independent of save/reload.
export const BANNER_DURATION = 24 * 60 * 60 * 1000;
export const BANNER_DISCOUNT = 20;
export function playableStars(id) { return Math.max(1, Math.min(5, PLAYABLES[id]?.stars || 1)); }
export function playableBanner(now = Date.now()) {
  const slot = Math.floor(now / BANNER_DURATION);
  const index = ((slot % PLAYABLE_IDS.length) + PLAYABLE_IDS.length) % PLAYABLE_IDS.length;
  return { id: PLAYABLE_IDS[index], nextId: PLAYABLE_IDS[(index + 1) % PLAYABLE_IDS.length], endsAt: (slot + 1) * BANNER_DURATION, discount: BANNER_DISCOUNT };
}
export function premiumPrice(product, now = Date.now()) {
  const id = product.id.split(":")[1];
  const hero = ["recruit", "summon"].includes(product.kind);
  const base = hero ? playableStars(id) * (product.kind === "recruit" ? 60 : 30) : product.price;
  const discount = hero && playableBanner(now).id === id ? BANNER_DISCOUNT : 0;
  const cash = Math.round(base * (100 - discount)) / 100;
  return { base, cash, platinum: Math.round(cash * 100), discount };
}
export const PREMIUM_PRODUCTS = [
  { id: "autoLoot", price: 120, kind: "skill", name: ["Auto Loot", "Kusang Loot"], description: ["Permanent summon collection skill. Toggle anytime, even with adventure mode off.", "Permanenteng kasanayan ng summon sa pagkuha ng loot. Maaaring i-toggle kahit patay ang adventure mode."] },
  { id: "autoDefend", price: 120, kind: "skill", name: ["Auto Defend", "Kusang Depensa"], description: ["Permanent summon defense skill. Protects you independently of adventure mode.", "Permanenteng depensa ng summon kahit patay ang adventure mode."] },
  { id: "autoSell", price: 120, kind: "skill", name: ["Auto Sell", "Kusang Benta"], description: ["Permanent summon errand skill. Every 10 s your summon sells plain spare gear (magic gear too when the bag is nearly full). Refined, socketed, set and unique items are kept.", "Permanenteng kasanayan ng summon. Tuwing 10 segundo, ibinebenta ng iyong summon ang karaniwang sobrang gamit (pati magic kapag halos puno na ang bag). Itinatabi ang may refine, socket, set at unique."] },
  { id: "autoBuy", price: 120, kind: "skill", name: ["Auto Buy", "Kusang Bili"], description: ["Permanent summon errand skill. Your summon keeps 10 Red Potions and 2 Panaceas stocked, spending at most a quarter of your gold per errand.", "Permanenteng kasanayan ng summon. Pinapanatili ng iyong summon ang 10 Pulang Potion at 2 Panacea, at hindi gumagastos ng higit sa sangkapat ng iyong ginto bawat lakad."] },
  { id: "refineSafetyStone", price: 35, kind: "item", name: ["Refine Safety Stone", "Bato ng Ligtas na Refine"], description: ["One guaranteed refine; materials and gold still required. Unlocks +11 through +15.", "Isang garantisadong refine; kailangan pa rin ng materyales at ginto. Para rin sa +11 hanggang +15."] },
  { id: "soulstone", price: 1, kind: "item", name: ["Soulstone", "Bato ng Kaluluwa"], description: ["Adds 10 minutes of autonomous adventure when used. Exchange back for ₱1 or 100 platinum.", "Nagdaragdag ng 10 minuto ng kusang adventure kapag ginamit. Maipapalit sa ₱1 o 100 platino."] },
  { id: "ward", price: 60, kind: "buff", duration: 3600000, name: ["Guardian Ward · 1 hour", "Pananggalang · 1 oras"], description: ["20% less incoming damage. Real-time countdown continues offline.", "20% bawas sa natatanggap na damage. Tuloy ang oras kahit offline."] },
  { id: "might", price: 60, kind: "buff", duration: 3600000, name: ["Champion Might · 1 hour", "Lakas ng Kampeon · 1 oras"], description: ["20% extra hero attack damage. Real-time countdown continues offline.", "20% dagdag sa damage ng atake. Tuloy ang oras kahit offline."] },
  ...Object.entries(TRANSMUTE_STYLES).map(([id, style]) => ({ id: `transmute:${id}`, price: 180, kind: "transmute", name: style.name, description: ["Permanent attack transmute: trails, sparks and sigils. Cosmetic effect; equip in this store.", "Permanenteng disenyo ng atake: trail, kislap at sigil. Piliin dito sa tindahan."] })),
  ...PLAYABLE_IDS.map(id => ({ id: `recruit:${id}`, price: playableStars(id) * 60, kind: "recruit", name: PLAYABLES[id].label, description: ["Recruit instantly, skip this NPC's trial, and unlock their permanent Echo Summon skill.", "Agad i-recruit, laktawan ang trial ng NPC, at makuha ang permanenteng Echo Summon."] })),
  ...PLAYABLE_IDS.map(id => ({ id: `summon:${id}`, price: playableStars(id) * 30, kind: "summon", name: [ `${PLAYABLES[id].label[0]} · Echo Summon`, `${PLAYABLES[id].label[1]} · Echo Summon` ], description: ["Permanent companion using this NPC's signature skills. One echo active at a time.", "Permanenteng kasama na may kasanayan ng NPC. Isang echo lang ang aktibo."] }))
];
const finite = (value, max = 1000000000) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;
export function loadPremium(saved = {}) {
  if (!saved || typeof saved !== "object") saved = {};
  const skills = Object.fromEntries(["autoLoot", "autoDefend", "autoSell", "autoBuy"].map(id => [id, Boolean(saved.skills?.[id])]));
  const owned = key => [...new Set(Array.isArray(saved[key]) ? saved[key].filter(id => PLAYABLE_IDS.includes(id)) : [])];
  const transmutes = [...new Set(Array.isArray(saved.transmutes) ? saved.transmutes.filter(id => TRANSMUTE_STYLES[id]) : [])];
  const summons = owned("summons");
  return { cash: Number.isFinite(saved.cash) ? Math.round(Math.max(0, Math.min(1000000000, saved.cash)) * 100) / 100 : 0, demoPayments: finite(saved.demoPayments), skills,
    enabled: Object.fromEntries(Object.keys(skills).map(id => [id, skills[id] && saved.enabled?.[id] !== false])),
    buffs: Object.fromEntries(["ward", "might"].map(id => [id, finite(saved.buffs?.[id], Date.now() + 365 * 86400000)])),
    transmutes, transmute: transmutes.includes(saved.transmute) ? saved.transmute : null,
    recruits: owned("recruits"), summons, summonActive: summons.includes(saved.summonActive) ? saved.summonActive : null, summon: normalizeSummonCfg(saved.summon) };
}
// Carry owned unlocks and remaining premium consumables, never refill used products.
export function retainPremiumForRegression(oldPlayer, player, party) {
 player.premium=loadPremium({...oldPlayer.premium,buffs:{}});
 player.gold=oldPlayer.gold;
 for(const id of PREMIUM_PRODUCTS.filter(x=>x.kind==="item").map(x=>x.id)){
  const qty=oldPlayer.bag.count(id);if(qty)player.bag.add(id,qty);
 }
 for(const id of player.premium.recruits){
  const q=party.book.state[id];q.started=q.recruited=q.bossProof=true;q.progress=PLAYABLES[id].required;
  Object.keys(q.systems).forEach(key=>q.systems[key]=true);
  if(!party.members.includes(id)){party.members.push(id);party.hp[id]=null;}
 }
}
export const premiumSkill = (p, id) => p?.hp > 0 && Boolean(p.premium?.skills[id] && p.premium.enabled[id]);
export const premiumBuff = (p, id, now = Date.now()) => p?.premium?.buffs[id] > now;
export function demoTopUp(p, amount) {
  if (![500, 1200, 3000].includes(amount) || !p?.premium || p.premium.cash + amount > 1000000000) return false;
  p.premium.cash = Math.round((p.premium.cash + amount) * 100) / 100; p.premium.demoPayments++; return true;
}
export function exchangePremium(p, direction, amount) {
  if (!Number.isFinite(amount) || !Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000 || !p?.premium) return false;
  if (direction === "cashToPlatinum") {
    if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) return false;
    const gold = amount * CASH_GOLD;
    if (p.premium.cash < amount || !Number.isFinite(p.gold) || p.gold + gold > 1e12) return false;
    p.premium.cash = Math.round((p.premium.cash - amount) * 100) / 100;
    p.gold = Math.round((p.gold + gold) * 10000) / 10000;
  } else if (direction === "platinumToCash") {
    if (amount % 100 !== 0) return false;
    const gold = amount * 100, pesos = amount / 100;
    if (!Number.isFinite(p.gold) || p.gold < gold || p.premium.cash + pesos > 1000000000) return false;
    p.gold = Math.round((p.gold - gold) * 10000) / 10000;
    p.premium.cash = Math.round((p.premium.cash + pesos) * 100) / 100;
  } else if (["soulToCash", "soulToPlatinum"].includes(direction)) {
    if (!Number.isSafeInteger(amount) || p.bag.count("soulstone") < amount || p.premium.cash + amount > 1000000000 || !Number.isFinite(p.gold) || p.gold + amount * CASH_GOLD > 1e12) return false;
    p.bag.take("soulstone", amount);
    if (direction === "soulToCash") p.premium.cash = Math.round((p.premium.cash + amount) * 100) / 100;
    else p.gold = Math.round((p.gold + amount * CASH_GOLD) * 10000) / 10000;
  } else return false;
  return true;
}
export function buyPremium(p, party, id, now = Date.now(), currency = "cash") {
  const product = PREMIUM_PRODUCTS.find(x => x.id === id), state = p?.premium;
  if (!product || !state || !["cash", "platinum"].includes(currency)) return { ok: false, reason: "cash" };
  const price = premiumPrice(product, now);
  if (currency === "platinum" && !["recruit", "summon"].includes(product.kind)) return { ok: false, reason: "platinum" };
  if (currency === "cash" ? !Number.isFinite(state.cash) || state.cash < price.cash : !Number.isFinite(p.gold) || p.gold < price.platinum * 100) return { ok: false, reason: currency };
  const key = id.split(":")[1];
  if ((product.kind === "skill" && state.skills[id]) || (product.kind === "transmute" && state.transmutes.includes(key)) ||
      (product.kind === "recruit" && party.recruited(key)) || (product.kind === "summon" && state.summons.includes(key))) return { ok: false, reason: "owned" };
  if (product.kind === "recruit" && party.members.length >= 6) return { ok: false, reason: "party" };
  if (product.kind === "item" && !p.bag.add(id, 1)) return { ok: false, reason: "bag" };
  if (product.kind === "skill") { state.skills[id] = true; state.enabled[id] = true; }
  if (product.kind === "buff") state.buffs[id] = Math.min(now + 365 * 86400000, Math.max(now, state.buffs[id] || 0) + product.duration);
  if (product.kind === "transmute") { state.transmutes.push(key); state.transmute = key; }
  if (product.kind === "recruit") {
    const q = party.book.state[key]; q.started = q.recruited = q.bossProof = true; q.progress = PLAYABLES[key].required;
    Object.keys(q.systems).forEach(id => q.systems[id] = true);
    party.members.push(key); party.hp[key] = null; state.recruits.push(key);
  }
  if (["recruit", "summon"].includes(product.kind)) {
    if (!state.summons.includes(key)) state.summons.push(key);
    state.summonActive = key;
  }
  if (currency === "cash") state.cash = Math.round((state.cash - price.cash) * 100) / 100;
  else p.gold -= price.platinum * 100;
  return { ok: true };
}
export function attackTransmute(p, projectile) {
  const style = TRANSMUTE_STYLES[p.premium?.transmute];
  if (style && p.premium.transmutes.includes(p.premium.transmute)) projectile.transmute = { ...style, id: p.premium.transmute };
  return projectile;
}
export function drawAttackTransmute(ctx, p) {
  if (!p.transmute || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
  const {color, accent, id} = p.transmute, age = p.age || 0;
  const r = Math.min(28, Math.max(7, p.r || p.radius || 9));
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.shadowColor = color; ctx.shadowBlur = 7;
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.beginPath();
  if (id === "storm") {
    const a = Math.atan2(p.vy || 0, p.vx || 1);
    for(let i=0;i<7;i++){const d=i*4;const wobble=(i%2?3:-3);const x=p.x-Math.cos(a)*d+Math.sin(a)*wobble,y=p.y-Math.sin(a)*d-Math.cos(a)*wobble;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
  } else { ctx.ellipse(p.x,p.y,r,r*.6,age*.06,0,Math.PI*2); }
  ctx.stroke(); ctx.fillStyle = accent;
  for(let i=0;i<6;i++){const a=age*.13+i*Math.PI/3, d=r+Math.sin(age*.2+i)*4;ctx.fillRect(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,2,2);}
  if(id==="astral"){ctx.beginPath();for(let i=0;i<=6;i++){const a=i*Math.PI/3+age*.04;ctx.lineTo(p.x+Math.cos(a)*r*.7,p.y+Math.sin(a)*r*.7);}ctx.stroke();}
  ctx.restore();
}
