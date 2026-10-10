(()=>{'use strict';
const DATA=window.SYSTEM_DATA||{}, KEY='shadow-monarch-hunter-v1', START=DATA.start||'2026-10-12';
const titles={dashboard:'COMMAND CENTER',quests:'DAILY QUESTS',stats:'HUNTER ANALYTICS',training:'TRAINING ARC',achievements:'ACHIEVEMENTS',history:'HUNTER LOG',settings:'SETTINGS & BACKUP'};
const base={entries:{},bonuses:[],rank:'C',targets:{...(DATA.targets||{})}};
let state;try{state={...base,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{state={...base}};
state.entries=state.entries&&typeof state.entries==='object'?state.entries:{};
state.bonuses=Array.isArray(state.bonuses)?state.bonuses:[];
state.targets={...base.targets,...(state.targets||{})};
const now=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const initial=now()<START?START:now();let selected=initial,view='dashboard',activeDay='Monday';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Math.max(0,Number(v)||0), num=v=>Math.round(n(v)), format=v=>num(v).toLocaleString('en-US');
const day=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'long'});
const pretty=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const dateShift=(d,days)=>{let x=new Date(d+'T12:00:00');x.setDate(x.getDate()+days);return [x.getFullYear(),String(x.getMonth()+1).padStart(2,'0'),String(x.getDate()).padStart(2,'0')].join('-')};
const dayNumber=d=>{const [y,m,k]=d.split('-').map(Number);return Date.UTC(y,m-1,k)/86400000};
const currentWeek=d=>Math.floor((dayNumber(d)-dayNumber(START))/7)+13;
const get=d=>state.entries[d]||{};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({entries:state.entries,bonuses:state.bonuses,rank:state.rank,targets:state.targets}))}catch{notify('Storage unavailable; export a backup')}}; 
const notify=msg=>{const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('show'),3000)};
const flag=(e,key)=>!!e[key],count=(e,k)=>n(e[k]);
const xpFor=(e,d)=>{
 let v=0,lines=[];const add=(name,x)=>{if(x>0){v+=x;lines.push([name,x])}};
 const weekday=day(d);
 add('Anki',flag(e,'anki')?20:0);
 add('Planned lectures',count(e,'lecturesPlanned')>0&&count(e,'lecturesDone')>=count(e,'lecturesPlanned')?25:0);
 add('Extra practice',flag(e,'review')?15:0);
 add('Strength workout',flag(e,'gym')&&['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(weekday)?30:0);
 add('Run',flag(e,'run')?weekday==='Saturday'?35:['Tuesday','Thursday'].includes(weekday)?25:0:0);
 add('BJJ',flag(e,'bjj')&&weekday==='Sunday'?30:0);
 for(const [k,label] of [['pushups','Pushups'],['situps','Sit-ups'],['burpees','Burpees']]){let x=count(e,k);add(label,x>=100?10:x>=50?5:0)}
 const steps=count(e,'steps');add('Steps',steps>=10000?15:steps>=7000?8:steps>=5000?4:0);
 add('Mobility',flag(e,'mobility')?10:0);
 const cal=count(e,'calories');add('Nutrition plan',cal>=n(state.targets.calories)-100&&cal<=n(state.targets.calories)+150?15:0);
 add('Protein',count(e,'protein')>=n(state.targets.protein)?15:0);
 add('Sleep routine',flag(e,'sleep')?15:0);
 add('Daily planning',flag(e,'planning')?10:0);
 add('Strength PR',flag(e,'pr')?10:0);
 add('Weekly quiz passed',flag(e,'quiz')?50:0);
 add('Module exam passed',flag(e,'module')?150:0);
 add('Problem-solving exam passed',flag(e,'problem')?100:0);
 add('Anatomy Lab Practical 1 passed',d==='2026-11-09'&&flag(e,'anatomyPractical1')?100:0);
 add('Anatomy Lab Practical 2 passed',d==='2026-12-04'&&flag(e,'anatomyPractical2')?100:0);
 add('Recovery override',flag(e,'recovery')?15:0);
 return {xp:v,lines};
};
const dailyRecords=()=>Object.entries(state.entries).filter(([d])=>d>=START).map(([d,e])=>({date:d,xp:xpFor(e,d).xp,e})).sort((a,b)=>b.date.localeCompare(a.date));
const total=()=>dailyRecords().reduce((a,b)=>a+b.xp,0)+state.bonuses.reduce((a,b)=>a+n(b.xp),0);
const lvFor=tot=>{let level=1,remaining=tot,need=1000;while(remaining>=need&&level<10000){remaining-=need;level++;need+=100}return {level,remaining,need}};
const stat=(name,value,detail,cls='')=>'<article class="card"><div class="stat-label">'+escape(name)+'</div><div class="stat-value '+cls+'">'+escape(value)+'</div><div class="stat-detail">'+escape(detail)+'</div></article>';
const bar=(a,b)=>'<div class="bar"><div style="width:'+Math.min(100,100*a/(b||1)).toFixed(2)+'%"></div></div>';
const button=(text,action,other='')=>'<button class="button '+other+'" data-action="'+action+'">'+escape(text)+'</button>';
const sum=(key)=>dailyRecords().filter(({e})=>!!e[key]).length;
const statsContext=()=>({entries:state.entries,bonuses:state.bonuses,start:START,selected,xpFor});

const allQuestDays=()=>dailyRecords().filter(x=>x.xp>0).length;
const countFlag=k=>dailyRecords().filter(x=>flag(x.e,k)).length;
const totalKm=()=>dailyRecords().reduce((v,x)=>v+count(x.e,'runKm'),0);
const bestConsecutive=k=>{
 const dates=dailyRecords().filter(x=>flag(x.e,k)).map(x=>x.date).sort();
 let best=0,run=0,prev='';
 for(const d of dates){run=prev&&dateShift(prev,1)===d?run+1:1;best=Math.max(best,run);prev=d}
 return best;
};
const fourGymWeeks=()=>{
 const weeks=new Map();
 dailyRecords().forEach(x=>{
  if(!flag(x.e,'gym'))return;
  const w=Math.floor((dayNumber(x.date)-dayNumber(START))/7);
  weeks.set(w,(weeks.get(w)||0)+1);
 });
 return [...weeks.keys()].some(w=>[0,1,2,3].every(i=>(weeks.get(w+i)||0)>=4));
};
const achieved=kind=>{
 switch(kind){
  case 'historical':return true;
  case 'saitama':return dailyRecords().some(x=>['pushups','situps','burpees'].every(k=>count(x.e,k)>=100));
  case 'distance':return state.bonuses.some(x=>x.id==='first15k');
  case 'gym':return fourGymWeeks();
  case 'anki':return bestConsecutive('anki')>=7;
  case 'recovery':return countFlag('recovery')>=7;
  case 'study30':return countFlag('anki')>=30;
  case 'study100':return countFlag('anki')>=100;
  case 'quiz10':return countFlag('quiz')>=10;
  case 'module3':return countFlag('module')>=3;
  case 'gym25':return countFlag('gym')>=25;
  case 'gym100':return countFlag('gym')>=100;
  case 'runner10':return countFlag('run')>=10;
  case 'runner50':return countFlag('run')>=50;
  case 'run100km':return totalKm()>=100;
  case 'run500km':return totalKm()>=500;
  case 'steps10':return dailyRecords().filter(x=>count(x.e,'steps')>=10000).length>=10;
  case 'mobility30':return countFlag('mobility')>=30;
  case 'mobility100':return countFlag('mobility')>=100;
  case 'bjj10':return countFlag('bjj')>=10;
  case 'quests30':return allQuestDays()>=30;
  case 'quests100':return allQuestDays()>=100;
  case 'quests365':return allQuestDays()>=365;
  default:return false;
 }
};

const KM_TO_MI=0.6213711922;
const miles=km=>n(km)*KM_TO_MI;
const kmText=km=>n(km).toFixed(2)+' km / '+miles(km).toFixed(2)+' mi';
const distanceText=text=>String(text??'').replace(/(\d+(?:\.\d+)?)(?:\s*([–-])\s*(\d+(?:\.\d+)?))?\s*(?:km|K)\b/g,(whole,one,dash,two)=>{
 const fmt=x=>Number(x).toFixed(2);
 return whole+' ('+fmt(Number(one)*KM_TO_MI)+(two?'–'+fmt(Number(two)*KM_TO_MI):'')+' mi)';
});
const plannedRun=date=>{
 const weekday=day(date),slot={Tuesday:2,Thursday:3,Saturday:4}[weekday];
 if(slot===undefined)return null;
 const week=currentWeek(date);
 const row=(DATA.running||[]).find(x=>Number(x[0])===week);
 if(row)return{title:'Road to 15K · Week '+week,description:distanceText(row[slot]),notes:row[5]||''};
 const cycles=DATA.ongoingRunning||[];
 const cycle=cycles.length?cycles[((week-24)%cycles.length+cycles.length)%cycles.length]:null;
 return cycle?{title:'Endless Ascent · '+cycle[0],description:distanceText(cycle[slot-1]),notes:cycle[4]||''}:{title:'Scheduled '+weekday+' run',description:'Easy running',notes:''};
};
let showExamBosses=false;
const examBosses=(DATA.academicBosses||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
const examStatus=(boss)=>flag(get(boss.date),boss.key)?'DEFEATED':boss.date<now()?'DATE PASSED':boss.date===now()?'TODAY':'UPCOMING';
const examCountdown=(date)=>Math.round(dayNumber(date)-dayNumber(now()));
const upcomingBossBoard=()=>{
 if(!examBosses.length)return '';
 const future=examBosses.filter(x=>x.date>=now()||flag(get(x.date),x.key));
 return '<section class="card"><div class="today-top"><div><span class="kicker">📆 ACADEMIC ARC · FALL 2026</span><h2>Scheduled Boss Battles</h2></div><span class="tag">4 EXAMS</span></div>'+
 '<p class="hint" style="margin:7px 0 14px">Choose a date to open its daily quest board. Boss XP is earned only when you mark the exam as passed.</p>'+
 '<div class="boss-event-list">'+examBosses.map(boss=>{
  const status=examStatus(boss),days=examCountdown(boss.date);
  const timing=status==='DEFEATED'?'✓ Passed':days===0?'Today':days>0?'In '+days+' day'+(days===1?'':'s'):'Date passed';
  return '<button class="boss-event" data-go-date="'+escape(boss.date)+'" aria-label="Open '+escape(boss.title)+' daily quests"><span class="boss-event-main"><strong>'+escape(boss.title)+'</strong><small>'+escape(pretty(boss.date))+' · '+escape(boss.kind)+'</small></span><span class="boss-event-side"><span class="tag '+(status==='DEFEATED'?'greentag':'goldtag')+'">'+escape(timing)+'</span><small>+'+boss.xp+' XP</small></span></button>';
 }).join('')+'</div></section>';
};
const questsHtml=()=>{
 const e=get(selected),weekday=day(selected),schedule=(DATA.schedule||{})[weekday]||'';
 const gymScheduled=Object.prototype.hasOwnProperty.call(DATA.gym||{},weekday);
 const runPlan=plannedRun(selected),bjjScheduled=weekday==='Sunday',quizScheduled=weekday==='Friday';
 const liftItems=(e.liftItems&&typeof e.liftItems==='object')?e.liftItems:{};
 const check=(label,k,xp,desc='')=>'<div class="quest '+(flag(e,k)?'done':'')+'"><label><input type="checkbox" data-field="'+k+'" '+(flag(e,k)?'checked':'')+'><span><strong>'+escape(label)+'</strong><small>'+escape(desc)+'</small></span></label><span class="xp-pill">+'+xp+' XP</span></div>';
 const field=(label,k,placeholder='',step=1)=>'<label class="field"><span>'+escape(label)+'</span><input type="number" min="0" step="'+step+'" data-field="'+k+'" placeholder="'+escape(placeholder)+'" value="'+(e[k]??'')+'"></label>';
 const kmValue=e.runKm??'';
 const milesValue=kmValue===''?'':Math.round(miles(kmValue)*100)/100;
 const runMilesField='<label class="field"><span>Run distance (mi)</span><input type="number" min="0" step="0.01" data-field="runMi" placeholder="Miles" value="'+milesValue+'"></label>';
 const workout=((DATA.gym||{})[weekday]||[]).filter(([exercise])=>!(/\brun$/i).test(exercise));
 const checkedLift=workout.filter((_,i)=>!!liftItems[i]).length;
 const gymCard=gymScheduled?
 '<section class="card"><div class="today-top"><div><span class="kicker">⚔️ Today’s strength workout</span><h2>'+escape(weekday+' · '+schedule.replace(/\s*(?:\+|·)\s*Run$/,''))+'</h2></div><span class="tag">'+checkedLift+' / '+workout.length+' checked</span></div><p class="hint" style="margin:8px 0 13px">Check each exercise as you go. The full workout checkbox awards the +30 XP.</p>'+
 check('Complete '+weekday+' workout','gym',30,'Finished the planned strength session')+
 '<div class="workout-checklist">'+workout.map(([exercise,reps],i)=>'<label class="workout-step '+(liftItems[i]?'completed':'')+'"><input type="checkbox" data-lift-item="'+i+'" '+(liftItems[i]?'checked':'')+'><span>'+escape(exercise)+'</span><small>'+escape(reps)+'</small></label>').join('')+'</div></section>':'';
 const runningCard=runPlan?
 '<section class="card"><div class="today-top"><div><span class="kicker">🏃 Today’s run · '+escape(runPlan.title)+'</span><h2>'+escape(runPlan.description)+'</h2></div><span class="tag">'+(weekday==='Saturday'?'+35':'+25')+' XP</span></div><p class="hint" style="margin:8px 0 13px">'+escape(runPlan.notes)+' · Warm up and cool down. Adjust for recovery as needed.</p>'+
 check('Complete '+weekday+' run','run',weekday==='Saturday'?35:25,runPlan.description)+
 '<div class="fields" style="margin-top:13px">'+field('Distance (km)','runKm','Kilometers',.01)+runMilesField+field('Run time (minutes)','runMinutes','Minutes')+'</div><p class="hint">Enter either kilometers or miles; the other unit converts automatically. Both refer to the same run.</p></section>':'';
 const recoveryCard=bjjScheduled?
 '<section class="card"><h2>🥋 Sunday BJJ</h2><div class="quest-list">'+check('Complete BJJ session','bjj',30,'Grappling practice · technique and recovery first')+'</div><div class="fields" style="margin-top:13px">'+field('BJJ duration (min)','bjjMinutes','Optional')+'</div></section>':'';
 const todaysBosses=examBosses.filter(b=>b.date===selected);
 const isUnscheduled=flag(e,'module')&&!todaysBosses.some(b=>b.key==='module')||flag(e,'problem')&&!todaysBosses.some(b=>b.key==='problem');
 const examVisible=showExamBosses||isUnscheduled;
 const examBoss='<div style="margin-top:12px"><button type="button" class="button small outline" data-action="exam-boss">'+(examVisible?'Hide unscheduled exam logging':'Log a rescheduled or makeup exam')+'</button></div>'+
 (examVisible?'<div class="quest-list" style="margin-top:12px">'+
 (!todaysBosses.some(b=>b.key==='module')?check('Passed a rescheduled module exam','module',150,'Use only for an actual makeup or rescheduled exam'):'')+
 (!todaysBosses.some(b=>b.key==='problem')?check('Passed a rescheduled problem-solving exam','problem',100,'Use only for an actual makeup or rescheduled exam'):'')+
 '</div>':'');
 const todayBossCard=todaysBosses.length?
 '<section class="card boss-card"><div class="today-top"><div><span class="kicker">⚔️ SCHEDULED ACADEMIC BOSS</span><h2>'+escape(todaysBosses.map(b=>b.title).join(' · '))+'</h2></div><span class="tag goldtag">'+escape(pretty(selected))+'</span></div>'+
 '<p class="hint" style="margin:10px 0 13px">Scheduled for this date. Check off after you know you passed; completing other daily quests remains optional.</p>'+
 '<div class="quest-list">'+todaysBosses.map(b=>check('Pass '+b.title,b.key,b.xp,'Academic boss battle · '+b.kind)).join('')+'</div></section>':'';

 const earned=xpFor(e,selected);
 return '<div class="stack">'+(window.HUNTER_STATS?window.HUNTER_STATS.daily(e):'')+
 '<section class="card"><div class="today-top"><div><span class="kicker">Daily Gate / Week '+currentWeek(selected)+'</span><h2>'+escape(pretty(selected))+' · '+weekday+'</h2><p class="muted">'+escape(schedule)+'</p></div><div class="date-nav">'+button('← Previous','prev','small outline')+'<input class="input" aria-label="Quest date" id="quest-date" type="date" min="'+START+'" value="'+selected+'">'+button('Next →','next','small outline')+'</div></div><div class="divider"></div><div class="grid two">'+stat('XP earned today',earned.xp+' XP',earned.lines.length+' quest awards','gold')+stat('OPM Challenge reps',format(count(e,'pushups')+count(e,'situps')+count(e,'burpees'))+'/300','Full protocol only when recovery allows','purple')+'</div></section>'+
 '<section class="card"><h2>🧠 Academic missions</h2><div class="quest-list">'+check('Daily Anki','anki',20,'Complete due reviews')+check('Extra review / practice','review',15,'Additional material beyond due Anki')+
 (quizScheduled?check('Pass Friday quiz','quiz',50,'Only appears on Friday'):'')+
 '</div><div class="divider"></div><div class="fields three">'+field('Study hours','studyHours','Total today',.25)+field('Anki cards completed','ankiCards','Total today')+field('Practice questions','practiceQuestions','Optional')+'</div><div class="divider"></div><div class="fields">'+field('Lectures planned','lecturesPlanned')+field('Lectures completed','lecturesDone')+'</div><p class="hint" style="margin-top:8px">+25 XP when your nonzero planned lecture target is completed.</p>'+examBoss+'</section>'+
 todayBossCard+
 (gymCard||runningCard||recoveryCard?
 '<div class="quest-day-specific">'+gymCard+runningCard+recoveryCard+'</div>':
 '<div class="note"><strong>Recovery-focused day.</strong> No gym, run, or BJJ is scheduled. Your daily quests and recovery still count.</div>')+
 '<section class="card"><h2>⚔️ Daily training & movement</h2><div class="quest-list">'+check('Mobility','mobility',10,'10–15 min')+(gymScheduled?check('New strength PR','pr',10,'Only if you set a PR during today’s lift'):'')+'</div><div class="fields" style="margin-top:12px">'+(gymScheduled?field('Gym time (minutes)','gymMinutes','Optional'):'')+field('Mobility time (minutes)','mobilityMinutes','Optional')+'</div></section>'+
 '<div class="grid two"><section class="card"><h2>🥊 OPM Challenge</h2><p class="hint">100 pushups · 100 sit-ups · 100 burpees. Count sets across the day. Modify or rest when needed.</p><div class="fields three" style="margin-top:14px">'+field('Pushups','pushups','0–100+')+field('Sit-ups','situps','0–100+')+field('Burpees','burpees','0–100+')+'</div><div class="divider"></div>'+field('Steps','steps','10,000 goal')+'</section>'+
 '<section class="card"><h2>🌙 Nutrition & Recovery</h2><p class="hint">Provisional target '+format(state.targets.calories)+' kcal · '+format(state.targets.protein)+'g protein. No bonus for under-eating.</p><div class="fields three" style="margin-top:14px">'+field('Calories','calories','',1)+field('Protein (g)','protein','',1)+field('Carbs (g)','carbs','',1)+field('Fat (g)','fat','',1)+'</div><div class="divider"></div><div class="fields">'+field('Hours slept','sleepHours','Optional',.25)+'</div><div class="divider"></div><div class="quest-list">'+check('Sleep plan followed','sleep',15)+check('Daily planning','planning',10)+check('Recovery override','recovery',15,'Modify training or rest responsibly')+'</div></section></div>'+
 '<section class="card"><h2>Daily notes</h2><label class="field"><span>How did today go?</span><textarea data-field="notes" rows="3" placeholder="Progress, energy, recovery, coursework…">'+escape(e.notes||'')+'</textarea></label><p class="hint" style="margin-top:10px">Changes are saved in this browser automatically after you finish editing a field.</p></section></div>';
};
const dashboard=()=>{const t=total(),l=lvFor(t),e=get(selected),recent=dailyRecords().slice(0,6);
 const postGate=achieved('distance')||now()>'2026-12-26';
 const phase=now()<START?'PREPARATION PHASE':postGate?'THE ENDLESS HUNTER ASCENT':'THE 15K ENDURANCE GATE';
 const bossLabel=postGate?'∞':'15K / 9.32 mi';
 const thisYear=String(new Date().getFullYear());
 const seasonXP=dailyRecords().filter(x=>x.date.startsWith(thisYear)).reduce((a,b)=>a+b.xp,0);
 return '<div class="stack"><section class="hero"><div class="meta">✦ HUNTER STATUS · ' +phase+'</div><h2>'+escape(state.rank)+'-RANK HUNTER</h2><p class="subtitle">Level '+l.level+' · The road to S-Rank starts with consistency.</p><div class="hero-stats"><div class="hero-stat"><strong>'+format(t)+' XP</strong><small>TOTAL EXPERIENCE</small></div><div class="hero-stat"><strong>'+format(l.remaining)+' / '+format(l.need)+'</strong><small>LEVEL PROGRESS</small></div><div class="hero-stat"><strong>'+bossLabel+'</strong><small>'+(postGate?'NO END DATE':'ENDURANCE BOSS')+'</small></div></div>'+bar(l.remaining,l.need)+'<span class="tag">✨ Shadow Monarch Edition</span></section>'+
 '<div class="grid four">'+stat('Level',l.level,'Next level in '+format(l.need-l.remaining)+' XP')+stat('Quests logged',dailyRecords().filter(a=>a.xp>0).length,'Days with earned XP','purple')+stat('Gym sessions',sum('gym'),'Mon–Fri strength','green')+stat('Runs logged',sum('run'),'Tue · Thu · Sat','gold')+'</div>'+
 '<div class="note"><strong>Season '+thisYear+':</strong> '+format(seasonXP)+' XP this calendar year · Your lifetime XP and all achievements carry forward forever.</div>'+
 upcomingBossBoard()+
 '<div class="grid two"><section class="card"><div class="today-top"><h2>Today’s Quest Board</h2>'+button('Open Quest Log ↗','quests','small')+'</div><div class="divider"></div><div class="metric"><span>Current date</span><strong>'+escape(pretty(selected))+'</strong></div><div class="metric"><span>Training</span><strong>'+escape(DATA.schedule?.[day(selected)]||'')+'</strong></div><div class="metric"><span>Earned XP</span><strong class="good">'+xpFor(e,selected).xp+'</strong></div><p class="hint" style="margin-top:12px">Daily quests and XP are reported by you, not automatically synced with Apple Health or Google Calendar.</p></section>'+
 '<section class="card"><h2>'+(postGate?'The Endless Ascent':'Road to 15K')+'</h2><p class="hint">'+(postGate?'Repeatable training seasons · More boss fights ahead':'11-week running arc · Starts Oct 12, 2026 · Target Dec 26')+'</p><div class="divider"></div><div class="metric"><span>Tuesday</span><strong>Quality / Tempo</strong></div><div class="metric"><span>Thursday</span><strong>Easy aerobic</strong></div><div class="metric"><span>Saturday</span><strong>Long run</strong></div><p class="hint" style="margin-top:11px">Training continues into future years. Repeat easy/build/recovery cycles and choose a new race target when ready.</p>'+button('See running plan','training','small outline')+'</section></div>'+
 (window.HUNTER_STATS?window.HUNTER_STATS.dashboard(statsContext()):'')+'<section class="card"><h2>Recent Hunter Reports</h2>'+(recent.length?'<div class="scroll"><table class="data-table"><thead><tr><th>Date</th><th>Focus</th><th>XP</th></tr></thead><tbody>'+recent.map(x=>'<tr><td>'+escape(pretty(x.date))+'</td><td>'+escape(DATA.schedule?.[day(x.date)]||'')+'</td><td><span class="xp-pill">+'+x.xp+'</span></td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No official XP logged yet. Start with your first quest board!</div>')+'</section></div>';
};
const training=()=>{const g=DATA.gym||{},r=DATA.running||[];return '<div class="stack"><div class="note"><strong>ROAD TO 15K:</strong> Runs Tuesday (quality), Thursday (easy) and Saturday (long). Recovery weeks are built in. Reduce Friday leg volume before long runs if needed.</div><section class="card"><h2>11-Week Running Plan</h2><div class="scroll"><table class="data-table"><thead><tr><th>Med Week</th><th>Starts</th><th>Tuesday</th><th>Thursday</th><th>Saturday</th><th>Notes</th></tr></thead><tbody>'+r.map(x=>'<tr class="week-row '+(/recovery/i.test(x[5]||'')?'recovery':'')+'"><td class="week-label">'+x[0]+'</td><td>'+escape(x[1])+'</td><td>'+escape(distanceText(x[2]))+'</td><td>'+escape(distanceText(x[3]))+'</td><td><strong>'+escape(distanceText(x[4]))+'</strong></td><td>'+escape(x[5]||'')+'</td></tr>').join('')+'</tbody></table></div><p class="hint">Intervals include warm-up, jog recoveries and cooldown. Keep easy runs conversational. 15K goal is flexible.</p></section><section class="card"><div class="today-top"><h2>♾ Season Two & Beyond — Repeatable Running Cycle</h2><span class="tag">NO END DATE</span></div><p class="hint" style="margin:9px 0 13px">After the first 15K arc, repeat this flexible four-week cycle or replace it with future race-specific blocks. The 15K finish date is a milestone, not a reset.</p><div class="scroll"><table class="data-table"><thead><tr><th>Cycle</th><th>Tuesday quality</th><th>Thursday easy</th><th>Saturday long</th><th>Focus</th></tr></thead><tbody>'+(DATA.ongoingRunning||[]).map(x=>'<tr><td class="week-label">'+escape(x[0])+'</td><td>'+escape(distanceText(x[1]))+'</td><td>'+escape(distanceText(x[2]))+'</td><td>'+escape(distanceText(x[3]))+'</td><td>'+escape(x[4])+'</td></tr>').join('')+'</tbody></table></div><p class="hint" style="margin-top:12px">Distances are suggestions, not requirements. Repeat recovery weeks, shorten runs during exam periods, and work toward any new distance you choose.</p></section><section class="card"><h2>Gym Program</h2><div class="day-tabs">'+Object.keys(g).map(d=>'<button data-day="'+d+'" class="'+(activeDay===d?'active':'')+'">'+d+'</button>').join('')+'</div><h3>'+escape(activeDay)+' · '+escape(DATA.schedule?.[activeDay]||'')+'</h3><div class="divider"></div><div class="small-list">'+(g[activeDay]||[]).map(([exercise,sets])=>'<div class="small-item"><span>'+escape(exercise)+'</span><span class="muted">'+escape(sets)+'</span></div>').join('')+'</div><p class="hint" style="margin-top:15px">Warm up and stretch appropriately; training can be modified for fatigue, exams or injury.</p></section></div>'};
const achievements=()=>{
 const a=DATA.achievements||[], unlocked=a.filter(x=>achieved(x[3])).length;
 return '<div class="stack"><section class="card"><div class="today-top"><div><span class="kicker">LIFETIME ACHIEVEMENTS · ALL SEASONS</span><h2>'+unlocked+' / '+a.length+' badges unlocked</h2></div><span class="tag goldtag">♾ THE ENDLESS ASCENT</span></div>'+bar(unlocked,a.length)+'<p class="hint">Achievements are earned from your existing quest logs, including in future years. Historical awards stay unlocked. New badges do not add XP, so nothing gets double-counted.</p></section><div class="badge-list">'+a.map(([name,description,emoji,kind])=>{
  const yes=achieved(kind);
  return '<article class="achievement '+(yes?'unlocked':'')+'"><div class="medal">'+escape(emoji)+'</div><h3>'+escape(name)+'</h3><p>'+escape(distanceText(description))+'</p><span class="tag '+(yes?'goldtag':'')+'">'+(yes?'✦ UNLOCKED':'LOCKED')+'</span></article>'
 }).join('')+'</div><section class="card"><h2>15K Boss Battle · Chapter One</h2><p class="muted">The first 15K earns +200 XP once. After this milestone, the System continues into the Endless Ascent; your XP, badges and quest history never reset.</p><div class="actions" style="margin-top:12px">'+button(state.bonuses.some(b=>b.id==='first15k')?'15K Boss Defeated ✓':'Claim first 15K (+200 XP)','claim15k','small '+(state.bonuses.some(b=>b.id==='first15k')?'outline':''))+'</div></section></div>';
};
const history=()=>{const entries=dailyRecords().filter(x=>x.xp>0);return '<div class="stack"><div class="grid three">'+stat('Lifetime XP',format(total()),'All quest and boss awards')+stat('Logged Quest Days',entries.length,'Days with XP','purple')+stat('Boss Bonus XP',state.bonuses.reduce((a,b)=>a+n(b.xp),0),'One-time victories','gold')+'</div><section class="card"><h2>Daily XP History</h2>'+(entries.length?'<div class="scroll"><table class="data-table"><thead><tr><th>Date</th><th>XP</th><th>Notes</th><th></th></tr></thead><tbody>'+entries.map(x=>'<tr><td>'+escape(pretty(x.date))+'</td><td><span class="xp-pill">+'+x.xp+'</span></td><td>'+escape(x.e.notes||'')+'</td><td><button class="button small outline" data-go-date="'+x.date+'">View</button></td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No completed quests recorded yet.</div>')+'</section></div>'};
const settings=()=>'<div class="stack"><div class="note"><strong>Privacy:</strong> Your quest data is kept in this browser only. GitHub Pages hosts the code, not your personal data. Other browsers/devices do not automatically share progress. Export backups regularly.</div><section class="card"><h2>Hunter Settings</h2><div class="fields three">'+[['Calories','calories'],['Protein (g)','protein'],['Carbohydrates (g)','carbs'],['Fat (g)','fat'],['Steps','steps']].map(([label,k])=>'<label class="field"><span>'+label+'</span><input type="number" min="0" data-target="'+k+'" value="'+escape(state.targets[k])+'"></label>').join('')+'<label class="field"><span>Current rank (promotion by review)</span><select id="rank-select">'+['C','B','A','S'].map(k=>'<option '+(k===state.rank?'selected':'')+'>'+k+'</option>').join('')+'</select></label></div><p class="hint" style="margin-top:12px">Nutrition targets are provisional. If your energy, training or recovery suffer, adjust fueling; never chase XP by undereating.</p></section><section class="card"><h2>Backup & Restore</h2><p class="muted">Save a JSON backup to move data between devices or protect your XP history.</p><div class="actions" style="margin-top:15px">'+button('Download backup','export','small')+button('Import backup','import','small outline')+button('Erase local progress','clear','small danger')+'</div><p class="hint" style="margin-top:12px">Importing replaces your current local progress; export a backup first.</p></section><section class="card"><h2>📲 Move Hunter Progress Between Devices</h2><div class="small-list"><div class="small-item"><span><strong>1. Export</strong><small>On the device with your latest progress, choose Download backup above.</small></span></div><div class="small-item"><span><strong>2. Transfer</strong><small>Send the JSON backup privately via AirDrop, iCloud Drive, Google Drive, or email to yourself.</small></span></div><div class="small-item"><span><strong>3. Restore</strong><small>Open this same website on your other device and choose Import backup.</small></span></div><div class="small-item"><span><strong>4. Keep the latest copy</strong><small>Before switching devices again, export from whichever device you used last.</small></span></div></div><p class="hint" style="margin-top:12px">This is a manual transfer, not live synchronization. Import overwrites local progress; it does not merge changes. Automatic cloud syncing would need a separate private database and sign-in.</p></section></div>';
const render=()=>{document.getElementById('top-title').textContent=titles[view]||titles.dashboard;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.getElementById('app').innerHTML=({dashboard,quests:questsHtml,stats:()=>window.HUNTER_STATS?window.HUNTER_STATS.render(statsContext()):'<div class="empty">Analytics is loading.</div>',training,achievements,history,settings}[view]||dashboard)()};
const setView=v=>{if(!titles[v])return;view=v;render();window.scrollTo({top:0,behavior:'smooth'})};
document.addEventListener('click',e=>{
 const v=e.target.closest('[data-view]');if(v){setView(v.dataset.view);return}
 const statBtn=e.target.closest('[data-stats-action]');if(statBtn&&window.HUNTER_STATS){const redraw=window.HUNTER_STATS.change(statBtn.dataset.statsAction,statBtn.dataset.statsValue,statsContext());if(redraw)render();return}
 const d=e.target.closest('[data-day]');if(d){activeDay=d.dataset.day;render();return}
 const jump=e.target.closest('[data-go-date]');if(jump){selected=jump.dataset.goDate;showExamBosses=false;setView('quests');return}
 const b=e.target.closest('[data-action]');if(!b)return;
 switch(b.dataset.action){
 case 'exam-boss':showExamBosses=!showExamBosses;render();break;
 case 'quests':case 'training':setView(b.dataset.action);break;
 case 'prev':selected=dateShift(selected,-1);if(selected<START)selected=START;showExamBosses=false;render();break;
 case 'next':selected=dateShift(selected,1);showExamBosses=false;render();break;
 case 'claim15k':
 if(state.bonuses.some(x=>x.id==='first15k'))return;
 if(confirm('Did you complete your FIRST 15K run? This awards +200 XP exactly once.')){state.bonuses.push({id:'first15k',date:selected,xp:200,title:'Distance Breaker'});save();render();notify('+200 XP · DISTANCE BREAKER UNLOCKED!')}break;
 case 'export':{
 const blob=new Blob([JSON.stringify({version:1,entries:state.entries,bonuses:state.bonuses,rank:state.rank,targets:state.targets},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='shadow-monarch-backup-'+now()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Backup downloaded');break}
 case 'import':document.getElementById('import-file').click();break;
 case 'clear':if(confirm('Permanently erase progress saved in this browser? Export a backup first.')){state={...base,entries:{},bonuses:[],rank:'C',targets:{...base.targets}};save();render();notify('Browser progress reset')}break;
 }
});
document.addEventListener('change',e=>{
 if(e.target.id==='stats-metric'&&window.HUNTER_STATS){window.HUNTER_STATS.change('metric',e.target.value,statsContext());render();return}
 if(e.target.id==='stats-focus'&&window.HUNTER_STATS){window.HUNTER_STATS.change('focus',e.target.value,statsContext());render();return}
 if(e.target.id==='quest-date'){if(e.target.value&&e.target.value>=START){selected=e.target.value;showExamBosses=false;render()}return}
 if(e.target.id==='rank-select'){state.rank=e.target.value;save();render();return}
 const key=e.target.dataset.target;if(key){state.targets[key]=n(e.target.value);save();render();return}
 const lift=e.target.dataset.liftItem;
 if(lift!==undefined){const entry={...get(selected)},items={...(entry.liftItems||{})};items[lift]=e.target.checked;entry.liftItems=items;state.entries[selected]=entry;save();render();return}
 const k=e.target.dataset.field;
 if(k){
  const entry={...get(selected)};
  if(k==='runMi'){entry.runKm=e.target.value===''?'':Math.round(n(e.target.value)/KM_TO_MI*1000)/1000}
  else entry[k]=e.target.type==='checkbox'?e.target.checked:e.target.type==='number'?(e.target.value===''?'':n(e.target.value)):e.target.value;
  state.entries[selected]=entry;save();render();
 }
});
document.getElementById('today-btn').addEventListener('click',()=>{selected=initial;setView('quests')});
document.getElementById('import-file').addEventListener('change',async e=>{
 const f=e.target.files?.[0];if(!f)return;try{let obj=JSON.parse(await f.text());if(!obj.entries||typeof obj.entries!=='object'||!Array.isArray(obj.bonuses||[]))throw Error('Invalid backup');if(!confirm('Replace this browser’s progress with the imported backup?'))return;state={...base,...obj,targets:{...base.targets,...obj.targets}};save();render();notify('Hunter backup restored!')}catch(err){alert('Could not load backup: '+err.message)}finally{e.target.value=''}
});
render();
})();