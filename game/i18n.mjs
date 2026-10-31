import en from './locales/en.json' with {type:'json'};
export const PROFILE_KEY='voidline-player-v1';
export const PROGRESS_KEY='voidline-academy-v1';
export const DEFAULT_LOCALE='en';
export function readProfile(value){try{const p=JSON.parse(value||'{}');return {name:typeof p?.name==='string'?p.name.trim().slice(0,24):'',locale:p?.locale==='zh'?'zh':DEFAULT_LOCALE};}catch{return {name:'',locale:DEFAULT_LOCALE};}}
export function languageFrom(search,saved=DEFAULT_LOCALE){const lang=new URLSearchParams(search).get('lang');return lang==='en'||lang==='zh'?lang:saved==='zh'?'zh':DEFAULT_LOCALE;}
export function languageLink(href,locale){if(typeof href!=='string'||!href.startsWith('/')||href.startsWith('//'))return href;const url=new URL(href,'https://voidline.local');url.searchParams.set('lang',locale);return url.pathname+url.search+url.hash;}
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=Object.entries(en).filter(([k])=>/\{\d+\}/.test(k)).sort((a,b)=>b[0].replace(/\{\d+\}/g,'').length-a[0].replace(/\{\d+\}/g,'').length).map(([key,value])=>({re:new RegExp('^'+key.split(/\{\d+\}/).map(escape).join('(.*)')+'$'),value,indices:[...key.matchAll(/\{(\d+)\}/g)].map(m=>Number(m[1]))}));
const literals=Object.keys(en).filter(k=>!k.includes('{')&&k.length>1).sort((a,b)=>b.length-a.length);
const fragments=new RegExp(literals.map(escape).join('|'),'g');
// Shared state stays language neutral. Localize display messages, including saved v3 logs.
export function translate(input,locale=DEFAULT_LOCALE,depth=0){
 const value=translateMessage(input,locale,depth);
 return locale==='en'&&typeof value==='string'?value.replace(/\b(\d+) (action|ship|missile|module|turn)\(s\)/g,(_,n,noun)=>`${n} ${noun}${n==='1'?'':'s'}`).replace(/\b1 cells\b/g,'1 cell').replace(/\b1 minutes\b/g,'1 minute'):value;
}
function translateMessage(input,locale,depth){
 if(typeof input!=='string'||locale!=='en'||!/[\u4e00-\u9fff]/.test(input))return input;
 const text=input.trim().replace(/\s+/g,' '),padding=[input.match(/^\s*/)[0],input.match(/\s*$/)[0]];
 const log=text.match(/^(\d{2,} · )(?=[\u4e00-\u9fff])(.+)$/);if(log)return log[1]+translate(log[2],locale,depth+1);
 if(Object.hasOwn(en,text))return padding[0]+en[text]+padding[1];
 if(depth<5)for(const {re,value,indices} of patterns){const match=text.match(re);if(match){const args={};indices.forEach((n,i)=>args[n]=translate(match[i+1],locale,depth+1));return padding[0]+value.replace(/\{(\d+)\}/g,(_,n)=>args[n]??'')+padding[1];}}
 // Compound ship names, module reports, and independent log events use the same vocabulary.
 return input.replace(fragments,key=>en[key]).replace(/；/g,'; ').replace(/、/g,', ').replace(/：/g,': ').replace(/（/g,' (').replace(/）/g,')');
}
