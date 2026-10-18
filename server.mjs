import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {Accounts,sessionCookie} from './accounts.mjs';
const accounts=new Accounts(process.env.YUNYING_DATA_DIR||fileURLToPath(new URL('./.user-data/',import.meta.url)));
const root=path.resolve(fileURLToPath(new URL('./public/studio/',import.meta.url)));
const base='https://api.openai-next.com';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const musicPath=process.env.SUNO_STATE_PATH; // 填入平台文档中的查询路径，使用 {id} 占位符。
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
async function body(req,limit=16000){let s='';for await(const chunk of req){s+=chunk;if(Buffer.byteLength(s)>limit)throw Object.assign(new Error('请求过大'),{status:413})}return JSON.parse(s||'{}')}
export function createServer(){return http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){
  if(req.headers.origin&&!['http://127.0.0.1:5173','http://localhost:5173'].includes(req.headers.origin))return send(res,403,{error:'不允许的来源'});
  const secure=req.headers['x-forwarded-proto']==='https';
  if(url.pathname==='/api/login'&&req.method==='POST'){try{const b=await body(req,4096);const result=accounts.login(b.username);res.setHeader('Set-Cookie',sessionCookie(result.token,secure));return send(res,200,{user:result.user})}catch(e){return send(res,400,{error:e.message})}}
  if(url.pathname==='/api/logout'&&req.method==='POST'){res.setHeader('Set-Cookie',sessionCookie('',secure));return send(res,200,{ok:true})}
  const user=accounts.user(req.headers.cookie);
  if(url.pathname==='/api/me'&&req.method==='GET')return send(res,200,{user});
  if(url.pathname==='/api/config'&&req.method==='GET')return send(res,200,{configured:!!process.env.CREDIT_MEDIA_API_KEY,musicPolling:!!musicPath});
  if(!user)return send(res,401,{error:'请先输入用户名登录'});
  if(req.headers['x-workspace-user']&&req.headers['x-workspace-user']!==user.id)return send(res,409,{error:'当前登录用户已切换，请刷新页面后重试'});
  if(url.pathname==='/api/account/data'){
   if(req.method==='GET')return send(res,200,{records:accounts.data(user)});
   if(req.method==='PUT'){try{const b=await body(req,7*1024*1024);return send(res,200,{record:accounts.put(user,b.key,b.value,b.version)})}catch(e){return send(res,e.status||400,{error:e.message})}}
   return send(res,405,{error:'请求方法无效'});
  }
  const key=process.env.CREDIT_MEDIA_API_KEY;if(!key)return send(res,503,{error:'请先在启动终端设置 CREDIT_MEDIA_API_KEY 环境变量，再启动后端。'});
  let endpoint,payload;
  if(req.method==='POST'&&url.pathname==='/api/generate'){
   const b=await body(req);if(typeof b.prompt!=='string'||!b.prompt.trim())return send(res,400,{error:'请输入描述'});
   if(!/^[a-zA-Z0-9.+_-]{1,100}$/.test(b.model||''))return send(res,400,{error:'模型名称无效'});
   if(b.kind==='video'){endpoint='/seedance/api/v3/contents/generations/tasks';payload={model:b.model,content:[{type:'text',text:b.prompt}],duration:[4,5,10].includes(b.duration)?b.duration:4,ratio:['16:9','9:16','1:1'].includes(b.ratio)?b.ratio:'16:9'}}
   else if(b.kind==='image'){endpoint='/v1/images/generations';payload={model:b.model,prompt:b.prompt,size:'1024x1024'}}
   else if(b.kind==='music'){endpoint='/_open/suno/music/generate';payload={inputType:10,gptDescriptionPrompt:b.prompt,mv:b.model}}
   else return send(res,400,{error:'未知创作类型'});
  }else if(req.method==='GET'&&url.pathname==='/api/task'){
   const id=url.searchParams.get('id');if(!id||id.length>200)return send(res,400,{error:'任务 ID 无效'});
   if(!accounts.ownsTask(user,id))return send(res,403,{error:'该任务不属于当前用户名，无法查询'});
   if(url.searchParams.get('kind')==='video')endpoint='/seedance/api/v3/contents/generations/tasks/'+encodeURIComponent(id);
   else if(url.searchParams.get('kind')==='music'&&musicPath){endpoint=musicPath.replace('{id}',encodeURIComponent(id));if(!endpoint.startsWith('/')||endpoint.startsWith('//')||endpoint.includes('://'))throw new Error('SUNO_STATE_PATH 必须是本站 API 相对路径')}
   else return send(res,501,{error:'音乐查询接口尚未配置，请依据平台 getState 文档设置 SUNO_STATE_PATH。'});
  }else return send(res,404,{error:'接口不存在'});
  const response=await fetch(base+endpoint,{method:payload?'POST':'GET',headers:{Authorization:'Bearer '+key,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(120000)});
  const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{return send(res,502,{error:'平台未返回 JSON，请检查平台状态'})}
  if(!response.ok)return send(res,response.status,{error:typeof data.error==='string'?data.error:(data.error?.message||data.message||'平台请求失败')});
  if(payload){const d=data.data&&typeof data.data==='object'&&!Array.isArray(data.data)?data.data:data;const id=d.task_id||d.taskId||d.id;if(typeof id==='string'||typeof id==='number')accounts.rememberTask(user,id)}
  return send(res,200,data);
 }
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const relative=decodeURIComponent(url.pathname==='/'?'index.html':url.pathname.slice(1));const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep))return send(res,403,{error:'Forbidden'});
 const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch(e){send(res,e.status||(e.code==='ENOENT'?404:502),{error:e.name==='TimeoutError'?'平台响应超时，请稍后检查任务状态':e.message==='fetch failed'?'无法连接 API 平台':e.message})}})}
if(process.argv[1]&&realpathSync(process.argv[1])===realpathSync(fileURLToPath(import.meta.url)))createServer().listen(5173,'127.0.0.1',()=>console.log('云映工作台 http://127.0.0.1:5173'));
