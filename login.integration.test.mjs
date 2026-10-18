import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from './tools/dom-validation/node_modules/jsdom/lib/api.js';
const read=file=>readFileSync(new URL('./public/studio/'+file,import.meta.url),'utf8');
test('login bootstrap loads workspace with user scoped storage and sync headers',async()=>{
 const dom=new JSDOM(read('index.html'),{url:'https://studio.example',runScripts:'outside-only'}),w=dom.window,records={},requests=[];
 try{
 w.Headers=Headers;w.setTimeout=()=>1;w.clearTimeout=()=>{};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 // Anonymous records must not be silently assigned to the first username.
 w.localStorage.setItem('yunying-works',JSON.stringify([{prompt:'anonymous private work'}]));
 w.fetch=async(url,options={})=>{requests.push({url,options});let data={};if(url==='/api/me')data={user:null};else if(url==='/api/login')data={user:{id:'alice-id',name:'alice'}};else if(url==='/api/config')data={configured:true};else if(url==='/api/account/data'){if(options.method==='PUT'){const b=JSON.parse(options.body);assert.equal(b.version,records[b.key]?.version||0);records[b.key]={value:b.value,version:b.version+1};data={record:records[b.key]}}else data={records}}return {ok:true,json:async()=>data}};
 const append=w.document.body.append.bind(w.document.body);w.document.body.append=(...nodes)=>{append(...nodes);for(const node of nodes)if(node.tagName==='SCRIPT'){new vm.Script(read(new URL(node.src).pathname.slice(1))).runInContext(dom.getInternalVMContext());node.onload()}};
 const boot=new vm.Script(read('login.js')).runInContext(dom.getInternalVMContext());await new Promise(setImmediate);
 assert.ok(w.document.getElementById('loginScreen'));w.document.querySelector('#loginScreen input').value='alice';w.document.querySelector('#loginScreen form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await boot;
 assert.equal(w.document.getElementById('loginScreen'),null);assert.equal(w.eval('works.length'),0);assert.match(w.document.querySelector('.profile').textContent,/alice/);
 w.eval("setPrompt('a');setPrompt('alice');setPrompt('alice draft')");await w.YunyingAccount.flush();assert.match(records['yunying-drafts'].value,/alice draft/);
 const writes=requests.filter(r=>r.options.method==='PUT');assert.ok(writes.length);assert.equal(writes.filter(r=>JSON.parse(r.options.body).key==='yunying-drafts').length,1);assert.ok(writes.every(r=>r.options.headers['X-Workspace-User']==='alice-id'));
 assert.equal(requests.some(r=>r.url==='/api/generate'),false);
 }finally{dom.window.close()}
});

test('explicit username replaces remembered session before loading any records',async()=>{
 const dom=new JSDOM(read('index.html'),{url:'https://studio.example/?username=bob',runScripts:'outside-only'}),w=dom.window,requests=[];
 try{
 w.Headers=Headers;w.fetch=async(url,options={})=>{requests.push({url,options});return {ok:true,json:async()=>url==='/api/me'?{user:{id:'alice-id',name:'alice'}}:url==='/api/login'?{user:{id:'bob-id',name:'bob'}}:{records:{}}}};
 const append=w.document.body.append.bind(w.document.body);w.document.body.append=(...nodes)=>{append(...nodes);for(const n of nodes)if(n.tagName==='SCRIPT')n.onload()};
 await new vm.Script(read('login.js')).runInContext(dom.getInternalVMContext());
 assert.equal(w.YunyingAccount.user.name,'bob');assert.equal(w.location.search,'');
 assert.equal(JSON.parse(requests.find(r=>r.url==='/api/login').options.body).username,'bob');
 assert.equal(requests.find(r=>r.url==='/api/account/data').options.headers['X-Workspace-User'],'bob-id');
 assert.match(w.document.querySelector('.profile').textContent,/bob/);
 }finally{dom.window.close()}
});
