// Impeccable refinement: preserve behavior, make the operating surface quieter.
const studioIcons={
 brand:'M4 8l8-5 8 5v8l-8 5-8-5V8z M4 8l8 5 8-5 M12 13v8',
 create:'M12 5v14 M5 12h14',
 video:'M15 8l5-3v14l-5-3 M4 5h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z',
 library:'M4 7h16v13H4z M7 4h10 M9 1h6 M8 11h8 M8 15h5',
 explore:'M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z',
 tasks:'M12 7v5l3 2 M21 12a9 9 0 11-9-9 9 9 0 019 9z',
 cinema:'M3 6h18v14H3z M3 10h18 M6 6l3 4 M12 6l3 4 M18 6l3 4',
 anime:'M12 3c5 0 9 4 9 9s-4 9-9 9-9-4-9-9 4-9 9-9z M8 10v2 M16 10v2 M8 15c2 2 6 2 8 0',
 real:'M3 20l6-10 4 6 3-4 5 8H3z M15 5a2 2 0 104 0 2 2 0 00-4 0',
 three:'M12 3l9 5v9l-9 5-9-5V8l9-5z M3 8l9 5 9-5 M12 13v9',
 dream:'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z',
 arrow:'M5 12h14 M13 6l6 6-6 6'
};
function studioIcon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.classList.add('studio-icon');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',studioIcons[name]||studioIcons.explore);svg.append(path);return svg}
function navIcon(selector,name){const el=$(selector);if(!el)return;el.setAttribute('aria-label',el.querySelector('span')?.textContent||'导航');for(const child of [...el.childNodes])if(child.nodeType===3)child.remove();el.prepend(studioIcon(name))}
$('.brand b').replaceChildren(studioIcon('brand'));
navIcon('[data-view="create"]','video');navIcon('[data-view="library"]','library');navIcon('[data-view="inspire"]','explore');navIcon('[data-view="tasks"]','tasks');
$('.eyebrow')?.remove();$('.tag')?.remove();
$('#prompt').setAttribute('aria-label','创作描述');$('#prompt').setAttribute('aria-describedby','chars');$('#prompt').placeholder='描述主体、场景、动作与氛围。越具体，越接近你的想象。';
$('#model').setAttribute('aria-label','生成模型');$('#closeModal').setAttribute('aria-label','关闭对话框');$('#closeModal').textContent='×';
const styleIcons={电影感:'cinema',动漫:'anime',写实:'real','3D':'three',梦幻:'dream'};
document.querySelectorAll('.style').forEach(button=>{button.querySelector('.style-pic').replaceChildren(studioIcon(styleIcons[button.dataset.style]));button.addEventListener('click',syncStudioA11y)});
const orb=$('.orb');if(orb){orb.classList.add('studio-viewfinder');orb.replaceChildren(studioIcon('video'))}
$('#previewStatus').setAttribute('role','status');$('#previewStatus').setAttribute('aria-live','polite');
const steps=document.createElement('ol');steps.className='studio-steps';steps.setAttribute('aria-label','创作流程');for(const t of ['描述想法','选择模型','生成并查看作品']){const item=document.createElement('li');item.textContent=t;steps.append(item)}
if($('#previewArea .studio-viewfinder'))$('#previewArea').append(steps);
function syncStudioA11y(){document.querySelectorAll('.nav').forEach(b=>{if(b.classList.contains('active'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});document.querySelectorAll('[data-kind],.style,.filter-button').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('selected'))))}
const studioView=showView;showView=function(v){studioView(v);syncStudioA11y();$('#title').setAttribute('tabindex','-1');$('#title').focus({preventScroll:true})};
const studioKind=setKind;setKind=function(k){studioKind(k);syncStudioA11y()};
document.querySelectorAll('.filter-button').forEach(b=>b.addEventListener('click',()=>queueMicrotask(syncStudioA11y)));
syncStudioA11y();
