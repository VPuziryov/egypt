'use strict';
const lang = document.documentElement.lang === 'ru' ? 'ru' : 'en';
const copy = {
 ru: {loading:'Загружаем расписание…',error:'Не удалось загрузить расписание. Попробуйте обновить или откройте исходную таблицу.',source:'Открыть таблицу',empty:'По выбранным условиям рейсов нет.',confirmed:'Подтверждён',planned:'Запланирован',unknown:'Уточняется',all:'Все месяцы',count:'Рейсов',seats:'свободных мест',sold:'Мест нет',loaded:'Данные загружены',bad:'В источнике не найдены строки расписания.'},
 en: {loading:'Loading schedule…',error:'The schedule could not be loaded. Try refreshing or open the source table.',source:'Open table',empty:'No sailings match these filters.',confirmed:'Confirmed',planned:'Planned',unknown:'To be confirmed',all:'All months',count:'Sailings',seats:'available places',sold:'Full',loaded:'Data loaded',bad:'No schedule rows were found in the source.'}
}[lang];
const published = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQajGKJrlO2o2G9Q6Qo0RhvdKnhrrzG7gLnXozQVhm-v8geWoKIysK-FessVWvwnj20n6z0tUQ6nMJm/';
const gid = lang === 'ru' ? '1556887608' : '1984293992';
const sourceURL = published + 'pubhtml?gid=' + gid + '&single=true';
const dataURL = published + 'pub?gid=' + gid + '&single=true&output=csv';
let sailings = [];
const $ = id => document.getElementById(id);
function parseCSV(text) {
 const rows = []; let row = [], value = '', quoted = false;
 for (let i=0;i<text.length;i++) {
  const c=text[i];
  if(c==='"') { if(quoted && text[i+1]==='"'){value+='"';i++;}else quoted=!quoted; }
  else if(c===','&&!quoted){row.push(value);value='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value='';}
  else value+=c;
 }
 if(quoted)throw new Error('Invalid CSV');
 if(value||row.length){row.push(value);rows.push(row);} return rows;
}
function dateValue(value) {
 const m=/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/.exec((value||'').trim()); if(!m)return null;
 const y=m[3].length===2?2000+Number(m[3]):Number(m[3]);const d=new Date(y,Number(m[2])-1,Number(m[1]));
 return d.getFullYear()===y && d.getMonth()===Number(m[2])-1 && d.getDate()===Number(m[1])?d:null;
}
function node(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
function status(s){return node('span',s.status==='confirmed'?copy.confirmed:s.status==='planned'?copy.planned:copy.unknown,'status '+s.status);}
function dateLabel(d){return new Intl.DateTimeFormat(lang==='ru'?'ru-RU':'en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(d);}
function monthKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function render(){
 const list=sailings.filter(s=>(!$('month').value||monthKey(s.depart)===$('month').value)&&(!$('status').value||s.status===$('status').value));
 $('rows').replaceChildren();$('cards').replaceChildren();$('count').textContent=copy.count+': '+list.length;
 $('notice').textContent=list.length?'':copy.empty;
 for(const s of list){
  const tr=document.createElement('tr'), dates=node('td',dateLabel(s.depart),'date');dates.append(node('small','→ '+dateLabel(s.arrive)));tr.append(dates);
  const route=node('td',s.route,'route');route.append(node('div',s.boat,'boat'));tr.append(route,node('td',s.price,'price'),node('td',s.seats,'seats'),node('td',s.from+' → '+s.to,'ports'));
  const st=document.createElement('td');st.append(status(s));tr.append(st);const action=document.createElement('td');action.append(pickButton(s));tr.append(action);$('rows').append(tr);
  const card=node('article','','card'),top=node('div','','card-top'),date=node('div',dateLabel(s.depart),'date');date.append(node('small','→ '+dateLabel(s.arrive)));top.append(date,status(s));
  const bottom=node('div','','card-bottom'),places=node('div','','seats');places.append(node('strong',s.seats),node('span',Number(s.seats)===0?copy.sold:copy.seats));bottom.append(node('div',s.price,'price'),places);
  card.append(top,node('div',s.route,'route'),node('div',s.boat,'boat'),node('div',s.from+' → '+s.to,'ports'),bottom,pickButton(s));$('cards').append(card);
 }
}
function pickButton(s){const b=node('button',lang==='ru'?'Запросить места':'Enquire','sailing-pick');b.type='button';if(s.seats.trim()==='0'){b.disabled=true;b.textContent=lang==='ru'?'Мест нет':'Full';}b.addEventListener('click',()=>window.selectSailing(s));return b;}
async function load(){
 $('refresh').disabled=true;$('notice').textContent=copy.loading;$('rows').replaceChildren();$('cards').replaceChildren();$('count').textContent='';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(dataURL,{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);
  const rows=parseCSV((await response.text()).replace(/^\uFEFF/,''));const today=new Date();today.setHours(0,0,0,0);
  let valid=0;sailings=[];
  for(const r of rows){const depart=dateValue(r[0]),arrive=dateValue(r[2]);if(!depart||!arrive)continue;valid++;if(arrive<today)continue;
   sailings.push({depart,arrive,route:r[4]||'—',price:r[5]||'—',seats:r[6]||'—',boat:r[7]||'—',from:r[8]||'—',to:r[10]||'—',status:(r[11]||'').includes('✅')?'confirmed':(r[11]||'').includes('🕓')?'planned':'unknown'});
  }
  if(!valid)throw new Error(copy.bad);sailings.sort((a,b)=>a.depart-b.depart);
  const selected=$('month').value;$('month').replaceChildren(new Option(copy.all,''));
  for(const key of [...new Set(sailings.map(s=>monthKey(s.depart)))]){const d=sailings.find(s=>monthKey(s.depart)===key).depart;$('month').add(new Option(new Intl.DateTimeFormat(lang==='ru'?'ru-RU':'en-GB',{month:'long',year:'numeric'}).format(d),key));}
  if([...$('month').options].some(o=>o.value===selected))$('month').value=selected;
  $('loaded').textContent=copy.loaded+': '+new Intl.DateTimeFormat(lang==='ru'?'ru-RU':'en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date());render();
 }catch(error){sailings=[];$('notice').textContent=copy.error+' ';const link=node('a',copy.source);link.href=sourceURL;link.target='_blank';link.rel='noopener';$('notice').append(link);$('loaded').textContent='';}
 finally{clearTimeout(timer);$('refresh').disabled=false;}
}
for(const a of document.querySelectorAll('[data-lang]')){a.href='/safari/'+a.dataset.lang+'/'+location.search+location.hash;a.addEventListener('click',()=>{try{localStorage.setItem('langPref',a.dataset.lang);}catch(_){}});}
$('source').href=sourceURL;$('month').addEventListener('change',render);$('status').addEventListener('change',render);$('refresh').addEventListener('click',load);load();
