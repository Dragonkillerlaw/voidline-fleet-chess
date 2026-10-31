import ts from 'typescript';
import fs from 'node:fs';
export const files=['app/battle.tsx','app/commands-v2.tsx','app/academy.tsx','game/academy.mjs','game/rules.mjs','game/tactics.mjs','game/scene.mjs','game/room-client.mjs','app/api/rooms/route.ts'];
export function messages(){const result=new Set();for(const file of files){const src=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.JS);function visit(n){let v;if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isJsxText(n))v=n.text;if(ts.isTemplateExpression(n))v=n.head.text+n.templateSpans.map((s,i)=>`{${i}}${s.literal.text}`).join('');if(v&&/[\u4e00-\u9fff]/.test(v))result.add(v.trim().replace(/\s+/g,' '));ts.forEachChild(n,visit);}visit(src);}return [...result];}
if(process.argv[2]==='list')console.log(messages().map((s,i)=>`${i}\t${s}`).join('\n'));
