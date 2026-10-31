import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createGame,VERSION} from '../game/engine.mjs';
import {upgradeWaitingRoom} from '../game/room-upgrade.mjs';

function fixture({version=3,revision=0,ply=0,turnIndex=0,guest='guest-hash'}={}){
 const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE rooms(code TEXT PRIMARY KEY,state TEXT,host_hash TEXT,guest_hash TEXT,revision INTEGER,created_at INTEGER)');
 const state={...createGame(),version,ply,turnIndex};
 sql.prepare('INSERT INTO rooms VALUES (?,?,?,?,?,?)').run('ABC234',JSON.stringify(state),'host-hash',guest,revision,1234);
 const db={prepare(query){
  return {bind(...args){
   return {async run(){return sql.prepare(query).run(...args);},async first(){return {...sql.prepare(query).get(...args)};}};
  }};
 }};
 const read=()=>({...sql.prepare('SELECT * FROM rooms').get()});
 return {sql,db,read,state};
}
test('an untouched v3 room upgrades without changing its board, seats, code or expiry',async()=>{
 const f=fixture();try{const before=f.read(),after=await upgradeWaitingRoom(f.db,before);
 assert.deepEqual({...after,state:before.state,revision:before.revision},before);
 assert.deepEqual(JSON.parse(after.state),{...f.state,version:VERSION});assert.equal(after.revision,1);
 assert.deepEqual(await upgradeWaitingRoom(f.db,after),after);
 }finally{f.sql.close();}
});
test('migration does not reset a started, finished, current or unsupported room',async()=>{
 for(const options of [{revision:1},{ply:1},{turnIndex:1},{version:1},{version:VERSION}]){
 const f=fixture(options);try{const before=f.read();assert.deepEqual(await upgradeWaitingRoom(f.db,before),before);assert.deepEqual(f.read(),before);}finally{f.sql.close();}}
 const f=fixture();try{const state={...f.state,winner:1};f.sql.prepare('UPDATE rooms SET state=?').run(JSON.stringify(state));const before=f.read();assert.deepEqual(await upgradeWaitingRoom(f.db,before),before);}finally{f.sql.close();}
});
test('simultaneous migrations increment revision once and keep a concurrent guest',async()=>{
 const f=fixture({guest:null});try{const before=f.read();f.sql.prepare('UPDATE rooms SET guest_hash=?').run('joined-guest');const [a,b]=await Promise.all([upgradeWaitingRoom(f.db,before),upgradeWaitingRoom(f.db,before)]);
 assert.equal(a.revision,1);assert.equal(b.revision,1);assert.equal(a.guest_hash,'joined-guest');assert.equal(b.guest_hash,'joined-guest');
 }finally{f.sql.close();}
});
test('a stale migration cannot overwrite a game that has advanced',async()=>{
 const f=fixture();try{const before=f.read(),state={...f.state,version:VERSION,ply:1};f.sql.prepare('UPDATE rooms SET state=?,revision=2').run(JSON.stringify(state));
 const after=await upgradeWaitingRoom(f.db,before);assert.equal(after.revision,2);assert.deepEqual(JSON.parse(after.state),state);
 }finally{f.sql.close();}
});
