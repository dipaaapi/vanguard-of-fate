// Regional playable NPCs: unique combat kits and separate, saveable recruitment quests.
// The quests track elite encounters in the character's home region; they never touch Act progress.
export const PLAYABLES = {
  cerynVoss: { stars: 5, region: "rocky", label: ["Ceryn Voss", "Ceryn Voss"], role: { en: "Aethelgard royal envoy", fil: "Sugo maharlika ng Aethelgard" },
    skillLore: { en: "Marks allies with royal orders, granting a short damage surge and protective cover.", fil: "Minamarkahan ang mga kakampi sa utos ng korona upang bigyan sila ng panandaliang lakas at proteksiyon." }, required: 3,
    skills: ["Oathmark", "Royal Intercession", "Crownward Edict"] },
  vaelThorn: { stars: 5, region: "siege", label: ["Vael Thorn", "Vael Thorn"], role: { en: "Dark Continent survivor and pathfinder", fil: "Nakaligtas at gabay mula sa Dark Continent" },
    skillLore: { en: "Fires shadow anchors and folds through darkness to reposition in battle.", fil: "Nagpapakawala ng shadow anchor at dumaraan sa dilim upang magpalit ng puwesto sa labanan." }, required: 3, needsBoss: true,
    skills: ["Umbral Anchor", "Nightfold Step", "Gravetide Snare"] },
  nimaFen: { stars: 5, region: "swamp", label: ["Nima Fen", "Nima Fen"], role: { en: "Beastkin marsh guide and forager", fil: "Gabay at mangangalap na Beastkin sa latian" },
    skillLore: { en: "Uses swamp reagents and poison craft to control space and pressure enemies.", fil: "Gumagamit ng sangkap mula sa latian at lason upang kontrolin ang lugar at gipitin ang mga kalaban." }, required: 3, feed: { mudcarp: 2, wildSpice: 2 },
    skills: ["Bogcraft", "Reed Decoy", "Fenburst"] },
  eirene: { stars: 5, region: "lost", label: ["Eirene", "Eirene"], role: { en: "Sole caretaker automaton of the Lost Sky Continent", fil: "Nag-iisang robot na tagapag-alaga ng Lost Sky Continent" },
    skillLore: { en: "Runs maintenance pulses, wind-assisted repositioning and a protective barrier array.", fil: "Gumagamit ng maintenance pulse, paglipat sa tulong ng hangin, at hanay ng mga pananggalang." }, required: 3,
    skills: ["Maintenance Pulse", "Aerial Lift", "Sanctuary Array"], systems: ["lift", "habitat", "caretaker"] },
  templar: { stars: 5, region: "siege", label: ["Dame Serelle", "Dame Serelle"], role: { en: "Royal Templar and sworn protector of the heir", fil: "Templar ng kaharian at sinumpaang tagapagtanggol ng tagapagmana" },
    skillLore: { en: "Turns a broken royal oath into a relentless countercharge and a ward that shelters nearby allies.", fil: "Ginagawang walang-humpay na ganting-sugod at pananggalang para sa mga kakampi ang wasak na panunumpa sa korona." }, required: 3, needsBoss: true,
    skills: ["Last Vow", "Oathbreaker Pursuit", "Heir's Sanctuary"] }
};

export const PLAYABLE_IDS = Object.keys(PLAYABLES);

export const INNATE_BUILDS = {
 cerynVoss:{job:"Royal Envoy",primary:"int",stats:{str:8,agi:6,vit:12,int:16,dex:8,luk:10},path:"Royal Command",passives:{dmg:8,def:5}},
 vaelThorn:{job:"Shadow Pathfinder",primary:"dex",stats:{str:9,agi:18,vit:8,int:10,dex:20,luk:12},path:"Nightfold",passives:{crit:8,move:10}},
 nimaFen:{job:"Bog Alchemist",primary:"int",stats:{str:6,agi:10,vit:10,int:20,dex:12,luk:14},path:"Venomcraft",passives:{dmg:12,cdr:6}},
 eirene:{job:"Sky Caretaker",primary:"int",stats:{str:8,agi:8,vit:18,int:18,dex:8,luk:6},path:"Sanctuary Array",passives:{def:8,heal:20}},
 templar:{job:"Royal Templar",primary:"str",stats:{str:20,agi:8,vit:20,int:6,dex:10,luk:6},path:"Last Vow",passives:{def:12,dmgReduce:10}}
};
export function innateBuild(id,level=1){
 const base=INNATE_BUILDS[id],growth=Math.max(0,level-1);
 return {...base,rank:1+Math.floor(growth/10),stats:Object.fromEntries(Object.entries(base.stats).map(([k,v])=>[k,v+Math.floor(growth*v*.12)])),passives:Object.fromEntries(Object.entries(base.passives).map(([k,v])=>[k,Math.round(v*(1+growth*.03)*100)/100]))};
}
export function innateMaxHp(id,level){const vit=innateBuild(id,level).stats.vit;return Math.round((100+(level-1)*12+vit*6)*(1+vit*.01));}

export function makePlayableKit(id,avatar){
 const kit=makeBasePlayableKit(id,avatar);
 for(const key of ["onAttack","onSkill","onSkill2"]){const action=kit[key];if(action)kit[key]=(actor,target,spawn)=>action(actor,target,shot=>{if(Number.isFinite(shot.damage))shot.damage=Math.round(shot.damage*(1+Math.max(0,(actor.level||1)-1)*.045));spawn(shot);});}
 return kit;
}
function makeBasePlayableKit(id, avatar) {
  const common = { ...INNATE_BUILDS[id], innate:true, id, name: PLAYABLES[id]?.label[0] || id, avatar, speed: 1.45,
    maxHp: 100, attackCooldown: 28, cooldown: 180, cooldown2: 240,
    range: 42, animMap: { bash: "skill", slash: "attack" } };
  const wave = (p, spawn, color, damage, radius = 34, push = 8) => spawn({
    type: "shockwave", x: p.x + 10, y: p.y + 14, r: 5, max: radius, grow: 3,
    damage, hit: new Set(), color, push
  });
  if (id === "cerynVoss") return { ...common,
    onAttack: (p, _t, spawn) => { p.buffs.damage = Math.max(p.buffs.damage, 90); wave(p, spawn, "#f6cc67", 17, 30, 5); return true; },
    onSkill: (p, _t, spawn) => { wave(p, spawn, "#79b9ff", 24, 68, 10); p.guardTimer = 24; return true; },
    onSkill2: (p, _t, spawn) => { const a = p.aimAngle; spawn({ type:"follow", owner:p, angle:a, offset:24, radius:34, life:12, damage:38, hit:new Set(), color:"#f6cc67", push:12 }); return true; }
  };
  if (id === "vaelThorn") return { ...common,
    onAttack: (p, _t, spawn) => { const a=p.aimAngle; spawn({type:"bolt", x:p.x+10, y:p.y+10, vx:Math.cos(a)*5, vy:Math.sin(a)*5, damage:16, elem:"shadow", color:"#a78bfa", range:130}); return true; },
    onSkill: (p, _t, spawn) => { const a=p.aimAngle; p.chargeTimer=8; p.chargeVx=Math.cos(a)*4.2; p.chargeVy=Math.sin(a)*4.2; spawn({type:"follow", owner:p, angle:a, offset:44, radius:30, life:24, damage:28, hit:new Set(), color:"#7c3aed", push:16}); return true; },
    onSkill2: (p, _t, spawn) => wave(p, spawn, "#c4b5fd", 44, 52, 20),
    onUpdate(p) { if (p.chargeTimer > 0) { p.chargeTimer--; p.x += p.chargeVx; p.y += p.chargeVy; } }
  };
  if (id === "nimaFen") return { ...common,
    onAttack: (p, _t, spawn) => wave(p, spawn, "#84cc16", 16, 38, 4),
    onSkill: (p, _t, spawn) => { const a=p.aimAngle; spawn({type:"bolt", x:p.x+10, y:p.y+10, vx:Math.cos(a)*3.5, vy:Math.sin(a)*3.5, damage:25, elem:"poison", color:"#a3e635", range:110}); return true; },
    onSkill2: (p, _t, spawn) => wave(p, spawn, "#34d399", 40, 58, 14)
  };
  if (id === "templar") return { ...common,
    onAttack: (p, _t, spawn) => { wave(p, spawn, "#e7c96b", 20, 42, 8); p.buffs.damage = Math.max(p.buffs.damage, 54); return true; },
    onSkill: (p, _t, spawn) => { const a=p.aimAngle; p.chargeTimer=10; p.chargeVx=Math.cos(a)*4.5; p.chargeVy=Math.sin(a)*4.5; spawn({type:"follow", owner:p, angle:a, offset:38, radius:32, life:22, damage:34, hit:new Set(), color:"#f4e6a1", push:18}); return true; },
    onSkill2: (p, _t, spawn) => { p.guardTimer=54; wave(p, spawn, "#c7d9ee", 46, 76, 6); return true; },
    onUpdate(p) { if (p.chargeTimer > 0) { p.chargeTimer--; p.x += p.chargeVx; p.y += p.chargeVy; } }
  };
  return { ...common,
    onAttack: (p, _t, spawn) => { p.hp=Math.min(p.maxHp,p.hp+4); wave(p, spawn, "#67e8f9", 17, 36, 6); return true; },
    onSkill: (p, _t, spawn) => { const a=p.aimAngle; spawn({type:"follow", owner:p, angle:a, offset:30, radius:40, life:20, damage:28, hit:new Set(), color:"#67e8f9", push:12}); return true; },
    onSkill2: (p, _t, spawn) => { wave(p, spawn, "#e0f2fe", 40, 62, 18); p.guardTimer = 30; return true; }
  };
}

export class PlayableQuestBook {
  constructor(saved = {}) {
    this.state = Object.fromEntries(PLAYABLE_IDS.map(id => [id, {
      started: Boolean(saved[id]?.started), recruited: Boolean(saved[id]?.recruited), progress: Math.max(0, saved[id]?.progress | 0),
      bossProof: Boolean(saved[id]?.bossProof), systems: Object.fromEntries((PLAYABLES[id].systems || []).map(key => [key, Boolean(saved[id]?.systems?.[key])]))
    }]));
  }
  start(id) { if (!this.state[id] || this.state[id].recruited) return false; this.state[id].started = true; return true; }
  onEliteKill(area) {
    const advanced = [];
    for (const [id, def] of Object.entries(PLAYABLES)) {
      const q = this.state[id];
      if (q.started && !q.recruited && def.region === area && def.required > 0) {
        q.progress = Math.min(def.required, q.progress + 1);
        advanced.push(id);
      }
    }
    return advanced;
  }
  onBossDefeated(area) {
    const advanced = [];
    Object.entries(PLAYABLES).forEach(([id, def]) => {
      const q = this.state[id];
      if (q.started && !q.recruited && def.region === area && def.needsBoss && !q.bossProof) {
        q.bossProof = true;
        advanced.push(id);
      }
    });
    return advanced;
  }
  repairSystem(id, system) {
    const q = this.state[id], def = PLAYABLES[id];
    if (!q?.started || q.recruited || !def.systems?.includes(system) || q.systems[system]) return false;
    q.systems[system] = true;
    q.progress = Object.values(q.systems).filter(Boolean).length;
    return true;
  }
  ready(id, bag = null) {
    const def = PLAYABLES[id], q = this.state[id];
    const systemsReady = !def.systems || def.systems.every(key => q?.systems[key]);
    return Boolean(q?.started && systemsReady && q.progress >= def.required && (!def.needsBoss || q.bossProof) && (!def.feed || (bag && Object.entries(def.feed).every(([item,n]) => bag.count(item) >= n))));
  }
  recruit(id, bag = null) {
    if (!this.ready(id, bag)) return false;
    Object.entries(PLAYABLES[id].feed || {}).forEach(([item,n]) => bag.take(item,n));
    this.state[id].recruited = true;
    return true;
  }
  serialize() { return structuredClone(this.state); }
}
