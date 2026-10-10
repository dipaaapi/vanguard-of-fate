// Editable Aseprite hall, staff and membership plate; exported through the static-image pipeline.
import { Canvas, hex as H } from "./kit.mjs";
import { writeAse } from "../asefile.mjs";
import { SRC_DIR, ROOT, writePng } from "../lib.mjs";
import path from "node:path";
import fs from "node:fs";
const rect = (c, x, y, w, h, col) => c.poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]], H(col));
const star = (c, x, y, r, col) => c.poly(Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,d=i%2?r*.43:r;return [x+Math.cos(a)*d,y+Math.sin(a)*d];}),H(col));
function hall() {
  const c = new Canvas(280,180);
  c.blob(140,160,134,15,[H("#202837"),H("#34404b")]);
  rect(c,8,142,264,22,"#63716e");
  for(let y=146;y<166;y+=6) for(let x=10+(y%12?0:7);x<272;x+=16) {rect(c,x,y,14,4,"#89918a");rect(c,x,y,14,1,"#b1b5a0");}
  rect(c,20,68,240,85,"#55483d");
  for(let y=72;y<150;y+=9) for(let x=24+(y%18?8:0);x<256;x+=23) {const w=Math.min(21,256-x);rect(c,x,y,w,7,"#827363");rect(c,x,y,w,1,"#b1a18a");}
  for(const x of [20,66,206,252]) {rect(c,x,73,8,77,"#263b44");rect(c,x,73,2,77,"#86a09a");}
  c.poly([[7,83],[35,33],[126,17],[146,17],[246,33],[274,83]],H("#182936"));
  for(let y=28;y<83;y+=6) {const inset=Math.max(11,37-(y-28)*.46);c.poly([[inset,y],[280-inset,y],[280-inset-3,y+5],[inset+3,y+5]],H(y%12?"#315d67":"#3c7480"));
    for(let x=Math.ceil(inset/12)*12;x<280-inset;x+=12)c.line(x,y,x+3,y+4,1,H("#528d92"));}
  c.poly([[116,60],[140,34],[164,60],[164,106],[116,106]],H("#273b47"));
  c.poly([[122,61],[140,41],[158,61],[158,100],[122,100]],H("#b99a5a"));
  c.blob(140,75,14,17,[H("#244b52"),H("#3b837d"),H("#65bdb1")]);star(c,140,74,12,"#ffe0a0");
  rect(c,121,109,38,44,"#122a32");c.blob(140,112,19,18,[H("#142832"),H("#254452")],{flat:126});
  rect(c,128,123,24,30,"#805735");for(const x of [130,138,146])rect(c,x,123,2,28,"#bf8c52");rect(c,138,129,2,21,"#3e3229");c.blob(147,140,2,2,[H("#ffe0a0")]);
  for(const x of [38,83,177,222]) {rect(c,x,97,20,25,"#26303b");rect(c,x+3,99,14,20,"#d5aa64");rect(c,x+9,99,2,22,"#3c3635");rect(c,x+2,109,16,2,"#3c3635");}
  for(const [i,x] of [47,91,185,229].entries()) {rect(c,x,124,7,31,i%2?"#c9a361":"#419685");c.poly([[x,155],[x+3,151],[x+7,155],[x+7,124],[x,124]],H(i%2?"#c9a361":"#419685"));star(c,x+3,133,3,"#fce7ac");}
  for(const x of [12,260]) {rect(c,x,129,5,24,"#29303b");c.blob(x+2,128,4,7,[H("#ae5a26"),H("#ffa344"),H("#ffe9a4")]);}
  rect(c,116,157,48,3,"#c3b99c");rect(c,112,161,56,3,"#9da594");c.outline(H("#111e2b"));return c;
}
function staff(key) {
  const palettes={guildMaster:["#315b64","#7da8aa","#b9b9aa","#c68c62"],guildRepresentative:["#3b7470","#96d0ad","#482f34","#e0ac86"],guildClerk:["#826140","#e4c481","#ba744b","#f1cba5"],guildScout:["#446b3e","#91b569","#3c3025","#b98257"],guildInflictionist:["#5d386d","#b191d5","#c9c1e7","#d5bbcf"]};
  const [base,light,hair,skin]=palettes[key],c=new Canvas(32,48);
  c.blob(16,43,10,3,[H("#142534")]);
  rect(c,10,33,5,10,"#292d38");rect(c,18,33,5,10,"#292d38");rect(c,9,40,7,4,"#4e3b31");rect(c,18,40,7,4,"#4e3b31");
  c.poly([[8,21],[24,21],[27,37],[5,37]],H(base));c.poly([[9,22],[15,21],[15,37],[8,37]],H(light));
  rect(c,6,22,4,12,base);rect(c,23,22,4,12,base);rect(c,5,31,5,4,skin);rect(c,23,31,5,4,skin);
  rect(c,8,31,17,3,"#4a3a2d");rect(c,15,31,4,3,"#dfc17b");
  c.blob(16,15,7,9,[H("#513d37"),H(skin),H(skin)]);c.blob(16,9,8,6,[H("#292b35"),H(hair),H(hair)]);
  rect(c,10,10,3,6,hair);rect(c,21,10,3,6,hair);rect(c,12,15,2,2,"#222833");rect(c,19,15,2,2,"#222833");rect(c,15,20,4,1,"#875046");
  if(key==='guildMaster') {rect(c,11,20,11,4,hair);rect(c,7,23,4,5,"#b4c9c9");rect(c,23,23,4,5,"#b4c9c9");rect(c,27,23,2,19,"#c7d8d2");rect(c,25,29,6,2,"#d4b56e");}
  if(key==='guildRepresentative') {rect(c,21,7,3,16,hair);star(c,17,27,4,"#ffe2a2");rect(c,25,26,4,6,"#66bdad");}
  if(key==='guildClerk') {rect(c,10,14,5,4,"#506b79");rect(c,18,14,5,4,"#506b79");rect(c,14,15,5,1,"#e8d594");rect(c,22,25,7,11,"#334967");rect(c,24,27,4,7,"#eadfb3");}
  if(key==='guildScout') {c.poly([[6,10],[15,3],[25,11]],H(base));c.line(26,20,29,30,1,H("#c6aa75"));c.line(29,30,26,41,1,H("#c6aa75"));c.line(26,20,26,41,1,H("#e0d9b7"));}
  if(key==='guildInflictionist') {rect(c,23,9,3,19,hair);c.line(27,14,27,42,2,H("#573947"));c.blob(27,12,4,5,[H("#673c8b"),H("#b692e8"),H("#ede0ff")]);c.spark(4,19,H("#b692e8"));}
  c.outline(H("#111c29"));return c;
}
function plate() {const c=new Canvas(24,24);rect(c,5,3,14,18,"#244451");rect(c,6,4,12,16,"#77c0b2");rect(c,7,5,10,14,"#3b877e");star(c,12,12,5,"#ffe4a6");c.blob(12,5,1,1,[H("#122734")]);c.outline(H("#111c29"));return c;}
function caravan() {
  const c = new Canvas(48,40);
  c.blob(24,35,22,4,[H('#142534')]);
  for(const x of [9,37]) { c.blob(x,31,6,7,[H('#202b35'),H('#655044'),H('#d9ae70')]);rect(c,x-1,26,2,11,'#35303c'); }
  rect(c,4,19,40,12,'#744b32');rect(c,5,21,38,2,'#c89157');rect(c,5,28,38,2,'#c89157');
  c.poly([[5,19],[10,5],[37,5],[43,19]],H('#e0c999'));rect(c,11,7,25,3,'#f7e5b7');
  for(const x of [12,24,36])rect(c,x,10,2,9,'#8d795e');
  rect(c,19,14,10,9,'#31666b');star(c,24,18,4,'#ffe0a0');
  c.blob(41,15,3,4,[H('#49392d'),H('#d5ad82')]);rect(c,38,19,7,7,'#567d68');rect(c,41,25,5,3,'#493b32');
  c.outline(H('#111c29'));return c;
}
function resource(stone) {
  const c = new Canvas(24,24);c.blob(12,21,10,2,[H('#142534')]);
  if(stone) { c.poly([[3,20],[5,10],[12,5],[20,11],[22,20]],H('#697c87'));c.poly([[5,11],[12,6],[15,12],[8,17]],H('#a9bec2'));rect(c,15,15,4,3,'#d8b071'); }
  else { c.line(12,21,12,8,2,H('#77a965'));c.poly([[12,16],[4,10],[4,16],[12,20]],H('#4b9269'));c.poly([[12,12],[20,7],[20,14],[12,17]],H('#a1c96c'));c.blob(12,6,4,4,[H('#a36bb5'),H('#ead0ed')]); }
  c.outline(H('#111c29'));return c;
}
const art={hall:hall(),plate:plate(),...Object.fromEntries(['guildMaster','guildRepresentative','guildClerk','guildScout','guildInflictionist'].map(key=>[key,staff(key)])),caravan:caravan(),herb:resource(false),stone:resource(true)};
for(const [key,c] of Object.entries(art))writeAse(path.join(SRC_DIR,'ui',`guild_${key}.aseprite`),{w:c.w,h:c.h,layer:'Guild art',frames:[{rgba:c.rgba(),duration:.12}]});
const preview=new Canvas(500,240);preview.blit(art.hall,25,0);Object.values(art).slice(1).forEach((c,i)=>preview.blit(c,25+i*48,185));
fs.mkdirSync(path.join(ROOT,'.codex'),{recursive:true});writePng(path.join(ROOT,'.codex','guild-art.png'),preview.w,preview.h,preview.rgba());
fs.writeFileSync(path.join(ROOT,'assets','ui','guild.json'),JSON.stringify(Object.keys(art).map(k=>`guild_${k}`),null,2)+'\n');
console.log(`Painted ${Object.keys(art).length} editable guild Aseprite sources`);
