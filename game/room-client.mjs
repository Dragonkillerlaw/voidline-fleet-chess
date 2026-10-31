export const ROOM_SESSION = 'voidline-room-v3';

export function restoreSeat(raw) {
 try {
  const seat = JSON.parse(raw);
  if (!/^[A-Z2-9]{6}$/.test(seat?.code) || typeof seat.token !== 'string' || !seat.token || seat.token.length > 256 || ![0, 1].includes(seat.team)) return null;
  // A saved revision is not a saved board. Always fetch a full snapshot on reload.
  return {code: seat.code, token: seat.token, team: seat.team, revision: -1, ready: false};
 } catch { return null; }
}

export function mergeRoom(current, data, {secret, expected} = {}) {
 if (expected && (current?.code !== expected.code || current?.token !== expected.token)) return null;
 if (!secret && (!current || current.code !== data.code)) return null;
 const sameSeat = current?.code === data.code && (!secret || current.token === secret);
 if (sameSeat && data.revision < current.revision) return null;
 return {code: data.code, token: secret ?? current.token, team: data.team, revision: data.revision, ready: !!data.ready || !!(sameSeat && current.ready)};
}

// POSTs are never retried automatically: a timed-out action may already be committed.
// The next authoritative poll reconciles it without spending a second activation.
/** @param {{body?: any, code?: string, token?: string, revision?: number, signal?: AbortSignal, timeoutMs?: number, fetchImpl?: typeof fetch}} options */
export async function roomRequest({body, code, token, revision, signal, timeoutMs = 10000, fetchImpl = fetch} = {}) {
 const controller = new AbortController();
 const abort = () => controller.abort(signal.reason);
 signal?.throwIfAborted();
 signal?.addEventListener('abort', abort, {once: true});
 let timedOut = false;
 const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
 try {
  const query = new URLSearchParams({code: code ?? ''});
  if (Number.isInteger(revision) && revision >= 0) query.set('since', String(revision));
  const response = await fetchImpl(body ? '/api/rooms' : `/api/rooms?${query}`, {
   method: body ? 'POST' : 'GET', signal: controller.signal, cache: 'no-store',
   headers: {...(body ? {'Content-Type': 'application/json'} : {}), ...(token ? {Authorization: `Bearer ${token}`} : {})},
   ...(body ? {body: JSON.stringify(body)} : {}),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('服务器暂时不可用，请重试'); }
  if (!response.ok) throw new Error(data.error || '连接失败');
  return data;
 } catch (error) {
  if (timedOut) throw new Error('连接超时，请检查网络后重试。');
  if (signal?.aborted) throw error;
  if (error instanceof TypeError) throw new Error('网络中断，请检查连接。');
  throw error;
 } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
