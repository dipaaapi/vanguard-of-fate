import fs from 'node:fs';
import path from 'node:path';
import {Canvas,hex} from './kit.mjs';
import {writeAse,readAse} from '../asefile.mjs';
import {writePng} from '../lib.mjs';
// Editable, layered Aseprite originals. --export reads originals without repainting hand edits.
const kits={novice:['blade','spiral','rock'],knight:['shield','lance','crescent'],archer:['bow','wing','arrows'],priest:['cross','angel','sun'],mage:['meteor','bolt','ice'],fighter:['orb','boot','burst'],vaelThorn:['crescent','spiral','chain'],cerynVoss:['crown','shield','sun'],nimaFen:['flask','leaf','poison'],eirene:['cross','mirror','ice'],templar:['blades','bolt','shield']};
const colors={novice:'#b4d3e1',knight:'#54bfff',archer:'#88edac',priest:'#ffdb79',mage:'#bd9bff',fighter:'#ff8868',vaelThorn:'#ad84ff',cerynVoss:'#ffe396',nimaFen:'#8ff276',eirene:'#92ecff',templar:'#f6bf75',path:'#68d6ed'};
const paths={slam:'burst',warcry:'crown',bulwark:'shield',volley:'arrows',pinpoint:'bow',shadowstep:'spiral',spark:'bolt',frostnova:'ice',manashield:'mirror'};
const entries=[...Object.entries(kits).flatMap(([owner,m])=>m.map((motif,i)=>({key:`${owner}-${['J','K','L'][i]}`,owner,motif,index:i}))),...Object.entries(paths).map(([key,motif],i)=>({key:`path-${key}`,owner:'path',motif,index:i}))];
function paint({owner,motif,index},frame){
 const bg=new Canvas(32,32), art=new Canvas(32,32), fx=new Canvas(32,32), color=hex(colors[owner]),white=hex('#f5f5d9'),dark=hex('#24304f');
 for(let y=1;y<31;y++)for(let x=1;x<31;x++){const d=Math.hypot(x-16,y-16);bg.set(x,y,[7+Math.round((24-d)*.4),14+Math.round((24-d)*.6),28+Math.round((24-d)*.9),255]);}
 const line=(a,b,w=2,c=color)=>art.line(...a,...b,w,c), poly=(p,c=color)=>art.poly(p,c);
 const ring=(r,c=color)=>{for(let a=0;a<6.3;a+=.06)art.set(16+Math.cos(a)*r,16+Math.sin(a)*r,c);};
 if(['blade','lance','blades'].includes(motif)){poly([[8,25],[11,16],[24,5],[23,14],[14,23]],white);line([7,22],[15,27],3);line([9,25],[5,29],3,hex('#bd8540'));if(motif==='blades')line([7,6],[25,25],3);if(motif==='lance')line([4,28],[28,4],1,color);}
 if(motif==='shield'){poly([[7,7],[16,4],[25,7],[24,20],[16,28],[8,20]]);poly([[10,9],[16,7],[22,9],[21,19],[16,24],[11,19]],dark);line([16,9],[16,22],2,white);line([12,15],[20,15],2,white);}
 if(['spiral','crescent'].includes(motif)){for(let a=0;motif==='spiral'&&a<10;a+=.05){const r=a*1.1;art.set(16+Math.cos(a)*r,16+Math.sin(a)*r,color);}if(motif==='crescent')for(let a=1;a<4.8;a+=.03)line([16+Math.cos(a)*8,16+Math.sin(a)*8],[16+Math.cos(a)*12,16+Math.sin(a)*12],1);}
 if(motif==='rock')art.blob(16,17,10,8,[dark,color,white]);
 if(['bow','arrows'].includes(motif)){if(motif==='bow'){for(let a=-1.4;a<1.5;a+=.08)art.set(10+Math.cos(a)*12,16+Math.sin(a)*11,color);line([12,5],[12,27],1,white);}for(let i=0;i<(motif==='arrows'?3:1);i++){let x=8+i*7;line([x,25],[x+7,7],1,white);poly([[x+4,10],[x+8,4],[x+9,12]]);}}
 if(['wing','angel'].includes(motif)){poly([[15,18],[3,7],[5,18],[11,22],[16,20]]);poly([[17,18],[29,7],[27,18],[21,22],[16,20]]);art.blob(16,15,3,6,[dark,color,white]);if(motif==='angel')ring(10,white);}
 if(motif==='cross'){line([16,6],[16,26],5);line([6,15],[26,15],5);line([16,9],[16,23],1,white);}
 if(['sun','burst','poison'].includes(motif)){for(let i=0;i<8;i++){const a=i*Math.PI/4+index*.13;line([16+Math.cos(a)*6,16+Math.sin(a)*6],[16+Math.cos(a)*13,16+Math.sin(a)*13],motif==='burst'?3:1);}art.blob(16,16,6,6,[dark,color,white]);if(motif==='poison'){art.blob(13,15,2,2,[dark]);art.blob(20,15,2,2,[dark]);line([13,21],[20,21],2,dark);}}
 if(['meteor','orb'].includes(motif)){if(motif==='meteor'){poly([[5,24],[21,5],[27,4],[25,15],[15,27]],hex('#fc875b'));line([10,21],[26,5],2,white);}art.blob(13,20,7,7,[dark,color,white]);}
 if(motif==='bolt')poly([[18,3],[7,18],[15,17],[12,29],[26,12],[18,13]],white);
 if(motif==='ice'){for(let i=0;i<6;i++){const a=i*Math.PI/3;line([16,16],[16+Math.cos(a)*12,16+Math.sin(a)*12],2);line([16+Math.cos(a)*8,16+Math.sin(a)*8],[16+Math.cos(a+.4)*11,16+Math.sin(a+.4)*11],1,white);}art.blob(16,16,3,3,[color,white]);}
 if(motif==='boot')poly([[9,5],[19,5],[18,17],[26,21],[26,26],[8,26],[7,22]],white);
 if(motif==='chain'){for(let i=0;i<4;i++){art.blob(7+i*6,25-i*6,4,5,[dark,color,white]);art.blob(7+i*6,25-i*6,2,3,[dark]);}}
 if(motif==='crown'){poly([[5,10],[11,15],[16,5],[21,15],[27,10],[24,25],[8,25]]);line([10,22],[22,22],2,white);}
 if(motif==='flask'){line([13,4],[19,4],3,white);poly([[13,5],[19,5],[19,12],[26,25],[24,28],[8,28],[6,25],[13,12]],white);poly([[12,17],[20,17],[24,25],[9,25]]);}
 if(motif==='leaf'){poly([[5,27],[8,11],[26,4],[25,20],[15,26]]);line([5,27],[24,7],1,white);}
 if(motif==='mirror'){poly([[16,3],[27,15],[16,29],[5,15]],white);poly([[16,6],[24,15],[16,25],[8,15]]);line([12,17],[20,10],2,white);}
 for(let n=0;n<7;n++){const a=n*2.4+index*.4+frame*.3;const r=10+(n%3)*2;fx.set(16+Math.cos(a)*r,16+Math.sin(a)*r,n%2?white:color);}
 return {background:bg.rgba(),emblem:art.rgba(),sparkles:fx.rgba()};
}
fs.mkdirSync('assets/skillcards',{recursive:true});
fs.mkdirSync('aseprite/skill',{recursive:true});fs.mkdirSync('assets/skills',{recursive:true});
for(const e of entries){const file=`aseprite/skill/${e.key}.aseprite`;if(!process.argv.includes('--export'))writeAse(file,{w:32,h:32,layers:['background','emblem','sparkles'],frames:[0,1,2].map(f=>({duration:.18,cels:paint(e,f)}))});const src=readAse(file);const sheet=new Uint8ClampedArray(96*32*4);src.frames.forEach((f,i)=>{for(let y=0;y<32;y++)sheet.set(f.rgba.subarray(y*128,(y+1)*128),(y*96+i*32)*4);});writePng(`assets/skills/${e.key}.png`,96,32,sheet);
 const card=new Uint8ClampedArray(288*56*4), tint=hex(colors[e.owner]);
 src.frames.forEach((f,fi)=>{
  for(let y=0;y<56;y++)for(let x=0;x<96;x++){
   const glow=Math.max(0,1-Math.hypot(x-64,y-23)/65), at=(y*288+fi*96+x)*4;
   card.set([Math.round(5+tint[0]*glow*.19),Math.round(10+tint[1]*glow*.19),Math.round(20+tint[2]*glow*.19),255],at);
  }
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   const k=(y*32+x)*4,d=Math.hypot(x-16,y-16), bg=[7+Math.round((24-d)*.4),14+Math.round((24-d)*.6),28+Math.round((24-d)*.9)];
   if(f.rgba[k+3]===0 || bg.every((v,c)=>f.rgba[k+c]===v))continue;
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
    const xx=36+x*2+dx,yy=-5+y*2+dy;if(xx>=96||yy<0||yy>=56)continue;
    card.set(f.rgba.subarray(k,k+4),(yy*288+fi*96+xx)*4);
   }
  }
 });
 writePng(`assets/skillcards/${e.key}.png`,288,56,card);
}
console.log(`Painted/exported ${entries.length} layered Aseprite skill icons`);
