import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {STUDIES,OPENINGS,openingState,resolveStudy} from '../game/academy.mjs';
import {applyAction,validAction,cells,inside,createGame,key} from '../game/engine.mjs';
import {solveTurn,openingFacts} from '../game/tactics.mjs';
const report={scope:'Exhaustive legal actions within the stated one-turn puzzle horizon; full opponent reply for delayed-win puzzle. Opening plans are examples, not proven optimal.',puzzles:[],openings:[]};
for(const study of STUDIES){
 let s=study.build();assert.equal(study.goal(s),false,study.id+' initially unsolved');
 const occupied=new Set(s.rocks.map(key));
 for(const ship of s.ships)for(const cell of cells(ship)){assert.ok(inside(cell.p),study.id+' in bounds');assert.ok(!occupied.has(key(cell.p)),study.id+' no overlap');occupied.add(key(cell.p));}
 for(const action of study.line){assert.equal(validAction(s,action),null,study.id+': '+JSON.stringify(action));s=applyAction(s,action);}
 assert.equal(resolveStudy(study,s).status,'success',study.id+' canonical line');
 if(study.category==='puzzle'){const r=solveTurn(study.build(),study.goal,{reply:study.reply});assert.ok(r.solutions>0);report.puzzles.push({id:study.id,...r});console.log(study.id, r.nodes,'nodes',r.solutions,'winning lines',r.firstActions.length,'first moves');}
}
for(const o of OPENINGS){let s=createGame();for(const step of o.steps){assert.equal(validAction(s,step.action),null,o.id+' '+JSON.stringify(step.action));s=applyAction(s,step.action);}report.openings.push({id:o.id,before:openingFacts(createGame()),afterOwnTurn:openingFacts(openingState(o.id,2)),afterReply:openingFacts(s)});console.log(o.id,'all four actions legal');}
await mkdir('research',{recursive:true});await writeFile('research/tactical-analysis.json',JSON.stringify(report,null,2)+'\n');
