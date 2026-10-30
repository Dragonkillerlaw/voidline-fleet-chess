import { env } from 'cloudflare:workers';
import { createGame,applyAction,VERSION } from '../../../game/engine.mjs';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(v=>v.toString(16).padStart(2,'0')).join('');
const token=()=>crypto.randomUUID()+crypto.randomUUID();
export async function GET(req:Request){
 const code=new URL(req.url).searchParams.get('code')?.toUpperCase();if(!code||!/^[A-Z2-9]{6}$/.test(code))return reply({error:'请输入六位房间码'},400);
 const row=await env.DB!.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first<any>();if(!row||Date.now()-row.created_at>7*86400000)return reply({error:'房间不存在或已过期'},404);
 if(JSON.parse(row.state).version!==VERSION)return reply({error:'此房间使用旧版规则，请创建新的战略战区'},409);
 const secret=req.headers.get('authorization')?.replace('Bearer ','');if(!secret)return reply({error:'请加入房间'},401);const digest=await hash(secret),team=digest===row.host_hash?0:digest===row.guest_hash?1:null;if(team===null)return reply({error:'席位凭证无效'},403);
 return reply({code,team,state:JSON.parse(row.state),revision:row.revision,ready:!!row.guest_hash});
}
export async function POST(req:Request){
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return reply({error:'不允许跨站请求'},403);
 let body:any;try{const raw=await req.text();if(raw.length>5000)return reply({error:'请求过大'},413);body=JSON.parse(raw);if(!body||typeof body!=='object')return reply({error:'请求无效'},400);}catch{return reply({error:'请求无效'},400);}
 try{
 if(body.op==='create'){const secret=token(),digest=await hash(secret),state=createGame();for(let i=0;i<5;i++){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',code=Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>chars[v%chars.length]).join('');const r=await env.DB!.prepare('INSERT OR IGNORE INTO rooms (code,state,host_hash,revision,created_at) VALUES (?,?,?,0,?)').bind(code,JSON.stringify(state),digest,Date.now()).run();if(r.meta.changes)return reply({code,token:secret,team:0,state,revision:0,ready:false});}return reply({error:'房间创建繁忙，请重试'},503);}
 const code=String(body.code??'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return reply({error:'房间码格式无效'},400);
 const row=await env.DB!.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first<any>();if(!row||Date.now()-row.created_at>7*86400000)return reply({error:'房间不存在或已过期'},404);
 if(JSON.parse(row.state).version!==VERSION)return reply({error:'此房间使用旧版规则，请创建新的战略战区'},409);
 if(body.op==='join'){const secret=token(),digest=await hash(secret),r=await env.DB!.prepare('UPDATE rooms SET guest_hash=? WHERE code=? AND guest_hash IS NULL').bind(digest,code).run();if(!r.meta.changes)return reply({error:'房间已满；原玩家请使用原浏览器恢复席位'},409);return reply({code,token:secret,team:1,state:JSON.parse(row.state),revision:row.revision,ready:true});}
 if(JSON.parse(row.state).version!==VERSION)return reply({error:'此房间使用旧版规则，请创建新的战略战区'},409);
 const secret=req.headers.get('authorization')?.replace('Bearer ','');if(!secret)return reply({error:'缺少席位凭证'},401);const digest=await hash(secret),team=digest===row.host_hash?0:digest===row.guest_hash?1:null;if(team===null)return reply({error:'席位凭证无效'},403);
 if(body.op!=='act')return reply({error:'未知操作'},400);if(!row.guest_hash)return reply({error:'等待另一位指挥官加入'},409);if(!Number.isInteger(body.revision)||body.revision!==row.revision)return reply({error:'棋局已更新，请稍后重试'},409);
 let state;try{state=applyAction(JSON.parse(row.state),body.action,team);}catch(e){return reply({error:(e as Error).message},400);}
 const r=await env.DB!.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(state),code,row.revision).run();if(!r.meta.changes)return reply({error:'另一个行动已提交，请刷新棋局'},409);return reply({code,team,state,revision:row.revision+1,ready:true});
 }catch(e){console.error('Room API failure',e);return reply({error:'服务器暂时不可用，请重试'},503);}
}
