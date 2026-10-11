import { summonThreat, summonTarget, autoSummonLoot } from "./automation.js";
import { Player } from "../player.js";
import { attackTransmute } from "../premium.js";
export function companionId(player, party) {
 const selected=player.premium?.summonActive;
 if(!selected || !player.premium.summons.includes(selected))return null;
 const id=party.activeId === "hero" ? selected : "hero";
 return party.hpOf(id,player) > 0 ? id : null;
}
// One premium NPC echo uses the recruit's real Avatar and signature combat kit.
export class PremiumEcho {
 constructor(id,player,party){this.id=id;this.avatar=party.avatarOf(id,player);this.kit=party.kitOf(id,player)||player.heroData;this.x=player.x-26;this.y=player.y-10;this.isAlive=true;this.t=0;this.cd=0;this.skillCd=0;this.anim="idle";this.facing="right";this.flying=true;this.actor=id==="hero"?new Player(this.x,this.y,player.heroData):{x:this.x,y:this.y,buffs:{},guardTimer:0};}
 update(p,manager,loot,fx,stage,spawn){this.t++;if(this.cd>0)this.cd--;if(this.skillCd>0)this.skillCd--;
  if(p.hp<=0||p.inBoat)return;
  this.kit.onUpdate?.(this.actor);
  if(this.actor.chargeTimer>0){this.x=this.actor.x;this.y=this.actor.y;}
  if(Math.hypot(this.x-p.x,this.y-p.y)>360){this.x=p.x-26;this.y=p.y-10;}
  if(autoSummonLoot(this,p,manager,loot,fx,stage,{x:10,y:20,fly:true,speed:2.8})){this.anim="walk";return;}
  const safe=stage.isInsideSafeZone(p.x+10,p.y+17);const enemy=safe?null:summonTarget(p,manager.enemies,200);this.target=enemy;
  const gx=enemy?enemy.x-24:p.x-26,gy=enemy?enemy.y:p.y-10,dx=gx-this.x,dy=gy-this.y,d=Math.hypot(dx,dy);
  if(d>8){this.x+=dx/d*Math.min(2.8,d-8);this.y+=dy/d*Math.min(2.8,d-8);this.anim="walk";}else this.anim="idle";
  if(dx)this.facing=dx<0?"left":"right";
  if(!enemy||Math.hypot(enemy.x-this.x,enemy.y-this.y)>60)return;
  const actor=this.actor;Object.assign(actor,{x:this.x,y:this.y,level:p.level,aimAngle:Math.atan2(enemy.y-this.y,enemy.x-this.x),facing:this.facing,buffs:{...p.buffs},hp:p.hp,maxHp:p.maxHp});
  const emit=shot=>{shot.premiumEcho=true;spawn(attackTransmute(p,shot));};
  if(this.cd<=0){this.kit.onAttack(actor,enemy,emit);this.cd=Math.max(40,this.kit.attackCooldown);this.anim="attack";}
  if(this.skillCd<=0){this.kit.onSkill(actor,enemy,emit);this.skillCd=Math.max(180,this.kit.cooldown);this.anim="attack";}
  // The echo's defensive skills shelter its owner too.
  if(actor.guardTimer)p.guardTimer=Math.max(p.guardTimer||0,Math.min(30,actor.guardTimer));
 }
 draw(ctx){ctx.save();ctx.globalAlpha=.78;ctx.shadowColor="#bd96ff";ctx.shadowBlur=5;this.avatar.draw(ctx,this.x+10,this.y+20,"side",this.anim,Math.floor(this.t/8),this.facing==="left");ctx.restore();}
}
