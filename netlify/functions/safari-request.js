'use strict';
const core=require('./lib/safari.cjs');
const HEADERS={'Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(statusCode,data)=>({statusCode,headers:HEADERS,body:JSON.stringify(data)});
function createHandler(env=process.env,fetcher=(url,options={})=>fetch(url,{...options,signal:AbortSignal.timeout(12000)})){
 const configured=()=>['GOOGLE_SERVICE_ACCOUNT','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID'].every(k=>Boolean(env[k]));
 return async event=>{
  if(event.httpMethod==='GET')return reply(200,{configured:configured()});
  if(event.httpMethod!=='POST')return reply(405,{success:false});
  if(!configured())return reply(503,{success:false,code:'not_configured'});
  if((event.body||'').length>14000)return reply(413,{success:false,code:'invalid'});
  let b;try{b=JSON.parse(event.body||'{}');}catch(_){return reply(400,{success:false,code:'invalid'});}
  if(b?.website)return reply(400,{success:false,code:'invalid'});
  const error=core.validate(b);if(error)return reply(400,{success:false,code:error});
  let sailing;try{sailing=await core.resolveSailing(b,fetcher);}catch(_){return reply(409,{success:false,code:'sailing_unavailable'});}
  const rec=core.makeRecord(b,sailing);
  try{const added=await core.save(rec,env,fetcher);const telegramDelivered=added?await core.notify(b,sailing,rec,env,fetcher):null;return reply(200,{success:true,requestId:rec.id,telegramDelivered});}
  catch(_){console.error('[safari-request] Save failed',{requestId:rec.id});return reply(502,{success:false,code:'save_failed'});}
 };
}
exports.handler=createHandler();exports.createHandler=createHandler;
