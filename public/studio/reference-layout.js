// Structure based on the user-provided reference. Existing controls keep their handlers.
const refEditor=$('.editor'),refBody=$('.editor-body');
const refControls=document.createElement('div');refControls.className='reference-controls';
refControls.append($('.model-label'),tasteStyles,$('.settings'),$('.generate-wrap'));refBody.append(refControls);
const refHints=document.createElement('div');refHints.className='reference-hints';refHints.append($('.prompt-footer'),$('.draft-row'));refEditor.after(refHints);
const refSwitcher=document.createElement('div');refSwitcher.className='reference-switcher';refSwitcher.setAttribute('aria-label','创作与作品');
const refCreate=document.createElement('button');refCreate.type='button';refCreate.textContent='生成';refCreate.onclick=()=>showView('create');
const refAssets=document.createElement('button');refAssets.type='button';refAssets.textContent='我的作品';refAssets.onclick=()=>showView('library');refSwitcher.append(refCreate,refAssets);$('.heading').after(refSwitcher);
const refNav=document.querySelector('aside nav');for(const view of ['create','inspire','library','tasks'])refNav.append(refNav.querySelector('[data-view="'+view+'"]'));
for(const [view,label] of Object.entries({create:'创作',inspire:'探索',library:'资产',tasks:'任务'})){const nav=refNav.querySelector('[data-view="'+view+'"]');nav.querySelector('span').textContent=label;nav.setAttribute('aria-label',label);nav.title=label;nav.dataset.navLabel=label}
const refSidebarNote=document.createElement('div');refSidebarNote.className='reference-sidebar-note';const refNoteTitle=document.createElement('strong');refNoteTitle.textContent='创作记录';const refNoteText=document.createElement('p');refNoteText.textContent='草稿自动保存，任务可继续查询。';refSidebarNote.append(refNoteTitle,refNoteText);refNav.after(refSidebarNote);
$('#inspirations .section-heading h2').innerHTML='灵感精选 <span>选择一个画面，开始你的创作</span>';
$('.preview').hidden=true;
const refBusy=busy;busy=function(text){$('.preview').hidden=false;refBusy(text)};
const refResult=showResult;showResult=function(work){$('.preview').hidden=false;refResult(work)};
const refView=showView;showView=function(view){refView(view);document.body.classList.toggle('reference-home',view==='create');refSwitcher.hidden=!['create','library'].includes(view);refCreate.classList.toggle('selected',view==='create');refAssets.classList.toggle('selected',view==='library');refCreate.setAttribute('aria-pressed',String(view==='create'));refAssets.setAttribute('aria-pressed',String(view==='library'));$('#title').textContent={create:'你好，今天想要创作什么？',library:'我的创作资产',inspire:'探索创作灵感',tasks:'任务中心'}[view]||'创作工作台';refHints.hidden=view!=='create'};
// Keep useful guidance in the placeholder rather than repeating labels around it.
const refKind=setKind;setKind=function(k){refKind(k);$('#prompt').placeholder=k==='music'?'描述曲风、情绪、乐器与人声，让灵感成为旋律。':'输入你的创意，描述主体、场景、动作与镜头，让想象成为画面。'};
const refGenerate=$('#generate');refGenerate.classList.add('reference-generate');refGenerate.setAttribute('aria-label','提交生成任务');
const refStyleSummary=tasteStyles.querySelector('summary');refStyleSummary.querySelector('span:first-child').textContent='风格';
const refDraft=$('#draftStatus');if(refDraft)refDraft.setAttribute('aria-live','polite');
document.addEventListener('pointerdown',event=>{if(tasteStyles.open&&!tasteStyles.contains(event.target))tasteStyles.open=false});
document.addEventListener('keydown',event=>{if(event.key==='Escape')tasteStyles.open=false});
showView('create');setKind(kind);
