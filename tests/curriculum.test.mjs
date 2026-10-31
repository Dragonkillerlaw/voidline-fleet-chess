import test from 'node:test';
import assert from 'node:assert/strict';
import {STUDIES,resolveStudy,hp,get} from '../game/academy.mjs';
import {applyAction,moves,beam,charged} from '../game/engine.mjs';
import {defenderReply} from '../game/tactics.mjs';
const study=id=>STUDIES.find(s=>s.id===id),end={kind:'end_turn'};
const play=(st,line)=>line.reduce((s,a)=>resolveStudy(st,applyAction(s,a)).state,st.build());
test('curriculum progresses through six single-ship lessons, four combinations and four endgames',()=>{assert.deepEqual(STUDIES.map(s=>s.category),[...Array(6).fill('lesson'),...Array(4).fill('combined'),...Array(4).fill('puzzle')]);assert.equal(new Set(STUDIES.map(s=>s.id)).size,14);});
test('one, two and three-cell sidesteps remain vulnerable; four cells escape the entire cone',()=>{
 const st=study('cannon-denial');for(const x of [7,8,9]){const result=resolveStudy(st,applyAction(applyAction(st.build(),{kind:'move',id:'0-1',to:[x,2,5]}),end));assert.equal(result.status,'failed');assert.equal(hp(result.state,'0-1'),0);}
 const after=play(st,st.line);assert.ok(st.goal(after));
});
test('shield counter demonstrates a real blocked shot, refill, and second-turn finishing shot',()=>{
 const st=study('shield-counter');const after=play(st,st.line.slice(0,2));assert.equal(after.turn,0);assert.equal(after.turnIndex,2);assert.equal(hp(after,'0-1'),4);assert.equal(get(after,'0-1').shield,3);assert.ok(after.history.some(r=>r.impacts.some(h=>h.id==='0-1'&&h.blocked===1&&h.damage===0)));assert.ok(st.goal(applyAction(after,st.line[2])));
});
test('shooting without bringing the Aegis into range loses the protected fighter HP',()=>{
 const st=study('shield-relay'),after=play(st,[st.line[1],end]);assert.equal(hp(after,'0-2'),1);assert.equal(st.goal(after),false);assert.ok(st.goal(play(st,st.line)));
});
test('one-cell group movement still takes both missile splash hits',()=>{
 const st=study('command-evade'),after=play(st,[{...st.line[0],steps:1},end]);assert.equal(hp(after,'0-2'),1);assert.equal(hp(after,'0-3'),1);assert.equal(st.goal(after),false);
});
test('missile net leaves one escape and covers all enemy replies with a retained charged cannon',()=>{
 const st=study('cannon-missile-net'),initial=st.build();assert.deepEqual(moves(initial,get(initial,'1-0')),[[7,2,7]]);assert.equal(beam(initial,get(initial,'0-0'),get(initial,'1-0').p).ok,false);
 const launched=applyAction(applyAction(initial,st.line[0]),end),reply=defenderReply(launched,st.replyGoal);assert.equal(reply.success,true);assert.deepEqual(get(reply.state,'1-0').p,[7,2,7]);assert.equal(hp(reply.state,'1-0'),2);assert.equal(charged(reply.state,get(reply.state,'0-0')),true);assert.ok(st.goal(applyAction(reply.state,st.line[2])));
 const waste=applyAction(applyAction(initial,{kind:'fire',id:'0-0'}),st.line[0]);assert.equal(defenderReply(waste,st.replyGoal).success,false);
});
