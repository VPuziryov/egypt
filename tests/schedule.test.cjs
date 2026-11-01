const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const routing=fs.readFileSync('schedule/assets/language.js','utf8');
function route(language,saved,search=''){let target;vm.runInNewContext(routing,{URLSearchParams,navigator:{language},localStorage:{getItem:()=>saved},location:{search,hash:'#dates',replace:u=>target=u}});return target;}
test('Hub RU group and fallback, explicit and saved choices, query/hash retention',()=>{
 for(const l of ['ru-RU','uk-UA','be-BY','kk-KZ'])assert.equal(route(l,null),'/schedule/ru/#dates');
 for(const l of ['en-GB','lv-LV','de-DE','uz-UZ','fr-FR',''])assert.equal(route(l,null),'/schedule/en/#dates');
 assert.equal(route('ru','en'),'/schedule/en/#dates');assert.equal(route('en','ru','?lang=en&utm_source=bot'),'/schedule/en/?lang=en&utm_source=bot#dates');assert.equal(route('uk','bad'),'/schedule/ru/#dates');
});
const source=fs.readFileSync('schedule/assets/schedule.js','utf8');const parsers=source.slice(source.indexOf('function parseCSV'),source.indexOf('function node('));
const api=vm.runInNewContext(parsers+';({parseCSV,dateValue})');
test('CSV quoted commas, newlines, escaped quotes and CRLF; invalid dates',()=>{
 const rows=api.parseCSV('"heading, line\nnext",x\r\n"St ""John""",y\r\n');assert.equal(rows[0][0],'heading, line\nnext');assert.equal(rows[1][0],'St "John"');
 assert.equal(api.dateValue('31.02.26'),null);assert.equal(api.dateValue('07.11.26').getFullYear(),2026);assert.throws(()=>api.parseCSV('"unfinished'));
});
test('7-second Pixel pauses in hidden tabs, resumes remaining time and fires once',()=>{
 let now=0,hidden=false,nextId=0;const events=[],listeners={},timers=new Map();
 const doc={get hidden(){return hidden},createElement:()=>({}),getElementsByTagName:()=>[{parentNode:{insertBefore(){}}}],addEventListener:(e,f)=>listeners[e]=f};
 const win={fbq:(...args)=>events.push(args),addEventListener:(e,f)=>listeners[e]=f};
 vm.runInNewContext(fs.readFileSync('schedule/assets/pixel.js','utf8'),{window:win,document:doc,fbq:win.fbq,performance:{now:()=>now},setTimeout:(f,ms)=>{timers.set(++nextId,{f,at:now+ms});return nextId},clearTimeout:id=>timers.delete(id)});
 now=3000;hidden=true;listeners.visibilitychange();assert.equal(timers.size,0);now=30000;hidden=false;listeners.visibilitychange();const t=[...timers.values()][0];assert.equal(t.at,34000);now=34000;t.f();assert.equal(events.filter(e=>e[1]==='ViewContent_EgyptSchedule_7s').length,1);listeners.pageshow();assert.equal(events.filter(e=>e[1]==='PageView').length,1);
});
