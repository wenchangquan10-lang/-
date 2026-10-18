import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context={};vm.runInNewContext(readFileSync(new URL('./public/studio/task-core.js',import.meta.url),'utf8'),context);const T=context.YunyingTasks;
test('recovery never resubmits interrupted generation',()=>{const r=T.recover([{uid:'a',status:'submitting'},{uid:'b',status:'polling',id:'1'},{uid:'c',status:'succeeded'}]);assert.equal(r[0].status,'uncertain');assert.equal(r[1].status,'paused');assert.equal(r[2].status,'succeeded');assert.equal(T.canQuery(r[0]),false);assert.equal(T.canQuery(r[1]),true)});
test('normalize terminal states, nested IDs and duplicate updates',()=>{assert.equal(T.outcome({data:{status:'expired'}}),'failed');assert.equal(T.outcome({state:'COMPLETED'}),'completed');assert.equal(T.outcome({status:'processing'}),'pending');assert.equal(T.taskId({data:{task_id:42}}),'42');assert.equal(T.taskId({id:{bad:1}}),null);const r=T.upsert([{uid:'a',status:'pending'}],{uid:'a',status:'succeeded'});assert.equal(r.length,1);assert.equal(r[0].status,'succeeded');assert.equal(T.canQuery({id:'x',status:'succeeded'}),false)});
test('actionable billing and rate-limit errors',()=>{assert.match(T.errorText(new Error('insufficient credits')),/额度不足/);assert.match(T.errorText(new Error('429 rate limit')),/重复提交/);assert.match(T.errorText(new Error('401 Unauthorized')),/密钥/)});
