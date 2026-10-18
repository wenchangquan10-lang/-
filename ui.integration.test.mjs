import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from './tools/dom-validation/node_modules/jsdom/lib/api.js';
import vm from 'node:vm';
const read=f=>readFileSync(new URL('./public/studio/'+f,import.meta.url),'utf8');
async function boot(saved={}){
 const dom=new JSDOM(read('index.html'),{url:'http://localhost:5173',runScripts:'outside-only'});const w=dom.window;let calls=[],failMode=null,done=false;
 for(const [key,value] of Object.entries(saved))w.localStorage.setItem(key,value);
 w.setTimeout=()=>1;w.clearTimeout=()=>{};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.fetch=async(url,opts)=>{calls.push({url,opts});if(url==='/api/config')return {ok:true,json:async()=>({configured:true,musicPolling:false})};if(url==='/api/generate'){if(failMode==='network')throw Error('network disconnected');if(failMode==='balance')return {ok:false,status:402,json:async()=>({error:'insufficient credits'})};return {ok:true,json:async()=>({id:'mock-video-1'})}}return {ok:true,json:async()=>done?{status:'succeeded',content:{video_url:'https://example.com/mock.mp4'}}:{status:'running'}}};
 for(const file of ['app.js','api.js','workspace.js','task-core.js','productivity.js','response-guide.js','polish.js','taste.js','reference-layout.js'])new vm.Script(read(file),{filename:file}).runInContext(dom.getInternalVMContext());
 await new Promise(setImmediate);return {dom,w,calls,setFailure:m=>failMode=m,setDone:()=>done=true};
}
test('task lifecycle, duplicate protection, works and drafts integrate',async()=>{
 const b=await boot();const {w}=b;
 try{
 assert.equal(w.document.querySelectorAll('[data-kind]').length,3);
 w.eval("setPrompt('a test video');");await w.document.querySelector('#generate').onclick();
 assert.equal(w.eval('jobs[0].status'),'pending');assert.equal(w.eval('jobs[0].id'),'mock-video-1');
 await w.document.querySelector('#generate').onclick();assert.equal(b.calls.filter(c=>c.url==='/api/generate').length,1);
 w.eval("showView('tasks')");assert.equal(w.document.querySelector('#taskView').hidden,false);assert.equal(w.document.querySelector('#createView').hidden,true);
 b.setDone();await w.eval('queryJob(jobs[0])');assert.equal(w.eval('jobs[0].status'),'succeeded');assert.equal(w.eval('works.length'),1);
 await w.eval('queryJob(jobs[0])');assert.equal(w.eval('works.length'),1);
 w.eval("showView('library')");assert.equal(w.document.querySelectorAll('.work-card').length,1);
 w.eval("works[0].favorite=true;persistWorks();setKind('music');setPrompt('music draft');setKind('video');");assert.equal(w.document.querySelector('#prompt').value,'a test video');
 w.eval("setKind('music')");assert.equal(w.document.querySelector('#prompt').value,'music draft');
 const saved={};for(let i=0;i<w.localStorage.length;i++){const key=w.localStorage.key(i);saved[key]=w.localStorage.getItem(key)}
 const reboot=await boot(saved);assert.equal(reboot.w.eval('jobs[0].status'),'succeeded');assert.equal(reboot.w.eval('works.length'),1);assert.equal(reboot.calls.filter(c=>c.url==='/api/generate').length,0);reboot.dom.window.close();
 }finally{b.dom.window.close()}
});
test('ambiguous failure is retained and never automatically resubmitted',async()=>{
 const b=await boot();try{b.setFailure('network');b.w.eval("setPrompt('ambiguous test')");await b.w.document.querySelector('#generate').onclick();assert.equal(b.w.eval('jobs[0].status'),'uncertain');await b.w.document.querySelector('#generate').onclick();assert.equal(b.calls.filter(c=>c.url==='/api/generate').length,1)}finally{b.dom.window.close()}
});
test('definite rejection supports user initiated retry',async()=>{
 const b=await boot();try{b.setFailure('balance');b.w.eval("setPrompt('rejection test')");await b.w.document.querySelector('#generate').onclick();assert.equal(b.w.eval('jobs[0].status'),'failed');b.setFailure(null);await b.w.document.querySelector('#generate').onclick();assert.equal(b.w.eval('jobs[0].status'),'pending')}finally{b.dom.window.close()}
});
test('response explanations use only platform supplied progress',async()=>{
 const b=await boot();try{const e=b.w.eval("explainResponse({data:{status:'running',progress:37}},'video','pending')");assert.equal(e.title,'正在生成');assert.equal(e.progress,37);const none=b.w.eval("explainResponse({status:'queued'},'video','pending')");assert.equal(none.title,'已进入队列');assert.equal(none.progress,null);const music=b.w.eval("explainResponse({status:'processing'},'music','pending')");assert.match(music.message,/暂时无法自动跟踪/);const invalid=b.w.eval("explainResponse({progress:150},'video','pending')");assert.equal(invalid.progress,null)}finally{b.dom.window.close()}
});
test('desktop navigation collapses and model labels preserve API values',async()=>{
 const b=await boot();try{const w=b.w;const toggle=w.document.querySelector('#navigationToggle');assert.equal(toggle.getAttribute('aria-expanded'),'true');toggle.click();assert.equal(w.document.body.classList.contains('taste-rail'),true);assert.equal(toggle.getAttribute('aria-expanded'),'false');toggle.click();assert.equal(w.document.body.classList.contains('taste-rail'),false);const model=w.document.querySelector('#model');assert.equal(model.options[0].value,'doubao-seedance-2-0-260128');assert.equal(model.options[0].textContent,'Seedance 2.0');w.eval("setKind('music')");assert.equal(w.document.querySelector('.taste-style-picker').hidden,true);w.eval("setKind('image')");assert.equal(w.document.querySelector('.taste-style-picker').hidden,false);assert.equal(w.document.querySelector('.label.spaced').hidden,true)}finally{b.dom.window.close()}
});
test('work rename saves inline without opening a dialog',async()=>{
 const b=await boot();try{const w=b.w;w.eval("works=[{id:7,kind:'video',name:'旧名称',prompt:'test prompt',model:'test',media:['https://example.com/mock.mp4']}];showView('library');renameWork(works[0]);");const form=w.document.querySelector('.taste-rename');assert.ok(form);assert.equal(w.document.querySelector('#modal').open,false);form.querySelector('input').value='新的作品名称';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(w.eval('works[0].name'),'新的作品名称');assert.equal(w.document.querySelector('.taste-rename'),null)}finally{b.dom.window.close()}
});
test('mobile drawer exposes named navigation and restores focus on Escape',async()=>{
 const b=await boot();try{const w=b.w;w.eval('tasteMobile.matches=true;syncTasteNavigation()');assert.equal(w.document.querySelector('aside').inert,true);w.document.querySelector('#navigationToggle').click();assert.equal(w.document.querySelector('aside').inert,false);assert.equal(w.document.querySelector('main').inert,true);assert.equal(w.document.querySelector('#navigationToggle').getAttribute('aria-expanded'),'true');w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(w.document.querySelector('main').inert,false);assert.equal(w.document.activeElement.id,'navigationToggle');assert.equal(w.document.querySelector('aside').inert,true)}finally{b.dom.window.close()}
});
test('reference composer keeps parameters and reveals results only when needed',async()=>{
 const b=await boot();try{const w=b.w;assert.equal(w.document.querySelector('.preview').hidden,true);assert.ok(w.document.querySelector('.reference-controls #model'));assert.ok(w.document.querySelector('.reference-controls #generate'));assert.equal(w.document.querySelector('#title').textContent,'你好，今天想要创作什么？');w.document.querySelector('.reference-switcher button:last-child').click();assert.equal(w.document.querySelector('#libraryView').hidden,false);assert.equal(w.document.querySelector('.reference-hints').hidden,true);w.document.querySelector('.reference-switcher button:first-child').click();w.eval("setPrompt('reference layout test')");await w.document.querySelector('#generate').onclick();assert.equal(w.document.querySelector('.preview').hidden,false);assert.equal(w.eval('jobs[0].status'),'pending')}finally{b.dom.window.close()}
});
