import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {applyAction} from '../game/engine.mjs';

// Only fixtures created by this run are changed, and only in local D1 storage.
const base=process.env.VOIDLINE_TEST_URL||'http://127.0.0.1:5180';
assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'Legacy fixtures are local-only');
const directory='.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
async function request(body,token,code,since){
 const url=base+'/api/rooms'+(body?'':`?code=${code}${since===undefined?'':`&since=${since}`}`);
 const r=await fetch(url,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {status:r.status,data:await r.json()};
}
async function createLegacy(started=false){
 const made=await request({op:'create'});assert.equal(made.status,200);const room=made.data;
 const state={...(started?applyAction(room.state,{kind:'move',id:'0-7',to:[7,0,3]}):room.state),version:3};
 let changed=false;
 for(const file of readdirSync(directory).filter(f=>f.endsWith('.sqlite')&&f!=='metadata.sqlite')){
  const db=new DatabaseSync(join(directory,file));try{
   if(!db.prepare("SELECT name FROM sqlite_master WHERE name='rooms'").get())continue;
   const found=db.prepare('SELECT code FROM rooms WHERE code=?').get(room.code);if(!found)continue;
   assert.equal(db.prepare('UPDATE rooms SET state=?,revision=? WHERE code=? AND revision=0').run(JSON.stringify(state),started?1:0,room.code).changes,1);changed=true;break;
  }finally{db.close();}
 }
 assert.ok(changed,'Created fixture must exist in the selected local D1');return {...room,state};
}
const h=await createLegacy();
assert.equal((await request(undefined,undefined,h.code)).status,401);
const joins=await Promise.all([request({op:'join',code:h.code}),request({op:'join',code:h.code})]);
assert.deepEqual(joins.map(r=>r.status).sort(),[200,409]);const guest=joins.find(r=>r.status===200).data;
assert.equal(guest.state.version,4);assert.equal(guest.revision,1);assert.equal(guest.state.ply,0);
const host=await request(undefined,h.token,h.code,0);assert.equal(host.status,200);assert.equal(host.data.ready,true);assert.equal(host.data.revision,1);assert.equal(host.data.state.version,4);
for(const seat of [h,guest]){const resumed=await request({op:'join',code:h.code},seat.token);assert.equal(resumed.status,200);assert.equal(resumed.data.team,seat.team);assert.equal(resumed.data.token,seat.token);}
const action=await request({op:'act',code:h.code,revision:1,action:{kind:'move',id:'0-7',to:[7,0,3]}},h.token);assert.equal(action.status,200);assert.equal(action.data.revision,2);
assert.deepEqual((await request(undefined,guest.token,h.code)).data.state,action.data.state);
const polled=await createLegacy();const recovered=await request(undefined,polled.token,polled.code,0);assert.equal(recovered.status,200);assert.equal(recovered.data.state.version,4);assert.equal(recovered.data.revision,1);assert.equal(recovered.data.ready,false);
const started=await createLegacy(true);
for(const result of [await request(undefined,started.token,started.code),await request({op:'join',code:started.code})]){assert.equal(result.status,409);assert.equal(result.data.code,'RULES_CHANGED');}
console.log(JSON.stringify({result:'PASS: local D1 legacy upgrade, concurrent joins, both-seat recovery, full snapshot, post-upgrade action sync, started-game protection',startedRoomForUi:started.code}));
