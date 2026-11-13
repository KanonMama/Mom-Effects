import { getContext, extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';
import { catalog } from './catalog.js';
const KEY='mom_particles';
const defaults={language:'ru',floating:true,enabled:{},density:35,speed:50,opacity:55,reduceMotion:false,position:{right:18,bottom:100},panelPosition:null,presets:{},customEffects:[],effectDensity:{},chatBindings:{},chatMode:false,infoblockSync:false,infoblockTime:true,infoblockEnvironment:true};
const categories={weather:['Погода','Weather'],season:['Времена года','Seasons & light'],magic:['Мистика','Magic'],ambient:['Атмосфера','Atmosphere'],cinema:['Кино','Cinematic'],romance:['Романтика','Romance']};
const builtins={
 'Вечер у костра':['embers','smoke','fireflies'], 'Ночная погоня':['rain','police','tiretracks'],
 'Лесная ведьма':['mist','wisps','runes'], 'Зимняя ночь':['snow','moonlight','nightsky'],
 'Под водой':['bubbles','caustics','jellyfish'], 'Осенний вечер':['autumn','golden','dust'],
 'Магическая ночь':['magiccircle','runes','portals'], 'Романтика':['pulsehearts','bluebloom','fireflies'],
 'Пещера лиан':['glowvines','fireflies','mist'], 'Дискотека':['disco','neon','prismstars'],
 'Хоррор':['analoghorror','blooddrip','cobwebs']};
let state,layer,style,settingsRoot,panel,panelBody,button,watcher,lastChatKey=null;const nodes=new Map();let autoIds=new Set();let lastScene=null;let sceneStatus='Нет данных / No data';
const allEffects=()=>[...catalog,...state.customEffects];
const chatKey=()=>{try{const c=getContext();return c?.chatId!=null&&c?.characterId!=null?String(c.characterId)+':'+String(c.chatId):null;}catch{return null;}};
const activeIds=()=>Object.keys(state.enabled).filter(k=>state.enabled[k]);
const tr=(ru,en)=>state.language==='ru'?ru:en;
const save=()=>{extension_settings[KEY]=state;saveSettingsDebounced();};
const rand=(a,b)=>a+Math.random()*(b-a);
const palette={snow:'#dbeaff',blizzard:'#f3faff',rain:'#a7c6ef',downpour:'#a7c6ef',mist:'#b8c0d2',rime:'#d8f3ff',sandstorm:'#bfa27b',nightsky:'#e8f2ff',grass:'#4eb86b',autumn:'#bd7044',sakura:'#f2a9c7',runes:'#a58cff',wisps:'#8acfff',blackfeathers:'#34313c',whitefeathers:'#eae9ff',stardust:'#b8a6ff',prismstars:'#ff9ee2',kitsune:'#ffbe76',inkscript:'#2b222c',fireflies:'#ffd99a',embers:'#ff9451',ash:'#9d9292',bubbles:'#94d5f1',plankton:'#63c9c6',caustics:'#7ce8ff',shark:'#6c9ab8',glowvines:'#ffb84d',cobwebs:'#d9e2ec',rose:'#f3a2ba',lavender:'#b9a0ed',bluebloom:'#63b8ff',hearts:'#fa92ad',pulsehearts:'#ff5e8e',confetti:'#c9a9ff',police:'#f15b78',blooddrip:'#a80b1e',tiretracks:'#26262b',butterflies:'#a8d8ff'};
const color=id=>palette[id]||'#b7b0e6';
function ensureLayer(){if(layer?.isConnected)return;layer=document.createElement('div');layer.id='mp-effects';document.body.append(layer);}

const overlayIds=new Set(['mist','smoke','frost','rime','sunbeams','golden','twilight','moonlight','aurora','police','alarm','flicker','vhs','analoghorror','neon','disco','danger','thunder','glitch','caustics','cobwebs']);
const volume={snow:80,blizzard:190,rain:100,downpour:230,wind:28,sandstorm:210,rime:36,nightsky:95,grass:85,autumn:38,sakura:42,dandelion:38,whitefeathers:28,blackfeathers:28,bats:22,summerdust:95,ash:90,plankton:85,caustics:26,shark:8,glowvines:24,cobwebs:20,dust:100,hearts:52,pulsehearts:34,bluebloom:28,shootingstars:9,stardust:70,prismstars:65,kitsune:14,inkscript:24,portals:58,fireflies:38,embers:52,glassrain:68,matrix:55,confetti:60,rose:40,lavender:42,butterflies:24,runes:32,magiccircle:14,wisps:28,bubbles:38,jellyfish:12,blooddrip:30,tiretracks:8,disco:44,analoghorror:18};
const runeGlyphs=['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ'];
const matrixGlyphs=['0','1','2','4','7','9','ア','カ','サ','タ','ナ','ハ','マ','ヤ','ラ','ワ','ミ','ネ','シ','ツ','ソ','ホ','モ','エ'];
const inkPhrases=['«Не оглядывайся...»','«Memento mori»','«Полночь близко»','«Кто здесь?»','«Тень за спиной»','«Слова на ветру»','«Вечность»','«Не стирать»','«Забытый обет»','«Следы чернил»','«Silentium»','«Тайна»'];

function makeEffect(effect){
 ensureLayer();const wrap=document.createElement('div');wrap.className='mp-effect mp-'+effect.type;wrap.dataset.effect=effect.id;layer.append(wrap);nodes.set(effect.id,wrap);
 const base=volume[effect.id]??(effect.type==='fall'?42:effect.type==='rise'?36:28);
 const scaled=Math.max(3,Math.min(360,Math.round(base*state.density/55*(state.effectDensity[effect.id]??100)/100)));
 if(overlayIds.has(effect.id)){
  const overlay=document.createElement('div');overlay.className='mp-overlay mp-overlay-'+effect.type;wrap.append(overlay);
  if(effect.id==='thunder'){const rain=allEffects().find(e=>e.id==='rain');addParticles(wrap,rain,85);}
  if(effect.id==='smoke')addParticles(wrap,effect,26);
  if(effect.id==='frost')addParticles(wrap,effect,22);
  if(effect.id==='golden')addParticles(wrap,effect,18);
  if(['rime','caustics','cobwebs','disco','analoghorror'].includes(effect.id))addParticles(wrap,effect,scaled);
  return;
 }
 addParticles(wrap,effect,scaled);
}

function addParticles(wrap,effect,count){
 if(!effect)return;
 const geometric=new Set(['snow','blizzard','rain','downpour','wind','sandstorm','rime','nightsky','grass','dandelion','stardust','prismstars','kitsune','portals','wisps','bats','whitefeathers','blackfeathers','fireflies','embers','bubbles','jellyfish','caustics','shark','glowvines','cobwebs','rose','lavender','bluebloom','butterflies','confetti','glassrain','matrix','magiccircle','autumn','sakura','plankton','dust','summerdust','ash','hearts','pulsehearts','smoke','frost','golden','shootingstars','blooddrip','tiretracks','disco','analoghorror']);
 const durations={rain:[.75,1.35],downpour:[.45,.82],blizzard:[2.0,4.2],snow:[7,15],wind:[2.2,4.6],sandstorm:[1.6,3.8],rime:[6,12],nightsky:[3.5,8],grass:[3.2,6.2],embers:[3.2,7.2],fireflies:[5,11],matrix:[2.6,5.8],glassrain:[4.5,11],jellyfish:[9,17],bats:[4.5,8.5],shootingstars:[3.2,6.5],summerdust:[8,16],ash:[7,15],plankton:[7,14],caustics:[4,8],shark:[5,9.5],glowvines:[4.5,8.5],cobwebs:[6,12],dust:[10,20],hearts:[6.5,12],pulsehearts:[2.8,5.2],bluebloom:[5.5,10.5],autumn:[7,14],sakura:[7,14],rose:[7,14],lavender:[7,14],whitefeathers:[8,16],blackfeathers:[8,16],butterflies:[7,13],runes:[6,12],magiccircle:[8,15],wisps:[6,12],portals:[3.5,7.5],stardust:[4,9],prismstars:[3.5,7.5],kitsune:[4.5,8.5],inkscript:[5.5,10],bubbles:[6,13],confetti:[5,10],dandelion:[9,17],frost:[6,12],golden:[8,16],blooddrip:[5,11],tiretracks:[4.5,8],disco:[2.8,5.8],analoghorror:[1.8,4.2]};
 for(let i=0;i<count;i++){
  const el=document.createElement('span');el.className='mp-particle';
  const id=effect.id;const kind=effect.type;
  let sym=effect.symbol;
  if(geometric.has(id))sym='';
  if(id==='runes')sym=runeGlyphs[i%runeGlyphs.length];
  if(id==='inkscript'){
   if(i%2===0){sym=inkPhrases[(i/2)%inkPhrases.length];el.dataset.ink='text';}
   else{sym='';el.dataset.ink='blot';}
  }
  if(id==='matrix'){
   const len=5+Math.floor(Math.random()*5);
   let col='';
   for(let j=0;j<len;j++)col+=(j?'\n':'')+matrixGlyphs[Math.floor(Math.random()*matrixGlyphs.length)];
   sym=col;
  }
  const depth=i%3;
  el.dataset.depth=String(depth);
  el.dataset.tint=String(i%(id==='confetti'||id==='autumn'||id==='prismstars'?5:4));
  el.textContent=sym;

  const [lo,hi]=durations[id]||[7,18];
  const depthSpeed=depth===0?1.28:depth===1?1.0:0.78;
  const dur=(rand(lo,hi)*depthSpeed)/Math.max(.2,state.speed/50);
  const scaleBase=depth===0?rand(.55,.78):depth===1?rand(.85,1.08):rand(1.12,1.42);

  el.style.setProperty('--x',rand(0,100).toFixed(2)+'vw');
  el.style.setProperty('--y',rand(0,100).toFixed(2)+'vh');

  if(id==='shootingstars'){
   el.style.setProperty('--x',rand(35,112).toFixed(2)+'vw');
   el.style.setProperty('--y',rand(-12,45).toFixed(2)+'vh');
   el.style.setProperty('--travel',rand(42,88).toFixed(2)+'vw');
  } else if(id==='nightsky'){
   el.style.setProperty('--y',rand(2,78).toFixed(2)+'vh');
  } else if(id==='grass'){
   el.style.setProperty('--x',rand(-2,102).toFixed(2)+'vw');
   el.style.setProperty('--y','0vh');
   el.style.setProperty('--len',rand(45,115).toFixed(0)+'px');
  } else if(id==='glowvines'||id==='blooddrip'||id==='cobwebs'){
   el.style.setProperty('--x',rand(1,99).toFixed(2)+'vw');
   el.style.setProperty('--y','0vh');
   el.style.setProperty('--len',rand(id==='blooddrip'?75:95,id==='blooddrip'?260:280).toFixed(0)+'px');
  } else if(id==='rime'){
   const edge=i%4;
   const ex=edge===0?rand(0,10):edge===1?rand(90,100):rand(0,100);
   const ey=edge===2?rand(0,12):edge===3?rand(88,100):rand(0,100);
   el.style.setProperty('--x',ex.toFixed(2)+'vw');
   el.style.setProperty('--y',ey.toFixed(2)+'vh');
  } else if(id==='shark'){
   el.style.setProperty('--x',rand(10,88).toFixed(2)+'vw');
   el.style.setProperty('--y',rand(18,86).toFixed(2)+'vh');
  } else if(id==='tiretracks'){
   el.style.setProperty('--x',rand(5,72).toFixed(2)+'vw');
   el.style.setProperty('--y',rand(12,84).toFixed(2)+'vh');
   el.style.setProperty('--rotate',rand(-38,-14).toFixed(0)+'deg');
  }

  const dir=i%2===0?1:-1;
  el.style.setProperty('--dx',rand(-95,95).toFixed(1)+'px');
  el.style.setProperty('--dy',rand(-85,85).toFixed(1)+'px');
  el.style.setProperty('--sway',(dir*rand(18,54)).toFixed(1)+'px');
  el.style.setProperty('--drift',rand(-45,95).toFixed(1)+'px');
  el.style.setProperty('--sz',rand(kind==='rain'?8:7,kind==='rain'?22:18).toFixed(1)+'px');
  el.style.setProperty('--dur',dur.toFixed(2)+'s');
  el.style.setProperty('--delay',(-rand(0,dur)).toFixed(2)+'s');
  el.style.setProperty('--flap',rand(.18,.32).toFixed(2)+'s');
  el.style.setProperty('--hue',color(id));
  if(id!=='tiretracks')el.style.setProperty('--rotate',rand(-180,180).toFixed(0)+'deg');
  el.style.setProperty('--scale',scaleBase.toFixed(2));
  wrap.append(el);
 }
}

function sync(){ensureLayer();layer.style.setProperty('--mp-opacity',state.opacity/100);layer.style.setProperty('--mp-speed',Math.max(.2,state.speed/50));layer.classList.toggle('mp-reduced',state.reduceMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches);for(const e of allEffects()){const should=!!state.enabled[e.id]||autoIds.has(e.id);const exists=nodes.has(e.id);if(should&&!exists)makeEffect(e);if(!should&&exists){nodes.get(e.id).remove();nodes.delete(e.id);}if(should){const el=nodes.get(e.id);if(el)el.style.opacity='1';}}renderControls();save();}
// Companion bridge: automatic effects are separate from manually enabled effects.
function interpretWeather(value,code='') {
 const coded={clear:[],cloudy:[],rain:['rain'],heavy_rain:['downpour'],downpour:['downpour'],drizzle:['rain'],thunderstorm:['thunder'],thunder:['thunder'],snow:['snow'],blizzard:['blizzard'],fog:['mist'],mist:['mist'],sandstorm:['sandstorm'],windy:['wind'],wind:['wind']};
 const normalize=(token)=>String(token||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
 const rawCodes=String(code||'').split(/[,;|]+/).map(normalize).filter(Boolean);
 const known=rawCodes.filter(token=>Object.prototype.hasOwnProperty.call(coded,token));
 let effects=[];
 if(known.length && known.some(token=>token!=='unknown')) {
  effects=known.flatMap(token=>coded[token]);
 } else {
  const t=String(value||'').toLowerCase().replace(/ё/g,'е');
  if(/thunder|гроза|гром|молни/.test(t))effects.push('thunder');
  if(/blizzard|метел|вьюг|буран/.test(t))effects.push('blizzard');
  else if(/heavy.rain|downpour|ливень|проливн/.test(t))effects.push('downpour');
  else if(/drizzle|морос|light.rain|небольш.*дожд/.test(t))effects.push('rain');
  else if(/rain|дожд/.test(t))effects.push('rain');
  if(/snow|снег|снеж/.test(t))effects.push('snow');
  if(/fog|mist|туман|дымк/.test(t))effects.push('mist');
  if(/sandstorm|песчан.*бур/.test(t))effects.push('sandstorm');
  if(/wind|ветер|ветр|ветрено/.test(t))effects.push('wind');
 }
 const result=new Set(effects);
 if(result.has('downpour'))result.delete('rain');
 if(result.has('blizzard'))result.delete('snow');
 return [...result];
}
function interpretTime(value){
 const t=String(value||'').toLowerCase().replace(/ё/g,'е').trim();
 const clock=t.match(/(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?:\D|$)/);
 if(clock){
  const h=Number(clock[1]);
  if(h>=5&&h<8)return {period:'dawn',effect:'golden'};
  if(h>=8&&h<17)return {period:'day',effect:null};
  if(h>=17&&h<18)return {period:'golden_hour',effect:'golden'};
  if(h>=18&&h<21)return {period:'twilight',effect:'twilight'};
  return {period:'night',effect:'moonlight'};
 }
 if(/сумерк|twilight|dusk|вечер|evening/.test(t))return {period:'twilight',effect:'twilight'};
 if(/рассвет|dawn|sunrise|утро|morning/.test(t))return {period:'dawn',effect:'golden'};
 if(/ноч|night/.test(t))return {period:'night',effect:'moonlight'};
 if(/день|днем|дневн|day|afternoon|полдень|noon/.test(t))return {period:'day',effect:null};
 return null;
}
const periodName=(period)=>({dawn:tr('Рассвет','Dawn'),day:tr('День','Day'),golden_hour:tr('Золотой час','Golden hour'),twilight:tr('Сумерки','Twilight'),night:tr('Ночь','Night')})[period]||tr('не определено','unknown');
function chooseTimeEffect(time){
 if(!time||!state.infoblockTime)return null;
 const ids={dawn:'golden',day:null,golden_hour:'golden',twilight:'twilight',night:'moonlight'};
 return ids[time.period]||null;
}
function interpretEnvironment(value,location=''){
 const v=String(value||'').toLowerCase().trim();
 const codes=['outdoor','indoor','covered','underground','vehicle','underwater','space'];
 if(codes.includes(v))return {code:v,source:'code'};
 const loc=String(location||'').toLowerCase().replace(/ё/g,'е');
 if(/подвод|на дне океана|submerged|underwater/.test(loc))return {code:'underwater',source:'location'};
 if(/космическ.*вакуум|открыт.*космос|spacewalk|outer space/.test(loc))return {code:'space',source:'location'};
 if(/подземел|подвал|пещер|катакомб|бункер|шахт|dungeon|basement|cave|bunker/.test(loc))return {code:'underground',source:'location'};
 if(/в машине|в автомобиле|в поезде|в самолете|в автобусе|в вагоне|inside (a |the )?(car|train|plane|bus)/.test(loc))return {code:'vehicle',source:'location'};
 if(/беседк|под навесом|под крышей|gazebo|under (a |the )?canopy/.test(loc))return {code:'covered',source:'location'};
 if(/кабинет|офис|комнат|спальн|кухн|коридор|квартир|в доме|в здании|лаборатор|office|bedroom|kitchen|inside (a |the )?building/.test(loc))return {code:'indoor',source:'location'};
 if(/парк|лес|улиц|площад|пляж|полян|двор|на крыше|garden|forest|street|park|beach/.test(loc))return {code:'outdoor',source:'location'};
 return {code:'unknown',source:'unknown'};
}
const environmentName=(code)=>({outdoor:tr('Улица','Outdoor'),indoor:tr('Помещение','Indoor'),covered:tr('Под навесом','Covered'),underground:tr('Под землёй','Underground'),vehicle:tr('Транспорт','Vehicle'),underwater:tr('Под водой','Underwater'),space:tr('Открытый космос','Space'),unknown:tr('Не определено','Unknown')})[code];
function applyScene(detail){
 if(!detail||typeof detail!=='object')return;
 const current=getContext();
 if(String(detail.chatId??'')!==String(current?.chatId??'')||String(detail.characterId??'')!==String(current?.characterId??''))return;
 lastScene=detail;
 const weather=interpretWeather(detail.weather,detail.weatherCode);
 const time=state.infoblockTime?interpretTime(detail.time):null;
 const timeEffect=chooseTimeEffect(time);
 const environment=interpretEnvironment(detail.environment,detail.location);
 const blockOutdoor=state.infoblockEnvironment&&['indoor','underground','vehicle','underwater','space'].includes(environment.code);
 const next=new Set(blockOutdoor?[]:[...weather,...(timeEffect?[timeEffect]:[])]);
 const timeStatus=state.infoblockTime?(time?periodName(time.period):tr('время не распознано','time not recognized')):tr('выключено','disabled');
 sceneStatus=`${detail.weather||'—'} · ${detail.time||'—'} (${timeStatus}) · ${environmentName(environment.code)}${blockOutdoor?' [фильтр]':''} → ${[...next].join(', ')||tr('без визуальных эффектов','no visual effects')}`;
 if(state.infoblockSync){autoIds=next;sync();}
 updateBridgeStatus();
}
function updateBridgeStatus(){document.querySelectorAll('[data-mp-bridge-status]').forEach(el=>el.textContent=sceneStatus);}
function setBridgeEnabled(value){state.infoblockSync=value;if(!value){autoIds.clear();sync();}else if(lastScene){applyScene(lastScene);}else if(window.__momInfoblockScene){applyScene(window.__momInfoblockScene);}save();updateBridgeStatus();}
function rebuild(){for(const n of nodes.values())n.remove();nodes.clear();sync();}
function toggle(id,value){state.enabled[id]=value;sync();}
function persistChat(){const key=chatKey();if(!key)return alert(tr('Открой чат, чтобы сохранить привязку.','Open a chat to save a binding.'));state.chatBindings[key]=activeIds();state.chatMode=true;save();refreshUI();}
function unbindChat(){const key=chatKey();if(key)delete state.chatBindings[key];save();refreshUI();}
function watchChat(){const key=chatKey();if(key===lastChatKey)return;lastChatKey=key;autoIds.clear();lastScene=null;sceneStatus='Ожидание инфоблока / Waiting for Infoblock';sync();if(window.__momInfoblockScene)applyScene(window.__momInfoblockScene);if(!state.chatMode||!key)return;const ids=state.chatBindings[key];if(Array.isArray(ids))setPreset(ids);}
function downloadJSON(data,filename){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
const safeTypes=new Set(['snow','rain','fog','storm','frost','wind','dust','sun','gold','twilight','moon','fall','float','aurora','circle','glitch','rise','police','alarm','flicker','vhs','neon','danger','shoot']);
function importData(data){if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid JSON root');let count=0;const entries=data.presets||data.scenes||{};if(entries&&typeof entries==='object'&&!Array.isArray(entries)){for(const [name,ids] of Object.entries(entries)){if(typeof name!=='string'||!name.trim()||name.length>48||!Array.isArray(ids)||!ids.every(id=>typeof id==='string'))continue;state.presets[name]=ids.filter(id=>allEffects().some(e=>e.id===id));count++;}}if(Array.isArray(data.effects)){for(const raw of data.effects.slice(0,100)){if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!/^custom_[a-z0-9_-]{1,40}$/.test(raw.id)||!safeTypes.has(raw.type)||typeof raw.ru!=='string'||typeof raw.en!=='string'||typeof raw.symbol!=='string'||raw.symbol.length>8||raw.ru.length>60||raw.en.length>60||!Object.hasOwn(categories,raw.category)||catalog.some(e=>e.id===raw.id))continue;const item={id:raw.id,ru:raw.ru,en:raw.en,category:raw.category,type:raw.type,symbol:raw.symbol};state.customEffects=state.customEffects.filter(e=>e.id!==item.id);state.customEffects.push(item);count++;}}if(!count)throw Error('No valid scenes or declarative effects');save();refreshUI();return count;}
function setPreset(ids){state.enabled={};ids.forEach(id=>state.enabled[id]=true);rebuild();}
function inputRow(label,key){const row=document.createElement('label');row.className='mp-range';const text=document.createElement('span');text.textContent=label;const value=document.createElement('output');value.textContent=state[key]+'%';const input=document.createElement('input');input.type='range';input.min=key==='speed'?10:5;input.max=100;input.value=state[key];input.addEventListener('input',()=>{state[key]=Number(input.value);value.textContent=input.value+'%';if(key==='density'||key==='speed')rebuild();else sync();});row.append(text,value,input);return row;}
function renderControls(){document.querySelectorAll('[data-mp-toggle]').forEach(el=>{const id=el.dataset.mpToggle;el.checked=!!state.enabled[id];const row=el.closest('.mp-effect-row');const badge=row?.querySelector('[data-mp-auto]');if(badge){badge.hidden=!(state.infoblockSync&&autoIds.has(id));badge.textContent=state.enabled[id]?tr('AUTO + вручную','AUTO + manual'):'AUTO';}});document.querySelectorAll('[data-mp-count]').forEach(el=>el.textContent=Object.values(state.enabled).filter(Boolean).length);}
function makeUI(root){root.innerHTML='';const head=document.createElement('div');head.className='mp-head';head.innerHTML='<strong>✦ Mom Effects</strong><span data-mp-count>0</span>';root.append(head);
const tools=document.createElement('div');tools.className='mp-tools';const lang=document.createElement('button');lang.textContent=state.language==='ru'?'EN':'RU';lang.onclick=()=>{state.language=state.language==='ru'?'en':'ru';save();refreshUI();};const clear=document.createElement('button');clear.textContent=tr('Выключить всё','Disable all');clear.onclick=()=>setPreset([]);tools.append(lang,clear);root.append(tools);
const settings=document.createElement('section');settings.className='mp-section';settings.append(inputRow(tr('Количество','Density'),'density'),inputRow(tr('Скорость','Speed'),'speed'),inputRow(tr('Прозрачность','Opacity'),'opacity'));
for(const [key,label] of [['floating',tr('Плавающая кнопка','Floating button')],['reduceMotion',tr('Уменьшить движение','Reduce motion')]]){const row=document.createElement('label');row.className='mp-check';const c=document.createElement('input');c.type='checkbox';c.checked=state[key];c.onchange=()=>{state[key]=c.checked;if(key==='floating')button.hidden=!c.checked;sync();};row.append(c,document.createTextNode(label));settings.append(row);}root.append(settings);
const presetTitle=document.createElement('h4');presetTitle.textContent=tr('Сцены','Scenes');root.append(presetTitle);const presets=document.createElement('div');presets.className='mp-presets';for(const [name,ids] of Object.entries(builtins)){const b=document.createElement('button');b.textContent=name;b.onclick=()=>setPreset(ids);presets.append(b);}for(const [name,ids] of Object.entries(state.presets)){const group=document.createElement('span');group.className='mp-preset-item';const b=document.createElement('button');b.textContent=name;b.onclick=()=>setPreset(ids);const rename=document.createElement('button');rename.textContent='✎';rename.title=tr('Переименовать','Rename');rename.onclick=()=>{const n=prompt(tr('Новое название','New name'),name)?.trim();if(!n||n.length>48||n===name||builtins[n]||state.presets[n])return;state.presets[n]=state.presets[name];delete state.presets[name];save();refreshUI();};const del=document.createElement('button');del.textContent='×';del.title=tr('Удалить','Delete');del.onclick=()=>{if(!confirm(tr('Удалить сцену «'+name+'»?','Delete scene '+name+'?')))return;delete state.presets[name];save();refreshUI();};group.append(b,rename,del);presets.append(group);}root.append(presets);
const savePreset=document.createElement('div');savePreset.className='mp-save';const name=document.createElement('input');name.placeholder=tr('Название сцены','Scene name');name.maxLength=48;const add=document.createElement('button');add.textContent='+';add.title=tr('Сохранить сцену','Save scene');add.onclick=()=>{const n=name.value.trim();if(!n||builtins[n])return alert(tr('Название занято','Name already used'));state.presets[n]=Object.keys(state.enabled).filter(k=>state.enabled[k]);save();refreshUI();};savePreset.append(name,add);root.append(savePreset);
const bridge=document.createElement('section');bridge.className='mp-section';const bh=document.createElement('h4');bh.textContent=tr('Mom Infoblock · синхронизация','Mom Infoblock · sync');bridge.append(bh);
const bridgeToggle=document.createElement('label');bridgeToggle.className='mp-check';const bc=document.createElement('input');bc.type='checkbox';bc.checked=state.infoblockSync;bc.onchange=()=>setBridgeEnabled(bc.checked);bridgeToggle.append(bc,document.createTextNode(tr('Автоматическая погода','Automatic weather')));bridge.append(bridgeToggle);
const timeToggle=document.createElement('label');timeToggle.className='mp-check';const tc=document.createElement('input');tc.type='checkbox';tc.checked=state.infoblockTime;tc.onchange=()=>{state.infoblockTime=tc.checked;if(lastScene)applyScene(lastScene);save();};timeToggle.append(tc,document.createTextNode(tr('Учитывать игровое время','Use in-game time')));bridge.append(timeToggle);
const envToggle=document.createElement('label');envToggle.className='mp-check';const ec=document.createElement('input');ec.type='checkbox';ec.checked=state.infoblockEnvironment;ec.onchange=()=>{state.infoblockEnvironment=ec.checked;if(lastScene)applyScene(lastScene);save();};envToggle.append(ec,document.createTextNode(tr('Учитывать окружение','Use scene environment')));bridge.append(envToggle);
const bs=document.createElement('small');bs.dataset.mpBridgeStatus='';bs.textContent=sceneStatus;bridge.append(bs);root.append(bridge);
const chat=document.createElement('section');chat.className='mp-section mp-chat';const chatTitle=document.createElement('h4');chatTitle.textContent=tr('Привязка к чату','Chat binding');chat.append(chatTitle);const mode=document.createElement('label');mode.className='mp-check';const cb=document.createElement('input');cb.type='checkbox';cb.checked=state.chatMode;cb.onchange=()=>{state.chatMode=cb.checked;save();};mode.append(cb,document.createTextNode(tr('Автоматически применять сцены чатов','Automatically apply chat scenes')));chat.append(mode);const status=document.createElement('small');const ck=chatKey();status.textContent=!ck?tr('Чат не открыт','No chat open'):state.chatBindings[ck]?tr('Для этого чата сохранена сцена','This chat has a saved scene'):tr('Для этого чата нет привязки','No binding for this chat');chat.append(status);const chatBtns=document.createElement('div');chatBtns.className='mp-tools';const bind=document.createElement('button');bind.textContent=tr('Сохранить для чата','Bind current scene');bind.onclick=persistChat;const unbind=document.createElement('button');unbind.textContent=tr('Отвязать','Unbind');unbind.onclick=unbindChat;chatBtns.append(bind,unbind);chat.append(chatBtns);root.append(chat);
const transfer=document.createElement('section');transfer.className='mp-section';const tt=document.createElement('h4');tt.textContent=tr('Импорт и экспорт JSON','JSON import & export');transfer.append(tt);const actions=document.createElement('div');actions.className='mp-tools';const exportBtn=document.createElement('button');exportBtn.textContent=tr('Экспортировать','Export');exportBtn.onclick=()=>downloadJSON({format:'mom-particles-v1',presets:state.presets,effects:state.customEffects},'mom-particles-scenes.json');const importBtn=document.createElement('button');importBtn.textContent=tr('Импортировать','Import');const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;importBtn.onclick=()=>file.click();file.onchange=async()=>{try{const f=file.files?.[0];if(!f)return;if(f.size>1024*1024)throw Error('File too large');const n=importData(JSON.parse(await f.text()));alert(tr('Импортировано: ','Imported: ')+n);}catch(e){alert(tr('Ошибка импорта: ','Import failed: ')+e.message);}finally{file.value='';}};actions.append(exportBtn,importBtn,file);transfer.append(actions);const hint=document.createElement('small');hint.textContent=tr('Только безопасные описания эффектов; JavaScript из JS-Slash-Runner не выполняется.','Only declarative effects; JS-Slash-Runner code is not executed.');transfer.append(hint);root.append(transfer);
const search=document.createElement('input');search.className='mp-search';search.placeholder=tr('Поиск эффектов…','Search effects…');root.append(search);const categoriesWrap=document.createElement('div');root.append(categoriesWrap);search.oninput=()=>{const q=search.value.toLocaleLowerCase();categoriesWrap.querySelectorAll('.mp-category').forEach(sec=>{let visible=0;sec.querySelectorAll('.mp-effect-row').forEach(row=>{const show=row.textContent.toLocaleLowerCase().includes(q);row.hidden=!show;if(show)visible++;});sec.hidden=!visible;if(q&&visible)sec.open=true;});};
for(const [cat,names] of Object.entries(categories)){const section=document.createElement('details');section.className='mp-category';section.open=cat==='weather';const summary=document.createElement('summary');summary.textContent=names[state.language==='ru'?0:1];section.append(summary);for(const e of allEffects().filter(e=>e.category===cat)){const label=document.createElement('label');label.className='mp-check mp-effect-row';const c=document.createElement('input');c.type='checkbox';c.dataset.mpToggle=e.id;c.checked=!!state.enabled[e.id];c.onchange=()=>toggle(e.id,c.checked);const name=document.createElement('span');name.textContent=(state.language==='ru'?e.ru:e.en);label.append(c,name);const autoBadge=document.createElement('span');autoBadge.className='mp-auto-badge';autoBadge.dataset.mpAuto=e.id;autoBadge.hidden=true;label.append(autoBadge);const density=document.createElement('input');density.type='range';density.min='10';density.max='200';density.step='10';density.value=state.effectDensity[e.id]??100;density.title=tr('Количество частиц эффекта','Effect particle density');density.className='mp-effect-density';density.oninput=()=>{state.effectDensity[e.id]=Number(density.value);if(state.enabled[e.id]||autoIds.has(e.id))rebuild();else save();};label.append(density);section.append(label);}categoriesWrap.append(section);}
renderControls();}
function refreshUI(){makeUI(settingsRoot);makeUI(panelBody);button.title=tr('Эффекты','Effects');}
function mount(){const host=document.querySelector('#extensions_settings')||document.querySelector('#extensions_settings2')||document.querySelector('#extensionsMenu')||document.body;const wrapper=document.createElement('div');wrapper.className='inline-drawer mp-drawer';wrapper.id='mp-drawer';const toggle=document.createElement('div');toggle.className='inline-drawer-toggle inline-drawer-header';toggle.innerHTML='<b>✦ Mom Effects</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>';const content=document.createElement('div');content.className='inline-drawer-content';content.style.display='none';
const container=document.createElement('div');container.id='mp-settings';container.className='mp-ui';content.append(container);wrapper.append(toggle,content);host.append(wrapper);settingsRoot=container;
button=document.createElement('button');button.id='mp-fab';button.type='button';button.textContent='✦';button.title='Mom Effects';button.hidden=!state.floating;button.setAttribute('aria-label','Mom Effects');document.body.append(button);
panel=document.createElement('div');panel.id='mp-panel';panel.className='mp-ui';panel.hidden=true;
const panelGrip=document.createElement('div');panelGrip.id='mp-panel-grip';
const gripTitle=document.createElement('strong');gripTitle.textContent='✦ Mom Effects';
const closePanel=document.createElement('button');closePanel.type='button';closePanel.textContent='×';closePanel.className='mp-close';closePanel.title=tr('Закрыть','Close');closePanel.onclick=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');};
panelGrip.append(gripTitle,closePanel);
panelBody=document.createElement('div');panelBody.id='mp-panel-body';panel.append(panelGrip,panelBody);document.body.append(panel);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const placePanel=(left,top)=>{const w=panel.offsetWidth||360,h=panel.offsetHeight||500;panel.style.left=clamp(left,8,Math.max(8,innerWidth-w-8))+'px';panel.style.top=clamp(top,8,Math.max(8,innerHeight-h-8))+'px';panel.style.right='auto';panel.style.bottom='auto';};
if(state.panelPosition?.left!=null){requestAnimationFrame(()=>placePanel(state.panelPosition.left,state.panelPosition.top));}
else {panel.style.left='auto';panel.style.top='auto';}
function draggable(target,grip,onEnd){
 let drag=null,suppress=false;
 grip.style.touchAction='none';
 grip.addEventListener('pointerdown',e=>{
  if(e.button!==0||(e.target!==grip && e.target.closest('button,input,select')))return;
  const r=target.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};
  grip.setPointerCapture(e.pointerId);
 });
 grip.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<4)return;
  drag.moved=true;target.style.left=clamp(drag.left+dx,8,Math.max(8,innerWidth-target.offsetWidth-8))+'px';
  target.style.top=clamp(drag.top+dy,8,Math.max(8,innerHeight-target.offsetHeight-8))+'px';target.style.right='auto';target.style.bottom='auto';
 });
 const finish=e=>{if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=null;try{grip.releasePointerCapture(e.pointerId);}catch{}if(moved){suppress=true;onEnd();setTimeout(()=>{suppress=false;},0);}};
 grip.addEventListener('pointerup',finish);grip.addEventListener('pointercancel',finish);
 return ()=>suppress;
}
const wasDragged=draggable(button,button,()=>{state.position={left:button.offsetLeft,top:button.offsetTop};save();});
button.addEventListener('click',e=>{
 if(wasDragged()){e.preventDefault();return;}
 const opening=panel.hidden;panel.hidden=!opening;button.setAttribute('aria-expanded',String(opening));
 if(opening&&!state.panelPosition){const r=button.getBoundingClientRect();placePanel(r.left-panel.offsetWidth+button.offsetWidth,r.top-panel.offsetHeight-10);}
});
draggable(panel,panelGrip,()=>{state.panelPosition={left:panel.offsetLeft,top:panel.offsetTop};save();});
if(state.position?.left!=null){button.style.left=state.position.left+'px';button.style.top=state.position.top+'px';button.style.right='auto';button.style.bottom='auto';}
window.addEventListener('resize',()=>{if(!panel.hidden&&panel.style.left)placePanel(panel.offsetLeft,panel.offsetTop);});
refreshUI();document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!button.contains(e.target))panel.hidden=true;});}
function init(){state=extension_settings[KEY]||{};state={...defaults,...state,enabled:{...defaults.enabled,...state.enabled},presets:{...state.presets},customEffects:Array.isArray(state.customEffects)?state.customEffects:[],effectDensity:{...state.effectDensity},chatBindings:{...state.chatBindings}};extension_settings[KEY]=state;mount();sync();document.addEventListener('visibilitychange',()=>layer?.classList.toggle('mp-paused',document.hidden));watcher=window.matchMedia('(prefers-reduced-motion: reduce)');watcher.addEventListener?.('change',sync);lastChatKey=chatKey();window.addEventListener('mom-infoblock:scene-update',e=>applyScene(e.detail));if(window.__momInfoblockScene)applyScene(window.__momInfoblockScene);setInterval(watchChat,1500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();