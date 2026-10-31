import {createGame,makeShip,alive,trace,applyAction,coord,TYPES,hasActed,charged,beam} from './engine.mjs';
import {defenderReply} from './tactics.mjs';
export const get=(s,id)=>s.ships.find(x=>x.id===id);
export const hp=(s,id,role='core')=>get(s,id)?.parts.find(p=>p.role===role)?.hp??0;
const setHP=(ship,role,hp)=>{ship.parts.find(p=>p.role===role).hp=hp;return ship;};
const distant=()=>[makeShip('flag',0,'0-0',[1,0,2]),makeShip('flag',1,'1-0',[12,5,11])];
function position(ships,rocks=[]){return {...createGame(),ships,rocks,nebula:[],log:['教学局面：使用正式对战规则。'],nextId:[30,30]};}
const F=(team,id,p)=>makeShip('fighter',team,id,p);
const trained=ship=>{ship.charge={due:0};return ship;};
const win=s=>s.winner===0;

const ORIGINAL_STUDIES=[
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
  intro:'R1 核心只剩 1，却被 R2 的共享护盾保护。蓝方母舰的主炮已就绪；敌方核心在 45°射界之外，神盾舰却挡在炮口正前方。',objective:'用本回合两次行动击毁 R1 核心。',why:'当两次攻击的功能不同，顺序决定结果。先取消保护，再交给小艇完成最后一点伤害。',setup:'B1 已蓄力；R1 核心剩 1；R2 护盾为 3，发生器完整。',
  build:()=>{const a=trained(makeShip('flag',0,'0-0',[7,3,2])),b=setHP(makeShip('flag',1,'1-0',[9,3,5],2),'core',1),g=makeShip('aegis',1,'1-1',[7,3,5],4);return position([a,b,g,F(0,'0-1',[11,3,5])]);},
  hidden:[],focus:'0-0',layer:3,frame:{min:[3,0,0],max:[12,5,11]},goal:win,
  line:[{kind:'fire',id:'0-0'},{kind:'fire',id:'0-1',target:[9,3,5]}],
  hints:['先射小艇会被护盾吸收。你需要让发生器先失效。','B1 的贯穿炮会依次命中神盾舰核心和发生器。','先 B1 发射贯穿炮，再让 B2 攻击 J6 · L4 的母舰核心。'],success:'先破坏发生器，再打一血核心。反过来，小艇的这一炮会被护盾吃掉。',failure:'两次行动用完后，敌方核心仍在。试着先取消护盾，再用小艇收官。'},
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
  hints:['只发导弹，对手就会抢先开炮。需要同时让自己的核心免于致命反击。','一种方法是用 B2 拆主炮，用 B3 把导弹中心落在母舰核心；两次行动顺序均可。','B2 攻击 G9 · L3；B3 定点攻击 G11 · L3。新版主炮覆盖前方 45°，B1 横移一格仍不安全；必须先解除主炮威胁。'],
  success:'你同时安排了生存与击杀。先拆掉敌炮，才能活到导弹结算；这个结果能经受敌方所有合法回应。',failure:'要同时处理「对方下一步能杀我」与「我怎样杀对方」。检查致命反击是否已解除，以及导弹是否正中核心。'}
];

function original(id,category,number){const study=ORIGINAL_STUDIES.find(s=>s.id===id);if(!study)throw new Error('Unknown study');return {...study,category,number};}
const blockedShot=(s,id)=>s.history.some(r=>r.impacts.some(h=>h.id===id&&h.blocked>0&&h.damage===0));
const counterShot=(id,target)=>s=>{const action={kind:'fire',id,target};return trace(s,get(s,id),target).ok?[action,{kind:'end_turn'}]:[{kind:'end_turn'}];};
const missileNet=s=>s.winner===0||s.turn===0&&alive(get(s,'0-0'))&&charged(s,get(s,'0-0'))&&beam(s,get(s,'0-0'),get(s,'1-0').p).hits.some(h=>h.ship.id==='1-0'&&h.part.role==='core');

export const STUDIES=[
 original('firing-square','lesson','01'),
 {id:'cannon-angle',category:'lesson',number:'02',title:'主炮不必只打正前方',tag:'母舰 · 45°射界',minutes:2,
  intro:'目标在右前上方，既不在舰首轴线上，也不是等距对角线。主炮仍能瞄准它。',objective:'不移动、不转向，用已蓄力的 B1 击毁 R2。',
  why:'射界是以炮口为顶点、舰首为轴的 45°空间锥。选择目标确定一条直线；不是同时扫射整个锥体。',setup:'B1 已蓄力；R2 是标准 2 点核心攻击艇。橙方母舰在练习区外。',
  build:()=>position([trained(makeShip('flag',0,'0-0',[4,2,2])),distant()[1],F(1,'1-1',[7,3,8])]),
  hidden:['1-0'],focus:'0-0',layer:3,frame:{min:[1,0,0],max:[11,5,11]},modes:['fire'],goal:s=>hp(s,'1-1')===0,
  line:[{kind:'fire',id:'0-0',target:[7,3,8]}],
  hints:['先切到 L4，观察目标与炮口的高度差。','点击 R2，或把主炮瞄准坐标设为 H9 · L4。','预览通往 H9 · L4 的射线，再确认。射线会穿过目标继续延伸。'],
  success:'你在不转向、不取消蓄力的情况下完成了侧前方打击。45°限制的是方向，实际只发射这一条射线。',failure:'先别移动或转向，那会丢掉蓄力。找出锥内的目标并预览射线。'},
 {id:'cannon-denial',category:'lesson',number:'03',title:'横移一格，还在炮口里',tag:'母舰 · 封锁航线',minutes:3,
  intro:'敌方主炮已就绪。B2 离开原来的直线，还不等于离开整个射界。',objective:'让 B2 完整避开敌方下一回合的主炮，然后结束回合。',
  why:'蓄力主炮即使不开火，也能限制对手的安全落点。封锁不是额外规则，而是对手必须考虑的致命威胁。',setup:'R1 已蓄力；系统会寻找能击中 B2 的合法回应。B1 在练习区外。',
  build:()=>position([distant()[0],trained(makeShip('flag',1,'1-0',[6,2,10])),F(0,'0-1',[6,2,5])]),
  hidden:['0-0'],focus:'0-1',layer:2,frame:{min:[1,0,1],max:[12,5,13]},modes:['move'],reply:true,
  goal:s=>s.turnIndex>=2&&hp(s,'0-1')===2,
  line:[{kind:'move',id:'0-1',to:[10,2,5]},{kind:'end_turn'}],
  hints:['炮口在 G9 · L3，面向南方。橙色阴影显示当前高度的射界。','向东一格、两格、三格都仍可能被瞄准；想想攻击艇的最大机动距离。','B2 向东 4 格到 K6 · L3，再结束回合。向西的安全撤离也可以。'],
  success:'你离开了整片射界，而不只是原来的瞄准线。这个落点能经受对手所有合法回应。',failure:'敌方仍能重新瞄准 B2。比较炮口到落点的前向距离与侧向距离，别只躲原来的那条线。'},
 {id:'shield-counter',category:'lesson',number:'04',title:'用护盾换一轮无伤反击',tag:'神盾 · 换血节奏',minutes:3,
  intro:'神盾舰的近防炮伤害不高，但护盾可以吸收对方的还击。先打、承受反击，再收尾。',objective:'用 B2 击毁 R2，并至少吸收一次反击，B2 核心保持 4。',
  why:'看交换是否划算，要算护盾和回合补充。护盾池只有 3 点，也保护发生器；持续集火仍能打穿它。',setup:'本课 R2 固定射击 B2 核心，随后结束回合。这是护盾机制演示，不代表对手在实战中必须还击。',
  build:()=>position([...distant(),makeShip('aegis',0,'0-1',[5,2,5],0),F(1,'1-1',[5,2,7])]),
  hidden:['0-0','1-0'],focus:'0-1',layer:2,frame:{min:[2,0,2],max:[9,5,10]},modes:['fire','special'],extraTurns:1,replyScript:counterShot('1-1',[5,2,5]),
  goal:s=>hp(s,'1-1')===0&&hp(s,'0-1')===4&&blockedShot(s,'0-1'),
  line:[{kind:'fire',id:'0-1',target:[5,2,7]},{kind:'end_turn'},{kind:'fire',id:'0-1',target:[5,2,7]}],
  hints:['先用神盾的近防炮打掉 R2 一点核心。','结束回合。观察战报：敌方反击被护盾吸收，自己的回合开始时护盾补回 3。','再次攻击 F8 · L3，击毁 R2。检查 B2 核心仍为 4。'],
  success:'两炮击毁目标，自己的核心没有损伤。吸收反击和回合补盾让这次交换获利；别把护盾当成无限生命。',failure:'需要真实吸收一次反击，再完成击杀。留在两格射程内，按回合节奏使用近防炮。'},
 original('evade-blast','lesson','05'),
 {id:'command-evade',category:'lesson',number:'06',title:'一次指令，救下两艘轻舰',tag:'指挥舰 · 行动效率',minutes:3,
  intro:'两艘攻击艇同时被导弹锁定。逐个移动会耗完两次行动，指挥舰可以让它们一起撤离。',objective:'用一次攻击艇联动避弹，结束回合后 B3、B4 都保持完整。',
  why:'指挥舰把多艘轻舰的机动合并成一次行动。代价是所有参与者都算已行动，且任一路径被堵就无法执行。',setup:'两枚导弹都在本回合结束时引爆。B2 是指挥舰，B3、B4 是攻击艇。',
  build:()=>{const s=position([...distant(),makeShip('command',0,'0-1',[4,3,2]),F(0,'0-2',[4,1,5]),F(0,'0-3',[8,4,5])]);s.missiles=[{id:'group-a',team:1,target:[4,1,5],due:1},{id:'group-b',team:1,target:[8,4,5],due:1}];return s;},
  hidden:['0-0','1-0'],focus:'0-1',layer:1,frame:{min:[1,0,0],max:[12,5,10]},modes:['special','move'],
  goal:s=>s.turnIndex>=1&&hp(s,'0-2')===2&&hp(s,'0-3')===2&&s.history.some(r=>r.action.kind==='group'),
  line:[{kind:'group',id:'0-1',type:'fighter',dir:0,steps:2},{kind:'end_turn'}],
  hints:['选 B2 的「技能」，联动舰型选攻击艇。','距离至少两格，避开导弹中心和六个相邻格。','攻击艇向东联动 2 格，然后结束回合。移动后两艘艇都不能再单独开火。'],
  success:'一次指令同时救下两艘轻舰，仍留下另一项行动的选择。参与编队的舰艇已经用过行动。',failure:'检查两艘攻击艇的落点：都要避开爆炸邻格，并且通过编队联动完成撤离。'},
 original('two-ships','combined','01'),
 {id:'shield-relay',category:'combined',number:'02',title:'让护盾跟上火力',tag:'神盾 + 攻击艇',minutes:4,
  intro:'攻击艇能打到敌人，却还没进入护盾范围。用另一艘舰的行动，为它的攻击提供保护。',objective:'本回合让 B3 打伤 R2；敌方反击后 B3 仍是 2 点核心。',
  why:'两次行动可以分工：一艘创造保护条件，一艘制造伤害。护盾只看舱段到神盾核心的曼哈顿距离。',setup:'本课 R2 固定反击 B3 核心。B2 是神盾，B3 是攻击艇；这是交换机制练习。',
  build:()=>position([...distant(),makeShip('aegis',0,'0-1',[9,2,4]),F(0,'0-2',[6,2,4]),F(1,'1-1',[6,2,6])]),
  hidden:['0-0','1-0'],focus:'0-1',layer:2,frame:{min:[2,0,1],max:[12,5,10]},replyScript:counterShot('1-1',[6,2,4]),
  goal:s=>s.turnIndex>=2&&hp(s,'0-2')===2&&hp(s,'1-1')===1&&blockedShot(s,'0-2'),
  line:[{kind:'move',id:'0-1',to:[7,2,4]},{kind:'fire',id:'0-2',target:[6,2,6]}],
  hints:['B3 核心在 G5 · L3，当前离神盾核心三格，没有保护。','把 B2 向西移动一格或两格，将 B3 纳入护盾距离 2。','再选 B3 攻击 G7 · L3。观察对方反击时护盾替 B3 承受伤害。'],
  success:'神盾负责创造安全交换，攻击艇负责输出。对方损失一点核心，你的攻击艇完整。',failure:'要同时造成伤害和保护 B3。神盾离得太远，或者把两次行动都花在机动上，都不能完成目标。'},
 original('disable-gun','combined','03'),
 {id:'cannon-missile-net',category:'combined',number:'04',title:'导弹逼走，主炮收网',tag:'武库舰 + 母舰',minutes:5,
  intro:'敌方核心在主炮射界外，但只剩一个可移动出口。用导弹迫使它进入已蓄力主炮的控制区。',objective:'用定点导弹与主炮的配合，在下个己方回合内击毁 R1。',
  why:'一种武器要求对手离开当前位置，另一种武器控制它的退路。先保留蓄力，等对手回应后再决定射线。',setup:'R1 核心剩 3；小行星使它只能向西机动。B1 已蓄力。系统检查敌方所有合法回应；示范中敌方优先寻找脱离导弹中心的行动。',
  build:()=>position([trained(makeShip('flag',0,'0-0',[4,2,2])),setHP(makeShip('flag',1,'1-0',[8,2,7],4),'core',3),makeShip('arsenal',0,'0-1',[3,1,6])],[[9,2,5],[8,3,5],[8,1,5],[8,2,4],[8,2,10]]),
  hidden:[],focus:'0-1',layer:2,frame:{min:[1,0,0],max:[12,5,12]},reply:true,replyGoal:missileNet,extraTurns:1,
  goal:win,
  line:[{kind:'fire',id:'0-1',target:[8,2,7]},{kind:'end_turn'},{kind:'fire',id:'0-0',target:[7,2,7]}],
  hints:['先用 B2 锁定 I8 · L3。不要让 B1 移动、转向或浪费已蓄力的炮。','结束回合。留在原地会被导弹击毁；向西撤离会进入主炮 45°射界。','若敌方撤到 H8 · L3，选 B1 瞄准那里，预览并确认贯穿炮。'],
  success:'导弹逼对手离开原地，主炮控制退路。对手若不撤离会被炸毁，撤离后也无法逃过下一回合的主炮。',failure:'需要保留已就绪的主炮，同时把导弹中心放在敌方核心。过早开炮或移动母舰，会让对手从缺口逃走。'},
 ...ORIGINAL_STUDIES.filter(s=>s.category==='puzzle')
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
 if(state.turn===1&&state.winner===null){
  if(study.replyScript)reply=study.replyScript(state);
  else if(study.reply)reply=defenderReply(state,study.replyGoal??study.goal).path;
  for(const a of reply)next=applyAction(next,a);
 }
 if(study.goal(next))return {state:next,reply,status:'success',message:study.success};
 if(next.winner!==null||next.turn!==0||next.turnIndex>2*(study.extraTurns??0))return {state:next,reply,status:'failed',message:study.failure};
 return {state:next,reply,status:'playing',message:reply.length?'敌方回应结束。检查战场，再安排下一步。':next.actionsLeft===1?'还剩一次行动。先确认另一艘舰该做什么；也可以主动结束回合。':study.objective};
}
