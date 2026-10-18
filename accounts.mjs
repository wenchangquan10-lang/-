import {createHmac,randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
const validKeys=new Set(['yunying-works','yunying-jobs','yunying-drafts']);
export function normalizeUsername(value){const name=String(value||'').normalize('NFC').trim().toLowerCase();if(!/^[\p{L}\p{N}_-]{2,24}$/u.test(name))throw Error('用户名需为 2–24 个中文、字母、数字、下划线或短横线');return name}
export class Accounts{
 constructor(directory){this.directory=directory;mkdirSync(directory,{recursive:true});this.file=path.join(directory,'accounts.json');this.secretFile=path.join(directory,'session.key');if(!existsSync(this.secretFile))writeFileSync(this.secretFile,randomBytes(32),{mode:0o600});this.secret=readFileSync(this.secretFile);this.db=existsSync(this.file)?JSON.parse(readFileSync(this.file,'utf8')):{users:{}}}
 save(){writeFileSync(this.file+'.tmp',JSON.stringify(this.db),{mode:0o600});renameSync(this.file+'.tmp',this.file)}
 id(name){return createHash('sha256').update(name).digest('hex')}
 login(name){name=normalizeUsername(name);const id=this.id(name);if(!this.db.users[id]){this.db.users[id]={name,records:{},tasks:[]};this.save()}const data=Buffer.from(JSON.stringify({id,expires:Date.now()+7*86400000})).toString('base64url');const signature=createHmac('sha256',this.secret).update(data).digest('base64url');return {user:{id,name},token:data+'.'+signature}}
 user(cookie){try{const raw=String(cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('yunying_session='))?.slice(16);if(!raw)return null;const [data,signature]=raw.split('.');const expected=Buffer.from(createHmac('sha256',this.secret).update(data).digest('base64url'));const actual=Buffer.from(signature||'');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;const parsed=JSON.parse(Buffer.from(data,'base64url').toString());if(parsed.expires<Date.now()||!this.db.users[parsed.id])return null;return {id:parsed.id,name:this.db.users[parsed.id].name}}catch{return null}}
 data(user){return this.db.users[user.id].records}
 put(user,key,value,version){if(!validKeys.has(key))throw Object.assign(Error('不支持的数据类型'),{status:400});if(value!==null){if(typeof value!=='string'||Buffer.byteLength(value)>6*1024*1024)throw Object.assign(Error('单项数据不能超过 6MB'),{status:413});JSON.parse(value)}const records=this.data(user),current=records[key]?.version||0;if(version!==current)throw Object.assign(Error('数据已被其他页面更新，请刷新后再操作'),{status:409});records[key]={value,version:current+1};this.save();return records[key]}
 rememberTask(user,id){if(id===null||id===undefined)return;id=String(id);const tasks=this.db.users[user.id].tasks;if(!tasks.includes(id)){tasks.push(id);this.save()}}
 ownsTask(user,id){return this.db.users[user.id].tasks.includes(String(id))}
}
export function sessionCookie(token,secure=false){return 'yunying_session='+token+'; HttpOnly; SameSite=Lax; Path=/; Max-Age='+(token?'604800':'0')+(secure?'; Secure':'')}
