import assert from 'node:assert/strict';
const base=process.env.VOIDLINE_TEST_URL||'http://127.0.0.1:5180';
async function post(body,token){const r=await fetch(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
async function get(code,token){const r=await fetch(base+'/api/rooms?code='+code,{headers:token?{Authorization:`Bearer ${token}`}:{}});return {status:r.status,data:await r.json()};}
const h=await post({op:'create'});assert.equal(h.status,200,JSON.stringify(h.data));const host=h.data;assert.equal(host.state.version,3);assert.equal(host.state.actionsLeft,2);
assert.equal((await post({op:'act',code:host.code,revision:0,action:{kind:'end_turn'}},host.token)).status,409);
const j=await post({op:'join',code:host.code});assert.equal(j.status,200);const guest=j.data;
assert.equal((await post({op:'join',code:host.code})).status,409);assert.equal((await get(host.code)).status,401);assert.equal((await get(host.code,'invalid')).status,403);
let revision=0,state=host.state;
async function order(action){const r=await post({op:'act',code:host.code,revision,action},state.turn?guest.token:host.token);assert.equal(r.status,200,JSON.stringify(r.data));revision++;state=r.data.state;return state;}
await order({kind:'move',id:'0-7',to:[7,0,3]});assert.equal(state.turn,0);assert.equal(state.actionsLeft,1);
assert.equal((await post({op:'act',code:host.code,revision,action:{kind:'end_turn'}},guest.token)).status,400);
assert.equal((await post({op:'act',code:host.code,revision,action:{kind:'move',id:'0-7',to:[6,0,3]}},host.token)).status,400);
assert.deepEqual((await get(host.code,guest.token)).data.state,state);
await order({kind:'charge',id:'0-0'});assert.equal(state.turn,1);assert.equal(state.actionsLeft,2);assert.equal(state.history.length,2);
assert.equal((await post({op:'act',code:host.code,revision:0,action:{kind:'end_turn'}},guest.token)).status,409);
const race=await Promise.all([post({op:'act',code:host.code,revision,action:{kind:'end_turn'}},guest.token),post({op:'act',code:host.code,revision,action:{kind:'end_turn'}},guest.token)]);assert.deepEqual(race.map(x=>x.status).sort(),[200,409]);revision++;state=race.find(x=>x.status===200).data.state;
assert.equal(state.turn,0);assert.equal(state.turnIndex,2);await order({kind:'fire',id:'0-0'});assert.ok(state.last.effects.some(x=>x.kind==='beam'));assert.equal(state.turn,0);await order({kind:'fire',id:'0-1',target:[2,1,8]});assert.equal(state.missiles.length,1);assert.equal(state.turn,1);
await order({kind:'move',id:'1-7',to:[6,5,10]});assert.equal(state.missiles.length,1);await order({kind:'charge',id:'1-0'});assert.equal(state.missiles.length,0);assert.ok(state.last.effects.some(x=>x.kind==='blast'));
await order({kind:'group',id:'0-3',type:'corvette',dir:0,steps:1});assert.equal(state.acted.length,3);assert.equal(state.actionsLeft,1);await order({kind:'end_turn'});await order({kind:'end_turn'});await order({kind:'end_turn'});assert.ok(state.ships.length>22);assert.deepEqual((await get(host.code,host.token)).data.state,state);
await order({kind:'resign'});assert.notEqual(state.winner,null);assert.equal((await post({op:'act',code:host.code,revision,action:{kind:'end_turn'}},state.turn?guest.token:host.token)).status,400);
console.log('PASS: v3 two-ship turns, duplicate activation rejection, authoritative sync, auth, stale revision, concurrent end-turn, reconnect, cannon charge, delayed missiles, group activation, factory and victory.');
