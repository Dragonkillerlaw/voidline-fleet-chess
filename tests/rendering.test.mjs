import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameLoop} from '../game/frame-loop.mjs';
import {FleetScene} from '../game/scene.mjs';

function scheduler(draw) {
 let id = 0;
 const pending = new Map();
 const loop = new FrameLoop(draw, {request: fn => {pending.set(++id, fn); return id;}, cancel: id => pending.delete(id)});
 return {loop, pending, step(time) {const frames = [...pending.values()]; pending.clear(); frames.forEach(fn => fn(time));}};
}

test('idle canvas sleeps; repeated invalidations coalesce into a single redraw', () => {
 let draws = 0;
 const s = scheduler(() => {draws++; return false;});
 s.loop.invalidate(); s.loop.invalidate(); s.loop.invalidate();
 assert.equal(s.pending.size, 1); s.step(0);
 for (let t = 16; t <= 10000; t += 16) s.step(t);
 assert.equal(draws, 1); assert.equal(s.pending.size, 0);
 s.loop.invalidate(); s.step(10016); assert.equal(draws, 2);
});

test('animation is capped at 30fps and draws a final clean frame before sleeping', () => {
 const times = [];
 const s = scheduler(t => {times.push(t); return t < 2200;});
 s.loop.invalidate();
 for (let t = 0; t < 2500; t += 16) s.step(t);
 assert.ok(times.length > 40 && times.length <= 67);
 assert.ok(times.at(-1) >= 2200);
 assert.equal(s.pending.size, 0);
});

test('destroy cancels pending work and ignores late callbacks and invalidation', () => {
 let draws = 0;
 const s = scheduler(() => {draws++; return true;});
 s.loop.invalidate(); const late = [...s.pending.values()][0]; s.loop.destroy();
 late(100); s.loop.invalidate(); s.step(200);
 assert.equal(draws, 0); assert.equal(s.pending.size, 0);
});

test('every camera control wakes the canvas, and repeated hover over one module does not', () => {
 const scene = Object.create(FleetScene.prototype);
 let redraws = 0, hovers = 0;
 Object.assign(scene, {frames: {invalidate() {redraws++;}}, onHover() {hovers++;}});
 scene.reset(); scene.focus([1,2,3]); scene.rotate(1); scene.zoomBy(.2);
 assert.equal(redraws, 4);
 scene.setHover({id: '0-0', role: 'core', p: [1,2,3]});
 scene.setHover({id: '0-0', role: 'core', p: [1,2,3]});
 scene.setHover({id: '0-0', role: 'engine', p: [1,2,2]});
 scene.setHover(null); scene.setHover(null);
 assert.equal(hovers, 3); assert.equal(redraws, 7);
});

test('combat and missile targets animate; ordinary moves and resting boards do not', () => {
 const scene = Object.create(FleetScene.prototype);
 scene.options = {state: {missiles: [], ships: [{id: 'a', type: 'arsenal'}]}};
 assert.equal(scene.isAnimating(0), false);
 scene.combat = {at: 0, effects: [], impacts: []};
 assert.equal(scene.isAnimating(100), false);
 scene.combat.effects.push({kind: 'beam'});
 assert.equal(scene.isAnimating(100), true); assert.equal(scene.isAnimating(2200), false);
 scene.options.pending = {kind: 'fire', id: 'a'};
 assert.equal(scene.isAnimating(3000), true);
 scene.options.pending = null; scene.options.state.missiles.push({target: [1,2,3]});
 assert.equal(scene.isAnimating(3000), true);
});
