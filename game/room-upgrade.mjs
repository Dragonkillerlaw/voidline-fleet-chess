import {VERSION} from './engine.mjs';

// v3 and v4 share the board schema; only cannon rules changed. Never migrate
// a game after its first action. Preserve the room code, both seats and board.
export async function upgradeWaitingRoom(db, row) {
 const state=JSON.parse(row.state);
 if(state.version!==3||VERSION!==4||row.revision!==0||state.ply!==0||state.turnIndex!==0||state.winner!==null)return row;
 const upgraded=JSON.stringify({...state,version:VERSION});
 await db.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE code=? AND revision=0 AND state=?').bind(upgraded,row.code,row.state).run();
 // A concurrent join/upgrade may have changed the seat or revision. Re-read
 // rather than returning stale credentials or overwriting the winner's update.
 return await db.prepare('SELECT * FROM rooms WHERE code=?').bind(row.code).first()??row;
}
