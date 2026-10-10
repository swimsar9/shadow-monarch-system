/* Hunter Analytics. Stored only in your browser; no data leaves your device. */
window.HUNTER_STATS=(()=>{
'use strict';
let scope='week',metric='runKm',focus='';
const categories={
 'Study':[['studyHours','Study hours','h'],['ankiCards','Anki cards',''],['practiceQuestions','Practice questions',''],['lecturesDone','Lectures completed','']],
 'Running & Training':[['runKm','Running distance (km + mi)','km'],['runMi','Running distance (miles)','mi'],['runMinutes','Running time','min'],['gymMinutes','Gym time','min'],['bjjMinutes','BJJ time','min'],['mobilityMinutes','Mobility time','min'],['gym','Gym days',''],['run','Run days',''],['bjj','BJJ days',''],['mobility','Mobility days','']],
 'OPM Challenge & Steps':[['pushups','Pushups','reps'],['situps','Sit-ups','reps'],['burpees','Burpees','reps'],['steps','Steps','steps']],
 'Recovery & Nutrition':[['sleepHours','Sleep hours','h'],['calories','Calories','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fat','Fat','g'],['sleep','Sleep-plan days',''],['recovery','Recovery days','']],
 'XP & Missions':[['xp','XP','XP'],['anki','Anki days',''],['quiz','Quizzes passed',''],['module','Module exams',''],['problem','Problem-solving exams',''],['anatomyPractical1','Anatomy Practical 1 passed',''],['anatomyPractical2','Anatomy Practical 2 passed',''],['review','Extra practice days',''],['planning','Planning days',''],['pr','Personal records','']]
};
const metrics=Object.values(categories).flat(), info=Object.fromEntries(metrics.map(m=>[m[0],m]));
const boolKeys=new Set(['gym','run','bjj','mobility','sleep','recovery','anki','quiz','module','problem','review','planning','pr','anatomyPractical1','anatomyPractical2']);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>{const y=Number(x);return Number.isFinite(y)&&y>0?y:0};
const KM_TO_MI=0.6213711922;
const fmt=(v,p=0)=>Number(v||0).toLocaleString('en-US',{minimumFractionDigits:p,maximumFractionDigits:p});
const formDate=s=>new Date(s+'T00:00:00Z');
const dateStr=d=>[d.getUTCFullYear(),String(d.getUTCMonth()+1).padStart(2,'0'),String(d.getUTCDate()).padStart(2,'0')].join('-');
const plus=(d,days)=>{let x=formDate(d);x.setUTCDate(x.getUTCDate()+days);return dateStr(x)};
const nice=(d,short=false)=>formDate(d).toLocaleDateString('en-US',{timeZone:'UTC',year:short?undefined:'numeric',month:'short',day:'numeric'});
const mon=d=>plus(d,-((formDate(d).getUTCDay()+6)%7));
const val=(e,key,date,xpFor)=>key==='xp'?num(xpFor(e,date).xp):key==='runMi'?num(e.runKm)*KM_TO_MI:boolKeys.has(key)?(e[key]===true?1:0):num(e[key]);
const disp=(v,key)=>key==='runKm'?fmt(v,2)+' km / '+fmt(v*KM_TO_MI,2)+' mi':fmt(v,['studyHours','runMi','sleepHours'].includes(key)?2:0)+(info[key]?.[2]?' '+info[key][2]:'');
const bounds=ctx=>{
 const f=focus||ctx.selected||ctx.start;
 if(scope==='day')return{a:f,b:f,title:nice(f)};
 if(scope==='week'){const a=mon(f),b=plus(a,6);return{a,b,title:nice(a)+' – '+nice(b)}}
 if(scope==='month'){const x=formDate(f),a=f.slice(0,7)+'-01';return{a,b:dateStr(new Date(Date.UTC(x.getUTCFullYear(),x.getUTCMonth()+1,0))),title:x.toLocaleDateString('en-US',{timeZone:'UTC',month:'long',year:'numeric'})}}
 if(scope==='year'){const y=f.slice(0,4);return{a:y+'-01-01',b:y+'-12-31',title:'Calendar year '+y}}
 const logged=Object.keys(ctx.entries).filter(d=>d>=ctx.start).sort(),end=logged.length?logged[logged.length-1]:ctx.start;
 return{a:ctx.start,b:end>f?end:f,title:'Lifetime since '+nice(ctx.start)};
};
const summary=ctx=>{
 const win=bounds(ctx);
 const rows=Object.entries(ctx.entries||{}).filter(([d,e])=>d>=ctx.start&&d>=win.a&&d<=win.b&&e&&typeof e==='object').sort((a,b)=>a[0].localeCompare(b[0]));
 const totals={};for(const [key] of metrics)totals[key]=rows.reduce((s,[d,e])=>s+val(e,key,d,ctx.xpFor),0);
 const bonus=(ctx.bonuses||[]).filter(x=>x.date>=win.a&&x.date<=win.b).reduce((s,x)=>s+num(x.xp),0);totals.xp+=bonus;
 const averages={};for(const key of ['calories','protein','sleepHours']){const arr=rows.map(x=>x[1][key]).filter(x=>x!==undefined&&x!==null&&x!=='');averages[key]=arr.length?arr.reduce((s,x)=>s+num(x),0)/arr.length:null}
 return{win,rows,totals,averages,bonus,days:rows.filter(([,e])=>Object.values(e).some(v=>v===true||num(v)>0||(typeof v==='string'&&v.trim()!==''))).length};
};
const stat=(title,note,value,cl='')=>'<div class="card"><div class="stat-label">'+safe(title)+'</div><div class="stat-value '+cl+'">'+safe(value)+'</div><div class="stat-detail">'+safe(note)+'</div></div>';
const line=(title,value)=>'<div class="metric"><span>'+safe(title)+'</span><strong>'+safe(value)+'</strong></div>';
const section=(title,content)=>'<section class="card"><h2>'+title+'</h2>'+content+'</section>';
const details=s=>{
 const t=s.totals;
 return '<div class="analytics-categories">'+
 section('🧠 Academics',line('Study time',disp(t.studyHours,'studyHours'))+line('Anki cards',fmt(t.ankiCards))+line('Anki days',fmt(t.anki))+line('Practice questions',fmt(t.practiceQuestions))+line('Lectures completed',fmt(t.lecturesDone))+line('Quizzes passed',fmt(t.quiz))+line('Anatomy practicals passed',fmt(t.anatomyPractical1+t.anatomyPractical2))+line('Module / problem exams',fmt(t.module)+' / '+fmt(t.problem)))+
 section('🏃 Running & Training',line('Distance',disp(t.runKm,'runKm'))+line('Run sessions',fmt(t.run))+line('Running time',fmt(t.runMinutes)+' min')+line('Gym sessions',fmt(t.gym))+line('Gym time',fmt(t.gymMinutes)+' min')+line('BJJ sessions / time',fmt(t.bjj)+' / '+fmt(t.bjjMinutes)+' min')+line('Mobility days / time',fmt(t.mobility)+' / '+fmt(t.mobilityMinutes)+' min'))+
 section('🥊 OPM Challenge & Steps',line('Pushups',fmt(t.pushups))+line('Sit-ups',fmt(t.situps))+line('Burpees',fmt(t.burpees))+line('Total reps',fmt(t.pushups+t.situps+t.burpees))+line('Total steps',fmt(t.steps))+line('10K step days',fmt(s.rows.filter(([,e])=>num(e.steps)>=10000).length)))+
 section('🌙 Nutrition & Recovery',line('Average calories (recorded days)',s.averages.calories===null?'—':fmt(s.averages.calories)+' kcal')+line('Average protein (recorded days)',s.averages.protein===null?'—':fmt(s.averages.protein)+' g')+line('Average hours slept',s.averages.sleepHours===null?'—':fmt(s.averages.sleepHours,1)+' h')+line('Sleep-plan days',fmt(t.sleep))+line('Recovery overrides',fmt(t.recovery))+line('Planning days',fmt(t.planning)))+
 '</div>';
};
const chartEntries=(s,ctx)=>{
 let buckets=[];
 if(scope==='day')buckets=[{label:nice(s.win.a,true),begin:s.win.a,end:s.win.a}];
 else if(scope==='week'||scope==='month'){for(let d=s.win.a;d<=s.win.b;d=plus(d,1)){buckets.push({label:scope==='week'?formDate(d).toLocaleDateString('en-US',{timeZone:'UTC',weekday:'short'}):String(formDate(d).getUTCDate()),begin:d,end:d});if(buckets.length>31)break}}
 else if(scope==='year'){for(let m=1;m<=12;m++){const begin=s.win.a.slice(0,4)+'-'+String(m).padStart(2,'0')+'-01';const end=dateStr(new Date(Date.UTC(Number(begin.slice(0,4)),m,0)));buckets.push({label:formDate(begin).toLocaleDateString('en-US',{timeZone:'UTC',month:'short'}),begin,end})}}
 else{const from=Number(s.win.a.slice(0,4)),to=Number(s.win.b.slice(0,4));for(let yr=from;yr<=to;yr++)buckets.push({label:String(yr),begin:yr+'-01-01',end:yr+'-12-31'})}
 return buckets.map(b=>({...b,value:s.rows.filter(([d])=>d>=b.begin&&d<=b.end).reduce((a,[d,e])=>a+val(e,metric,d,ctx.xpFor),0)+(metric==='xp'?(ctx.bonuses||[]).filter(x=>x.date>=b.begin&&x.date<=b.end).reduce((a,x)=>a+num(x.xp),0):0)}));
};
const chart=(s,ctx)=>{
 const arr=chartEntries(s,ctx),max=Math.max(1,...arr.map(x=>x.value)),name=info[metric]?.[1]||'Metric';
 const select=Object.entries(categories).map(([title,options])=>'<optgroup label="'+safe(title)+'">'+options.map(a=>'<option value="'+a[0]+'" '+(metric===a[0]?'selected':'')+'>'+safe(a[1])+'</option>').join('')+'</optgroup>').join('');
 return '<section class="card"><div class="today-top"><div><div class="kicker">Progress visualization</div><h2>'+safe(name)+' over time</h2></div><label class="field analytics-picker"><span>Choose metric</span><select id="stats-metric">'+select+'</select></label></div>'+
 '<div class="analytics-chart" role="img" aria-label="'+safe(name+': '+arr.map(x=>x.label+' '+disp(x.value,metric)).join(', '))+'">'+
 arr.map(x=>'<div class="analytics-bar-col" title="'+safe(x.label+': '+disp(x.value,metric))+'"><strong>'+safe(x.value?fmt(x.value,['runKm','runMi','studyHours','sleepHours'].includes(metric)?1:0):'')+'</strong><div class="analytics-track"><div class="analytics-fill" style="height:'+Math.max(x.value?3:0,100*x.value/max).toFixed(2)+'%"></div></div><span>'+safe(x.label)+'</span></div>').join('')+'</div>'+
 '<p class="hint" style="margin-top:12px">Recorded values only. An empty day means no data entered—not failure.</p></section>';
};
const table=s=>{
 const periods=new Map(),group=d=>scope==='year'?d.slice(0,7):scope==='lifetime'?d.slice(0,4):d;
 for(const [d,e] of s.rows){const k=group(d);if(!periods.has(k))periods.set(k,[]);periods.get(k).push([d,e])}
 const keys=[...periods.keys()].sort().reverse().slice(0,70);
 const cols=['studyHours','ankiCards','runKm','runMi','pushups','situps','burpees','steps','sleepHours','xp'];
 let html='<div class="scroll" style="margin-top:13px"><table class="data-table"><thead><tr><th>Period</th>'+['Study h','Cards','Run km','Run mi','Pushups','Sit-ups','Burpees','Steps','Sleep h','XP'].map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>';
 for(const key of keys){const rows=periods.get(key),name=scope==='year'?formDate(key+'-01').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',year:'numeric'}):scope==='lifetime'?key:nice(key,true);
 html+='<tr><td><strong>'+safe(name)+'</strong></td>'+cols.map(col=>'<td>'+safe(fmt(rows.reduce((n,[d,e])=>n+val(e,col,d,s._ctx.xpFor),0),['runKm','runMi','studyHours','sleepHours'].includes(col)?1:0))+'</td>').join('')+'</tr>'}
 html+='</tbody></table></div>';
 return '<section class="card"><div class="today-top"><div><h2>'+(scope==='year'?'Monthly':scope==='lifetime'?'Annual':'Daily')+' Breakdown</h2><p class="hint">Review the numbers behind your progress.</p></div><button class="button small outline" data-stats-action="csv">Download lifetime CSV ↓</button></div>'+
 (keys.length?html:'<div class="empty">Nothing recorded for this period yet. Log your first daily quest!</div>')+'</section>';
};
const render=ctx=>{
 if(!focus)focus=ctx.selected||ctx.start;
 const s=summary(ctx);s._ctx=ctx;
 const ranges=[['day','Daily'],['week','Weekly'],['month','Monthly'],['year','Yearly'],['lifetime','Lifetime']].map(([k,v])=>'<button '+(scope===k?'class="active"':'')+' data-stats-action="scope" data-stats-value="'+k+'">'+v+'</button>').join('');
 return '<div class="stack"><section class="hero analytics-hero"><div class="meta">◈ HUNTER ANALYTICS · UNLIMITED PROGRESSION</div><h2>YOUR STATS. YOUR LEGACY.</h2><p class="subtitle">Study hours, Anki cards, running, reps and more—tracked for life.</p><div class="hero-stats"><div class="hero-stat"><strong>'+fmt(s.totals.xp)+' XP</strong><small>PERIOD XP</small></div><div class="hero-stat"><strong>'+fmt(s.days)+'</strong><small>LOGGED DAYS</small></div><div class="hero-stat"><strong>'+disp(s.totals.runKm,'runKm')+'</strong><small>DISTANCE</small></div></div></section>'+
 '<section class="card"><div class="today-top"><div><span class="kicker">Time Period</span><h2>'+safe(s.win.title)+'</h2></div><div class="date-nav"><button class="button small outline" data-stats-action="prev">←</button><input id="stats-focus" class="input" aria-label="Statistics focus date" type="date" min="'+ctx.start+'" value="'+safe(focus)+'"><button class="button small outline" data-stats-action="next">→</button></div></div><div class="day-tabs" style="margin-top:14px">'+ranges+'</div></section>'+
 '<div class="grid four">'+stat('Study Hours','Hours recorded',disp(s.totals.studyHours,'studyHours'),'purple')+stat('Anki Cards','Total reviewed or learned',fmt(s.totals.ankiCards))+stat('Running Distance',fmt(s.totals.run)+' run days',disp(s.totals.runKm,'runKm'),'green')+stat('OPM Total','All three exercises',fmt(s.totals.pushups+s.totals.situps+s.totals.burpees),'gold')+'</div>'+
 chart(s,ctx)+details(s)+table(s)+'<div class="note"><strong>Long-term data:</strong> Logs and lifetime totals continue beyond December 2026. New study-hour and Anki-card counts begin when you enter them; the old Anki checkbox cannot reveal how many cards you did.</div></div>';
};
const dashboard=ctx=>{
 const arr=Object.entries(ctx.entries||{}).filter(([d])=>d>=ctx.start);const sum=k=>arr.reduce((n,[,e])=>n+num(e[k]),0);
 return '<section class="card"><div class="today-top"><div><span class="kicker">LIFETIME ANALYTICS</span><h2>Hunter Progress Totals</h2></div><button class="button small" data-view="stats">View Stats ↗</button></div><div class="divider"></div><div class="grid four">'+stat('Running','All time',disp(sum('runKm'),'runKm'),'green')+stat('Studying','All time',disp(sum('studyHours'),'studyHours'),'purple')+stat('Anki Cards','All time',fmt(sum('ankiCards')))+stat('OPM Challenge','All-time reps',fmt(sum('pushups')+sum('situps')+sum('burpees')),'gold')+'</div></section>';
};
const daily=e=>'<section class="card"><div class="today-top"><h2>📊 Daily Stats Snapshot</h2><button class="button small outline" data-view="stats">Weekly & Monthly ↗</button></div><div class="divider"></div><div class="grid four">'+stat('Study Hours','Today',disp(num(e.studyHours),'studyHours'),'purple')+stat('Anki Cards','Today',fmt(num(e.ankiCards)))+stat('Run Distance','Today',disp(num(e.runKm),'runKm'),'green')+stat('OPM Reps','Today',fmt(num(e.pushups)+num(e.situps)+num(e.burpees)),'gold')+'</div></section>';
const exportCsv=ctx=>{
 const keys=['date','studyHours','ankiCards','practiceQuestions','lecturesPlanned','lecturesDone','runKm','runMi','runMinutes','gym','gymMinutes','run','bjj','bjjMinutes','mobility','mobilityMinutes','pushups','situps','burpees','steps','calories','protein','carbs','fat','sleepHours','sleep','recovery','anki','review','planning','pr','quiz','module','problem','anatomyPractical1','anatomyPractical2','xp','notes'];
 const quoted=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 const lines=[keys.map(quoted).join(',')];for(const [d,e] of Object.entries(ctx.entries).filter(([d])=>d>=ctx.start).sort(([a],[b])=>a.localeCompare(b))){
 lines.push(keys.map(k=>quoted(k==='date'?d:k==='xp'?ctx.xpFor(e,d).xp:k==='runMi'?(num(e.runKm)*KM_TO_MI).toFixed(2):e[k]===true?1:e[k]===false?0:e[k]??'')).join(','))}
 const url=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='shadow-monarch-lifetime-stats.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
};
const change=(type,value,ctx)=>{
 if(type==='scope'&&['day','week','month','year','lifetime'].includes(value)){scope=value;return true}
 if(type==='metric'&&Object.prototype.hasOwnProperty.call(info,value)){metric=value;return true}
 if(type==='focus'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&value>=ctx.start){focus=value;return true}
 if(type==='csv'){exportCsv(ctx);return false}
 if((type==='next'||type==='prev')&&scope!=='lifetime'){
  const x=formDate(focus||ctx.selected||ctx.start),delta=type==='next'?1:-1;
  if(scope==='day')x.setUTCDate(x.getUTCDate()+delta);
  if(scope==='week')x.setUTCDate(x.getUTCDate()+7*delta);
  if(scope==='month'||scope==='year'){const orig=x.getUTCDate();x.setUTCDate(1);if(scope==='month')x.setUTCMonth(x.getUTCMonth()+delta);else x.setUTCFullYear(x.getUTCFullYear()+delta);const max=new Date(Date.UTC(x.getUTCFullYear(),x.getUTCMonth()+1,0)).getUTCDate();x.setUTCDate(Math.min(orig,max))}
  focus=dateStr(x);if(focus<ctx.start)focus=ctx.start;return true
 }
 return false;
};
return {render,dashboard,daily,change};
})();