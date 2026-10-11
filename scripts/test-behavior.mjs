import assert from 'node:assert/strict';
import {load,seedRandom} from './headless.mjs';
const {tickBehavior,behaviorPose,BEHAVIOR_POOLS}=await load('js/behavior.js');
const {QuestManager,MENTOR_BY_CLASS}=await load('js/quest.js');
seedRandom(7);
// Every pool rolls, poses stay finite, and moving cancels at once
for(const pool of Object.keys(BEHAVIOR_POOLS)){
 const a={};const seen=new Set();
 for(let i=0;i<60*600;i++){const b=tickBehavior(a,true,pool);if(b){seen.add(b);const p=behaviorPose(a);assert.ok(p&&[p.sx,p.sy,p.ox,p.oy].every(Number.isFinite),pool+' '+b);}}
 assert.equal(seen.size,BEHAVIOR_POOLS[pool].length,pool+' rolls every behavior: '+[...seen]);
 while(!a.bhv.cur)tickBehavior(a,true,pool);
 assert.equal(tickBehavior(a,false,pool),null);assert.equal(behaviorPose(a),null,'moving cancels');
}
// Act V: the mentor waits until the hero is registered with the guild
const q=new QuestManager();q.step=5;q.side={complete:()=>true,ensure(){},hudLine:()=>''};
const hero={level:12,guild:{member:false},bag:{has:()=>false}};
q.update(hero);q.onTalk(MENTOR_BY_CLASS.knight,'x','knight');assert.equal(q.step,5,'mentor before guild registration');
hero.guild.member=true;q.update(hero);q.onTalk(MENTOR_BY_CLASS.knight,'x','knight');assert.equal(q.step,6,'mentor after registration');
console.log('PASS: idle behaviors for',Object.keys(BEHAVIOR_POOLS).join('/'),'and the Act V guild registration gate');
