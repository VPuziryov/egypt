'use strict';
const crypto = require('node:crypto');
const SHEET_ID='1jRTKf1lh1Brhb20d9FYeGOj8iKM57XOALv6-7cgT2TM';
const CSV='https://docs.google.com/spreadsheets/d/e/2PACX-1vQajGKJrlO2o2G9Q6Qo0RhvdKnhrrzG7gLnXozQVhm-v8geWoKIysK-FessVWvwnj20n6z0tUQ6nMJm/pub?gid=1984293992&single=true&output=csv';
function parseCSV(text){const rows=[];let row=[],value='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value='';}else value+=c;}if(quoted)throw Error('Invalid CSV');if(value||row.length){row.push(value);rows.push(row);}return rows;}
function isoDate(s){const m=/^(\d\d)\.(\d\d)\.(\d{2}|\d{4})$/.exec(s||'');if(!m)return null;const y=m[3].length===2?'20'+m[3]:m[3];const iso=y+'-'+m[2]+'-'+m[1];const d=new Date(iso+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===iso?iso:null;}
function validate(body){
 if(!body||typeof body!=='object'||Array.isArray(body))return 'invalid';
 const limits={name:120,email:254,messenger:200,period:250,message:3000,company:200,source:1000,requestId:64,dateMode:20,tripType:20,lang:2,boat:80,route:200,departure:10,returnDate:10,website:200};
 for(const [k,n] of Object.entries(limits))if(body[k]!=null&&(typeof body[k]!=='string'||body[k].length>n))return 'invalid';
 if(!body.name?.trim())return 'name';
 if(!['ru','en'].includes(body.lang)||!['exact','approximate','help','question'].includes(body.dateMode)||!['individual','mini_group','partial_charter','full_charter'].includes(body.tripType))return 'invalid';
 const email=(body.email||'').trim(),messenger=(body.messenger||'').trim();
 if(!email&&!messenger)return 'contact';
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return 'email';
 if(messenger&&!(/^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(messenger)||/^(?:https:\/\/)?t\.me\/[A-Za-z][A-Za-z0-9_]{4,31}\/?$/.test(messenger)||/^(?:https:\/\/)?wa\.me\/[1-9][0-9]{6,14}\/?$/.test(messenger)||/^\+[1-9][0-9 ()-]{6,24}$/.test(messenger)))return 'messenger';
 if(body.guests!==null&&body.guests!==undefined&&(!Number.isInteger(body.guests)||body.guests<1||body.guests>200))return 'guests';
 if(body.dateMode==='approximate'&&!body.period?.trim())return 'period';
 if(body.dateMode==='question'&&!body.message?.trim())return 'message';
 if(body.dateMode==='exact'&&(!/^\d{4}-\d{2}-\d{2}$/.test(body.departure||'')||!/^\d{4}-\d{2}-\d{2}$/.test(body.returnDate||'')||!body.boat||!body.route))return 'sailing';
 if(!/^[A-Za-z0-9-]{16,64}$/.test(body.requestId||'')||body.consent!==true)return 'invalid';
 return null;
}
async function resolveSailing(body,fetcher){if(body.dateMode!=='exact')return null;const r=await fetcher(CSV);if(!r.ok)throw Error('Schedule unavailable');const rows=parseCSV(await r.text());const row=rows.find(r=>isoDate(r[0])===body.departure&&isoDate(r[2])===body.returnDate&&r[7]===body.boat&&r[4]===body.route);if(!row||isoDate(row[2])<new Date().toISOString().slice(0,10))throw Error('Sailing unavailable');return {departure:isoDate(row[0]),returnDate:isoDate(row[2]),boat:row[7],route:row[4],price:row[5],seats:row[6]};}
const TYPES={individual:'Индивидуально / с напарником',mini_group:'Мини-группа',partial_charter:'Частичный фрахт',full_charter:'Полный фрахт'};
const MODES={exact:'Выбран рейс',approximate:'Примерные даты',help:'Помочь с выбором',question:'Вопрос'};
function makeRecord(b,s){const id=b.requestId;const contact=[b.email?.trim(),b.messenger?.trim()].filter(Boolean).join(' · ');const details=[`Формат: ${TYPES[b.tripType]}`,`Даты: ${MODES[b.dateMode]}`,b.period?`Период: ${b.period.trim()}`:'',`Мест: ${b.guests??'Пока неизвестно'}`,b.message?.trim()].filter(Boolean).join('\n');return {id,contact,details,row:[new Date().toISOString(),b.name.trim(),contact,b.company?.trim()||'',b.source||'',details,s?.boat||'',s?.route||'',s?.departure||'',s?.returnDate||'',b.guests??'',s?.price||'',b.lang,'NEW','',id]};}
async function token(credentials,fetcher){const now=Math.floor(Date.now()/1000);const enc=v=>Buffer.from(JSON.stringify(v)).toString('base64url');const unsigned=enc({alg:'RS256',typ:'JWT'})+'.'+enc({iss:credentials.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});const assertion=unsigned+'.'+crypto.sign('RSA-SHA256',Buffer.from(unsigned),credentials.private_key).toString('base64url');const r=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});const data=await r.json();if(!r.ok||!data.access_token)throw Error('Sheets authorization failed');return data.access_token;}
async function save(record,env,fetcher){const credentials=JSON.parse(env.GOOGLE_SERVICE_ACCOUNT);const access=await token(credentials,fetcher);const id=env.SAFARI_SPREADSHEET_ID||SHEET_ID;const base='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'/values/';const headers={Authorization:'Bearer '+access,'Content-Type':'application/json'};
 // Retries from one form reuse the request ID. This prevents ordinary re-submission;
 // simultaneous requests are not an atomic uniqueness guarantee in Google Sheets.
 const check=await fetcher(base+'Leads!P2:P',{headers});if(!check.ok)throw Error('Unable to read requests');const existing=await check.json();if((existing.values||[]).some(r=>r[0]===record.id))return false;
 const r=await fetcher(base+'Leads!A:P:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',{method:'POST',headers,body:JSON.stringify({values:[record.row]})});if(!r.ok)throw Error('Unable to save enquiry');return true;}
async function notify(b,s,rec,env,fetcher){const text=['🤿 iScuba · Новый запрос сафари',`ID: ${rec.id}`,`Имя: ${b.name.trim()}`,`Контакт: ${rec.contact}`,s?`${s.boat} · ${s.route}\n${s.departure} → ${s.returnDate}\nЦена по расписанию: ${s.price}`:'',rec.details,b.company?`Компания / группа: ${b.company}`:'',`Язык: ${b.lang}`].filter(Boolean).join('\n\n');try{const r=await fetcher('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:text.slice(0,4000)})});const d=await r.json();return r.ok&&d.ok===true;}catch(_){return false;}}
module.exports={validate,parseCSV,isoDate,resolveSailing,makeRecord,save,notify};
