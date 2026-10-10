import { getLang } from "./i18n.js";
export const GUILD_RANKS = ["G", "F", "E", "D", "C", "B", "A", "S", "SS", "SSS"];
export const GUILD_LEVELS = [1, 15, 22, 30, 40, 52, 65, 80, 100, 120];
export const GUILD_AREAS = ["hub", "canopy", "swamp", "coast", "frost", "ash", "strand", "ossuary", "siege", "maw"];
export const GUILD_ROLES = {
  frontliner: { en: "Frontliner", fil: "Unahang mandirigma" }, rear: { en: "Rear", fil: "Likurang mandirigma" },
  support: { en: "Support", fil: "Suporta" }, dd: { en: "Damage Dealer (DD)", fil: "Tagapinsala (DD)" },
  inflictionist: { en: "Inflictionist", fil: "Tagapagpahirap" }
};
export const PILLAR_MEMBERS = [
  { id: "arthur", role: "frontliner", rank: "S" }, { id: "lyra", role: "rear", rank: "A" },
  { id: "julian", role: "support", rank: "SS" }, { id: "sam", role: "dd", rank: "S" },
  { id: "renzo", role: "dd", rank: "A" }
];
export const GUILD_SITE = { x: 170, y: 548, w: 280, h: 180 };
export const GUILD_ZONE = { x: 146, y: 540, w: 328, h: 254 };
export const GUILD_NPCS = {
  guildMaster: { x: 305, y: 726 }, guildRepresentative: { x: 360, y: 746 },
  guildClerk: { x: 247, y: 752 }, guildScout: { x: 168, y: 750 }, guildInflictionist: { x: 435, y: 750 }
};
const TEXT = {
  en: {
    title: "Meridian Adventurers' Guild", master: "Guild Master Oren Vale", representative: "Representative Mira Quill",
    clerk: "Contract Clerk Tessa Reed", scout: "Guild Scout Bram Holt", inflictionist: "Warden Neris Dusk",
    locked: "The guild opens when Whispering Canopy is unlocked.", close: "F3 / Esc · Close", board: "Guild contracts", members: "Guild roster",
    member: "Member", rank: "Rank", role: "Role", fee: "Registration includes your first plate", register: "Apply to the Guild Leader",
    assess: "Reassess abilities / promotion", assessment: "Assessment: class, allocated stats and learned abilities; promotions also require completed contracts.",
    plate: "Guild plate", replace: "Replace lost plate", lost: "Report plate lost", lostConfirm: "Confirm loss of this plate",
    plateRule: "Each replacement costs double the last plate price. Membership and contract progress remain registered.",
    reset: "Guild resets", resetStats: "Reset stats", resetSkills: "Reset skills", resetPaths: "Reset paths", resetAll: "Reset all three pools",
    resetHint: "1 platinum per reset service. An accepted guild contract grants 50% off while it remains active. Refunded pools remain independent; their automatic allocation is switched off.",
    resetAt: "Visit the Guild Representative at the hall for a paid reset (1P; 0.5P with an active guild contract).",
    confirm: "Confirm", accept: "Accept contract", claim: "Claim rewards", abandon: "Abandon contract", active: "Accepted guild contract", empty: "No active guild contract.",
    hunt: "Field clearance", scoutQuest: "Survey commission", elite: "Elite warrant", reward: "Rewards", points: "points", exp: "EXP",
    statPoints: "Stat points", skillPoints: "Skill points", pathPoints: "Path points", completed: "Contracts completed", claimed: "Reward claimed",
    rankGate: "Requires guild rank", areaGate: "Region not yet unlocked", autoSkills: "Auto skills", autoPaths: "Auto paths", on: "On", off: "Off", style: "My style",
    autoHint: "Automatic learning respects level, prerequisites and resonance. It spends only the matching point pool and fills empty path slots.",
    abilityTypes: "Frontliner holds the line; Rear attacks from range; Support heals and protects; DD deals damage; Inflictionists specialize in status ailments, dark summons, draining and immobilization.",
    ok: "Guild record updated.", joined: "Welcome to the Meridian Guild!", notMember: "Apply to the Guild Leader first.", noPlate: "Bring your guild plate, or buy a replacement from the Representative.",
    nearby: "Speak to the appropriate guild staff member at the hall.", funds: "Not enough coins.", full: "Make room in your bag. No coins or rewards were taken.",
    busy: "Finish or abandon your current guild contract first.", unavailable: "This contract is not available at your rank or story progress.", unfinished: "Complete the contract objective before claiming its reward.",
    noChange: "There are no allocated points to reset.", ready: "Guild contract complete! Return to the Contract Clerk.",
    ceremony1: "Your abilities are weighed by the guild's Covenant seal.", ceremony2: "Your role is {role}. Your assessed guild rank is {rank}.",
    ceremony3: "Protect fellow adventurers. Honor every contract. Carry the Meridian plate with pride.", ceremony4: "Membership recorded. Your own guild journey begins.",
    continue: "Enter / Space: Continue · Esc: Skip", contractNote: "Guild contracts are separate from the main story, side quests and NPC recruitment trials.",
    weapon: "Tier weapon", armorSet: "Guild armor and weapon set", accessory: "Accessories", epic: "Epic", legendary: "Legendary", mythical: "Mythical"
  },
  fil: {
    title: "Meridian Adventurers' Guild", master: "Guild Master Oren Vale", representative: "Kinatawan Mira Quill",
    clerk: "Klerk ng Kontrata Tessa Reed", scout: "Guild Scout Bram Holt", inflictionist: "Warden Neris Dusk",
    locked: "Bubukas ang guild kapag nabuksan ang Whispering Canopy.", close: "F3 / Esc · Isara", board: "Mga kontrata ng guild", members: "Mga miyembro ng guild",
    member: "Miyembro", rank: "Ranggo", role: "Tungkulin", fee: "Kasama sa pagpaparehistro ang unang plaka", register: "Mag-aplay sa Guild Leader",
    assess: "Suriin ang kakayahan / promosyon", assessment: "Pagsusuri: klase, inilaan na stat at natutuhang kakayahan; kailangan din ang natapos na kontrata para sa promosyon.",
    plate: "Plaka ng guild", replace: "Palitan ang nawalang plaka", lost: "Iulat na nawala ang plaka", lostConfirm: "Kumpirmahing nawala ang plakang ito",
    plateRule: "Doble ng huling presyo ng plaka ang bawat kapalit. Nananatiling nakatala ang pagiging miyembro at progreso ng kontrata.",
    reset: "Mga reset sa guild", resetStats: "I-reset ang stat", resetSkills: "I-reset ang skill", resetPaths: "I-reset ang landas", resetAll: "I-reset ang tatlong pool",
    resetHint: "1 platinum bawat serbisyo ng reset. May 50% diskuwento habang may tinanggap na aktibong kontrata ng guild. Magkahiwalay ang ibinalik na mga point; patay ang kanilang auto-allocation.",
    resetAt: "Lumapit sa Kinatawan ng Guild para sa reset (1P; 0.5P kapag may aktibong kontrata ng guild).",
    confirm: "Kumpirmahin", accept: "Tanggapin ang kontrata", claim: "Kunin ang gantimpala", abandon: "Iwan ang kontrata", active: "Tinanggap na kontrata ng guild", empty: "Walang aktibong kontrata ng guild.",
    hunt: "Paglilinis ng lugar", scoutQuest: "Komisyon sa pagsisiyasat", elite: "Mandato laban sa Elite", reward: "Gantimpala", points: "point", exp: "EXP",
    statPoints: "Stat point", skillPoints: "Skill point", pathPoints: "Path point", completed: "Natapos na kontrata", claimed: "Nakuha na ang gantimpala",
    rankGate: "Kailangan ang ranggo ng guild", areaGate: "Hindi pa bukas ang rehiyon", autoSkills: "Auto skill", autoPaths: "Auto landas", on: "Bukas", off: "Patay", style: "Istilo ko",
    autoHint: "Sinusunod ng auto-learning ang level, prerequisite at resonance. Tamang pool lang ang ginagastos; pinupunan ang bakanteng slot ng landas.",
    abilityTypes: "Ang Frontliner ang unang depensa; Rear ang malayuang atake; Support ang lunas at proteksiyon; DD ang pinsala; Inflictionist ang sumpa, madilim na summon, pag-drain at pagpigil sa paggalaw.",
    ok: "Na-update ang tala ng guild.", joined: "Maligayang pagdating sa Meridian Guild!", notMember: "Mag-aplay muna sa Guild Leader.", noPlate: "Dalhin ang plaka ng guild o bumili ng kapalit sa Kinatawan.",
    nearby: "Kausapin ang tamang kawani sa bulwagan ng guild.", funds: "Kulang ang barya.", full: "Maglaan ng puwang sa bag. Walang kinuha na barya o gantimpala.",
    busy: "Tapusin o iwan muna ang kasalukuyang kontrata.", unavailable: "Hindi angkop ang kontratang ito sa iyong ranggo o progreso.", unfinished: "Tapusin muna ang layunin bago kunin ang gantimpala.",
    noChange: "Walang nakalaang point na ire-reset.", ready: "Tapos ang kontrata ng guild! Bumalik sa Klerk ng Kontrata.",
    ceremony1: "Sinusukat ng Covenant seal ng guild ang iyong kakayahan.", ceremony2: "Ang tungkulin mo ay {role}. Ang ranggo mo ay {rank}.",
    ceremony3: "Protektahan ang kapwa adventurer. Tuparin ang kontrata. Ipagmalaki ang plaka ng Meridian.", ceremony4: "Naitala ang pagiging miyembro. Nagsisimula ang iyong paglalakbay sa guild.",
    continue: "Enter / Space: Ituloy · Esc: Laktawan", contractNote: "Hiwalay ang kontrata ng guild sa pangunahing kuwento, side quest at pagsubok sa pag-recruit ng NPC.",
    weapon: "Tier na armas", armorSet: "Set ng guild armor at armas", accessory: "Mga aksesorya", epic: "Epiko", legendary: "Maalamat", mythical: "Mitikal"
  }
};
Object.assign(TEXT.en, {
  cull: "SLAY · Normal enemies", champion: "SLAY · Elites / Champions", mvp: "SLAY · MVP",
  gather: "GATHER", escort: "ESCORT · NPC caravan", herb: "Herbs", stone: "Stones", enemy: "Enemy drops", npc: "NPC supplies",
  gatherHint: "Collect {count} × {item} from {source}. Deliver the items to the guild clerk; the supplies are consumed.",
  npcHint: "Speak to Bram Holt, the Guild Scout, at the guild hall to receive the requested supplies.",
  resourceHint: "Collect marked resources near the first survey site in the required region by walking up to them.",
  enemyHint: "Slain enemies in this region drop the requested contract material. Pick it up from the ground.",
  escortHint: "Guide the caravan from the first survey site through the second to the third. Stay nearby and defeat {waves} ambush waves. Lost caravans require abandoning and accepting the contract again.",
  mvpHint: "Defeat the guild MVP at the first survey site, or the region's campaign MVP.",
  defence: "DEF", escortFailed: "Caravan lost · Reaccept contract", defend: "Protect caravan", guide: "Guide caravan · Stay nearby", destination: "Caravan destination", supplied: "Contract supplies received. Deliver them to the guild clerk.", wave: "Waves", route: "Waypoints"
});
Object.assign(TEXT.fil, {
  cull: "PAGPATAY · Karaniwang kalaban", champion: "PAGPATAY · Elite / Champion", mvp: "PAGPATAY · MVP",
  gather: "PANGANGALAP", escort: "PAG-ALALAY · Karaban ng NPC", herb: "Mga halamang gamot", stone: "Mga bato", enemy: "Samsam ng kalaban", npc: "Suplay ng NPC",
  gatherHint: "Kumuha ng {count} × {item} mula sa {source}. Ihatid sa klerk ng guild; kukunin ang suplay.",
  npcHint: "Kausapin si Bram Holt, ang Scout ng Guild, sa bulwagan para sa hinihinging suplay.",
  resourceHint: "Lumapit sa mga markadong sangkap sa unang survey site ng kinakailangang rehiyon.",
  enemyHint: "May materyal ng kontrata ang napatay na kalaban sa rehiyong ito. Pulutin sa lupa.",
  escortHint: "Gabayan ang karaban mula una, ikalawa, hanggang ikatlong survey site. Manatiling malapit at talunin ang {waves} bugso ng ambush. Iwan at tanggapin muli ang kontrata kapag nawala ang karaban.",
  mvpHint: "Talunin ang MVP ng guild sa unang survey site o ang MVP ng kampanya sa rehiyon.",
  defence: "DEP", escortFailed: "Nawala ang karaban · Tanggapin muli", defend: "Protektahan ang karaban", guide: "Gabayan ang karaban · Lumapit", destination: "Destinasyon ng karaban", supplied: "Natanggap ang suplay. Ihatid sa klerk ng guild.", wave: "Mga bugso", route: "Mga waypoint"
});
export const guildText = (key, vars = {}) => (TEXT[getLang()]?.[key] || TEXT.en[key] || key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
export const guildRoleName = role => GUILD_ROLES[role]?.[getLang()] || role;
