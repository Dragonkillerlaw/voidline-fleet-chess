import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreSeat, mergeRoom, roomRequest} from '../game/room-client.mjs';

const seat = {code: 'ABC234', token: 'host-secret', team: 0, revision: 8, ready: true};
test('reload discards cached revision and readiness until the full board is restored', () => {
 assert.deepEqual(restoreSeat(JSON.stringify(seat)), {...seat, revision: -1, ready: false});
 for (const raw of ['null', '{bad', '{}', JSON.stringify({...seat, team: 2}), JSON.stringify({...seat, code: '?bad'})]) assert.equal(restoreSeat(raw), null);
});

test('late responses cannot reopen a room, replace another seat, or roll back the board', () => {
 assert.equal(mergeRoom(null, seat, {expected: seat}), null);
 assert.equal(mergeRoom({...seat, code: 'DEF234'}, seat, {expected: seat}), null);
 assert.equal(mergeRoom({...seat, token: 'new-secret'}, seat, {expected: seat}), null);
 assert.equal(mergeRoom(seat, {...seat, revision: 7}, {expected: seat}), null);
 assert.deepEqual(mergeRoom(seat, {...seat, revision: 9}, {expected: seat}), {...seat, revision: 9});
});

test('metadata-only polls retain the seat and notify guest arrival at the same revision', () => {
 const waiting = {...seat, revision: 0, ready: false};
 const joined = mergeRoom(waiting, {code: seat.code, revision: 0, team: 0, ready: true, unchanged: true}, {expected: waiting});
 assert.deepEqual(joined, {...waiting, ready: true});
 assert.equal(mergeRoom(joined, waiting, {expected: joined}).ready, true);
 assert.equal(Object.hasOwn(joined, 'state'), false);
});

test('new seat replaces old metadata without inheriting its readiness', () => {
 const next = {code: 'DEF234', team: 0, revision: 0, ready: false};
 assert.deepEqual(mergeRoom(seat, next, {secret: 'new-secret'}), {...next, token: 'new-secret'});
});

test('only polls with a loaded snapshot send since; seat credentials stay in headers', async () => {
 const calls = [];
 const fetchImpl = async (url, init) => {calls.push({url, init}); return Response.json({ok: true});};
 await roomRequest({code: seat.code, token: seat.token, revision: -1, fetchImpl});
 await roomRequest({code: seat.code, token: seat.token, revision: 8, fetchImpl});
 await roomRequest({body: {op: 'act', revision: 8}, token: seat.token, fetchImpl});
 assert.equal(calls[0].url, '/api/rooms?code=ABC234');
 assert.equal(calls[1].url, '/api/rooms?code=ABC234&since=8');
 assert.equal(calls[2].url, '/api/rooms'); assert.equal(calls[2].init.method, 'POST');
 calls.forEach(c => assert.equal(c.init.headers.Authorization, 'Bearer host-secret'));
});

test('timed-out orders abort without automatic resubmission', async () => {
 let calls = 0, aborted = false;
 const fetchImpl = async (_url, {signal}) => new Promise((resolve, reject) => {
  calls++; signal.addEventListener('abort', () => {aborted = true; reject(signal.reason);}, {once: true});
 });
 await assert.rejects(roomRequest({body: {op: 'act'}, timeoutMs: 5, fetchImpl}), /连接超时/);
 assert.equal(calls, 1); assert.equal(aborted, true);
});

test('leaving aborts requests, including callers already aborted before fetch', async () => {
 const controller = new AbortController(); let calls = 0;
 const fetchImpl = async (_url, {signal}) => new Promise((resolve, reject) => {
  calls++; signal.addEventListener('abort', () => reject(signal.reason), {once: true});
 });
 const request = roomRequest({code: seat.code, signal: controller.signal, fetchImpl});
 controller.abort(); await assert.rejects(request, {name: 'AbortError'});
 await assert.rejects(roomRequest({signal: controller.signal, fetchImpl}), {name: 'AbortError'});
 assert.equal(calls, 1);
});

test('server and network failures produce usable messages instead of JSON parsing errors', async () => {
 await assert.rejects(roomRequest({fetchImpl: async () => new Response('<html>Unavailable</html>', {status: 503})}), /服务器暂时不可用/);
 await assert.rejects(roomRequest({fetchImpl: async () => Response.json({error: '棋局已更新，请稍后重试'}, {status: 409})}), /棋局已更新/);
 await assert.rejects(roomRequest({fetchImpl: async () => {throw new TypeError('Failed to fetch');}}), /网络中断/);
});
