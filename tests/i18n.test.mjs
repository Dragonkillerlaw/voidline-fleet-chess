import test from 'node:test';import assert from 'node:assert/strict';
import {translate,readProfile,languageFrom,languageLink} from '../game/i18n.mjs';
import {STUDIES,OPENINGS,openingState,resolveStudy} from '../game/academy.mjs';
import {applyAction,TYPES,DIR_NAMES} from '../game/engine.mjs';
import {actionText,legalActions} from '../game/tactics.mjs';
import {messages} from '../scripts/extract-messages.mjs';
const english=text=>{const value=translate(text,'en');assert.ok(!/[\u4e00-\u9fff]/.test(value),`${text} => ${value}`);return value;};
test('all shipped source messages have English translations',()=>{for(const message of messages())english(message);});
test('profile parsing defaults to English and preserves a saved language',()=>{for(const value of [null,'null','broken','{"name":42,"locale":"xx"}'])assert.deepEqual(readProfile(value),{name:'',locale:'en'});assert.deepEqual(readProfile('{"name":"  Nova  ","locale":"en"}'),{name:'Nova',locale:'en'});assert.deepEqual(readProfile('{"name":"  Nova  ","locale":"zh"}'),{name:'Nova',locale:'zh'});assert.equal(readProfile(JSON.stringify({name:'x'.repeat(100)})).name.length,24);assert.equal(languageFrom(''),'en');assert.equal(languageFrom('?lang=bad','xx'),'en');assert.equal(languageFrom('','zh'),'zh');assert.equal(languageFrom('?lang=zh','en'),'zh');assert.equal(translate('战术学院'),translate('战术学院','en'));});
test('language links preserve rooms, openings and hashes without changing external URLs',()=>{assert.equal(languageLink('/play?room=ABC234&lang=zh#view','en'),'/play?room=ABC234&lang=en#view');assert.equal(languageLink('/play?opening=escort','en'),'/play?opening=escort&lang=en');assert.equal(languageLink('https://github.com/Dragonkillerlaw/voidline-fleet-chess','en'),'https://github.com/Dragonkillerlaw/voidline-fleet-chess');assert.equal(languageLink('//example.org','en'),'//example.org');assert.equal(languageFrom('?lang=en','zh'),'en');assert.equal(languageFrom('?lang=bad','en'),'en');});
test('live counters, spent ships and joined feedback translate as complete messages',()=>{assert.equal(english('第 03 轮 · 橙方'),'Round 03 · Orange');assert.equal(english('F5 · L3 · 核心 2 · ✓ 已行动'),'F5 · L3 · Core 2 · ✓ Acted');assert.equal(english('给我下一条提示'),'Show next hint');for(const s of ['△ 2 枚导弹待引爆 · 1 枚将在本回合结束时结算','已演示 4 / 4 步 · 蓝方剩 2 次行动','还可指挥 1 艘其他战舰','护盾场 · 2/3','护盾吸收 3','攻击艇 · 4 艘','另有 4 艘受到影响，详见完整战报。','共享护盾池 0/3 · 发生器已毁'])english(s);});
test('both languages keep game state intact across all training solutions and enemy replies',()=>{
 for(const study of STUDIES){for(const key of ['title','tag','intro','objective','why','setup','success','failure'])english(study[key]);study.hints.forEach(english);let state=study.build();for(const action of study.line){english(actionText(action,state));const result=resolveStudy(study,applyAction(state,action));state=result.state;english(result.message);state.log.forEach(english);const snapshot=JSON.stringify(state);for(const ship of state.ships){english(TYPES[ship.type].short);ship.parts.forEach(p=>english(p.label));}assert.equal(JSON.stringify(state),snapshot);assert.equal(translate(study.title,'zh'),study.title);}}
});
test('every opening step and initial legal action has English combat and action feedback',()=>{
 for(const opening of OPENINGS){['title','style','idea','tradeoff'].forEach(k=>english(opening[k]));opening.steps.forEach(s=>english(s.text));openingState(opening.id).log.forEach(english);}
 for(const study of STUDIES){const state=study.build();for(const action of legalActions(state)){english(actionText(action,state));const after=applyAction(state,action);after.last.events.forEach(english);after.last.impacts.forEach(h=>english(`${h.label} ${h.before}→${h.after}`));}}
 DIR_NAMES.forEach(english);
});
