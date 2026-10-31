import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,makeShip,beam,muzzle,inCannonArc,applyAction,trace,targets,cannonShots,cannonCoverage,key,DIRS,cells,validAction} from '../game/engine.mjs';
const gun=(p=[4,2,2],dir=4)=>({...makeShip('flag',0,'0-0',p,dir),charge:{due:0}});
function board(flag=gun(),ships=[],rocks=[]){return {...createGame(),ships:[flag,makeShip('flag',1,'1-0',[12,3,11]),...ships],rocks,nebula:[]};}
test('45-degree half-angle is a circular space cone, including its boundary',()=>{
 const a=gun();assert.ok(inCannonArc(a,[7,2,7]));assert.ok(inCannonArc(a,[7,3,8]));
 for(const p of [[8,2,7],[7,5,7],[4,2,3],[4,2,4],[NaN,2,8],[14,2,8]])assert.equal(inCannonArc(a,p),false,JSON.stringify(p));
});
test('all six ship orientations use the muzzle and enforce their own forward cone',()=>{
 for(let dir=0;dir<6;dir++){const a=gun([6,dir===2?2:3,6],dir),start=muzzle(a),forward=DIRS[dir],other=DIRS[(dir+2)%6];
  assert.ok(inCannonArc(a,start.map((v,i)=>v+forward[i])));
  assert.ok(inCannonArc(a,start.map((v,i)=>v+forward[i]+other[i])));
  assert.equal(inCannonArc(a,start.map((v,i)=>v-forward[i])),false);
 }
});
test('range uses Euclidean distance from the muzzle rather than Chebyshev distance',()=>{
 const a=gun([0,0,2]);assert.ok(inCannonArc(a,[8,4,13]));assert.equal(inCannonArc(a,[9,5,13]),false);
});
test('arbitrary 3D aiming produces a straight beam and damages its intended voxel',()=>{
 const target=[7,3,8],s=board(gun(),[makeShip('fighter',1,'1-1',target)]),b=beam(s,s.ships[0],target);
 assert.ok(b.ok);assert.ok(b.hits.some(h=>h.ship.id==='1-1'));const d=target.map((v,i)=>v-b.ray[0][i]);
 for(const p of b.ray){const q=p.map((v,i)=>v-b.ray[0][i]);assert.ok(Math.abs(q[0]*d[1]-q[1]*d[0])<1e-8);assert.ok(Math.abs(q[0]*d[2]-q[2]*d[0])<1e-8);}
 const after=applyAction(s,{kind:'fire',id:'0-0',target});assert.equal(after.ships[2].parts[0].hp,0);assert.equal(after.ships[0].charge,null);
});
test('slanted beams traverse crossed voxels, continue beyond aim, and stop at rocks',()=>{
 const s=board(gun(),[makeShip('fighter',0,'0-1',[5,2,5]),makeShip('fighter',1,'1-1',[7,2,7])]);
 assert.equal(beam(s,s.ships[0],[6,2,6]).hits.length,2);s.nebula=[[5,2,5]];
 const after=applyAction(s,{kind:'fire',id:'0-0',target:[6,2,6]});assert.equal(after.ships[2].parts[0].hp,0);assert.equal(after.ships[3].parts[0].hp,0);
 s.rocks=[[6,2,6]];const blocked=beam(s,s.ships[0],[7,2,7]);assert.equal(blocked.ok,false);assert.deepEqual(blocked.blocked,[6,2,6]);assert.equal(blocked.hits.length,1);
});
test('edge-only touches do not hit or block a diagonal ray',()=>{
 const s=board(gun(),[],[[5,2,4],[4,2,5]]);assert.equal(beam(s,s.ships[0],[7,2,7]).blocked,null);
 s.rocks.push([5,2,5]);assert.deepEqual(beam(s,s.ships[0],[7,2,7]).blocked,[5,2,5]);
});
test('an adjacent forward rock does not prohibit a clear angled shot',()=>{
 const s=board(gun(),[],[[4,2,5]]);assert.ok(validAction(s,{kind:'fire',id:'0-0'}));assert.equal(validAction(s,{kind:'fire',id:'0-0',target:[7,2,7]}),null);
});
test('invalid payloads and off-cone shots cannot consume an activation',()=>{
 const s=board(),copy=structuredClone(s);for(const target of [null,[],[4,2,3],[8,2,7],[NaN,2,6],'x'])assert.throws(()=>applyAction(s,{kind:'fire',id:'0-0',target}));assert.deepEqual(s,copy);
});
test('all highlighted aim cells are legal; sector shading contains every impacted voxel',()=>{
 const s=board(),a=s.ships[0],coverage=new Set(cannonCoverage(s,a).map(key));
 for(const target of targets(s,a)){assert.ok(trace(s,a,target).ok);for(const p of beam(s,a,target).path.slice(1))assert.ok(coverage.has(key(p)));}
});
test('search representatives preserve every distinct ordered module hit outcome',()=>{
 const s=board(gun(),[makeShip('aegis',1,'1-1',[7,2,7]),makeShip('fighter',0,'0-1',[5,2,5])]),a=s.ships[0];
 const signature=b=>b.hits.map(h=>`${h.ship.id}:${h.part.role}`).join('|'),expected=new Set(targets(s,a).map(p=>signature(beam(s,a,p))));
 assert.deepEqual(new Set(cannonShots(s,a).map(signature)),expected);assert.ok(expected.size>2);
});
test('cached ray geometry never retains stale obstacles or ship positions',()=>{
 const s=board(gun(),[makeShip('fighter',1,'1-1',[7,2,7])]),a=s.ships[0];
 assert.ok(cannonShots(s,a).some(b=>b.hits.some(h=>h.ship.id==='1-1')));
 s.rocks=[[5,2,5]];assert.ok(!targets(s,a).some(p=>key(p)==='7,2,7'));
 s.rocks=[];s.ships[2].p=[2,2,2];assert.ok(!cannonShots(s,a).some(b=>b.hits.some(h=>h.ship.id==='1-1')));
});
