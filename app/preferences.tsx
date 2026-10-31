"use client";
import {cloneElement,createContext,isValidElement,useContext,useEffect,useState,type ReactNode,type ReactElement} from 'react';
import {DEFAULT_LOCALE,PROFILE_KEY,readProfile,languageFrom,languageLink,translate} from '../game/i18n.mjs';
type Locale='zh'|'en';
const Preferences=createContext({locale:DEFAULT_LOCALE as Locale,name:'',ready:false,saved:true,setLocale:(_value:Locale)=>{},setName:(_value:string)=>{}});
export function PreferencesProvider({children}:{children:ReactNode}){
 const [locale,setLanguage]=useState<Locale>(DEFAULT_LOCALE),[name,setPlayerName]=useState(''),[ready,setReady]=useState(false),[saved,setSaved]=useState(true);
 useEffect(()=>{let profile=readProfile(null);try{profile=readProfile(localStorage.getItem(PROFILE_KEY));}catch{setSaved(false);}setPlayerName(profile.name);setLanguage(languageFrom(window.location.search,profile.locale));setReady(true);},[]);
 useEffect(()=>{if(!ready)return;document.documentElement.lang=locale==='en'?'en':'zh-CN';document.title=locale==='en'?'VOIDLINE · Fleet Chess':'VOIDLINE · 深空舰队棋';try{localStorage.setItem(PROFILE_KEY,JSON.stringify({name,locale}));setSaved(true);}catch{setSaved(false);}},[name,locale,ready]);
 function setLocale(value:Locale){setLanguage(value);const url=new URL(window.location.href);url.searchParams.set('lang',value);window.history.replaceState(null,'',url.pathname+url.search+url.hash);}
 return <Preferences.Provider value={{locale,name,ready,saved,setLocale,setName:value=>setPlayerName(value.trim().slice(0,24))}}>{children}</Preferences.Provider>;
}
export function usePreferences(){const context=useContext(Preferences);return {...context,t:(text:string)=>translate(text,context.locale),link:(href:string)=>languageLink(href,context.locale)};}
export function LanguageSwitch(){const {locale,setLocale}=usePreferences();return <div className="language-switch" aria-label="Language"><button type="button" lang="zh-CN" aria-pressed={locale==='zh'} onClick={()=>setLocale('zh')}>中文</button><button type="button" lang="en" aria-pressed={locale==='en'} onClick={()=>setLocale('en')}>EN</button></div>;}
// Translate rendered text and accessible labels, never rule IDs, input values or callbacks.
// Joining adjacent primitive children keeps counters such as “第 {round} 轮” in one message.
export function localizeTree(node:ReactNode,locale:Locale):ReactNode{
 if(typeof node==='string')return translate(node,locale);
 if(Array.isArray(node)){const grouped:ReactNode[]=[];let text='';const flush=()=>{if(text){grouped.push(translate(text,locale));text='';}};node.forEach((child,index)=>{if(typeof child==='string'||typeof child==='number')text+=child;else{flush();const localized=localizeTree(child,locale);grouped.push(isValidElement(localized)&&localized.key===null?cloneElement(localized,{key:`localized-${index}`}):localized);}});flush();return grouped;}
 if(!isValidElement<any>(node))return node;
 const element=node as ReactElement<any>;
 if(element.type===LanguageSwitch)return element;
 const props:Record<string,any>={};
 if(typeof element.type==='string')for(const key of ['title','aria-label','placeholder','alt'])if(typeof element.props[key]==='string')props[key]=translate(element.props[key],locale);
 if(element.type==='a'&&element.props.href)props.href=languageLink(element.props.href,locale);
 if(element.props.children!==undefined)props.children=localizeTree(element.props.children,locale);
 return cloneElement(element,props);
}
export function Localized({children}:{children:ReactNode}){const {locale}=usePreferences();return localizeTree(children,locale);}
