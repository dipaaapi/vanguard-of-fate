import { GFX } from "../settings.js";
// Refinement intensity is shared by worn silhouettes, orbit effects and item previews.
export function refineGlow(item, tick = 0) {
  const plus = Math.min(15, Math.max(0, Number(item?.plus) || 0));
  if(item?.type!=="equip"||!plus)return null;
  const color=plus===15?`hsl(${(tick*1.4)%360} 100% 74%)`:plus>=13?"#ff7595":plus>=10?"#ffce67":plus>=7?"#d68aff":plus>=4?"#55d8ff":"#b2edff";
  return {plus,color,accent:plus>=10?"#fff7d2":"#effaff",blur:3+plus*.9,width:.6+plus*.21};
}
export function styleRefineGlow(image,item){const g=refineGlow(item);if(!g)return;image.style.filter=`drop-shadow(0 0 ${g.width}px ${g.color}) drop-shadow(0 0 ${g.blur/2}px ${g.color})`;image.dataset.refine=String(g.plus);}
export function drawRefinedSprite(ctx,item,tick,draw){const g=GFX.glow&&refineGlow(item,tick);if(!g){draw();return;}ctx.save();ctx.shadowColor=g.color;ctx.shadowBlur=g.blur;
 const w=g.width*.35;ctx.filter=`drop-shadow(${w}px 0 0 ${g.color}) drop-shadow(-${w}px 0 0 ${g.color}) drop-shadow(0 ${w}px 0 ${g.color}) drop-shadow(0 -${w}px 0 ${g.color})`;
 draw();ctx.restore();}
export function drawRefineAura(ctx,x,y,item,tick,weapon=false){const g=GFX.glow&&refineGlow(item,tick);if(!g)return;
 ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha*=.48+Math.sin(tick*.05)*.12;ctx.shadowColor=g.color;ctx.shadowBlur=g.blur;ctx.strokeStyle=g.color;ctx.lineWidth=g.width;
 const rx=weapon?3+g.plus*.12:9+g.plus*.16,ry=weapon?7:12;
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,weapon?-.5:0,0,Math.PI*2);ctx.stroke();
 if(g.plus>=7){ctx.lineWidth=g.width*.5;ctx.beginPath();ctx.ellipse(x,y+10,weapon?7:14,3+g.plus*.1,tick*.012,0,Math.PI*2);ctx.stroke();}
 const count=2+Math.floor(g.plus*.65);ctx.fillStyle=g.accent;
 for(let i=0;i<count;i++){const a=tick*(weapon?.05:.022)+i*Math.PI*2/count;const r=1+g.plus*.04;const px=x+Math.cos(a)*(rx+3),py=y+Math.sin(a)*(ry+3)-((tick+i*13)%45)/12;
  ctx.globalAlpha=.35+.5*Math.max(0,Math.sin(tick*.09+i));ctx.fillRect(px,py,r,r);
  if(g.plus>=10&&i%3===0){ctx.fillRect(px-r,py+r/2,r*3,.7);ctx.fillRect(px+r/2,py-r,.7,r*3);}
 }
 if(g.plus>=13){ctx.strokeStyle=g.accent;ctx.lineWidth=.7;for(let i=0;i<4;i++){const a=tick*.02+i*Math.PI/2;ctx.beginPath();ctx.arc(x,y,rx+5,a,a+.5);ctx.stroke();}}
 ctx.restore();}
