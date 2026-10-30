import {translate} from './i18n.mjs';
import {SIZE,cells,alive,DIRS,TYPES,add,mul,eq,key,coord,at,trace,inside,beam,charged,shieldActive,groupMove,hasActed} from './engine.mjs';
const BLUE='#77dcf4',ORANGE='#ff9c75';
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function inPoly(p,poly){let ok=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)ok=!ok;}return ok;}
export class FleetScene{
 constructor(canvas,onPick,onHover){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.yaw=.68;this.pitch=.64;this.zoom=1;this.pan=[0,0];this.focusPoint=null;this.onPick=onPick;this.onHover=onHover;this.hits=[];this.options={};this.running=true;
  this.down=null;this.drag=false;this.handlers={
   pointerdown:e=>{this.down={x:e.offsetX,y:e.offsetY,yaw:this.yaw,pitch:this.pitch,pan:[...this.pan],panning:e.shiftKey||e.button===2};this.drag=false;canvas.setPointerCapture(e.pointerId);},
   pointermove:e=>{if(this.down){const dx=e.offsetX-this.down.x,dy=e.offsetY-this.down.y;if(Math.hypot(dx,dy)>5)this.drag=true;if(this.drag){if(this.down.panning)this.pan=[this.down.pan[0]+dx,this.down.pan[1]+dy];else{this.yaw=this.down.yaw+dx*.008;this.pitch=Math.max(.22,Math.min(1.48,this.down.pitch+dy*.006));}}}else {const hit=this.pick(e.offsetX,e.offsetY);this.hover=hit;onHover(hit);}},
   pointerup:e=>{if(this.down&&!this.drag)onPick(this.pick(e.offsetX,e.offsetY));this.down=null;},
   pointercancel:()=>{this.down=null;},pointerleave:()=>{this.hover=null;onHover(null);},
   contextmenu:e=>e.preventDefault(),wheel:e=>{e.preventDefault();this.zoom=Math.max(.65,Math.min(3.2,this.zoom-e.deltaY*.0015));}
  };
  for(const [n,f]of Object.entries(this.handlers))canvas.addEventListener(n,f,{passive:false});
  this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(canvas);this.fit();
  const loop=t=>{if(!this.running)return;if(!this.lastFrame||t-this.lastFrame>30){this.draw(t);this.lastFrame=t;}this.raf=requestAnimationFrame(loop);};this.raf=requestAnimationFrame(loop);
 }
 fit(){const rect=this.canvas.getBoundingClientRect();this.w=rect.width;this.h=rect.height;this.dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=this.w*this.dpr;this.canvas.height=this.h*this.dpr;}
 update(options){const old=this.options.state;if(old&&options.state.ply>old.ply){const reports=options.state.history.filter(r=>r.id>old.ply);this.combat={effects:reports.flatMap(r=>r.effects),impacts:reports.flatMap(r=>r.impacts),at:performance.now()};}else if(options.state.ply===0||old&&options.state.ply<old.ply)this.combat=null;this.options=options;}
 reset(top=false){this.yaw=top?0:.68;this.pitch=top?1.48:.64;this.zoom=1;this.pan=[0,0];this.focusPoint=null;}
 focus(p){this.focusPoint=[...p];this.pan=[0,0];this.zoom=1.8;}
 rotate(n){this.yaw+=n*Math.PI/4;}
 destroy(){this.running=false;cancelAnimationFrame(this.raf);this.resize.disconnect();for(const[n,f]of Object.entries(this.handlers))this.canvas.removeEventListener(n,f);}
 project(p){const frame=this.options.frame,span=frame?Math.max(frame.max[0]-frame.min[0]+1,frame.max[2]-frame.min[2]+1):14,center=this.focusPoint??(frame?frame.min.map((v,i)=>(v+frame.max[i])/2):[(SIZE[0]-1)/2,2,(SIZE[2]-1)/2]),x=p[0]-center[0],y=p[1]-center[1],z=p[2]-center[2],c=Math.cos(this.yaw),s=Math.sin(this.yaw),depth=x*s+z*c,scale=Math.min(this.w/(span*1.5),this.h/Math.max(10,span))*this.zoom;return {x:this.w*.5+(x*c-z*s)*scale+this.pan[0],y:this.h*.52+(depth*Math.sin(this.pitch)-y*Math.cos(this.pitch))*scale+this.pan[1],d:depth*Math.cos(this.pitch)+y*Math.sin(this.pitch)};}
 pick(x,y){for(const objectsFirst of [true,false])for(let i=this.hits.length-1;i>=0;i--){const h=this.hits[i];if(!!h.data.id===objectsFirst&&inPoly({x,y},h.poly))return h.data;}return null;}
 draw(time){
  const {state,selected,layer=1,slice=false,mode='move',destinations=[],pending,preview,hiddenIds=[],showLabels=false}=this.options;if(!state)return;
  const frame=this.options.frame??{min:[0,0,0],max:SIZE.map(n=>n-1)},lo=frame.min,hi=frame.max;
  const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.w,this.h);
  const bg=c.createRadialGradient(this.w*.48,this.h*.4,0,this.w*.5,this.h*.5,this.w*.7);bg.addColorStop(0,'#142b3a');bg.addColorStop(.5,'#0b1825');bg.addColorStop(1,'#070f19');c.fillStyle=bg;c.fillRect(0,0,this.w,this.h);
  for(let i=0;i<95;i++){const x=((i*7919)%1000)/1000*this.w,y=((i*3571)%1000)/1000*this.h;c.fillStyle=`rgba(162,204,226,${.1+(i%5)*.035})`;c.fillRect(x,y,i%9===0?2:1,1);}
  this.hits=[];const queue=[],labels=[];
  const face=(points,fill,stroke='rgba(135,189,212,.14)',data=null,width=1)=>{const poly=points.map(p=>this.project(p));queue.push({poly,fill,stroke,width,data,depth:poly.reduce((a,p)=>a+p.d,0)/poly.length});};
  const line=(a,b,color,width=1,dash=[])=>{const p=this.project(a),q=this.project(b);c.beginPath();c.setLineDash(dash);c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.strokeStyle=color;c.lineWidth=width;c.stroke();c.setLineDash([]);};
  const tile=(p,color,border,data)=>face([[p[0]-.48,p[1]-.43,p[2]-.48],[p[0]+.48,p[1]-.43,p[2]-.48],[p[0]+.48,p[1]-.43,p[2]+.48],[p[0]-.48,p[1]-.43,p[2]+.48]],color,border,data);
  const cube=(p,r,colors,data)=>{const [x,y,z]=p;const v=[[-r,-r,-r],[r,-r,-r],[r,-r,r],[-r,-r,r],[-r,r,-r],[r,r,-r],[r,r,r],[-r,r,r]].map(a=>add(a,p));[[0,1,2,3],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0],[4,7,6,5]].forEach((f,i)=>face(f.map(j=>v[j]),colors[i%colors.length],'rgba(155,185,211,.2)',data));};
  for(let x=lo[0];x<=hi[0]+1;x++)line([x-.5,-.5,lo[2]-.5],[x-.5,-.5,hi[2]+.5],'rgba(112,161,192,.15)');
  for(let z=lo[2];z<=hi[2]+1;z++)line([lo[0]-.5,-.5,z-.5],[hi[0]+.5,-.5,z-.5],'rgba(112,161,192,.15)');
  for(const x of[lo[0]-.5,hi[0]+.5])for(const z of[lo[2]-.5,hi[2]+.5]){line([x,-.5,z],[x,SIZE[1]-.5,z],'rgba(112,161,192,.2)',1,[3,5]);for(let y=0;y<SIZE[1];y++){const p=this.project([x,y,z]);c.fillStyle='rgba(165,199,215,.4)';c.fillRect(p.x-2,p.y-1,4,2);}}
  const destKeys=new Set(destinations.map(key));
  for(let x=lo[0];x<=hi[0];x++)for(let z=lo[2];z<=hi[2];z++){const p=[x,layer,z],legal=destKeys.has(key(p));tile(p,legal?(mode==='fire'?'rgba(249,155,104,.16)':'rgba(108,219,226,.14)'):((x+z)%2?'rgba(70,134,161,.025)':'rgba(70,134,161,.045)'),legal?(mode==='fire'?'#a26745':'#387f8a'):'rgba(119,183,212,.12)',{p});}
  for(let i=lo[0];i<=hi[0];i++)labels.push({p:[i,-.5,lo[2]-.85],text:String.fromCharCode(65+i),color:'#6b8da5',size:10});
  for(let i=lo[2];i<=hi[2];i++)labels.push({p:[lo[0]-.9,-.5,i],text:String(i+1),color:'#6b8da5',size:10});
  for(const p of state.nebula){if(slice&&p[1]!==layer)continue;cube(p,.44,['rgba(128,99,189,.12)','rgba(158,123,204,.13)','rgba(118,93,169,.18)'],{p,terrain:'nebula'});const q=this.project(p);labels.push({p,text:'⋆',color:'#c3a3ef',size:21});}
  for(const p of state.rocks){if(slice&&p[1]!==layer)continue;
   const verts=[[0,.49,0],[-.48,.09,-.27],[.12,.23,-.48],[.48,-.04,-.1],[.3,.08,.44],[-.29,-.03,.42],[0,-.48,0]].map(v=>add(v,p));
   for(let i=1;i<=5;i++){const n=i===5?1:i+1;face([verts[0],verts[i],verts[n]],['#53606a','#414f5c','#67717b','#788088','#4b5865'][i-1],'#7b899255',{p,terrain:'rock'});face([verts[6],verts[n],verts[i]],'#2b3948','#67758155',{p,terrain:'rock'});}
  }
  for(const ship of state.ships){if(hiddenIds.includes(ship.id))continue;const live=alive(ship),accent=ship.team?ORANGE:BLUE,selectedShip=ship.id===selected,forward=DIRS[ship.dir],up=Math.abs(forward[1])===1?[0,0,1]:[0,1,0],right=cross(up,forward);
   const world=(v,p)=>add(p,add(mul(right,v[0]),add(mul(up,v[1]),mul(forward,v[2]))));
   for(const cell of cells(ship)){
    if(slice&&cell.p[1]!==layer)continue;const data={p:cell.p,id:ship.id,role:cell.part.role},damaged=cell.part.hp===0||!live;
    const hull=damaged?['#3b4048','#30343e','#53515a']:ship.team?['#a39b91','#615659','#d7c5b3']:['#8ba6b6','#41596c','#c2d4dc'];
    const w=ship.type==='fighter'?.43:ship.type==='flag'?.43:ship.type==='station'?.45:.34,h=ship.type==='fighter'?.09:ship.type==='station'?.3:.2;
    const local=ship.type==='fighter'?[[-w,-h,-.35],[w,-h,-.35],[0,-h,.48],[-w,h,-.35],[w,h,-.35],[0,h,.48]]:[[-w,-h,-.44],[w,-h,-.44],[w,-h,.29],[0,-h,.48],[-w,-h,.29],[-w,h,-.44],[w,h,-.44],[w,h,.29],[0,h,.48],[-w,h,.29]];
    const vertices=local.map(v=>world(v,cell.p));const facets=ship.type==='fighter'?[[0,1,2],[0,3,4,1],[1,4,5,2],[2,5,3,0],[3,5,4]]:[[0,1,2,3,4],[0,5,6,1],[1,6,7,2],[2,7,8,3],[3,8,9,4],[4,9,5,0],[5,9,8,7,6]];
    facets.forEach((f,i)=>face(f.map(n=>vertices[n]),hull[i===facets.length-1?2:i%2],selectedShip?accent+'bb':'#162d3c',data,selectedShip?1.4:1));
    const patch=cell.part.role==='engine'?[[-.23,0,-.46],[.23,0,-.46],[.23,.13,-.46],[-.23,.13,-.46]]:[[-.1,h+.015,-.17],[.1,h+.015,-.17],[.1,h+.015,.2],[-.1,h+.015,.2]];
    face(patch.map(v=>world(v,cell.p)),damaged?'#ac7065':accent,accent+'88',data);
    if(cell.part.role==='weapon'&&ship.type==='flag'){face([[-.1,.23,-.3],[.1,.23,-.3],[.1,.23,.48],[-.1,.23,.48]].map(v=>world(v,cell.p)),ship.charge?'#fff0a3':accent,accent,data);}
    if(ship.type==='arsenal'&&cell.part.role==='weapon')for(const side of[-1,1])face([[side*.12,.21,-.2],[side*.3,.21,-.2],[side*.3,.21,.3],[side*.12,.21,.3]].map(v=>world(v,cell.p)),damaged?'#61434c':'#dfb279','#1e2c3b',data);
    if(cell.part.role==='shield')face([[0,.46,0],[-.3,.22,-.3],[.3,.22,-.3],[.3,.22,.3],[-.3,.22,.3]].map(v=>world(v,cell.p)),damaged?'#61434c':'#7cbfce',accent,data);
    if(cell.part.role==='signal')for(const side of[-1,1])face([[0,.21,0],[side*.42,.44,-.2],[side*.42,.44,.2]].map(v=>world(v,cell.p)),damaged?'#61434c':'#d9bd80',accent,data);
    if(cell.part.role==='factory')face([[-.3,.31,-.3],[.3,.31,-.3],[.3,.31,.3],[-.3,.31,.3]].map(v=>world(v,cell.p)),damaged?'#61434c':'#93bcb0',accent,data);
    if(selectedShip)tile(cell.p,'rgba(115,218,240,.05)',accent+'88',data);
   }
   if(!slice||ship.p[1]===layer){const q=this.project(ship.p),base=this.project([ship.p[0],-.48,ship.p[2]]);if(selectedShip){c.strokeStyle=accent+'66';c.setLineDash([2,4]);c.beginPath();c.moveTo(q.x,q.y);c.lineTo(base.x,base.y);c.stroke();c.setLineDash([]);}const acted=ship.team===state.turn&&hasActed(state,ship);if(showLabels||selectedShip||this.hover?.id===ship.id||ship.type==='flag'||acted)labels.push({p:add(ship.p,[0,.65,0]),text:`${acted?'✓ ':''}${TYPES[ship.type].short} ${ship.team?'R':'B'}${Number(ship.id.split('-')[1])+1}${live?'':' ×'}`,color:live?accent:'#7d808b',size:11,small:true});}
  }
  if(pending?.kind==='move'){const s=state.ships.find(x=>x.id===pending.id);for(const cell of cells(s,pending.to))if(!slice||cell.p[1]===layer)cube(cell.p,.38,['rgba(110,222,229,.11)','rgba(110,222,229,.18)'],{p:cell.p});}
  if(pending?.kind==='rotate'){const s=state.ships.find(x=>x.id===pending.id);for(const cell of cells(s,s.p,pending.dir))if(!slice||cell.p[1]===layer)cube(cell.p,.38,['rgba(110,222,229,.11)','rgba(110,222,229,.18)'],{p:cell.p});}
  if(pending?.kind==='group'){const commander=state.ships.find(x=>x.id===pending.id),g=groupMove(state,commander,pending.type,pending.dir,pending.steps);if(g.ok)for(const s of g.ships)for(const cell of cells(s,add(s.p,g.delta)))if(!slice||cell.p[1]===layer)cube(cell.p,.38,['rgba(110,222,229,.11)','rgba(110,222,229,.18)'],{p:cell.p});}
  queue.sort((a,b)=>a.depth-b.depth);for(const f of queue){c.beginPath();f.poly.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=f.fill;c.fill();c.strokeStyle=f.stroke;c.lineWidth=f.width;c.stroke();if(f.data)this.hits.push({poly:f.poly,data:f.data});}
  // Legal altitude moves remain selectable above the active horizontal plane.
  for(const p of destinations.filter(p=>p[1]!==layer)){if(mode==='fire')continue;const q=this.project(p);c.strokeStyle='#6edbe5';c.fillStyle='#102f3f';c.beginPath();c.arc(q.x,q.y,8,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=BLUE;c.font='11px monospace';c.textAlign='center';c.fillText(p[1]>layer?'↑':'↓',q.x,q.y+4);this.hits.push({poly:[{x:q.x-10,y:q.y-10},{x:q.x+10,y:q.y-10},{x:q.x+10,y:q.y+10},{x:q.x-10,y:q.y+10}],data:{p}});}
  for(const m of [...state.missiles,...(pending?.kind==='fire'&&state.ships.find(x=>x.id===pending.id)?.type==='arsenal'?[{target:pending.target}]:[])]){const q=this.project(m.target);c.strokeStyle='#ffab67';c.lineWidth=1.6;c.beginPath();c.arc(q.x,q.y,13+Math.sin(time*.004)*2,0,Math.PI*2);c.moveTo(q.x-20,q.y);c.lineTo(q.x+20,q.y);c.moveTo(q.x,q.y-20);c.lineTo(q.x,q.y+20);c.stroke();labels.push({p:add(m.target,[0,.65,0]),text:'IMPACT · 1',color:'#ffab67',size:10});}
  const chosen=state.ships.find(x=>x.id===selected),target=pending?.target??(mode==='fire'?this.hover?.p:null);
  if(chosen&&target&&mode==='fire'){const t=trace(state,chosen,target);for(let i=1;i<t.path.length;i++)line(t.path[i-1],t.path[i],t.ok?'#ffbb78':'#e57c72',2,[5,4]);}
  for(const flag of state.ships.filter(s=>alive(s)&&s.type==='flag'&&(s.charge||s.id===selected&&mode==='fire'))){const b=beam(state,flag);for(let i=1;i<b.path.length;i++)line(b.path[i-1],b.path[i],flag.charge?'#ffcf7ccc':'#f6b46d66',flag.charge?2:1,[5,5]);if(flag.charge)labels.push({p:add(flag.p,[0,.9,0]),text:charged(state,flag)?'主炮就绪':'蓄力中',color:'#ffe7a7',size:11});}
  for(const guard of state.ships.filter(shieldActive)){if(guard.id!==selected)continue;const tips=DIRS.map(d=>add(guard.p,mul(d,2)));for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if(Math.floor(i/2)!==Math.floor(j/2))line(tips[i],tips[j],'#7ad8da88',1,[3,3]);labels.push({p:add(guard.p,[0,.9,0]),text:`护盾 ${guard.shield}/3`,color:'#9ee9e7',size:11});}
  if(this.combat&&time-this.combat.at<2200){
   const age=time-this.combat.at,fade=Math.min(1,(2200-age)/650);
   for(const effect of this.combat.effects){
    const color=effect.team?ORANGE:BLUE;c.save();c.globalAlpha=fade;c.shadowColor=color;c.shadowBlur=18;
    if(effect.kind==='beam'&&age<1400){const path=effect.path,progress=Math.min(1,age/240);c.globalAlpha=Math.min(1,(1400-age)/650);for(let i=1;i<path.length;i++)if(i/(path.length-1)<=progress)line(path[i-1],path[i],color,effect.heavy?8:4);for(let i=1;i<path.length;i++)if(i/(path.length-1)<=progress)line(path[i-1],path[i],'#fff7da',effect.heavy?3:1.5);const muzzle=this.project(path[0]);c.fillStyle='#fff0bc';c.beginPath();c.arc(muzzle.x,muzzle.y,Math.max(2,12-age/65),0,Math.PI*2);c.fill();}
    if(effect.kind==='missile'){const [start,end]=effect.path,t=Math.min(1,age/950),p=start.map((v,i)=>v+(end[i]-v)*t);line(start,p,color,2,[4,6]);const q=this.project(p);c.fillStyle='#fff0b8';c.beginPath();c.arc(q.x,q.y,5,0,Math.PI*2);c.fill();}
    if(effect.kind==='blast'||effect.kind==='charge'){const q=this.project(effect.p),r=effect.kind==='blast'?15+Math.min(age/22,55):12+Math.min(age/35,24);c.lineWidth=3;c.strokeStyle=effect.kind==='blast'?'#ffc38a':'#9cecff';c.beginPath();c.arc(q.x,q.y,r,0,Math.PI*2);c.stroke();if(effect.kind==='blast')for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(q.x+Math.cos(a)*r*.65,q.y+Math.sin(a)*r*.65);c.lineTo(q.x+Math.cos(a)*r*1.2,q.y+Math.sin(a)*r*1.2);c.stroke();}}
    c.restore();
   }
   for(const hit of this.combat.impacts){const q=this.project(hit.p);c.save();c.globalAlpha=fade;const color=hit.damage?'#ff9e81':'#84e9f6';c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(q.x,q.y,16+Math.min(age/45,18),0,Math.PI*2);c.stroke();if(age<600){c.globalAlpha=.45*(1-age/600);c.fillStyle='#fff0bf';c.beginPath();c.arc(q.x,q.y,18,0,Math.PI*2);c.fill();}c.globalAlpha=fade;const y=q.y-28-Math.min(age/80,18);c.font='bold 21px sans-serif';c.textAlign='center';c.strokeStyle='#111b29';c.lineWidth=4;const text=translate(hit.sunk?'击毁':hit.damage?`−${hit.damage}`:`护盾 −${hit.blocked}`,this.options.locale);c.strokeText(text,q.x,y);c.fillStyle=color;c.fillText(text,q.x,y);c.fillStyle='#09131eeF';c.fillRect(q.x-30,y+9,60,6);c.fillStyle=color;c.fillRect(q.x-30,y+9,60*hit.after/hit.max,6);c.font='11px sans-serif';c.fillStyle='#eef6fa';c.fillText(`${translate(hit.label,this.options.locale)} ${hit.before} → ${hit.after}`,q.x,y+31);c.restore();}
  }
  for(const l of labels){l.text=translate(l.text,this.options.locale);const q=this.project(l.p);c.font=`${l.size}px "Consolas",monospace`;c.textAlign='center';if(l.small){const width=c.measureText(l.text).width+12;c.fillStyle='#0a1421d9';c.fillRect(q.x-width/2,q.y-12,width,18);}c.fillStyle=l.color;c.fillText(l.text,q.x,q.y);}
 }
}
