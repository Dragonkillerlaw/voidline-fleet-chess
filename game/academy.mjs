import {createGame,makeShip,alive,trace,applyAction,coord,TYPES,hasActed} from './engine.mjs';
import {defenderReply} from './tactics.mjs';
export const get=(s,id)=>s.ships.find(x=>x.id===id);
export const hp=(s,id,role='core')=>get(s,id)?.parts.find(p=>p.role===role)?.hp??0;
const setHP=(ship,role,hp)=>{ship.parts.find(p=>p.role===role).hp=hp;return ship;};
const distant=()=>[makeShip('flag',0,'0-0',[1,0,2]),makeShip('flag',1,'1-0',[12,5,11])];
function position(ships,rocks=[]){return {...createGame(),ships,rocks,nebula:[],log:['教学局面：使用正式对战规则。'],nextId:[30,30]};}
const F=(team,id,p)=>makeShip('fighter',team,id,p);
const trained=ship=>{ship.charge={due:0};return ship;};
const win=s=>s.winner===0;

export const STUDIES=[
 {id:'two-ships',category:'lesson',number:'01',title:'两艘舰，一次集火',tag:'行动经济',minutes:2,
  intro:'先只看三艘小艇。敌艇有 2 点核心，每艘攻击艇只能造成 1 点伤害。',objective:'本回合用两艘不同攻击艇击毁 R2。',
  why:'好棋要把两次行动连起来。两艘同时开火，可以在对手行动前消灭目标；同一艘不能在本回合连续攻击。',
  setup:'双方母舰在局部战区外，本课只操作 B2、B3。靶艇核心为标准 2 点。',
  build:()=>position([...distant(),F(0,'0-1',[5,2,7]),F(0,'0-2',[7,4,7]),F(1,'1-1',[7,2,7])]),
  hidden:['0-0','1-0'],focus:'0-1',layer:2,frame:{min:[2,0,3],max:[10,5,10]},modes:['fire'],
  goal:s=>hp(s,'1-1')===0,
  line:[{kind:'fire',id:'0-1',target:[7,2,7]},{kind:'fire',id:'0-2',target:[7,2,7]}],
  hints:['先算数：1 + 1 = 2。移动会用掉这艘艇的开火机会。','选择 B2，点击「攻击」，命中 R2 的核心。然后换 B3。','B2 攻击 H8 · L3；B3 再攻击同一个核心。'],
  success:'两次行动合成一次击杀。对手还没有机会移动，目标已经被清除。',failure:'目标仍然存活。把两次行动留给两艘能直接命中核心的攻击艇。'},
 {id:'firing-square',category:'lesson',number:'02',title:'先占射位，下一回合开火',tag:'三维射线',minutes:2,
  intro:'B2 与 R2 看起来很近，但高度不同，坐标差也不是等距对角线。现在无法开火。',objective:'把 B2 移到能直接瞄准 R2 核心的位置。',
  why:'距离近不等于能打到。要同时满足射程、射线方向和无遮挡；移动后也要为下一回合做计划。',
  setup:'这是静止目标练习；本课完成到达射位，不要求本回合击杀。',
  build:()=>position([...distant(),F(0,'0-1',[5,1,4]),F(1,'1-1',[7,2,4])],[[5,1,5]]),
  hidden:['0-0','1-0'],focus:'0-1',layer:1,frame:{min:[0,0,0],max:[11,5,9]},modes:['move','fire'],
  goal:s=>hasActed(s,'0-1')&&trace(s,get(s,'0-1'),get(s,'1-1').p).ok,
  line:[{kind:'move',id:'0-1',to:[5,2,4]}],
  hints:['普通炮只能沿轴线或等距对角线射击。','先让两艘艇处于同一高度。','B2 上升 1 格，到 F5 · L3。其他合法射位也算通过。'],
  success:'现在已经获得射线。但 B2 本回合已行动，不能再开火；实战中还要考虑对手会不会抢先移动或反击。',failure:'这个位置仍没有通往目标核心的射线。检查高度、距离和挡路的岩石。'},
 {id:'evade-blast',category:'lesson',number:'03',title:'先躲威胁，再谈进攻',tag:'威胁检查',minutes:2,
  intro:'橙方导弹已锁定 B2。它会在你的回合结束时爆炸，中心伤害 3，六邻格伤害 1。',objective:'结束回合后，B2 仍保持 2 点核心，完全避开爆炸。',
  why:'好棋首先避免已知损失。移动一格仍可能留在爆炸邻格；必须检查最终位置，而不是只离开红圈中心。',
  setup:'导弹从局部战区外发射，已进入倒计时。小行星会阻挡机动。',
  build:()=>{const s=position([...distant(),F(0,'0-1',[5,2,5])],[[5,2,7]]);s.missiles=[{id:'lesson-missile',team:1,target:[5,2,5],due:1}];return s;},
  hidden:['0-0','1-0'],focus:'0-1',layer:2,frame:{min:[0,0,0],max:[11,5,11]},modes:['move'],
  goal:s=>s.turnIndex>=1&&hp(s,'0-1')===2,
  line:[{kind:'move',id:'0-1',to:[7,2,5]},{kind:'end_turn'}],
  hints:['中心和上下左右前后六格都有伤害。','找一条净空路径，至少离开落点两格，再结束回合。','B2 向东 2 格到 H6 · L3，然后点「结束回合」。'],
  success:'没有受到任何伤害。每回合先看导弹落点和已蓄力的敌方主炮，再花行动进攻。',failure:'导弹仍伤到了 B2。只离开中心一格不够，或者你在移动前就结束了回合。'},
 {id:'disable-gun',category:'lesson',number:'04',title:'拆掉炮，比磨血更紧急',tag:'功能打击',minutes:3,
  intro:'橙方母舰已经蓄力，下一回合可以击毁你的母舰；但它的主炮只剩 1 点。',objective:'击毁 R1 的主炮，结束回合，确认蓝方母舰存活。',
  why:'伤害不是唯一收益。用 1 点伤害取消一次致命反击，往往比打厚重核心更紧急。',
  setup:'B1 核心剩 4；R1 主炮剩 1，引擎已毁且已蓄力。其余舱段按题面显示。',
  build:()=>{const a=setHP(makeShip('flag',0,'0-0',[6,2,2],0),'core',4),b=trained(makeShip('flag',1,'1-0',[6,2,10],5));setHP(b,'engine',0);setHP(b,'weapon',1);return position([a,b,F(0,'0-1',[8,2,8])]);},
  hidden:[],focus:'0-1',layer:2,frame:{min:[2,0,0],max:[11,5,13]},modes:['move','fire'],reply:true,
  goal:s=>s.turnIndex>=2&&alive(get(s,'0-0'))&&hp(s,'1-0','weapon')===0,
  line:[{kind:'fire',id:'0-1',target:[6,2,8]},{kind:'end_turn'}],
  hints:['敌方主炮在母舰朝向的最前端，坐标 G9 · L3。','B2 的 1 点伤害足以摧毁那段主炮，整艘母舰暂时打不死。','B2 攻击 G9 · L3，然后结束回合，观察敌方无法开炮。'],
  success:'致命反击被取消。你保住了母舰，也为下一回合创造了时间。',failure:'危险的主炮还在。对手只要开火，你的母舰就会被击毁。'},
 {id:'mate-focus',category:'puzzle',number:'01',title:'两点核心，如何收官？',tag:'一回合胜',minutes:2,
  intro:'橙方母舰只剩 2 点核心。你有两次行动，两艘小艇已在不同高度的射线上。',objective:'在当前回合内击毁 R1 核心。',why:'先算完整回合的伤害，再决定两艘舰各做什么。',setup:'R1 核心剩 2，无护盾。B1 在局部战区外。',
  build:()=>{const [a]=distant(),b=setHP(makeShip('flag',1,'1-0',[7,2,7]),'core',2);return position([a,b,F(0,'0-1',[5,2,7]),F(0,'0-2',[7,4,7])]);},
  hidden:['0-0'],focus:'0-1',layer:2,frame:{min:[2,0,3],max:[11,5,11]},goal:win,
  line:[{kind:'fire',id:'0-1',target:[7,2,7]},{kind:'fire',id:'0-2',target:[7,2,7]}],
  hints:['攻击核心才能结束对局；损毁其他舱段不会立即取胜。','两艘艇都已经有射线，无需先移动。','B2、B3 各射击一次 H8 · L3，先后顺序均可。'],success:'集火完成，两次小伤害变成了终结战局的一击。',failure:'本回合没有完成击杀。注意母舰核心的位置，别把两次行动花在别的舱段上。'},
 {id:'mate-shield',category:'puzzle',number:'02',title:'先断盾，后收官',tag:'行动顺序',minutes:4,
  intro:'R1 核心只剩 1，却被 R2 的共享护盾保护。蓝方母舰的主炮已就绪，但射线对准的是神盾舰。',objective:'用本回合两次行动击毁 R1 核心。',why:'当两次攻击的功能不同，顺序决定结果。先取消保护，再交给小艇完成最后一点伤害。',setup:'B1 已蓄力；R1 核心剩 1；R2 护盾为 3，发生器完整。',
  build:()=>{const a=trained(makeShip('flag',0,'0-0',[7,3,2])),b=setHP(makeShip('flag',1,'1-0',[8,3,8],2),'core',1),g=makeShip('aegis',1,'1-1',[7,3,7],4);return position([a,b,g,F(0,'0-1',[10,3,8])]);},
  hidden:[],focus:'0-0',layer:3,frame:{min:[3,0,0],max:[12,5,11]},goal:win,
  line:[{kind:'fire',id:'0-0'},{kind:'fire',id:'0-1',target:[8,3,8]}],
  hints:['先射小艇会被护盾吸收。你需要让发生器先失效。','B1 的贯穿炮会依次命中神盾舰核心和发生器。','先 B1 发射贯穿炮，再让 B2 攻击 I9 · L4 的母舰核心。'],success:'先破坏发生器，再打一血核心。反过来，小艇的这一炮会被护盾吃掉。',failure:'两次行动用完后，敌方核心仍在。试着先取消护盾，再用小艇收官。'},
 {id:'mate-clear',category:'puzzle',number:'03',title:'给主炮让出航道',tag:'零损失胜',minutes:3,
  intro:'主炮已经就绪，敌方核心也在射线上；但一艘己方攻击艇挡在中间。贯穿炮会误伤。',objective:'本回合击毁 R1，并保住 B2。',why:'这题优化的不只是能否取胜，还有代价。实战中是否接受牺牲仍要按局势判断。',setup:'R1 核心剩 4，无护盾；B1 已蓄力；B2 核心完整。',
  build:()=>position([trained(makeShip('flag',0,'0-0',[6,2,2])),setHP(makeShip('flag',1,'1-0',[6,2,9],0),'core',4),F(0,'0-1',[6,2,6])]),
  hidden:[],focus:'0-1',layer:2,frame:{min:[1,0,0],max:[12,5,12]},goal:s=>win(s)&&alive(get(s,'0-1')),
  line:[{kind:'move',id:'0-1',to:[7,2,6]},{kind:'fire',id:'0-0'}],
  hints:['炮能穿过友军，但会把友军一起打掉。','先让 B2 横移或升降，离开 B1 的直线射路。','B2 向东 1 格到 H7 · L3，再让 B1 开火。其他安全让路方式也算。'],success:'先让路，再开火；以零损失完成收官。',failure:'要同时满足取胜和保住 B2。直接开炮虽然可能获胜，却不满足这题的零损失要求。'},
 {id:'mate-delay',category:'puzzle',number:'04',title:'让延迟攻击成为必杀',tag:'先防后攻',minutes:5,
  intro:'R1 核心剩 3、引擎已毁，无法躲导弹；但它的已蓄力主炮也能立即击毁 B1。',objective:'在敌方下个回合结束前取胜，并保住蓝方母舰。',why:'延迟伤害只有在你活到结算时才有价值。先消除对方的致命反击，再确保导弹中心准确覆盖核心。',setup:'R1 核心 3、主炮 1、引擎 0，已蓄力；B1 核心 4；B3 有导弹。对手会选择能阻止你获胜的回应。',
  build:()=>{const a=setHP(makeShip('flag',0,'0-0',[6,2,2],0),'core',4),b=trained(makeShip('flag',1,'1-0',[6,2,10],5));setHP(b,'core',3);setHP(b,'engine',0);setHP(b,'weapon',1);return position([a,b,F(0,'0-1',[8,2,8]),makeShip('arsenal',0,'0-2',[3,2,7],0)]);},
  hidden:[],focus:'0-1',layer:2,frame:{min:[1,0,0],max:[11,5,13]},goal:win,reply:true,
  line:[{kind:'fire',id:'0-1',target:[6,2,8]},{kind:'fire',id:'0-2',target:[6,2,10]}],
  hints:['只发导弹，对手就会抢先开炮。需要同时让自己的核心免于致命反击。','一种方法是用 B2 拆主炮，用 B3 把导弹中心落在母舰核心；两次行动顺序均可。','B2 攻击 G9 · L3；B3 定点攻击 G11 · L3。也可让 B1 的核心移出敌方射线，再配合导弹；有效的替代解法同样通过。'],
  success:'你同时安排了生存与击杀。拆掉敌炮或让自己的核心避开射线，都能争取到导弹结算的时间；这个结果能经受敌方所有合法回应。',failure:'要同时处理「对方下一步能杀我」与「我怎样杀对方」。检查致命反击是否已解除，以及导弹是否正中核心。'}
];

export const OPENINGS=[
 {id:'escort',title:'护航展开',style:'稳住暴露单位，再展开轻舰',focus:'0-2',
  idea:'开局 B7 已在敌方武库舰射程内。先把神盾移到能覆盖它的位置，再用一次指挥行动展开四艘攻击艇。',
  tradeoff:'护盾池全队共享，不能当成每艘各有 3 点。前进后的高层 B11 也会进入导弹射程，要准备下一回合闪避。',
  steps:[
   {action:{kind:'move',id:'0-2',to:[11,2,2]},text:'神盾 B3 向东 2 格。B7 核心进入距离 2 的护盾范围。'},
   {action:{kind:'group',id:'0-3',type:'fighter',dir:4,steps:2},text:'指挥舰让四艘攻击艇向北 2 格。一次行动展开多个单位。'},
   {action:{kind:'fire',id:'1-1',target:[9,5,5]},text:'一种对手回应：用导弹锁定刚前进的高层 B11。开局计划仍要随威胁调整。'},
   {action:{kind:'group',id:'1-3',type:'corvette',dir:5,steps:3},text:'对手也推进护卫舰。轮到你时，先考虑让攻击艇编队向东 2 格避弹，再决定另一项行动。'}]},
 {id:'flanks',title:'双翼施压',style:'展开护卫舰，迫使对手让位',focus:'0-3',
  idea:'两艘护卫舰分居两翼，用指挥舰统一前进，再以武库舰锁定暴露的敌方护卫舰，争取推进的时间。',
  tradeoff:'导弹不是即时吃子。对手可以躲开，随后也可能反锁你的 B7；不要把无人命中的轰炸当成收益。',
  steps:[
   {action:{kind:'group',id:'0-3',type:'corvette',dir:4,steps:3},text:'两艘护卫舰向北推进 3 格，保留两翼路线。'},
   {action:{kind:'fire',id:'0-1',target:[2,2,10]},text:'武库舰锁定 R7 核心 C11 · L3。若对手不处理，会吃到 3 点核心伤害。'},
   {action:{kind:'move',id:'1-6',to:[5,2,10]},text:'一种对手回应：R7 向东 3 格，导弹将落空，但它花掉了一次行动。'},
   {action:{kind:'fire',id:'1-1',target:[11,3,6]},text:'对手反锁前进的 B7。下一回合先处理这枚导弹，不能机械照搬开局顺序。'}]},
 {id:'reserve',title:'稳守反炮',style:'减少直接暴露，保留选择',focus:'0-6',
  idea:'先让处于导弹射程的 B7 撤到安全线外，再用武库舰迫使敌方 R7 调整位置。适合先学会检查威胁的玩家。',
  tradeoff:'你保住安全，却没有推进轻舰。对手可以利用另一项行动占据前沿；安全不是免费优势。',
  steps:[
   {action:{kind:'move',id:'0-6',to:[11,3,0]},text:'B7 向南退 3 格。与敌方武库舰的曼哈顿距离从 9 增至 12，超出射程 10。'},
   {action:{kind:'fire',id:'0-1',target:[2,2,10]},text:'锁定敌方 R7 核心，要求它用行动处理威胁。'},
   {action:{kind:'move',id:'1-6',to:[5,2,10]},text:'一种对手回应：R7 躲开导弹。你没有直接造成伤害。'},
   {action:{kind:'move',id:'1-8',to:[5,5,6]},text:'对手利用另一项行动推进高层攻击艇。接下来应展开自己的轻舰，避免只守不发展。'}]}
];
export function openingState(id,steps=4){const opening=OPENINGS.find(x=>x.id===id);let s=createGame();if(!opening)return s;for(const step of opening.steps.slice(0,steps))s=applyAction(s,step.action);return s;}
export function resolveStudy(study,state){
 let next=state,reply=[];
 if(study.reply&&state.turn===1&&state.winner===null){const result=defenderReply(state,study.goal);reply=result.path;for(const a of reply)next=applyAction(next,a);}
 if(study.goal(next))return {state:next,reply,status:'success',message:study.success};
 if(next.winner!==null||next.turn!==0||next.turnIndex>0)return {state:next,reply,status:'failed',message:study.failure};
 return {state:next,reply,status:'playing',message:next.actionsLeft===1?'还剩一次行动。先确认另一艘舰该做什么；也可以主动结束回合。':study.objective};
}
