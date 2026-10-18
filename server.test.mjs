import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
process.env.YUNYING_DATA_DIR=mkdtempSync(path.join(tmpdir(),'yunying-server-test-'));
const {createServer}=await import('./server.mjs');
const server=createServer();
let cookie='';
function request(url,method='GET',body,origin){return new Promise(resolve=>{const req=Readable.from(body?[JSON.stringify(body)]:[]);Object.assign(req,{url,method,headers:{cookie,...(origin?{origin}:{})}});const res={setHeader(k,v){this.extra??={};this.extra[k]=v},writeHead(status,headers){this.status=status;this.headers=headers},end(text){resolve({status:this.status,text:String(text),extra:this.extra})}};server.emit('request',req,res)})}
test('API contracts and key isolation',async()=>{
 const old=process.env.CREDIT_MEDIA_API_KEY,originalFetch=globalThis.fetch;
 try{
 delete process.env.CREDIT_MEDIA_API_KEY;
 assert.equal((await request('/api/generate','POST',{})).status,401);
 const login=await request('/api/login','POST',{username:'backend-test-user'});cookie=login.extra['Set-Cookie'].split(';')[0];
 assert.equal((await request('/api/generate','POST',{})).status,503);
 process.env.CREDIT_MEDIA_API_KEY='test-only-secret';
 assert.equal((await request('/api/generate','POST',{},'https://untrusted.example')).status,403);
 const calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({id:'task-1'}),{status:200})};
 for(const kind of ['video','image','music']){
 const r=await request('/api/generate','POST',{kind,model:kind==='music'?'chirp-v4':'test-model',prompt:'test prompt',duration:4,ratio:'9:16'});
 assert.equal(r.status,200);assert.ok(!r.text.includes('test-only-secret'));
 }
 assert.equal(calls[0].url,'https://api.openai-next.com/seedance/api/v3/contents/generations/tasks');
 assert.deepEqual(JSON.parse(calls[0].options.body).content,[{type:'text',text:'test prompt'}]);
 assert.equal(JSON.parse(calls[0].options.body).ratio,'9:16');
 assert.equal(JSON.parse(calls[1].options.body).size,'1024x1024');
 assert.equal(JSON.parse(calls[2].options.body).mv,'chirp-v4');
 assert.equal(calls[2].options.headers.Authorization,'Bearer test-only-secret');
 await request('/api/task?kind=video&id=task-1');
 assert.ok(calls.at(-1).url.endsWith('/tasks/task-1'));assert.equal(calls.at(-1).options.method,'GET');
 const config=await request('/api/config');assert.ok(!config.text.includes('test-only-secret'));
 assert.equal((await request('/api/task?kind=music&id=task-1')).status,501);
 assert.equal((await request('/api/generate','POST',{kind:'video',model:'x',prompt:''})).status,400);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'insufficient credits'}}),{status:402});
 assert.equal((await request('/api/generate','POST',{kind:'image',model:'x',prompt:'x'})).status,402);
 assert.equal((await request('/')).status,200);
 assert.equal((await request('/%2e%2e%5cserver.mjs')).status,403);
 }finally{globalThis.fetch=originalFetch;if(old===undefined)delete process.env.CREDIT_MEDIA_API_KEY;else process.env.CREDIT_MEDIA_API_KEY=old}
});
