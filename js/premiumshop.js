import { getLang } from "./i18n.js";
import { PREMIUM_PRODUCTS, buyPremium, demoTopUp, exchangePremium, TRANSMUTE_STYLES, premiumBuff, premiumPrice, playableBanner, playableStars } from "./premium.js";
import { PLAYABLES } from "./playables.js";
import { describe, upgradeCost, MAX_PLUS } from "./items/itemdb.js";
import { formatCoins } from "./items/economy.js";
const WORDS = {
 title:["PREMIUM SHOP","PREMIUM NA TINDAHAN"],demo:["DEMO PAYMENTS · No real charges","DEMO PAYMENT · Walang totoong bayad"],
 gear:["Effects & Refinement","Epekto at Refine"],skills:["Skills & Buffs","Skill at Buff"],heroes:["Heroes & Summons","Bayani at Summon"],wallet:["Pesos & Exchange","Piso at Palitan"],
 buy:["Buy","Bilhin"],owned:["Owned","Pag-aari"],equip:["Equip","Gamitin"],off:["Disable","Patayin"],on:["Enable","Buksan"],
 platinum:["Not enough Platinum.","Kulang ang Platino."],featured:["FEATURED · 20% OFF","TAMPOK · 20% DISKUWENTO"],next:["Next","Susunod"],ends:["Offer ends in","Matatapos sa"],
 cash:["Not enough pesos. Open Pesos & Exchange.","Kulang ang piso. Buksan ang Piso at Palitan."],bag:["Your bag is full.","Puno ang bag."],party:["Your party is full.","Puno ang party."],
 bought:["Purchase complete.","Nabili na."],paid:["Demo payment approved. No money was charged.","Aprubado ang demo payment. Walang siningil na pera."],
 refine:["Guaranteed refine","Garantisadong refine"],materials:["Requires 1 Safety Stone plus materials and gold. Maximum +15.","Kailangan ng 1 Safety Stone, materyales at ginto. Hanggang +15."],
 failure:["Check your pesos, materials, gold or inventory space.","Tingnan ang piso, materyales, ginto o espasyo sa bag."],
 success:["Refinement successful!","Matagumpay ang refine!"],rate:["₱1 = 100 Platinum (10,000 gold). Enter whole pesos for ₱ → Platinum; multiples of 100 Platinum for Platinum → ₱. Soulstone = ₱1 / 100 Platinum.","₱1 = 100 Platino (10,000 ginto). Buong piso para sa ₱ → Platino; tig-100 Platino para sa Platino → ₱. Soulstone = ₱1 / 100 Platino."],
 payment:["Sample checkout","Halimbawang checkout"],complete:["Complete demo payment","Tapusin ang demo payment"],cancel:["Cancel","Kanselahin"],
 permanent:["Permanent","Permanente"],store:["Premium Shop","Premium Shop"],ward:["Guardian Ward","Pananggalang"],might:["Champion Might","Lakas ng Kampeon"],
 cashToPlatinum:["₱ → Platinum","₱ → Platino"],platinumToCash:["Platinum → ₱","Platino → ₱"],soulToCash:["Soulstone → ₱","Soulstone → ₱"],soulToPlatinum:["Soulstone → platinum","Soulstone → platino"]
};
const tx = key => WORDS[key]?.[getLang()==="fil"?1:0] || key;
const local = a => a[getLang()==="fil"?1:0];
function el(tag,parent,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent?.appendChild(n);return n;}
const button=(parent,label,fn)=>{const b=el("button",parent,"",label);b.type="button";b.onclick=fn;return b;};
export class PremiumShop {
 constructor(root,deps){this.root=root;this.deps=deps;this.open=false;this.tab="gear";this.message="";this.checkout=null;this.refineSelection="";this.bannerSlot=null;
  this.panel=el("div",root,"premium-modal");this.panel.hidden=true;this.panel.setAttribute("role","dialog");this.panel.setAttribute("aria-modal","true");
  this.ad=document.getElementById("premiumAd");if(this.ad)this.ad.onclick=()=>this.deps.open();
  const mapBox=document.getElementById("sideMapBox");   // buffs & effects sit under the side World Map when it exists
  this.hud=el("div",mapBox||root,mapBox?"premium-hud in-map":"premium-hud");this.hud.hidden=true;this.hudKey="";
  this.panel.addEventListener("click",e=>{if(e.target===this.panel)this.close();});
 }
 show(player,party){this.player=player;this.party=party;this.open=true;this.checkout=null;this.message="";this.panel.hidden=false;this.render();}
 close(){this.open=false;this.checkout=null;this.panel.hidden=true;this.deps.onClose?.();}
 handleInput(e){if(e.code==="Backspace"){e.preventDefault();if(this.checkout){this.checkout=null;this.render();}else this.close();}}
 changed(message){this.message=message;this.deps.onChange?.();this.render();this.hudKey="";}
 render(){const p=this.player;if(!p)return;const s=p.premium;this.panel.replaceChildren();const box=el("div",this.panel,"premium-box");
  const header=el("header",box,"premium-header");const brand=el("div",header,"premium-brand");el("span",brand,"premium-eyebrow","VANGUARD OF FATE · EXCLUSIVE COLLECTION");el("h2",brand,"",tx("title"));button(header,"✕",()=>this.close()).setAttribute("aria-label",getLang()==="fil"?"Isara":"Close");
  const account=el("div",box,"premium-account");el("p",account,"premium-demo",tx("demo"));el("p",account,"premium-wallet",`₱${s.cash.toLocaleString("en-PH",{maximumFractionDigits:2})} · ${formatCoins(p.gold)}`);
  el("p",box,"premium-promise",getLang()==="fil"?"Ang mga permanenteng binili ay mananatili sa Regression. Hindi kasama ang timed buffs; hindi napupunan ang nagamit na item.":"Your permanent collection stays with you through Regression. Timed buffs end; consumed items are not refilled.");
  const tabs=el("nav",box,"premium-tabs");for(const id of ["gear","skills","heroes","wallet"]){const b=button(tabs,tx(id),()=>{this.tab=id;this.checkout=null;this.render();});b.classList.toggle("selected",this.tab===id);}
  const body=el("div",box,`premium-body premium-page-${this.tab}${this.checkout?" premium-checkout":""}`);
  if(this.checkout){this.renderCheckout(body);return;}
  if(this.tab==="wallet")this.renderWallet(body);else{
   if(this.tab==="heroes")this.renderBanner(body);
   const kinds={gear:["transmute","item"],skills:["skill","buff"],heroes:["recruit","summon"]}[this.tab];
   for(const product of PREMIUM_PRODUCTS.filter(x=>kinds.includes(x.kind))){const card=el("article",body,"premium-card");
    const visual=el("div",card,`premium-product-art art-${product.kind} art-${product.id.split(":")[1] || product.id}`);
    if(["recruit","summon"].includes(product.kind))this.drawProfile(visual,product.id.split(":")[1]);
    else el("span",visual,"premium-glyph",({autoLoot:"✧",autoDefend:"♜",autoSell:"⚖",autoBuy:"⚗",refineSafetyStone:"◆",soulstone:"◇",ward:"♜",might:"⚔"})[product.id] || "✦");
    el("span",card,"premium-kind",product.kind==="buff"?(getLang()==="fil"?"1 ORAS":"1 HOUR"):product.kind==="item"?(getLang()==="fil"?"ITEM":"CONSUMABLE"):tx("permanent"));
    el("h3",card,"",local(product.name));
    if(["recruit","summon"].includes(product.kind)){
     const def=PLAYABLES[product.id.split(":")[1]];
     el("div",card,"premium-stars","★".repeat(playableStars(product.id.split(":")[1])));
     el("p",card,"",def.role[getLang()]);
     if(product.kind==="recruit"){el("p",card,"",def.skillLore[getLang()]);el("p",card,"premium-signature",def.skills.join(" · "));}
    }
    el("p",card,"",local(product.description));
    const key=product.id.split(":")[1];const owned=product.kind==="skill"?s.skills[product.id]:product.kind==="transmute"?s.transmutes.includes(key):product.kind==="recruit"?this.party.recruited(key):product.kind==="summon"?s.summons.includes(key):false;
    if(owned){
     if(product.kind==="skill")button(card,tx(s.enabled[product.id]?"off":"on"),()=>{s.enabled[product.id]=!s.enabled[product.id];this.changed(tx("owned"));});
     else if(product.kind==="transmute")button(card,tx(s.transmute===key?"off":"equip"),()=>{s.transmute=s.transmute===key?null:key;this.changed(tx("owned"));});
     else if(product.kind==="summon" || (product.kind==="recruit"&&s.summons.includes(key)))button(card,tx(s.summonActive===key?"off":"equip"),()=>{s.summonActive=s.summonActive===key?null:key;this.changed(tx("owned"));});
     else el("span",card,"",tx("owned"));
    }else{
     const price=premiumPrice(product);
     if(price.discount){card.classList.add("premium-featured-card");el("p",card,"premium-discount",`${tx("featured")} · ₱${price.base} → ₱${price.cash}`);}
     button(card,`${tx("buy")} · ₱${price.cash}`,()=>{const r=buyPremium(p,this.party,product.id);this.changed(tx(r.ok?"bought":r.reason));});
     if(["recruit","summon"].includes(product.kind))button(card,`${tx("buy")} · ${price.platinum.toLocaleString()} Platinum`,()=>{const r=buyPremium(p,this.party,product.id,Date.now(),"platinum");this.changed(tx(r.ok?"bought":r.reason));});
    }
   }
   if(this.tab==="gear")this.renderRefine(body);
  }
  const status=el("p",box,"premium-status",this.message);status.setAttribute("role","status");
 }
 drawProfile(parent,id){
  const canvas=el("canvas",parent,"premium-portrait");canvas.width=24;canvas.height=22;
  this.party.avatarOf(id,this.player)?.drawPortrait(canvas.getContext("2d"),24,22);
 }
 renderBanner(body){
  const banner=playableBanner(),def=PLAYABLES[banner.id];this.bannerSlot=banner.endsAt;
  const card=el("article",body,`premium-banner banner-${banner.id}`);this.drawProfile(card,banner.id);
  el("div",card,"premium-discount",tx("featured"));
  el("div",card,"premium-stars","★".repeat(playableStars(banner.id)));
  el("h3",card,"",local(def.label));el("p",card,"",def.role[getLang()]);
  el("p",card,"premium-signature",def.skills.join(" · "));
  this.bannerTimer=el("p",card,"premium-countdown");this.updateBannerTimer();
  el("p",card,"",`${tx("next")}: ${local(PLAYABLES[banner.nextId].label)}`);
  const product=PREMIUM_PRODUCTS.find(x=>x.id===`recruit:${banner.id}`),price=premiumPrice(product);
  if(this.party.recruited(banner.id))el("p",card,"",tx("owned"));else{
   el("p",card,"premium-base-price",`₱${price.base} · ${(price.base*100).toLocaleString()} Platinum`);
   for(const currency of ["cash","platinum"])button(card,`${tx("buy")} · ${currency==="cash"?`₱${price.cash}`:`${price.platinum.toLocaleString()} Platinum`}`,()=>{const r=buyPremium(this.player,this.party,product.id,Date.now(),currency);this.changed(tx(r.ok?"bought":r.reason));});
  }
 }
 updateBannerTimer(now=Date.now()){
  if(!this.bannerTimer?.isConnected)return;
  const seconds=Math.max(0,Math.ceil((playableBanner(now).endsAt-now)/1000));
  const hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60);
  this.bannerTimer.textContent=`${tx("ends")}: ${hours}:${String(minutes).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
 }
 renderRefine(body){const p=this.player,card=el("article",body,"premium-card premium-refine");el("h3",card,"",tx("refine"));el("p",card,"",tx("materials"));
  const select=el("select",card);select.setAttribute("aria-label",tx("refine"));const entries=[];
  for(const [slot,inst]of Object.entries(p.bag.equip))if(inst)entries.push({key:`slot:${slot}`,inst,where:{slot}});
  p.bag.slots.forEach((inst,index)=>{if(describe(inst)?.type==="equip")entries.push({key:`bag:${index}`,inst,where:{index}});});
  for(const entry of entries){const option=el("option",select,"",describe(entry.inst).name);option.value=entry.key;}
  if(entries.some(x=>x.key===this.refineSelection))select.value=this.refineSelection;select.onchange=()=>{this.refineSelection=select.value;this.render();};
  const entry=entries.find(x=>x.key===select.value);if(!entry)return;
  this.refineSelection=entry.key;const item=describe(entry.inst),cost=upgradeCost(item);
  el("p",card,"",`Safety Stone ${p.bag.count("refineSafetyStone")} · Shard ${cost.shards} · Void Crystal ${cost.crystals} · ${formatCoins(cost.gold)}`);
  const b=button(card,item.plus>=MAX_PLUS?"MAX +15":`${tx("refine")} +${item.plus+1} · 100%`,()=>{
   const r=p.bag.upgrade(entry.where,p,Math.random,{safe:true});
   if(r.ok&&!entry.where.slot)this.refineSelection=`bag:${p.bag.slots.indexOf(r.item)}`;
   this.changed(tx(r.ok&&r.success?"success":"failure"));
  });b.disabled=item.plus>=MAX_PLUS;
 }
 renderWallet(body){el("p",body,"",tx("rate"));
  for(const amount of [500,1200,3000])button(body,`${tx("payment")} · ₱${amount}`,()=>{this.checkout=amount;this.render();});
  const input=el("input",body);input.type="number";input.min="1";input.step="1";input.max="1000000";input.value="1";input.setAttribute("aria-label",getLang()==="fil"?"Dami":"Exchange amount");
  for(const direction of ["cashToPlatinum","platinumToCash","soulToCash","soulToPlatinum"])button(body,tx(direction),()=>this.changed(tx(exchangePremium(this.player,direction,Number(input.value))?"bought":"failure")));
 }
 renderCheckout(body){el("h3",body,"",`${tx("payment")} · ₱${this.checkout}`);el("p",body,"premium-demo",tx("demo"));
  const method=el("select",body);method.setAttribute("aria-label",getLang()==="fil"?"Demo na paraan":"Demo payment method");for(const label of ["Demo GCash","Demo Card","Demo PayPal"])el("option",method,"",label);
  button(body,tx("complete"),()=>{const amount=this.checkout;this.checkout=null;this.changed(tx(demoTopUp(this.player,amount)?"paid":"failure"));});
  button(body,tx("cancel"),()=>{this.checkout=null;this.render();});
 }
 updateHud(p,visible){this.hud.hidden=!visible;if(!visible||!p)return;const s=p.premium,now=Date.now();
  if(this.open&&this.tab==="heroes"&&!this.checkout){
   if(this.bannerSlot!==playableBanner(now).endsAt)this.render();
   this.updateBannerTimer(now);
  }
  const timers=["ward","might"].filter(id=>premiumBuff(p,id,now)).map(id=>[id,Math.ceil((s.buffs[id]-now)/1000)]);
  const key=JSON.stringify([getLang(),s.cash,s.skills,s.enabled,s.transmute,s.summonActive,p.activeName,p.heroName,playableBanner(now).id,Math.floor(now/6000)%4,timers]);if(key===this.hudKey)return;this.hudKey=key;this.hud.replaceChildren();
  if(this.ad){
   const slide=Math.floor(now/6000)%4;
   const featured=playableBanner(now);
   const offers=[
    [tx("heroes"),`${local(PLAYABLES[featured.id].label)} · ${tx("featured")}`,"✦","heroes"],
    [tx("gear"),`${local(TRANSMUTE_STYLES.ember.name)} · ${tx("permanent")}`,"✧","ember"],
    [tx("skills"),`${local(PREMIUM_PRODUCTS.find(x=>x.id==="autoLoot").name)} · ${tx("permanent")}`,"◈","skills"],
    [tx("refine"),`${local(PREMIUM_PRODUCTS.find(x=>x.id==="refineSafetyStone").name)} · +15`,"◇","refine"]
   ];
   this.ad.querySelector("strong").textContent=tx("store");
   this.ad.querySelector(".premium-ad-eyebrow").textContent=offers[slide][0];
   document.getElementById("premiumAdOffer").textContent=offers[slide][1];
   this.ad.querySelector(".premium-ad-crest").textContent=offers[slide][2];
   this.ad.dataset.theme=offers[slide][3];
   if(this.adSlide!==slide){this.adSlide=slide;
    if(!matchMedia("(prefers-reduced-motion: reduce)").matches)
     this.ad.querySelector(".premium-ad-copy").animate([{opacity:0,transform:"translateY(8px)"},{opacity:1,transform:"translateY(0)"}],{duration:700,easing:"ease-out"});
   }
  }
  for(const id of ["autoLoot","autoDefend","autoSell","autoBuy"])if(s.skills[id])button(this.hud,`${({autoLoot:"✧",autoDefend:"🛡",autoSell:"⚖",autoBuy:"⚗"})[id]} ${local(PREMIUM_PRODUCTS.find(x=>x.id===id).name)} · ${s.enabled[id]?"ON":"OFF"}`,()=>{s.enabled[id]=!s.enabled[id];this.deps.onChange?.();this.hudKey="";});
  for(const [id,time]of timers){const m=Math.floor(time/60),sec=time%60;el("div",this.hud,`premium-buff ${id}`,`${id==="ward"?"🛡":"⚔"} ${tx(id)} · ${m}:${String(sec).padStart(2,"0")}`);}
  if(s.transmute)el("div",this.hud,"premium-effect",`✦ ${local(TRANSMUTE_STYLES[s.transmute].name)}`);
  if(s.summonActive)el("div",this.hud,"premium-effect",`✧ Echo · ${p.active ? (p.heroName || p.heroData.name) : PREMIUM_PRODUCTS.find(x=>x.id===`recruit:${s.summonActive}`).name[getLang()==="fil"?1:0]}`);
 }
}
