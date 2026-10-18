// 布局与功能组织参考即梦公开页面；模板和视觉样式为本项目自行实现。
const intro=document.createElement('div');intro.className='create-intro';intro.innerHTML='<button class="quick-create" data-quick="image"><span class="quick-icon">▧</span><span><strong>图片创作</strong><small>让想象成为画面</small></span><span class="arrow">↗</span></button><button class="quick-create" data-quick="video"><span class="quick-icon">▷</span><span><strong>视频创作</strong><small>把故事变成镜头</small></span><span class="arrow">↗</span></button><button class="quick-create" data-quick="music"><span class="quick-icon">♫</span><span><strong>音乐创作</strong><small>为灵感配上声音</small></span><span class="arrow">↗</span></button>';
$('.heading').after(intro);
$('.tag').textContent='YUNYING · CREATIVE STUDIO';
$('.eyebrow').textContent='A SPACE FOR YOUR IMAGINATION';
$('.nav[data-view="create"] span').textContent='创作空间';
$('.nav[data-view="inspire"] span').textContent='灵感探索';
$('.upgrade strong').textContent='每个想法，都值得成片';
$('.upgrade p').textContent='图片 · 视频 · 音乐，一站创作';
$('.heading h1').innerHTML='把想象，<em>变成作品。</em>';
$('#subtitle').textContent='从一句话开始，探索属于你的画面与声音。';
const templates=[
 {title:'山海之间',category:'自然',kind:'video',style:'电影感',img:'photo-1464822759023-fed622ff2c3b',prompt:'航拍镜头穿过清晨云海，青绿色山峰缓缓浮现，阳光照亮山谷，镜头平稳向前推进，写实电影画面，宁静而壮阔。'},
 {title:'雨夜霓虹',category:'电影',kind:'video',style:'电影感',img:'photo-1519608487953-e999c86e7455',prompt:'未来城市的雨夜，一个撑透明雨伞的人走在霓虹街道，地面积水映出蓝色和粉色灯光，低机位跟随镜头，电影光影，丰富细节。'},
 {title:'一杯午后',category:'生活',kind:'image',style:'写实',img:'photo-1445116572660-236099ec97a0',prompt:'一杯精致拿铁放在复古木桌上，柔和午后阳光从左侧窗户照射，奶泡花纹清晰，背景为虚化的咖啡馆，胶片摄影，温暖棕色调。'},
 {title:'深蓝来信',category:'自然',kind:'video',style:'梦幻',img:'photo-1530053969600-caed2596d242',prompt:'深蓝海洋中一只鲸鱼缓缓游过，水面阳光形成柔和光柱，微小气泡闪烁，广角镜头缓缓后退，梦幻、宁静、富有空间感。'},
 {title:'森林里的小屋',category:'自然',kind:'image',style:'动漫',img:'photo-1448375240586-882707db888b',prompt:'一间藏在森林里的木屋，雨后空气清新，苔藓和蕨类围绕石板小路，窗内透出温暖灯光，细腻手绘动漫背景，安静治愈的氛围。'},
 {title:'夏日公路',category:'音乐',kind:'music',style:'电影感',img:'photo-1500534623283-312aade485b7',prompt:'轻快温暖的独立流行音乐，清澈女声，原声吉他、柔和鼓点与轻盈贝斯，中文歌词讲述夏日公路旅行和朋友相伴，明亮自由，旋律有记忆点。'},
 {title:'城市夜行',category:'音乐',kind:'music',style:'电影感',img:'photo-1519608487953-e999c86e7455',prompt:'没有人声的 Lo-fi 轻爵士，温暖电钢琴，松弛的嘻哈鼓点，柔和萨克斯点缀，窗外雨声作为背景，适合深夜专注工作，宁静而有节奏。'},
 {title:'微小的宇宙',category:'电影',kind:'image',style:'3D',img:'photo-1464822759023-fed622ff2c3b',prompt:'一个透明玻璃球中装着微缩山川与星空，球体悬浮在深色背景中，精细的3D材质，柔和边缘光，中心构图，超现实产品摄影。'}
];
let templateFilter='全部',templateQuery='';
const tools=document.createElement('div');tools.className='inspiration-tools';
for(const label of ['全部','视频','图片','自然','电影','音乐']){const b=document.createElement('button');b.className='filter-button'+(label==='全部'?' selected':'');b.textContent=label;b.onclick=()=>{templateFilter=label;tools.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b));renderTemplates()};tools.append(b)}
const search=document.createElement('input');search.className='template-search';search.placeholder='搜索灵感、场景或描述';search.setAttribute('aria-label','搜索灵感模板');search.type='search';search.oninput=()=>{templateQuery=search.value.trim().toLowerCase();renderTemplates()};tools.append(search);$('#cards').before(tools);
const note=document.createElement('p');note.className='template-note';note.textContent='卡片封面为示意摄影；生成效果由提示词和实际模型决定。';$('#cards').after(note);
$('#inspirations .section-heading h2').innerHTML='灵感探索 <span>找到一个起点，创作你的版本</span>';
const previousView=showView;showView=function(v){previousView(v);intro.hidden=v==='library';$('.heading h1').innerHTML=v==='library'?'属于你的，<em>灵感档案。</em>':v==='inspire'?'让灵感，<em>自由发生。</em>':'把想象，<em>变成作品。</em>';if(v==='create')$('#crumb').textContent='创作空间';if(v==='inspire')$('#crumb').textContent='灵感探索'};
function useTemplate(t){if(running)return toast('请等待当前请求结束');if(activeTask)return toast('请先完成当前任务，或点击放弃等待');showView('create');setKind(t.kind);style=t.style;document.querySelectorAll('.style').forEach(b=>b.classList.toggle('selected',b.dataset.style===style));setPrompt(t.prompt);$('#modal').close();window.scrollTo({top:0,behavior:'smooth'});toast('描述已填入，可调整参数后生成')}
function templateDetail(t){$('#modalContent').replaceChildren();const h=document.createElement('h2');h.textContent=t.title;const img=document.createElement('img');img.className='template-detail';img.alt=t.title+'示意封面';img.src='https://images.unsplash.com/'+t.img+'?auto=format&fit=crop&w=900&q=80';const p=document.createElement('p');p.className='template-description';p.textContent=t.prompt;const meta=document.createElement('p');meta.textContent={video:'视频模板',image:'图片模板',music:'音乐模板'}[t.kind]+' · '+t.category;const b=document.createElement('button');b.className='template-use';b.textContent='使用这段灵感 ↗';b.onclick=()=>useTemplate(t);$('#modalContent').append(h,img,meta,p,b);$('#modal').showModal()}
function renderTemplates(){const el=$('#cards');el.replaceChildren();const matches=templates.filter(t=>(templateFilter==='全部'||({视频:'video',图片:'image',音乐:'music'}[templateFilter]?t.kind==={视频:'video',图片:'image',音乐:'music'}[templateFilter]:t.category===templateFilter))&&(!templateQuery||(t.title+t.prompt+t.category).toLowerCase().includes(templateQuery)));if(!matches.length){const p=document.createElement('p');p.className='template-empty';p.textContent='暂时没有匹配的灵感，试试其他关键词。';el.append(p);return}matches.forEach(t=>{const b=document.createElement('button');b.className='card';const cover=document.createElement('div');cover.className='thumb';cover.style.backgroundImage='linear-gradient(0deg,#11182060,transparent),url(https://images.unsplash.com/'+t.img+'?auto=format&fit=crop&w=700&q=80)';const badge=document.createElement('span');badge.className='badge';badge.textContent={video:'▷ 视频',image:'▧ 图片',music:'♫ 音乐'}[t.kind]+' · '+t.category;cover.append(badge);const desc=document.createElement('div');desc.className='card-body';const name=document.createElement('strong');name.textContent=t.title;const sub=document.createElement('p');sub.textContent='查看描述 · 创作同款灵感 ↗';desc.append(name,sub);b.append(cover,desc);b.onclick=()=>templateDetail(t);el.append(b)})}
renderTemplates();$('#more').onclick=()=>{templates.push(templates.shift());renderTemplates()};
document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{if(running)return toast('请等待当前请求结束');showView('create');setKind(b.dataset.quick);$('#prompt').focus();$('#createView').scrollIntoView({behavior:'smooth',block:'start'})});
const reference=document.createElement('a');reference.href='https://jimeng.jianying.com/';reference.target='_blank';reference.rel='noopener noreferrer';reference.className='brand-link';reference.textContent='设计研究参考：即梦 AI ↗';$('footer').append(reference);
