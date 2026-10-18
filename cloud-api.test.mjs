import {test} from 'node:test';
import assert from 'node:assert/strict';
import {creationApi} from './build/creation-api.mjs';
test('cloud routes preserve API contracts and protect the secret',async()=>{
 const env={CREDIT_MEDIA_API_KEY:'mock-secret'},original=globalThis.fetch,calls=[];
 const req=(p,body)=>new Request('https://studio.example'+p,body?{method:'POST',headers:{'Content-Type':'application/json',origin:'https://studio.example'},body:JSON.stringify(body)}:{});
 try{
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json({id:'job-1'})};
 assert.deepEqual(await (await creationApi(req('/api/config'),env)).json(),{configured:true,musicPolling:false,hosted:true});
 for(const kind of ['video','image','music']){
 const response=await creationApi(req('/api/generate',{kind,model:'test-model',prompt:'test',duration:4,ratio:'16:9'}),env);
 assert.equal(response.status,200);assert.ok(!(await response.text()).includes('mock-secret'));
 }
 assert.equal(calls[0].url,'https://api.openai-next.com/seedance/api/v3/contents/generations/tasks');
 assert.equal(JSON.parse(calls[0].options.body).duration,4);
 assert.equal(JSON.parse(calls[1].options.body).size,'1024x1024');
 assert.equal(JSON.parse(calls[2].options.body).inputType,10);
 assert.equal(calls[0].options.headers.Authorization,'Bearer mock-secret');
 await creationApi(req('/api/task?kind=video&id=job-1'),env);
 assert.ok(calls.at(-1).url.endsWith('/tasks/job-1'));
 assert.equal((await creationApi(req('/api/task?kind=music&id=job-1'),env)).status,501);
 assert.equal((await creationApi(req('/api/generate',{kind:'image',model:'x',prompt:''}),env)).status,400);
 assert.equal((await creationApi(new Request('https://studio.example/api/config',{headers:{origin:'https://evil.example'}}),env)).status,403);
 assert.equal((await creationApi(req('/api/task?kind=video&id=x'),{})).status,503);
 }finally{globalThis.fetch=original}
});
