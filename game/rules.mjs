export const VERSION=3, SIZE=[14,6,14], MAX_UNITS=18, PRODUCTION_TURNS=4, MAX_TURNS=480, ACTIONS_PER_TURN=2;
export const DIRS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],DIR_NAMES=['东 +X','西 −X','上升 +Y','下降 −Y','北 +Z','南 −Z'];
export const TYPES={
 flag:{name:'方舟 / 母舰',short:'母舰',speed:1,range:14,length:5,damage:4,weapon:'蓄力贯穿炮',description:'唯一主力舰。先蓄力，下个己方回合可沿舰首发射贯穿射线。移动或转向会取消蓄力。'},
 arsenal:{name:'暴雨 / 武库舰',short:'武库舰',speed:1,range:10,length:3,damage:3,weapon:'定点导弹',description:'越过障碍锁定空间坐标。对手回合结束后引爆；中心伤害 3，六邻格伤害 1。四发备弹，可花一次行动装填。'},
 aegis:{name:'穹顶 / 神盾舰',short:'神盾舰',speed:2,range:2,length:2,damage:1,weapon:'近程防御炮',description:'为核心周围曼哈顿距离 2 内的友军舱段吸收伤害。共享护盾池 3 点，每次己方回合开始恢复。'},
 command:{name:'信标 / 指挥舰',short:'指挥舰',speed:2,range:2,length:2,damage:1,weapon:'近程防御炮',description:'用一次行动让全场所有己方攻击艇或护卫舰同向同步移动。任何一艘受阻，整个指令不可执行。'},
 station:{name:'前哨 / 指挥中心',short:'指挥中心',speed:0,range:0,length:3,damage:0,weapon:'舰艇生产',description:'固定设施，每 4 个己方回合生产 1 艘攻击艇。出港空间受阻或舰队达到 18 个存活单位时等待。'},
 corvette:{name:'短剑 / 护卫舰',short:'护卫舰',speed:3,range:3,length:2,damage:1,weapon:'近程全向炮',description:'两格舰身，可快速转移三格；射程三格，单次伤害一点。'},
 fighter:{name:'游隼 / 攻击艇',short:'攻击艇',speed:4,range:2,length:1,damage:1,weapon:'近程全向炮',description:'单格小艇，每次可移动四格。射程两格，依靠数量、掩护和包抄。'}
};
export const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,n)=>a.map(v=>v*n),eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]),key=p=>p.join(','),inside=p=>Array.isArray(p)&&p.length===3&&p.every((v,i)=>Number.isInteger(v)&&v>=0&&v<SIZE[i]),distance=(a,b)=>a.reduce((s,v,i)=>s+Math.abs(v-b[i]),0);
export const cells=(s,p=s.p,d=s.dir)=>s.parts.map(part=>({p:add(p,mul(DIRS[d],part.offset)),part})),alive=s=>!!s&&s.parts.find(p=>p.role==='core').hp>0,coord=p=>`${String.fromCharCode(65+p[0])}${p[2]+1} · L${p[1]+1}`;
export function at(s,p,except){const excluded=except instanceof Set?except:new Set([except]);for(const ship of s.ships){if(excluded.has(ship.id))continue;const c=cells(ship).find(c=>eq(c.p,p));if(c)return {ship,part:c.part};}return null;}
export const rockAt=(s,p)=>s.rocks.some(r=>eq(r,p)),nebulaAt=(s,p)=>s.nebula.some(r=>eq(r,p));
const part=(role,label,offset,hp)=>({role,label,offset,hp,max:hp});
export function makeShip(type,team,id,p,dir=team?5:4){
 const parts=type==='flag'?[part('engine','引擎',-2,3),part('armor','装甲舱',-1,3),part('core','母舰核心',0,8),part('capacitor','蓄能舱',1,3),part('weapon','贯穿主炮',2,3)]:type==='arsenal'?[part('engine','引擎',-1,2),part('core','核心',0,4),part('weapon','导弹发射舱',1,2)]:type==='aegis'?[part('core','核心 / 引擎',0,4),part('shield','护盾发生器',1,3)]:type==='command'?[part('core','核心 / 引擎',0,4),part('signal','指挥阵列',1,2)]:type==='station'?[part('armor','泊位',-1,3),part('core','控制核心',0,6),part('factory','生产模块',1,3)]:type==='corvette'?[part('core','核心 / 引擎',0,3),part('weapon','近防炮',1,2)]:[part('core','核心',0,2)];
 return {id,team,type,p:[...p],dir,parts,ammo:type==='arsenal'?4:0,charge:null,shield:type==='aegis'?3:0,production:0};
}
export function createGame(){
 const fleet=[['flag',[6,2,2]],['arsenal',[2,1,2]],['aegis',[9,2,2]],['command',[4,3,2]],['station',[11,1,1]],['corvette',[1,2,3]],['corvette',[11,3,3]],['fighter',[3,0,3]],['fighter',[8,0,3]],['fighter',[2,4,3]],['fighter',[9,5,3]]];
 const ships=[];for(let t=0;t<2;t++)fleet.forEach(([type,p],i)=>ships.push(makeShip(type,t,`${t}-${i}`,t?[13-p[0],5-p[1],13-p[2]]:p,type==='station'?(t?1:0):(t?5:4))));
 const mirror=p=>[13-p[0],5-p[1],13-p[2]],unique=a=>[...new Map(a.map(p=>[key(p),p])).values()];
 const rockSeed=[[3,0,6],[3,1,6],[3,2,6],[4,1,6],[4,2,6],[5,1,7],[1,3,7],[2,3,7],[2,4,7],[8,4,5],[8,5,5],[9,4,5],[10,0,6],[10,1,6],[11,1,6]];
 const cloudSeed=[[5,3,6],[5,4,6],[6,3,6],[6,4,6],[0,1,9],[0,2,9],[1,1,9],[1,2,9]];
 return {version:VERSION,size:SIZE,ply:0,turn:0,turnIndex:0,actionsLeft:ACTIONS_PER_TURN,acted:[],winner:null,ownTurns:[0,0],nextId:[11,11],ships,rocks:unique([...rockSeed,...rockSeed.map(mirror)]),nebula:unique([...cloudSeed,...cloudSeed.map(mirror)]),missiles:[],log:['每方回合可指挥两艘不同战舰，各行动一次。'],history:[],last:null};
}
export const canFit=(s,ship,p,d=ship.dir,except=ship.id)=>cells(ship,p,d).every(c=>inside(c.p)&&!rockAt(s,c.p)&&!at(s,c.p,except));
export const mobile=s=>alive(s)&&TYPES[s.type].speed>0&&!s.parts.some(p=>p.role==='engine'&&p.hp===0);
export function canMove(s,ship,to){if(!inside(to)||!mobile(ship))return false;const delta=to.map((v,i)=>v-ship.p[i]),axes=delta.filter(v=>v!==0);if(axes.length!==1||Math.abs(axes[0])>TYPES[ship.type].speed)return false;const d=delta.map(Math.sign);for(let n=1;n<=Math.abs(axes[0]);n++)if(!canFit(s,ship,add(ship.p,mul(d,n))))return false;return true;}
export function canRotate(s,ship,d){
 if(!Number.isInteger(d)||!DIRS[d]||d===ship.dir||!mobile(ship)||TYPES[ship.type].length===1)return false;
 const a=DIRS[ship.dir],b=DIRS[d];if(a.reduce((n,v,i)=>n+v*b[i],0)!==0)return false;
 for(const part of ship.parts){const start=add(ship.p,mul(a,part.offset)),end=add(ship.p,mul(b,part.offset));for(let x=Math.min(start[0],end[0]);x<=Math.max(start[0],end[0]);x++)for(let y=Math.min(start[1],end[1]);y<=Math.max(start[1],end[1]);y++)for(let z=Math.min(start[2],end[2]);z<=Math.max(start[2],end[2]);z++){const p=[x,y,z];if(!inside(p)||rockAt(s,p)||at(s,p,ship.id))return false;}}
 return canFit(s,ship,ship.p,d);
}
export const weaponReady=s=>alive(s)&&TYPES[s.type].damage>0&&!s.parts.some(p=>p.role==='weapon'&&p.hp===0)&&(s.type!=='arsenal'||s.ammo>0);
export const charged=(s,ship)=>!!ship.charge&&s.turnIndex>=ship.charge.due;
export const hasActed=(s,ship)=>s.acted.includes(typeof ship==='string'?ship:ship.id);
export const available=(s,ship)=>alive(ship)&&ship.team===s.turn&&ship.type!=='station'&&!hasActed(s,ship);
export const canCharge=ship=>ship.type==='flag'&&weaponReady(ship)&&!ship.charge&&!ship.parts.some(p=>p.role==='capacitor'&&p.hp===0);
export function beam(s,ship){const start=cells(ship).find(c=>c.part.role==='weapon')?.p??ship.p,path=[start],hits=[];for(let n=1;n<=TYPES[ship.type].range;n++){const p=add(start,mul(DIRS[ship.dir],n));if(!inside(p))break;if(rockAt(s,p))return {path,hits,blocked:p};path.push(p);const hit=at(s,p,ship.id);if(hit)hits.push({...hit,p});}return {path,hits,blocked:null};}
export function trace(s,ship,target){
 if(!weaponReady(ship)||!inside(target))return {ok:false,path:[],reason:'武器不可用'};
 if(ship.type==='arsenal')return {ok:distance(ship.p,target)<=TYPES.arsenal.range&&!rockAt(s,target),path:[ship.p,target],reason:'超出射程或落点为小行星'};
 if(ship.type==='flag'){const b=beam(s,ship);return {...b,ok:charged(s,ship)&&b.path.slice(1).some(p=>eq(p,target)),reason:!charged(s,ship)?'先蓄力，并等待对手行动结束':'目标不在贯穿射线内'};}
 const muzzle=ship.p,delta=target.map((v,i)=>v-muzzle[i]),n=Math.max(...delta.map(Math.abs));if(!n||n>TYPES[ship.type].range)return {ok:false,path:[],reason:'超出近防炮射程'};
 const d=delta.map(v=>v/n);if(!d.every(v=>[-1,0,1].includes(v)))return {ok:false,path:[],reason:'只能沿轴线或等距对角线射击'};
 const path=[muzzle];for(let i=1;i<=n;i++){const p=add(muzzle,mul(d,i));path.push(p);if(rockAt(s,p)||nebulaAt(s,p))return {ok:false,path,reason:rockAt(s,p)?'小行星阻挡':'星云阻挡普通能量炮'};const hit=at(s,p,ship.id);if(hit)return {ok:i===n&&alive(hit.ship)&&hit.ship.team!==ship.team&&hit.part.hp>0,path,hit,reason:'舰体或残骸阻挡'};}return {ok:false,path,reason:'没有敌方目标'};
}
export const groupShips=(s,team,type)=>s.ships.filter(x=>x.team===team&&x.type===type&&alive(x));
export function groupMove(s,commander,type,dir,steps){
 if(commander.type!=='command'||!alive(commander)||commander.parts.some(p=>p.role==='signal'&&p.hp===0))return {ok:false,reason:'指挥阵列不可用',ships:[]};
 if(!['fighter','corvette'].includes(type)||!Number.isInteger(dir)||!DIRS[dir]||!Number.isInteger(steps)||steps<1||steps>TYPES[type].speed)return {ok:false,reason:'联动参数无效',ships:[]};
 const ships=groupShips(s,commander.team,type),excluded=new Set(ships.map(x=>x.id));if(!ships.length)return {ok:false,reason:'没有该类型的存活舰艇',ships};
 if(hasActed(s,commander)||ships.some(x=>hasActed(s,x)))return {ok:false,reason:'指挥舰或编队中有舰艇本回合已行动',ships};
 for(const ship of ships)for(let n=1;n<=steps;n++)if(!mobile(ship)||!canFit(s,ship,add(ship.p,mul(DIRS[dir],n)),ship.dir,excluded))return {ok:false,reason:`${ship.id} 的路径受阻，联动取消`,ships};
 return {ok:true,ships,delta:mul(DIRS[dir],steps),reason:''};
}
export function validAction(s,a,team=s.turn){
 if(s.version!==VERSION)return '此房间使用旧版规则，请创建新的战略战区';if(s.winner!==null)return '对局已结束';if(team!==s.turn)return '请等待对手行动';if(!a||typeof a!=='object')return '无效指令';if(a.kind==='pass'||a.kind==='end_turn'||a.kind==='resign')return null;
 const ship=s.ships.find(x=>x.id===a.id);if(!ship||ship.team!==team||!alive(ship))return '请选择己方存活单位';
 if(hasActed(s,ship))return '该舰本回合已行动，请选择另一艘战舰';if(s.actionsLeft<=0)return '本回合行动次数已用完';
 if(a.kind==='move')return canMove(s,ship,a.to)?null:'路径、舰体或引擎限制了机动';
 if(a.kind==='rotate')return canRotate(s,ship,a.dir)?null:'转向需要 90° 净空和完好引擎';
 if(a.kind==='charge')return canCharge(ship)?null:'无法蓄力：检查主炮、蓄能舱和当前充能状态';
 if(a.kind==='reload')return ship.type==='arsenal'&&ship.ammo<4&&!ship.parts.some(p=>p.role==='weapon'&&p.hp===0)?null:'无需或无法装填';
 if(a.kind==='group'){const g=groupMove(s,ship,a.type,a.dir,a.steps);return g.ok?null:g.reason;}
 if(a.kind==='fire'&&ship.type==='flag')return weaponReady(ship)&&charged(s,ship)&&beam(s,ship).path.length>1?null:'主炮尚未完成蓄力，或炮口被小行星阻挡';
 if(a.kind==='fire'){if(!inside(a.target))return '无效目标';const t=trace(s,ship,a.target);return t.ok?null:t.reason;}return '未知指令';
}
export const shieldActive=s=>s.type==='aegis'&&alive(s)&&s.parts.find(p=>p.role==='shield')?.hp>0;
export function shieldAt(s,team,p){return s.ships.find(x=>x.team===team&&shieldActive(x)&&x.shield>0&&distance(x.p,p)<=2);}
function damage(s,p,amount,events,impacts){
 const h=at(s,p);if(!h||!alive(h.ship)||h.part.hp<=0)return;
 const guard=shieldAt(s,h.ship.team,p),before=h.part.hp,blocked=guard?Math.min(amount,guard.shield):0;
 if(guard){guard.shield-=blocked;amount-=blocked;if(blocked)events.push(`神盾 ${guard.id} 吸收 ${blocked} 伤害`);}
 h.part.hp=Math.max(0,before-amount);const dealt=before-h.part.hp;
 if(h.part.hp===0&&['core','weapon','capacitor'].includes(h.part.role))h.ship.charge=null;
 if(dealt)events.push(`${h.ship.team?'橙':'蓝'}方${TYPES[h.ship.type].short} ${h.part.label} −${dealt}${h.part.hp===0?' / 损毁':''}`);
 impacts.push({id:h.ship.id,team:h.ship.team,p:[...p],role:h.part.role,label:h.part.label,damage:dealt,blocked,before,after:h.part.hp,max:h.part.max,destroyed:h.part.hp===0,sunk:!alive(h.ship)});
}
function victory(s){const flags=[0,1].map(t=>s.ships.find(x=>x.team===t&&x.type==='flag'));if(!alive(flags[0])&&!alive(flags[1]))s.winner='draw';else if(!alive(flags[0]))s.winner=1;else if(!alive(flags[1]))s.winner=0;else if(s.turnIndex>=MAX_TURNS)s.winner='draw';}
export function spawnSites(s,station){const positions=[];for(let d=1;d<=2;d++)for(let x=-d;x<=d;x++)for(let y=-d;y<=d;y++)for(let z=-d;z<=d;z++){if(Math.abs(x)+Math.abs(y)+Math.abs(z)!==d)continue;const p=add(station.p,[x,y,z]);if(inside(p)&&!rockAt(s,p)&&!at(s,p))positions.push(p);}return positions.sort((a,b)=>distance(a,station.p)-distance(b,station.p)||(station.team?a[2]-b[2]:b[2]-a[2])||a[1]-b[1]||a[0]-b[0]);}
function production(s,team,events){for(const station of s.ships.filter(x=>x.team===team&&x.type==='station'&&alive(x)&&x.parts.find(p=>p.role==='factory').hp>0)){station.production=Math.min(PRODUCTION_TURNS,station.production+1);if(station.production<PRODUCTION_TURNS)continue;const live=s.ships.filter(x=>x.team===team&&alive(x)).length,port=spawnSites(s,station)[0];if(live>=MAX_UNITS||!port){events.push(`指挥中心生产待命：${live>=MAX_UNITS?'舰队达到18单位上限':'出港空间被占用'}`);continue;}const id=`${team}-${s.nextId[team]++}`;s.ships.push(makeShip('fighter',team,id,port));station.production=0;events.push(`指挥中心产出攻击艇 ${id} → ${coord(port)}`);}}
export function applyAction(state,action,team=state.turn){
 const error=validAction(state,action,team);if(error)throw new Error(error);
 const s=structuredClone(state),ship=s.ships.find(x=>x.id===action.id),events=[],impacts=[],effects=[],activated=[];
 const finishing=['pass','end_turn'].includes(action.kind),turnIndex=s.turnIndex;
 if(action.kind==='resign'){s.winner=1-team;events.push(`${team?'橙':'蓝'}方撤离战区`);}
 else if(finishing)events.push(`${team?'橙':'蓝'}方结束回合`);
 else if(action.kind==='move'){ship.p=[...action.to];ship.charge=null;events.push(`${TYPES[ship.type].short}机动至 ${coord(ship.p)}`);}
 else if(action.kind==='rotate'){ship.dir=action.dir;ship.charge=null;events.push(`${TYPES[ship.type].short}转向 ${DIR_NAMES[ship.dir]}`);}
 else if(action.kind==='charge'){ship.charge={due:s.turnIndex+2};effects.push({kind:'charge',p:[...ship.p],team});events.push('母舰主炮蓄力中，下个己方回合就绪');}
 else if(action.kind==='reload'){ship.ammo=4;events.push('武库舰装填完成：4 发导弹');}
 else if(action.kind==='group'){const g=groupMove(s,ship,action.type,action.dir,action.steps);for(const unit of g.ships){unit.p=add(unit.p,g.delta);activated.push(unit.id);}events.push(`指挥舰联动 ${g.ships.length} 艘${TYPES[action.type].short}，${DIR_NAMES[action.dir]} ${action.steps} 格`);}
 else if(action.kind==='fire'){
  if(ship.type==='arsenal'){ship.ammo--;s.missiles.push({id:`m${s.ply}`,team,sourceId:ship.id,target:[...action.target],due:s.turnIndex+2});effects.push({kind:'missile',path:[ship.p,[...action.target]],team});events.push(`武库舰锁定 ${coord(action.target)}，敌方回合结束时引爆`);}
  else if(ship.type==='flag'){const b=beam(s,ship);effects.push({path:b.path,kind:'beam',heavy:true,team});ship.charge=null;events.push('母舰释放贯穿主炮');for(const p of b.path.slice(1))damage(s,p,4,events,impacts);if(!impacts.length)events.push('射线未命中舰体');}
  else {effects.push({path:trace(s,ship,action.target).path,kind:'beam',team});damage(s,action.target,TYPES[ship.type].damage,events,impacts);}
 }
 if(ship){activated.push(ship.id);s.acted=[...new Set([...s.acted,...activated])];s.actionsLeft--;}
 s.ply++;if(s.winner===null)victory(s);
 const turnEnded=s.winner===null&&(finishing||s.actionsLeft===0);
 if(turnEnded){
  s.ownTurns[team]++;s.turnIndex++;
  for(const m of s.missiles.filter(m=>m.due<=s.turnIndex)){
   events.push(`定点导弹在 ${coord(m.target)} 引爆`);effects.push({kind:'blast',p:m.target,team:m.team});
   damage(s,m.target,3,events,impacts);for(const d of DIRS){const p=add(m.target,d);if(inside(p)&&!rockAt(s,p))damage(s,p,1,events,impacts);}
  }
  s.missiles=s.missiles.filter(m=>m.due>s.turnIndex);victory(s);
  if(s.winner===null)production(s,team,events);
  s.turn=1-team;s.actionsLeft=ACTIONS_PER_TURN;s.acted=[];
  for(const guard of s.ships.filter(x=>x.team===s.turn&&shieldActive(x)))guard.shield=3;
 }
 s.last={id:s.ply,action,team,events,effects,impacts,activated,turnEnded,turnIndex,remaining:turnEnded?0:s.actionsLeft};
 s.history=[...s.history,s.last].slice(-12);
 s.log=[...s.log,...events.map(e=>`${String(s.ply).padStart(2,'0')} · ${e}`)].slice(-80);return s;
}
export function moves(s,ship){const result=[];for(const d of DIRS)for(let n=1;n<=TYPES[ship.type].speed;n++){const to=add(ship.p,mul(d,n));if(canMove(s,ship,to))result.push(to);}return result;}
export function targets(s,ship){if(!weaponReady(ship))return [];if(ship.type==='flag')return charged(s,ship)?beam(s,ship).path.slice(1):[];if(ship.type==='arsenal'){const list=[];for(let x=0;x<SIZE[0];x++)for(let y=0;y<SIZE[1];y++)for(let z=0;z<SIZE[2];z++){const p=[x,y,z];if(trace(s,ship,p).ok)list.push(p);}return list;}return s.ships.filter(x=>x.team!==ship.team&&alive(x)).flatMap(x=>cells(x)).map(c=>c.p).filter(p=>trace(s,ship,p).ok);}
const value=(ship,part)=>part.role==='core'?(ship.type==='flag'?12:ship.type==='station'?5:3):part.hp>0?1:0;
function beamValue(s,ship){return beam(s,ship).hits.filter(h=>alive(h.ship)&&h.part.hp>0).reduce((n,h)=>n+(h.ship.team===ship.team?-1.7:1)*value(h.ship,h.part),0);}
function blastValue(s,team,p){return s.ships.filter(alive).reduce((n,ship)=>n+cells(ship).reduce((v,c)=>v+(c.part.hp>0&&distance(c.p,p)<=1?(ship.team===team?-2:1)*value(ship,c.part)*(eq(c.p,p)?2:1):0),0),0);}
export function botAction(s){
 let best={kind:'end_turn'},score=-1000;const enemies=s.ships.filter(x=>x.team!==s.turn&&alive(x)),consider=(action,n)=>{if(n>score&&!validAction(s,action)){score=n;best=action;}};
 for(const ship of s.ships.filter(x=>available(s,x))){
  const goal=[...enemies].sort((a,b)=>distance(ship.p,a.p)-distance(ship.p,b.p))[0];
  if(ship.type==='flag'){const v=beamValue(s,ship);if(charged(s,ship)&&v>0)consider({kind:'fire',id:ship.id},20+v);if(canCharge(ship)&&v>0)consider({kind:'charge',id:ship.id},12+v);}
  else if(ship.type==='arsenal'){if(ship.ammo===0)consider({kind:'reload',id:ship.id},6);else for(const enemy of enemies)for(const c of cells(enemy))if(trace(s,ship,c.p).ok){const v=blastValue(s,s.turn,c.p);if(v>0)consider({kind:'fire',id:ship.id,target:c.p},8+v);}}
  else for(const p of targets(s,ship)){const h=at(s,p);consider({kind:'fire',id:ship.id,target:p},11+value(h.ship,h.part));}
  for(const to of moves(s,ship)){let n=1+(distance(ship.p,goal.p)-distance(to,goal.p))*.9;const test={...s,ships:s.ships.map(x=>x.id===ship.id?{...x,p:to,charge:null}:x)},moved=test.ships.find(x=>x.id===ship.id);if(ship.type==='flag')n+=Math.max(0,beamValue(test,moved));else if(ship.type!=='arsenal'&&targets(test,moved).length)n+=5;if(s.missiles.some(m=>distance(ship.p,m.target)<=1)&&!s.missiles.some(m=>distance(to,m.target)<=1))n+=18;if(s.missiles.some(m=>distance(to,m.target)<=1))n-=16;for(const flag of enemies.filter(x=>x.type==='flag'&&x.charge))if(beam(test,flag).hits.some(h=>h.ship.id===ship.id))n-=12;consider({kind:'move',id:ship.id,to},n+((s.ply+to[0]*3+to[1]*7+to[2]*11)%17)/100);}
  if(ship.type==='flag')for(let d=0;d<6;d++)if(canRotate(s,ship,d)){const rotated={...ship,dir:d},test={...s,ships:s.ships.map(x=>x.id===ship.id?rotated:x)};consider({kind:'rotate',id:ship.id,dir:d},2+Math.max(0,beamValue(test,rotated))*2);}
  if(ship.type==='command')for(const type of ['fighter','corvette'])for(let d=0;d<6;d++)for(let n=1;n<=TYPES[type].speed;n++){const g=groupMove(s,ship,type,d,n);if(!g.ok)continue;const progress=g.ships.reduce((v,u)=>v+Math.min(...enemies.map(e=>distance(u.p,e.p)))-Math.min(...enemies.map(e=>distance(add(u.p,g.delta),e.p))),0);consider({kind:'group',id:ship.id,type,dir:d,steps:n},progress*.8);}
 }return best;
}
