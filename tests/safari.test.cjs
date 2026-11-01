const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const core=require('../netlify/functions/lib/safari.cjs');const {createHandler}=require('../netlify/functions/safari-request');
const base={name:'TEST',email:'test@example.com',lang:'en',dateMode:'help',tripType:'individual',guests:null,consent:true,requestId:'test-request-1234567890'};
test('general, approximate, question, group and charter enquiries validate',()=>{
 for(const tripType of ['individual','mini_group','partial_charter','full_charter'])assert.equal(core.validate({...base,tripType}),null);
 assert.equal(core.validate({...base,email:'',messenger:'@Example_User'}),null);
 assert.equal(core.validate({...base,dateMode:'approximate'}),'period');assert.equal(core.validate({...base,dateMode:'approximate',period:'March 2027'}),null);
 assert.equal(core.validate({...base,dateMode:'question'}),'message');assert.equal(core.validate({...base,dateMode:'question',message:'How to choose?'}),null);
 assert.equal(core.validate({...base,email:'',messenger:''}),'contact');assert.equal(core.validate({...base,guests:0}),'guests');assert.equal(core.validate({...base,consent:false}),'invalid');
});
test('selected sailing resolves against published source, ignoring client price',async()=>{
 const selected={...base,dateMode:'exact',departure:'2027-11-07',returnDate:'2027-11-14',boat:'SUNSHINE',route:'North+Tiran',price:'1 €'};
 const csv='07.11.27,-,14.11.27,NORTH,North+Tiran,750 €,9,SUNSHINE,HRG,,HRG,✅';
 const s=await core.resolveSailing(selected,async()=>({ok:true,text:async()=>csv}));assert.equal(s.price,'750 €');
 await assert.rejects(core.resolveSailing({...selected,boat:'OTHER'},async()=>({ok:true,text:async()=>csv})));
 const rec=core.makeRecord({...selected,tripType:'full_charter',guests:20},s);assert.equal(rec.row.length,16);assert.equal(rec.row[11],'750 €');assert.match(rec.row[5],/Полный фрахт/);assert.equal(rec.row[15],base.requestId);
});
test('unconfigured server fails closed without claiming a saved enquiry',async()=>{
 const h=createHandler({},()=>{throw Error('Must not call network')});assert.equal(JSON.parse((await h({httpMethod:'GET'})).body).configured,false);assert.equal((await h({httpMethod:'POST',body:JSON.stringify(base)})).statusCode,503);
});
test('save is RAW; failed Telegram delivery keeps successfully saved enquiry',async()=>{
 const {privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});const env={GOOGLE_SERVICE_ACCOUNT:JSON.stringify({client_email:'test@example.com',private_key:privateKey.export({type:'pkcs8',format:'pem'})}),TELEGRAM_BOT_TOKEN:'test',TELEGRAM_CHAT_ID:'test'};let saved=false;
 const h=createHandler(env,async(url,opts)=>{
  if(url.includes('oauth2.googleapis.com'))return{ok:true,json:async()=>({access_token:'test'})};
  if(url.includes('Leads!P2:P'))return{ok:true,json:async()=>({values:[]})};
  if(url.includes(':append?')){assert.match(url,/valueInputOption=RAW/);const row=JSON.parse(opts.body).values[0];assert.equal(row[1],'=danger');saved=true;return{ok:true};}
  if(url.includes('api.telegram.org')){assert.equal(saved,true);return{ok:false,json:async()=>({ok:false})};}
  throw Error('Unexpected fetch');
 });
 const result=await h({httpMethod:'POST',body:JSON.stringify({...base,name:'=danger'})});const data=JSON.parse(result.body);assert.equal(data.success,true);assert.equal(data.telegramDelivered,false);
});
test('save failures never return success or send Telegram',async()=>{
 const env={GOOGLE_SERVICE_ACCOUNT:'{}',TELEGRAM_BOT_TOKEN:'test',TELEGRAM_CHAT_ID:'test'};const h=createHandler(env,async()=>{throw Error('Save unavailable')});const r=await h({httpMethod:'POST',body:JSON.stringify(base)});assert.equal(r.statusCode,502);assert.equal(JSON.parse(r.body).success,false);
});
