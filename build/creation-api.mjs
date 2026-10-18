const base='https://api.openai-next.com';
function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
export async function creationApi(request,env){
 const url=new URL(request.url);
 try{
  const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'不允许的来源'},403);
  if(url.pathname==='/api/config'&&request.method==='GET')return json({configured:!!env.CREDIT_MEDIA_API_KEY,musicPolling:!!env.SUNO_STATE_PATH,hosted:true});
  if(!env.CREDIT_MEDIA_API_KEY)return json({error:'云端 API 密钥尚未配置'},503);
  let endpoint,payload;
  if(url.pathname==='/api/generate'&&request.method==='POST'){
   const raw=await request.text();if(raw.length>16000)return json({error:'请求过大'},413);
   let b;try{b=JSON.parse(raw)}catch{return json({error:'请求格式无效'},400)}
   if(typeof b.prompt!=='string'||!b.prompt.trim())return json({error:'请输入描述'},400);
   if(!/^[a-zA-Z0-9.+_-]{1,100}$/.test(b.model||''))return json({error:'模型名称无效'},400);
   if(b.kind==='video'){endpoint='/seedance/api/v3/contents/generations/tasks';payload={model:b.model,content:[{type:'text',text:b.prompt}],duration:[4,5,10].includes(b.duration)?b.duration:4,ratio:['16:9','9:16','1:1'].includes(b.ratio)?b.ratio:'16:9'}}
   else if(b.kind==='image'){endpoint='/v1/images/generations';payload={model:b.model,prompt:b.prompt,size:'1024x1024'}}
   else if(b.kind==='music'){endpoint='/_open/suno/music/generate';payload={inputType:10,gptDescriptionPrompt:b.prompt,mv:b.model}}
   else return json({error:'未知创作类型'},400);
  }else if(url.pathname==='/api/task'&&request.method==='GET'){
   const id=url.searchParams.get('id');if(!id||id.length>200)return json({error:'任务 ID 无效'},400);
   if(url.searchParams.get('kind')==='video')endpoint='/seedance/api/v3/contents/generations/tasks/'+encodeURIComponent(id);
   else if(url.searchParams.get('kind')==='music'&&env.SUNO_STATE_PATH){endpoint=env.SUNO_STATE_PATH.replace('{id}',encodeURIComponent(id));if(!endpoint.startsWith('/')||endpoint.startsWith('//')||endpoint.includes('://'))return json({error:'音乐查询路径配置无效'},500)}
   else return json({error:'音乐查询接口尚未配置，需平台 getState 文档。'},501);
  }else return json({error:'接口不存在'},404);
  const r=await fetch(base+endpoint,{method:payload?'POST':'GET',headers:{Authorization:'Bearer '+env.CREDIT_MEDIA_API_KEY,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(120000)});
  let data;try{data=await r.json()}catch{return json({error:'平台未返回 JSON，请检查平台状态'},502)}
  if(!r.ok)return json({error:typeof data.error==='string'?data.error:(data.error?.message||data.message||'平台请求失败')},r.status);
  return json(data);
 }catch(e){return json({error:e.name==='TimeoutError'?'平台响应超时，请稍后查询任务':'请求失败，请稍后重试'},502)}
}
