import {TYPES,DIR_NAMES,available,alive,cells,moves,targets,canCharge,canRotate,groupMove,validAction,applyAction,coord,trace,beam,shieldAt} from './engine.mjs';

// Enumerate legal choices, not just the moves preferred by the heuristic AI.
// Resignation is omitted because it cannot satisfy a winning/survival objective.
export function legalActions(s){
 if(s.winner!==null)return [];
 const out=[{kind:'end_turn'}];
 for(const ship of s.ships.filter(x=>available(s,x))){
  for(const to of moves(s,ship))out.push({kind:'move',id:ship.id,to});
  for(let dir=0;dir<6;dir++)if(canRotate(s,ship,dir))out.push({kind:'rotate',id:ship.id,dir});
  if(canCharge(ship))out.push({kind:'charge',id:ship.id});
  if(ship.type==='flag'){const a={kind:'fire',id:ship.id};if(!validAction(s,a))out.push(a);}
  else for(const target of targets(s,ship))out.push({kind:'fire',id:ship.id,target});
  const reload={kind:'reload',id:ship.id};if(!validAction(s,reload))out.push(reload);
  if(ship.type==='command')for(const type of ['fighter','corvette'])for(let dir=0;dir<6;dir++)for(let steps=1;steps<=TYPES[type].speed;steps++)if(groupMove(s,ship,type,dir,steps).ok)out.push({kind:'group',id:ship.id,type,dir,steps});
 }return out;
}
export const quickStep=(s,a)=>applyAction({...s,history:[],log:[],last:null},a);
export function defenderReply(s,goal){
 const defender=s.turn;
 function visit(state,path){
  if(state.winner!==null||state.turn!==defender)return {success:goal(state),state,path};
  let first;
  // Prefer a concrete attacking refutation to a harmless early pass when both refute the goal.
  const rank=a=>a.kind==='fire'?0:a.kind==='end_turn'?2:1;
  for(const action of legalActions(state).sort((a,b)=>rank(a)-rank(b))){const r=visit(quickStep(state,action),[...path,action]);first??=r;if(!r.success)return r;}
  return first??{success:goal(state),state,path};
 }return visit(s,[]);
}
export function solveTurn(initial,goal,{reply=false,limit=Infinity}={}){
 const team=initial.turn,result={nodes:0,solutions:0,firstActions:[],examples:[]};const first=new Set();
 function visit(s,path){
  if(result.solutions>=limit)return;
  result.nodes++;let won=goal(s);
  if(!won&&s.winner===null&&s.turn!==team&&reply)won=defenderReply(s,goal).success;
  if(won){result.solutions++;const k=JSON.stringify(path[0]);if(!first.has(k)){first.add(k);result.firstActions.push(path[0]);}if(result.examples.length<8)result.examples.push(path);return;}
  if(s.winner!==null||s.turn!==team)return;
  for(const action of legalActions(s))visit(quickStep(s,action),[...path,action]);
 }visit(initial,[]);return result;
}
export function actionText(a,s){
 if(a.kind==='end_turn'||a.kind==='pass')return '结束回合';
 const ship=s.ships.find(x=>x.id===a.id),name=`${TYPES[ship.type].short} ${ship.team?'R':'B'}${Number(ship.id.split('-')[1])+1}`;
 if(a.kind==='move')return `${name} → ${coord(a.to)}`;
 if(a.kind==='rotate')return `${name} 转向${DIR_NAMES[a.dir]}`;
 if(a.kind==='charge')return `${name} 蓄力`;
 if(a.kind==='group')return `${name}：全体${TYPES[a.type].short}向${DIR_NAMES[a.dir]} ${a.steps} 格`;
 if(a.kind==='reload')return `${name} 装填`;
 return `${name} ${a.target?`攻击 ${coord(a.target)}`:'发射贯穿炮'}`;
}
export function openingFacts(s,team=0){
 const enemy=s.ships.filter(x=>x.team!==team&&alive(x)),own=s.ships.filter(x=>x.team===team&&alive(x));
 const inMissileRange=own.filter(u=>enemy.some(e=>e.type==='arsenal'&&trace(s,e,u.p).ok)).map(u=>u.id);
 const protectedCores=own.filter(u=>shieldAt(s,team,u.p)).map(u=>u.id);
 const readyGunThreats=own.filter(u=>enemy.some(e=>e.type!=='arsenal'&&trace(s,e,u.p).ok)).map(u=>u.id);
 const flag=own.find(u=>u.type==='flag');
 return {inMissileRange,protectedCores,readyGunThreats,flagBeamEnemyModules:beam(s,flag).hits.filter(h=>h.ship.team!==team&&alive(h.ship)).length};
}
