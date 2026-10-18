import http from 'node:http';
http.createServer(async(req,res)=>{
 if(req.headers.origin){try{const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)throw Error()}catch{res.writeHead(403);return res.end('Origin rejected')}}
 try{
  if(!req.url.startsWith('/')||req.url.startsWith('//')){res.writeHead(400);return res.end()}
  const chunks=[];let size=0;const limit=req.url.startsWith('/api/account/data')?7*1024*1024:20000;for await(const c of req){size+=c.length;if(size>limit){res.writeHead(413);return res.end()}chunks.push(c)}
  const headers={'origin':'http://127.0.0.1:5173','x-forwarded-proto':req.headers['x-forwarded-proto']==='https'?'https':'http'};for(const key of ['content-type','cookie','x-workspace-user'])if(req.headers[key])headers[key]=req.headers[key];
  const response=await fetch('http://127.0.0.1:5173'+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks),signal:AbortSignal.timeout(125000),redirect:'manual'});
  res.writeHead(response.status,{'Content-Type':response.headers.get('content-type')||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...(response.headers.get('set-cookie')?{'Set-Cookie':response.headers.get('set-cookie')}:{})});res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(502);res.end('Local service unavailable')}
}).listen(5174,'127.0.0.1',()=>console.log('Public proxy: http://127.0.0.1:5174'));
