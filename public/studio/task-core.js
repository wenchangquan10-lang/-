(function(root){
 const terminal=new Set(['succeeded','failed','stopped']);
 function state(data){const d=data?.data&&typeof data.data==='object'&&!Array.isArray(data.data)?data.data:data||{};return String(d.status||d.state||'').toLowerCase()}
 function outcome(data){const s=state(data);if(['failed','error','cancelled','canceled','expired'].includes(s))return 'failed';if(['succeeded','completed','success','done'].includes(s))return 'completed';return 'pending'}
 function taskId(data){const d=data?.data&&typeof data.data==='object'&&!Array.isArray(data.data)?data.data:data||{};const id=d.task_id||d.taskId||d.id;return typeof id==='string'||typeof id==='number'?String(id):null}
 function recover(tasks){return tasks.filter(t=>t&&typeof t.uid==='string').map(t=>({...t,status:t.status==='submitting'?'uncertain':t.status==='polling'?'paused':t.status}))}
 function upsert(tasks,task){const i=tasks.findIndex(t=>t.uid===task.uid);if(i<0)return [task,...tasks];return tasks.map((t,j)=>j===i?{...t,...task}:t)}
 function canQuery(task){return !!task.id&&!terminal.has(task.status)}
 function errorText(error){const text=String(error?.message||error||'未知错误');if(/401|unauthorized|invalid.*key|认证|密钥/i.test(text))return 'API 密钥无效或已失效，请检查平台密钥。';if(/402|credit|balance|余额|额度不足/i.test(text))return '平台账户余额或额度不足，请到 API 平台检查。';if(/429|rate.limit|频率/i.test(text))return '请求过于频繁，请稍后继续查询，避免重复提交。';return text}
 root.YunyingTasks={state,outcome,taskId,recover,upsert,canQuery,errorText};
})(globalThis);
